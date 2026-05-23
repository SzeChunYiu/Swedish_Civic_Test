const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const AUTH_FOUNDATION_FOCUS_FLAG = '--focus-auth-foundation';
const expectedAuthFoundationSummaryKeys = [
  'authFoundationDependenciesValidated',
  'authFoundationRoutesValidated',
  'authFoundationFailClosedParityValidated',
  'authFoundationAnonymousParityValidated',
];

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

test('optional auth foundation uses focused content validation routing', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', AUTH_FOUNDATION_FOCUS_FLAG],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = parseJsonSummary(result.stdout, 'auth foundation focused validation');
  assert.deepEqual(Object.keys(summary).sort(), [...expectedAuthFoundationSummaryKeys].sort());
  assert.equal(summary.authFoundationDependenciesValidated, 5);
  assert.equal(summary.authFoundationRoutesValidated, 10);
  assert.equal(summary.authFoundationFailClosedParityValidated, true);
  assert.equal(summary.authFoundationAnonymousParityValidated, true);
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
