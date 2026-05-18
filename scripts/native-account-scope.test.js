const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function listFiles(dir) {
  const absoluteDir = path.join(repoRoot, dir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(dir, entry.name).replace(/\\/g, '/');
    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
}

const removedNativeAccountPaths = [
  'app/(auth)/_layout.tsx',
  'app/(auth)/sign-in.tsx',
  'app/auth/callback.tsx',
  'app/account.tsx',
  'components/auth/AccountHeader.tsx',
  'components/auth/AccountSection.tsx',
  'components/auth/Avatar.tsx',
  'components/auth/FacebookLogo.tsx',
  'components/auth/GoogleLogo.tsx',
  'components/auth/WelcomeBanner.tsx',
  'lib/auth/AuthContext.tsx',
  'lib/auth/displayName.ts',
  'lib/auth/entitlements.ts',
  'lib/supabase.ts',
];

const forbiddenPackages = [
  '@react-native-async-storage/async-storage',
  '@supabase/supabase-js',
  'expo-apple-authentication',
  'expo-auth-session',
  'expo-web-browser',
  'react-native-url-polyfill',
];

const sourceForbiddenPatterns = [
  /AuthProvider|useAuth|useRemoteEntitlement/,
  /AccountHeader|AccountSection|WelcomeBanner/,
  /@supabase|Supabase|supabase\.|EXPO_PUBLIC_SUPABASE/,
  /createClient\(|from\(['"]profiles['"]\)|from\(['"]entitlements['"]\)/,
  /auth\/callback|\/\(auth\)\/sign-in|href=["']\/account["']/,
  /Continue with (?:Google|Facebook|Apple)/i,
  /(?:sign in|logga in) with (?:Google|Facebook|Apple)/i,
  /(?:Google|Facebook|Apple)\s*,\s*(?:Facebook|Apple).*sync/i,
  /Sync your progress across devices/i,
  /synkronisera framsteg mellan enheter/i,
  /profile, study progress, and entitlement/i,
  /remote sync/i,
];

test('native app exposes no account, auth, or Supabase route surface', () => {
  for (const removedPath of removedNativeAccountPaths) {
    assert.equal(exists(removedPath), false, `${removedPath} should not ship in no-account MVP`);
  }

  assert.deepEqual(
    listFiles('components/auth'),
    [],
    'components/auth should not contain account UI',
  );
  assert.deepEqual(listFiles('lib/auth'), [], 'lib/auth should not contain auth runtime');
});

test('native root stack and manifests stay account-free', () => {
  const rootLayout = read('app/_layout.tsx');
  const routerManifest = read('lib/scaffold/routerShellManifest.ts');
  const architectureManifest = read('lib/scaffold/architectureManifest.ts');

  assert.doesNotMatch(rootLayout, /<Stack\.Screen\s+name=["']\(auth\)["']/);
  assert.doesNotMatch(rootLayout, /<Stack\.Screen\s+name=["']account["']/);
  assert.doesNotMatch(rootLayout, /AuthProvider/);
  assert.doesNotMatch(routerManifest, /app\/\(auth\)|app\/account\.tsx|name:\s*['"]account['"]/);
  assert.doesNotMatch(architectureManifest, /app\/\(auth\)|app\/account\.tsx/);
});

test('native app dependencies and plugins exclude account backends', () => {
  const packageJson = readJson('package.json');
  const packageLock = read('package-lock.json');
  const appJson = readJson('app.json');
  const plugins = appJson.expo.plugins ?? [];

  for (const packageName of forbiddenPackages) {
    assert.equal(
      packageJson.dependencies?.[packageName],
      undefined,
      `${packageName} should not be a runtime dependency`,
    );
    assert.doesNotMatch(
      packageLock,
      new RegExp(packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }

  assert.equal(plugins.includes('expo-web-browser'), false);
});

test('native app source has no OAuth or remote account copy', () => {
  const sourceFiles = listFiles('app')
    .concat(listFiles('components'), listFiles('lib'))
    .filter((filePath) => /\.(ts|tsx)$/.test(filePath));

  const violations = [];
  for (const filePath of sourceFiles) {
    const source = read(filePath);
    for (const pattern of sourceForbiddenPatterns) {
      if (pattern.test(source)) violations.push(`${filePath} matches ${pattern}`);
    }
  }

  assert.deepEqual(violations, []);
});
