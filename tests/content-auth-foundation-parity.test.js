const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  EXPECTED_AUTH_DEPENDENCIES,
  EXPECTED_AUTH_PATHS,
  validateAuthFoundationContract,
} = require('../scripts/auth-foundation-contract');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function createContractReader(overrides = {}) {
  return {
    exists(relativePath) {
      return Object.prototype.hasOwnProperty.call(overrides, relativePath)
        ? overrides[relativePath] !== null
        : fs.existsSync(path.join(repoRoot, relativePath));
    },
    readFile(relativePath) {
      if (Object.prototype.hasOwnProperty.call(overrides, relativePath)) {
        const value = overrides[relativePath];
        if (value === null) throw new Error(`${relativePath} missing`);
        return value;
      }
      return read(relativePath);
    },
    readJson(relativePath) {
      return JSON.parse(this.readFile(relativePath));
    },
  };
}

function validateWithOverrides(overrides = {}) {
  return validateAuthFoundationContract({
    repoRoot,
    reader: createContractReader(overrides),
  });
}

test('optional auth foundation shared contract validates the current source', () => {
  const result = validateWithOverrides();

  assert.deepEqual(result.errors, []);
  assert.equal(
    result.summary.authFoundationDependencyRulesValidated,
    EXPECTED_AUTH_DEPENDENCIES.length,
  );
  assert.equal(result.summary.authFoundationRouteFilesValidated, EXPECTED_AUTH_PATHS.length);
  assert.equal(result.summary.authFoundationFailClosedRulesValidated, 8);
  assert.equal(result.summary.authFoundationRootLayoutRulesValidated, 6);
  assert.equal(result.summary.authFoundationAnonymousChoiceRulesValidated, 10);
  assert.equal(result.summary.authFoundationAccountSeparationRulesValidated, 6);
  assert.equal(result.summary.authFoundationParityValidated, true);
});

test('optional auth foundation dependencies and routes are present', () => {
  const packageJson = readJson('package.json');
  const dependencies = packageJson.dependencies ?? {};

  for (const dependency of [
    '@supabase/supabase-js',
    'expo-apple-authentication',
    'expo-auth-session',
    'expo-web-browser',
    'react-native-url-polyfill',
  ]) {
    assert.equal(typeof dependencies[dependency], 'string', `${dependency} dependency missing`);
  }

  for (const relativePath of [
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
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} missing`);
  }
});

test('Supabase client fails closed when public auth env is absent', () => {
  const supabaseSource = read('lib/supabase.ts');
  const authSource = read('lib/auth/AuthContext.tsx');

  assert.match(supabaseSource, /EXPO_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseSource, /EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(supabaseSource, /isSupabaseConfigured/);
  assert.match(supabaseSource, /optional-auth-not-configured/);
  assert.match(supabaseSource, /persistSession:\s*isSupabaseConfigured/);
  assert.match(supabaseSource, /detectSessionInUrl:\s*isSupabaseConfigured/);
  assert.match(authSource, /if \(!isSupabaseConfigured\) throw authUnavailableError\(\)/);
  assert.match(authSource, /setStatus\('anonymous'\)/);
});

test('root layout provides auth context without gating anonymous study routes', () => {
  const layoutSource = read('app/_layout.tsx');

  assert.match(layoutSource, /import \{ AuthProvider \} from '\.\.\/lib\/auth\/AuthContext'/);
  assert.match(layoutSource, /<AuthProvider>\s*<RootLayoutContent \/>/);
  assert.match(
    layoutSource,
    /<Stack\.Screen name="\((?:auth)\)" options=\{\{ headerShown: false \}\}/,
  );
  assert.match(layoutSource, /<Stack\.Screen name="account"/);
  assert.match(
    layoutSource,
    /<Stack\.Screen name="auth\/callback" options=\{\{ headerShown: false \}\}/,
  );
  assert.match(
    layoutSource,
    /<Stack\.Screen name="\((?:tabs)\)" options=\{\{ headerShown: false \}\}/,
  );
});

test('sign-in and onboarding expose Google, Apple, and anonymous choices', () => {
  const signInSource = read('app/(auth)/sign-in.tsx');
  const onboardingSource = read('app/onboarding.tsx');
  const suppressedRoutesSource = read('lib/onboarding/firstRunAboutModalRoutes.ts');

  for (const source of [signInSource, onboardingSource]) {
    assert.match(source, /Continue with Google|Fortsätt med Google/);
    assert.match(source, /Continue with Apple|Fortsätt med Apple/);
    assert.match(source, /Continue without an account|Fortsätt utan konto/);
  }

  assert.match(onboardingSource, /onboarding-account-section/);
  assert.match(onboardingSource, /signInWithGoogle/);
  assert.match(onboardingSource, /signInWithApple/);
  assert.match(suppressedRoutesSource, /'\/\(auth\)'/);
});

test('account surface keeps local progress and purchase entitlements separate from auth', () => {
  const accountSource = read('app/account.tsx');

  assert.match(accountSource, /Local study data stays local/);
  assert.match(accountSource, /does not upload study progress/);
  assert.match(accountSource, /Purchases stay separate/);
  assert.match(accountSource, /useRemoveAdsEntitlements\(\{ skipPurchaseRuntime: true \}\)/);
  assert.doesNotMatch(accountSource, /from\('progress|from\("progress|upsert\(\{[\s\S]*progress/);
  assert.doesNotMatch(accountSource, /adsDisabled\s*=|proLifetime\s*=/);
});

test('optional auth foundation shared contract catches focused mutations', () => {
  const packageJson = readJson('package.json');
  delete packageJson.dependencies['@supabase/supabase-js'];
  const missingDependency = validateWithOverrides({
    'package.json': JSON.stringify(packageJson),
  });
  assert.equal(missingDependency.summary.authFoundationParityValidated, false);
  assert.match(missingDependency.errors.join('\n'), /@supabase\/supabase-js dependency missing/);

  const supabaseSource = read('lib/supabase.ts');
  const supabaseOpenMutation = validateWithOverrides({
    'lib/supabase.ts': supabaseSource.replaceAll('optional-auth-not-configured', 'auth-open'),
  });
  assert.equal(supabaseOpenMutation.summary.authFoundationParityValidated, false);
  assert.match(supabaseOpenMutation.errors.join('\n'), /optional-auth-not-configured/);

  const onboardingSource = read('app/onboarding.tsx');
  const anonymousChoiceMutation = validateWithOverrides({
    'app/onboarding.tsx': onboardingSource
      .replace('Fortsätt utan konto', 'Skapa konto först')
      .replace('Continue without an account', 'Create an account first'),
  });
  assert.equal(anonymousChoiceMutation.summary.authFoundationParityValidated, false);
  assert.match(anonymousChoiceMutation.errors.join('\n'), /anonymous study choice/);

  const accountSource = read('app/account.tsx');
  const accountCouplingMutation = validateWithOverrides({
    'app/account.tsx': `${accountSource}\nconst adsDisabled = true;\n`,
  });
  assert.equal(accountCouplingMutation.summary.authFoundationParityValidated, false);
  assert.match(accountCouplingMutation.errors.join('\n'), /purchase entitlements/);
});
