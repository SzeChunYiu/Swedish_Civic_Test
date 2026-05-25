const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_AUTH_DEPENDENCIES = Object.freeze([
  '@supabase/supabase-js',
  'expo-apple-authentication',
  'expo-auth-session',
  'expo-web-browser',
  'react-native-url-polyfill',
]);

const EXPECTED_AUTH_PATHS = Object.freeze([
  'app/(auth)/_layout.tsx',
  'app/(auth)/sign-in.tsx',
  'app/account.tsx',
  'app/auth/callback.tsx',
  'components/auth/AuthProviderButton.tsx',
  'components/auth/Avatar.tsx',
  'components/auth/GoogleLogo.tsx',
  'lib/auth/AuthContext.tsx',
  'lib/auth/displayName.ts',
  'lib/supabase.ts',
]);

function createFsReader(repoRoot) {
  return {
    exists(relativePath) {
      return fs.existsSync(path.join(repoRoot, relativePath));
    },
    readFile(relativePath) {
      return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    },
    readJson(relativePath) {
      return JSON.parse(this.readFile(relativePath));
    },
  };
}

function validateAuthFoundationContract({ repoRoot, reader = createFsReader(repoRoot) }) {
  const errors = [];
  const summary = {
    authFoundationAccountSeparationRulesValidated: 0,
    authFoundationAnonymousChoiceRulesValidated: 0,
    authFoundationDependencyRulesValidated: 0,
    authFoundationFailClosedRulesValidated: 0,
    authFoundationRouteFilesValidated: 0,
    authFoundationRootLayoutRulesValidated: 0,
    authFoundationParityValidated: false,
  };

  const read = (relativePath) => {
    try {
      return reader.readFile(relativePath);
    } catch (error) {
      errors.push(`${relativePath} could not be read: ${error.message}`);
      return '';
    }
  };
  const readJson = (relativePath) => {
    try {
      return reader.readJson(relativePath);
    } catch (error) {
      errors.push(`${relativePath} could not be parsed: ${error.message}`);
      return {};
    }
  };
  const assertMatch = ({ source, pattern, message, counter }) => {
    if (pattern.test(source)) {
      summary[counter] += 1;
      return;
    }
    errors.push(message);
  };
  const assertNoMatch = ({ source, pattern, message, counter }) => {
    if (!pattern.test(source)) {
      summary[counter] += 1;
      return;
    }
    errors.push(message);
  };

  const packageJson = readJson('package.json');
  const dependencies = packageJson.dependencies ?? {};
  for (const dependency of EXPECTED_AUTH_DEPENDENCIES) {
    if (typeof dependencies[dependency] === 'string') {
      summary.authFoundationDependencyRulesValidated += 1;
    } else {
      errors.push(`${dependency} dependency missing`);
    }
  }

  for (const relativePath of EXPECTED_AUTH_PATHS) {
    if (reader.exists(relativePath)) {
      summary.authFoundationRouteFilesValidated += 1;
    } else {
      errors.push(`${relativePath} missing`);
    }
  }

  const supabaseSource = read('lib/supabase.ts');
  const authSource = read('lib/auth/AuthContext.tsx');
  const layoutSource = read('app/_layout.tsx');
  const signInSource = read('app/(auth)/sign-in.tsx');
  const onboardingSource = read('app/onboarding.tsx');
  const suppressedRoutesSource = read('lib/onboarding/firstRunAboutModalRoutes.ts');
  const accountSource = read('app/account.tsx');

  for (const [pattern, message] of [
    [/EXPO_PUBLIC_SUPABASE_URL/, 'Supabase client must read EXPO_PUBLIC_SUPABASE_URL'],
    [
      /EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
      'Supabase client must read EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ],
    [/isSupabaseConfigured/, 'Supabase client must expose isSupabaseConfigured'],
    [/optional-auth-not-configured/, 'Supabase fallback must use optional-auth-not-configured'],
    [
      /persistSession:\s*isSupabaseConfigured/,
      'Supabase must persist sessions only when configured',
    ],
    [
      /detectSessionInUrl:\s*isSupabaseConfigured/,
      'Supabase must detect URL sessions only when configured',
    ],
  ]) {
    assertMatch({
      source: supabaseSource,
      pattern,
      message,
      counter: 'authFoundationFailClosedRulesValidated',
    });
  }
  for (const [pattern, message] of [
    [
      /if \(!isSupabaseConfigured\) throw authUnavailableError\(\)/,
      'AuthContext must fail closed when Supabase is not configured',
    ],
    [/setStatus\('anonymous'\)/, 'AuthContext must keep anonymous status available'],
  ]) {
    assertMatch({
      source: authSource,
      pattern,
      message,
      counter: 'authFoundationFailClosedRulesValidated',
    });
  }

  for (const [pattern, message] of [
    [
      /import \{ AuthProvider \} from '\.\.\/lib\/auth\/AuthContext'/,
      'root layout must import AuthProvider',
    ],
    [/<AuthProvider>\s*<RootLayoutContent \/>/, 'root layout must wrap RootLayoutContent'],
    [
      /<Stack\.Screen name="\((?:auth)\)" options=\{\{ headerShown: false \}\}/,
      'root layout must register the auth group without a header',
    ],
    [/<Stack\.Screen name="account"/, 'root layout must register account route'],
    [
      /<Stack\.Screen name="auth\/callback" options=\{\{ headerShown: false \}\}/,
      'root layout must register auth callback without a header',
    ],
    [
      /<Stack\.Screen name="\((?:tabs)\)" options=\{\{ headerShown: false \}\}/,
      'root layout must preserve anonymous tab routes',
    ],
  ]) {
    assertMatch({
      source: layoutSource,
      pattern,
      message,
      counter: 'authFoundationRootLayoutRulesValidated',
    });
  }

  for (const [source, label] of [
    [signInSource, 'sign-in route'],
    [onboardingSource, 'onboarding route'],
  ]) {
    for (const [pattern, message] of [
      [/Continue with Google|Fortsätt med Google/, `${label} must expose Google sign-in`],
      [/Continue with Apple|Fortsätt med Apple/, `${label} must expose Apple sign-in`],
      [
        /Continue without an account|Fortsätt utan konto/,
        `${label} must expose anonymous study choice`,
      ],
    ]) {
      assertMatch({
        source,
        pattern,
        message,
        counter: 'authFoundationAnonymousChoiceRulesValidated',
      });
    }
  }
  for (const [pattern, message, source] of [
    [
      /onboarding-account-section/,
      'onboarding route must keep account section marker',
      onboardingSource,
    ],
    [/signInWithGoogle/, 'onboarding route must wire Google sign-in', onboardingSource],
    [/signInWithApple/, 'onboarding route must wire Apple sign-in', onboardingSource],
    [
      /'\/\(auth\)'/,
      'first-run modal suppression must include auth routes',
      suppressedRoutesSource,
    ],
  ]) {
    assertMatch({
      source,
      pattern,
      message,
      counter: 'authFoundationAnonymousChoiceRulesValidated',
    });
  }

  for (const [pattern, message] of [
    [/Local study data stays local/, 'account route must state local study data stays local'],
    [/does not upload study progress/, 'account route must state progress is not uploaded'],
    [/Purchases stay separate/, 'account route must state purchases stay separate'],
    [
      /useRemoveAdsEntitlements\(\{ skipPurchaseRuntime: true \}\)/,
      'account route must skip purchase runtime reads',
    ],
  ]) {
    assertMatch({
      source: accountSource,
      pattern,
      message,
      counter: 'authFoundationAccountSeparationRulesValidated',
    });
  }
  for (const [pattern, message] of [
    [
      /from\('progress|from\("progress|upsert\(\{[\s\S]*progress/,
      'account route must not upload local progress to auth storage',
    ],
    [/adsDisabled\s*=|proLifetime\s*=/, 'account route must not mutate purchase entitlements'],
  ]) {
    assertNoMatch({
      source: accountSource,
      pattern,
      message,
      counter: 'authFoundationAccountSeparationRulesValidated',
    });
  }

  summary.authFoundationParityValidated =
    errors.length === 0 &&
    summary.authFoundationDependencyRulesValidated === EXPECTED_AUTH_DEPENDENCIES.length &&
    summary.authFoundationRouteFilesValidated === EXPECTED_AUTH_PATHS.length &&
    summary.authFoundationFailClosedRulesValidated === 8 &&
    summary.authFoundationRootLayoutRulesValidated === 6 &&
    summary.authFoundationAnonymousChoiceRulesValidated === 10 &&
    summary.authFoundationAccountSeparationRulesValidated === 6;

  if (!summary.authFoundationParityValidated) {
    errors.push(
      'optional auth foundation contract must validate dependencies, routes, fail-closed auth, anonymous study, and account/purchase separation',
    );
  }

  return { errors, summary };
}

module.exports = {
  EXPECTED_AUTH_DEPENDENCIES,
  EXPECTED_AUTH_PATHS,
  validateAuthFoundationContract,
};
