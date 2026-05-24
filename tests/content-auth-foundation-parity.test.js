const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { runFocusedValidatorMutation } = require('./helpers/focusedValidatorMutation.cjs');

const repoRoot = path.resolve(__dirname, '..');
const authFoundationFocusFlag = '--focus-auth-foundation';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function parseJsonSummary(output, label) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, `${label} should print a JSON summary`);
  return JSON.parse(match[0]);
}

function runFocusedAuthValidation() {
  return spawnSync(process.execPath, ['scripts/validate-content.js', authFoundationFocusFlag], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function assertAuthFoundationMutationFails({ label, targetFile, mutateSource, expectedMessage }) {
  const result = runFocusedValidatorMutation({
    focusFlag: authFoundationFocusFlag,
    targetFile,
    mutateSource,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 1, `${label} should fail focused validation\n${output}`);
  assert.match(output, /Content validation failed:/);
  assert.match(output, expectedMessage);
  assert.doesNotMatch(output, /questionSchemasValidated/);
}

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

test('auth foundation focused validator exposes only auth summary keys', () => {
  const result = runFocusedAuthValidation();
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0, output);
  const summary = parseJsonSummary(result.stdout, 'auth foundation focused validation');

  assert.deepEqual(summary, {
    authFoundationDependenciesValidated: 5,
    authFoundationRoutesValidated: 10,
    authFoundationFailClosedRulesValidated: 8,
    authFoundationAnonymousChoiceRulesValidated: 8,
    authFoundationAccountSeparationRulesValidated: 5,
    authFoundationParityValidated: true,
  });
  assert.equal(Object.hasOwn(summary, 'questionSchemasValidated'), false);
});

test('auth foundation focused validator rejects targeted source mutations', () => {
  assertAuthFoundationMutationFails({
    label: 'missing Supabase dependency',
    targetFile: 'package.json',
    expectedMessage: /auth foundation dependency missing @supabase\/supabase-js/,
    mutateSource: (source) => {
      const mutated = source.replace(/\n\s*"@supabase\/supabase-js": "[^"]+",/, '');
      if (mutated === source) throw new Error('Supabase dependency mutation did not apply');
      return mutated;
    },
  });

  assertAuthFoundationMutationFails({
    label: 'missing fail-closed Supabase config',
    targetFile: 'lib/supabase.ts',
    expectedMessage: /auth foundation fail-closed rule missing: Supabase configured flag/,
    mutateSource: (source) => {
      const mutated = source.replaceAll('isSupabaseConfigured', 'supabaseAuthEnabled');
      if (mutated === source) throw new Error('Supabase configured mutation did not apply');
      return mutated;
    },
  });

  assertAuthFoundationMutationFails({
    label: 'missing anonymous sign-in choice',
    targetFile: 'app/(auth)/sign-in.tsx',
    expectedMessage: /auth foundation anonymous-study rule missing: sign-in anonymous choice/,
    mutateSource: (source) => {
      const mutated = source
        .replace('Continue without an account', 'Continue as guest')
        .replace('Fortsätt utan konto', 'Fortsätt som gäst');
      if (mutated === source) throw new Error('anonymous choice mutation did not apply');
      return mutated;
    },
  });

  assertAuthFoundationMutationFails({
    label: 'missing local progress separation copy',
    targetFile: 'app/account.tsx',
    expectedMessage: /auth foundation account-separation rule failed: no progress upload copy/,
    mutateSource: (source) => {
      const mutated = source.replace('does not upload study progress', 'can sync study progress');
      if (mutated === source) throw new Error('progress separation mutation did not apply');
      return mutated;
    },
  });
});
