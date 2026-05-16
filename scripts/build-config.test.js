const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('EAS build and submit profiles are configured for internal and production releases', () => {
  const eas = readJson('eas.json');
  assert.equal(eas.cli.version, '>= 13.0.0');
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.equal(eas.build.production.autoIncrement, true);
  assert.equal(eas.submit.production.ios.appleId, 'TBD');
  assert.equal(
    eas.submit.production.android.serviceAccountKeyPath,
    './publishing/google-play-service-account.json',
  );
});

test('store build scripts document the exact release commands', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['build:preview'], 'node scripts/build-preview-guard.js');
  assert.equal(pkg.scripts['build:production'], 'node scripts/build-production-guard.js');
  assert.equal(pkg.scripts['submit:production'], 'node scripts/submit-production-guard.js');
});

test('EAS access evidence command is wired for repeatable non-secret checks', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['release:eas-access-check'], 'node scripts/check-eas-access.js');
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/check-eas-access.js')), true);
});

test('release validation includes dependency security audit', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['audit:release'], 'npm audit --audit-level=moderate');
  assert.match(pkg.scripts.validate, /npm run audit:release/);
  assert.equal(pkg.overrides.postcss, '8.5.10');
});

test('EAS CLI is invoked through npx so Expo Doctor accepts the dependency graph', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.devDependencies['eas-cli'], undefined);
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/build-preview-guard.js')), true);
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/build-preview-guard.js'), 'utf8'),
    /eas-cli@18\.13\.0/,
  );
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/build-production-guard.js')), true);
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/build-production-guard.js'), 'utf8'),
    /eas-cli@18\.13\.0/,
  );
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/submit-production-guard.js')), true);
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/submit-production-guard.js'), 'utf8'),
    /eas-cli@18\.13\.0/,
  );
});

test('preview build guard blocks when EAS auth is missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-build-guard-'));
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "Not logged in" >&2; exit 1; fi',
      'echo "unexpected npx command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(process.execPath, ['scripts/build-preview-guard.js', '--check-only'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Preview build blocked/i);
  assert.match(result.stdout, /Not logged in/i);
});

test('preview build guard check passes when EAS auth is ready', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-build-guard-ready-'));
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "expo-user"; exit 0; fi',
      'echo "unexpected npx command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(process.execPath, ['scripts/build-preview-guard.js', '--check-only'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
  });

  assert.equal(result.status, 0, result.stdout || result.stderr);
  assert.match(result.stdout, /Preview build config is ready/i);
});

test('EAS access evidence check writes a redacted blocked report when auth is missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-access-check-'));
  const reportPath = path.join(tmpDir, 'eas-access.md');
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "Not logged in" >&2; exit 1; fi',
      'echo "unexpected npx command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(process.execPath, ['scripts/check-eas-access.js', '--out', reportPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      EXPO_TOKEN: 'super-secret-token',
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
    },
  });
  const report = fs.readFileSync(reportPath, 'utf8');

  assert.equal(result.status, 1);
  assert.match(result.stdout, /EAS access check BLOCKED/i);
  assert.match(report, /Status \\| BLOCKED/);
  assert.match(report, /EXPO_TOKEN_SET \\| yes/);
  assert.match(report, /npx --yes eas-cli@18\.13\.0 whoami/);
  assert.match(report, /Not logged in/);
  assert.doesNotMatch(report, /super-secret-token/);
});

test('production build guard blocks while release preflight is not ready', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/build-production-guard.js', '--check-only'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Production build blocked/i);
  assert.match(result.stdout, /release preflight/i);
});

test('production build and submit guards rerun validation inside release preflight', () => {
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/build-production-guard.js'), 'utf8'),
    /--run-validate/,
  );
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/submit-production-guard.js'), 'utf8'),
    /--run-validate/,
  );
});

test('production submit guard blocks placeholder Apple identifiers before EAS submit', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/submit-production-guard.js', '--check-only'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /appleId/i);
  assert.match(result.stdout, /ascAppId/i);
  assert.match(result.stdout, /appleTeamId/i);
  assert.match(result.stdout, /TBD/i);
});

test('production submit guard blocks while release preflight is not ready', () => {
  const easPath = path.join(repoRoot, 'eas.json');
  const originalEas = fs.readFileSync(easPath, 'utf8');
  const fakeServiceAccount = path.join(repoRoot, 'tmp/fake-google-play-service-account.json');

  try {
    const eas = JSON.parse(originalEas);
    eas.submit.production.ios.appleId = 'release@example.com';
    eas.submit.production.ios.ascAppId = '1234567890';
    eas.submit.production.ios.appleTeamId = 'TEAM123456';
    eas.submit.production.android.serviceAccountKeyPath =
      './tmp/fake-google-play-service-account.json';
    fs.mkdirSync(path.dirname(fakeServiceAccount), { recursive: true });
    fs.writeFileSync(fakeServiceAccount, '{"type":"service_account"}\n');
    fs.writeFileSync(easPath, `${JSON.stringify(eas, null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      ['scripts/submit-production-guard.js', '--check-only'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Production submit blocked/i);
    assert.match(result.stdout, /release preflight/i);
  } finally {
    fs.writeFileSync(easPath, originalEas);
    fs.rmSync(fakeServiceAccount, { force: true });
  }
});

test('web export script is available for local production bundle smoke', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['build:web:export'], 'expo export --platform web --output-dir dist-web');
  assert.equal(
    pkg.scripts['release:web-export-smoke'],
    'rm -rf dist-web && npm run build:web:export',
  );
  assert.match(fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8'), /^dist-web\/$/m);
});

test('native appearance config has its required Expo module', () => {
  const pkg = readJson('package.json');
  const appConfig = readJson('app.json').expo;

  assert.equal(appConfig.userInterfaceStyle, 'light');
  assert.match(pkg.dependencies['expo-system-ui'], /^~/);
  assert.equal(
    pkg.scripts['release:native-prebuild-smoke'],
    'node scripts/native-prebuild-smoke.js',
  );
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/native-prebuild-smoke.js')), true);
  assert.match(fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8'), /^tmp\/$/m);
});
