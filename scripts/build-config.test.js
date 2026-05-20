const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { REQUIRED_SECURITY_HEADERS } = require('./check-live-site');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readThemeCanvasColor() {
  const themeSource = fs.readFileSync(path.join(repoRoot, 'lib/theme/colors.ts'), 'utf8');
  const match = themeSource.match(/const\s+canvas\s*=\s*'([^']+)'\s+satisfies\s+ColorToken/);
  assert.notEqual(match, null, 'colors.canvas should stay parseable for web export checks');
  return match[1];
}

function copyPublicWebManifest(outputDir) {
  const manifest = readJson('public/manifest.webmanifest');
  fs.copyFileSync(
    path.join(repoRoot, 'public/manifest.webmanifest'),
    path.join(outputDir, 'manifest.webmanifest'),
  );

  for (const icon of manifest.icons) {
    const iconDestination = path.join(outputDir, icon.src);
    fs.mkdirSync(path.dirname(iconDestination), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'public', icon.src), iconDestination);
  }

  return manifest;
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

test('Metro web export enables Expo Router route context discovery', () => {
  const configPath = path.join(repoRoot, 'metro.config.js');
  assert.equal(fs.existsSync(configPath), true);

  const config = require(configPath);
  assert.equal(config.transformer.unstable_allowRequireContext, true);

  const resolution = config.resolver.resolveRequest(
    {
      resolveRequest() {
        return { type: 'empty' };
      },
    },
    'expo-router/_ctx',
    'web',
  );
  assert.equal(resolution.type, 'sourceFile');
  assert.equal(resolution.filePath, path.join(repoRoot, 'lib/router/expoRouterWebContext.js'));
  assert.equal(fs.existsSync(resolution.filePath), true);
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

test('npm test dispatcher preserves full suite and focused monetization selector', () => {
  const pkg = readJson('package.json');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const fakeNpm = path.join(tmpDir, 'npm');
  fs.writeFileSync(fakeNpm, ['#!/bin/sh', `echo "$@" >> "${npmLog}"`, 'exit 0', ''].join('\n'), {
    mode: 0o755,
  });

  const env = {
    ...process.env,
    TEST_DISPATCH_NPM: fakeNpm,
    TEST_DISPATCH_CAPTURE: '1',
  };

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/test-dispatch.js')), true);
  assert.match(pkg.scripts['test:all'], /^npm run test:learning\b/);
  assert.match(pkg.scripts['test:all'], /npm run test:monetization/);
  assert.match(pkg.scripts['test:all'], /npm run test:a11y-labels$/);

  const fullResult = spawnSync(process.execPath, ['scripts/test-dispatch.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
  assert.equal(fullResult.status, 0, fullResult.stderr || fullResult.stdout);
  assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:all\n');

  fs.writeFileSync(npmLog, '');
  const monetizationResult = spawnSync(
    process.execPath,
    ['scripts/test-dispatch.js', 'monetization'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env,
    },
  );
  assert.equal(
    monetizationResult.status,
    0,
    monetizationResult.stderr || monetizationResult.stdout,
  );
  assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');

  const bogusResult = spawnSync(process.execPath, ['scripts/test-dispatch.js', 'bogus'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
  assert.equal(bogusResult.status, 1);
  assert.match(bogusResult.stderr, /Unsupported npm test selector: bogus/);
  assert.match(bogusResult.stderr, /monetization -> npm run test:monetization/);
  assert.match(bogusResult.stderr, /Run `npm test` with no selector/);
  assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');
});

test('GitHub release secrets check reports whether EXPO_TOKEN is configured without leaking values', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-release-secrets-check-'));
  const reportPath = path.join(tmpDir, 'github-secrets.md');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      'if [ "$1 $2 $3" = "secret list --repo" ]; then echo "EXPO_TOKEN 2026-05-16T00:00:00Z"; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/check-github-release-secrets.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'false',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:github-secrets-check'],
    'node scripts/check-github-release-secrets.js',
  );
  assert.match(result.stdout, /GitHub release secrets check READY/i);
  assert.match(report, /SzeChunYiu\/Swedish_Civic_Test/);
  assert.match(report, /EXPO_TOKEN \| present/);
  assert.doesNotMatch(report, /super-secret|token value/i);
});

test('GitHub release secrets check uses injected Actions env without gh secret-list auth', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-release-secrets-actions-env-'));
  const reportPath = path.join(tmpDir, 'github-secrets.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'echo "gh should not be called when Actions injected EXPO_TOKEN is present" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/check-github-release-secrets.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'true',
        EXPO_TOKEN: 'super-secret-token',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(ghLog), false);
  assert.match(result.stdout, /GitHub release secrets check READY/i);
  assert.match(report, /Status \| READY/);
  assert.match(report, /Source \| GitHub Actions injected environment/);
  assert.match(report, /EXPO_TOKEN \| present/);
  assert.doesNotMatch(report, /super-secret-token/);
  assert.doesNotMatch(result.stdout, /super-secret-token/);
});

test('GitHub release secrets check blocks in Actions when injected EXPO_TOKEN is empty', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-release-secrets-actions-empty-'));
  const reportPath = path.join(tmpDir, 'github-secrets.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    ['#!/bin/sh', `echo "$@" >> "${ghLog}"`, 'exit 2', ''].join('\n'),
    { mode: 0o755 },
  );

  const env = {
    ...process.env,
    GITHUB_ACTIONS: 'true',
    PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
  };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/check-github-release-secrets.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
  const report = fs.readFileSync(reportPath, 'utf8');

  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(ghLog), false);
  assert.match(result.stdout, /GitHub release secrets check BLOCKED/i);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /Source \| GitHub Actions injected environment/);
  assert.match(report, /EXPO_TOKEN \| missing/);
});

test('GitHub EXPO_TOKEN secret setter reads token from env without leaking values', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-expo-token-secret-setter-'));
  const reportPath = path.join(tmpDir, 'set-expo-token.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  const stdinLog = path.join(tmpDir, 'stdin.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "secret set EXPO_TOKEN" ]; then cat > "' +
        stdinLog +
        '"; echo "stored super-secret-token"; exit 0; fi',
      'if [ "$1 $2 $3" = "secret list --repo" ]; then echo "EXPO_TOKEN 2026-05-16T00:00:00Z"; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/set-github-expo-token-secret.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: 'super-secret-token',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');
  const stdin = fs.readFileSync(stdinLog, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:set-expo-token-secret'],
    'node scripts/set-github-expo-token-secret.js',
  );
  assert.match(result.stdout, /GitHub EXPO_TOKEN secret set READY/i);
  assert.match(report, /Status \| READY/);
  assert.match(report, /Secret \| EXPO_TOKEN/);
  assert.match(report, /Environment variable \| EXPO_TOKEN/);
  assert.match(report, /SzeChunYiu\/Swedish_Civic_Test/);
  assert.match(
    ghCalls,
    /secret set EXPO_TOKEN --repo SzeChunYiu\/Swedish_Civic_Test --app actions/,
  );
  assert.match(ghCalls, /secret list --repo SzeChunYiu\/Swedish_Civic_Test/);
  assert.equal(stdin, 'super-secret-token\n');
  assert.doesNotMatch(ghCalls, /super-secret-token/);
  assert.doesNotMatch(result.stdout, /super-secret-token/);
  assert.doesNotMatch(report, /super-secret-token/);
});

test('Expo token bootstrap blocks without a local token before running release commands', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-bootstrap-blocked-'));
  const reportPath = path.join(tmpDir, 'bootstrap.md');
  const npmLog = path.join(tmpDir, 'npm.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    ['#!/bin/sh', `echo "$@" >> "${npmLog}"`, 'exit 2', ''].join('\n'),
    { mode: 0o755 },
  );

  const env = { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/bootstrap-expo-token-release.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 1);
  assert.equal(
    pkg.scripts['release:expo-token-bootstrap'],
    'node scripts/bootstrap-expo-token-release.js',
  );
  assert.match(result.stdout, /Expo token release bootstrap BLOCKED/i);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /Environment variable \| EXPO_TOKEN/);
  assert.equal(fs.existsSync(npmLog), false);
});

test('Expo token bootstrap sets secret, verifies it, dispatches blocker loop, and redacts token', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-bootstrap-ready-'));
  const reportPath = path.join(tmpDir, 'bootstrap.md');
  const npmLog = path.join(tmpDir, 'npm.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${npmLog}"`,
      'args="$*"',
      'out=""',
      'prev=""',
      'for arg in "$@"; do if [ "$prev" = "--out" ]; then out="$arg"; fi; prev="$arg"; done',
      'case "$args" in',
      '  *"release:set-expo-token-secret"*) echo "stored super-secret-token"; printf "# set secret\\nREADY\\n" > "$out"; exit 0 ;;',
      '  *"release:github-secrets-check"*) echo "EXPO_TOKEN present"; printf "# check secret\\nREADY\\n" > "$out"; exit 0 ;;',
      '  *"release:external-loop-dispatch"*) echo "dispatch super-secret-token"; printf "# dispatch\\nhttps://github.com/SzeChunYiu/Swedish_Civic_Test/actions/runs/789\\n" > "$out"; exit 0 ;;',
      'esac',
      'echo "unexpected npm command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/bootstrap-expo-token-release.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: 'super-secret-token',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const npmCalls = fs.readFileSync(npmLog, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Expo token release bootstrap DISPATCHED/i);
  assert.match(report, /Status \| DISPATCHED/);
  assert.match(report, /release:set-expo-token-secret/);
  assert.match(report, /release:github-secrets-check/);
  assert.match(report, /release:external-loop-dispatch/);
  assert.match(report, /actions\/runs\/789/);
  assert.match(npmCalls, /run release:set-expo-token-secret -- --out/);
  assert.match(npmCalls, /run release:github-secrets-check -- --out/);
  assert.match(npmCalls, /run release:external-loop-dispatch -- --out/);
  assert.doesNotMatch(report, /super-secret-token/);
  assert.doesNotMatch(result.stdout, /super-secret-token/);
});

test('Expo token bootstrap can read the local token from macOS Keychain fallback', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-bootstrap-keychain-'));
  const reportPath = path.join(tmpDir, 'bootstrap.md');
  const npmLog = path.join(tmpDir, 'npm.log');
  const securityLog = path.join(tmpDir, 'security.log');
  fs.writeFileSync(
    path.join(tmpDir, 'security'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${securityLog}"`,
      'if [ "$1 $2 $3" = "find-generic-password -w -s" ] && [ "$4" = "EXPO_TOKEN" ]; then echo "keychain-secret-token"; exit 0; fi',
      'exit 44',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "$@ EXPO_TOKEN=$EXPO_TOKEN" >> "${npmLog}"`,
      'args="$*"',
      'out=""',
      'prev=""',
      'for arg in "$@"; do if [ "$prev" = "--out" ]; then out="$arg"; fi; prev="$arg"; done',
      'case "$args" in',
      '  *"release:set-expo-token-secret"*) printf "# set secret\\nREADY\\n" > "$out"; exit 0 ;;',
      '  *"release:github-secrets-check"*) printf "# check secret\\nREADY\\n" > "$out"; exit 0 ;;',
      '  *"release:external-loop-dispatch"*) printf "# dispatch\\nhttps://github.com/SzeChunYiu/Swedish_Civic_Test/actions/runs/790\\n" > "$out"; exit 0 ;;',
      'esac',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const env = { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/bootstrap-expo-token-release.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const npmCalls = fs.readFileSync(npmLog, 'utf8');
  const securityCalls = fs.readFileSync(securityLog, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Expo token release bootstrap DISPATCHED/i);
  assert.match(report, /Status \| DISPATCHED/);
  assert.match(report, /Token source \| macOS Keychain service EXPO_TOKEN/);
  assert.match(securityCalls, /find-generic-password -w -s EXPO_TOKEN/);
  assert.match(npmCalls, /EXPO_TOKEN=keychain-secret-token/);
  assert.doesNotMatch(report, /keychain-secret-token/);
  assert.doesNotMatch(result.stdout, /keychain-secret-token/);
});

test('Expo token Keychain writer blocks without a local token and does not call security', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-keychain-blocked-'));
  const reportPath = path.join(tmpDir, 'keychain.md');
  const securityLog = path.join(tmpDir, 'security.log');
  fs.writeFileSync(
    path.join(tmpDir, 'security'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${securityLog}"`,
      'echo "security should not be called without a token" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const env = { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/store-expo-token-keychain.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 1);
  assert.equal(
    pkg.scripts['release:store-expo-token-keychain'],
    'node scripts/store-expo-token-keychain.js',
  );
  assert.equal(fs.existsSync(securityLog), false);
  assert.match(result.stdout, /Expo token Keychain storage BLOCKED/i);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /Token source \| none/);
});

test('Expo token Keychain writer stores a stdin token without printing it', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-keychain-ready-'));
  const reportPath = path.join(tmpDir, 'keychain.md');
  const securityLog = path.join(tmpDir, 'security.log');
  fs.writeFileSync(
    path.join(tmpDir, 'security'),
    [
      '#!/bin/sh',
      'if [ "$1" = "add-generic-password" ] && [ "$2" = "-U" ] && [ "$3" = "-a" ] && [ "$5" = "-s" ] && [ "$6" = "EXPO_TOKEN" ] && [ "$7" = "-w" ] && [ "$8" = "super-secret-token" ]; then',
      `  echo "add-generic-password EXPO_TOKEN redacted" >> "${securityLog}"`,
      '  exit 0',
      'fi',
      'echo "unexpected security command" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const env = { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/store-expo-token-keychain.js', '--token-stdin', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env,
      input: 'super-secret-token\n',
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const securityCalls = fs.readFileSync(securityLog, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Expo token Keychain storage READY/i);
  assert.match(report, /Status \| READY/);
  assert.match(report, /Token source \| stdin/);
  assert.match(report, /security add-generic-password -U -a/);
  assert.match(securityCalls, /add-generic-password EXPO_TOKEN redacted/);
  assert.doesNotMatch(report, /super-secret-token/);
  assert.doesNotMatch(result.stdout, /super-secret-token/);
});

test('Expo token owner request reports current auth blockers and exact next commands', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-token-owner-request-'));
  const reportPath = path.join(tmpDir, 'token-request.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  const securityLog = path.join(tmpDir, 'security.log');
  const npxLog = path.join(tmpDir, 'npx.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "secret list --repo" ]; then exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'security'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${securityLog}"`,
      'if [ "$1 $2 $3" = "find-generic-password -s" ] && [ "$4" = "EXPO_TOKEN" ]; then exit 44; fi',
      'echo "unexpected security command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${npxLog}"`,
      'if [ "$1 $2" = "--yes eas-cli@18.13.0" ] && [ "$3" = "whoami" ]; then echo "Not logged in" >&2; exit 1; fi',
      'echo "unexpected npx command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const env = {
    ...process.env,
    GITHUB_ACTIONS: 'false',
    PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
  };
  delete env.EXPO_TOKEN;

  const result = spawnSync(
    process.execPath,
    ['scripts/write-expo-token-owner-request.js', '--out', reportPath],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 1);
  assert.equal(
    pkg.scripts['release:expo-token-request'],
    'node scripts/write-expo-token-owner-request.js --out reports/expo-token-owner-request-latest.md',
  );
  assert.match(result.stdout, /Expo token owner request BLOCKED/i);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /Repository \| SzeChunYiu\/Swedish_Civic_Test/);
  assert.match(report, /Local EXPO_TOKEN env \| missing/);
  assert.match(report, /macOS Keychain EXPO_TOKEN \| missing/);
  assert.match(report, /GitHub Actions EXPO_TOKEN secret \| missing/);
  assert.match(report, /EAS whoami \| blocked/);
  assert.match(report, /release:store-expo-token-keychain -- --token-stdin/);
  assert.match(report, /release:expo-token-bootstrap/);
  assert.doesNotMatch(report, new RegExp(['Bab', 'bloo'].join(''), 'i'));
  assert.doesNotMatch(report, /super-secret-token|token value/i);
});

test('EAS preview dispatch command blocks without EXPO_TOKEN secret and does not start workflow', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-preview-dispatch-blocked-'));
  const reportPath = path.join(tmpDir, 'dispatch.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "secret list --repo" ]; then exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/dispatch-eas-preview-workflow.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'false',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 1);
  assert.equal(
    pkg.scripts['release:eas-preview-dispatch'],
    'node scripts/dispatch-eas-preview-workflow.js',
  );
  assert.match(result.stdout, /EAS preview workflow dispatch BLOCKED/i);
  assert.match(report, /Status \| BLOCKED/);
  assert.match(report, /EXPO_TOKEN \| missing/);
  assert.match(report, /Run build \| false/);
  assert.doesNotMatch(ghCalls, /workflow run/);
});

test('EAS preview dispatch command starts manual workflow when EXPO_TOKEN secret exists', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-preview-dispatch-ready-'));
  const reportPath = path.join(tmpDir, 'dispatch.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "secret list --repo" ]; then echo "EXPO_TOKEN 2026-05-16T00:00:00Z"; exit 0; fi',
      'if [ "$1 $2 $3" = "workflow run eas-preview-build.yml" ]; then exit 0; fi',
      'if [ "$1 $2 $3" = "run list --workflow" ]; then echo "[{\\"databaseId\\":123,\\"url\\":\\"https://github.com/SzeChunYiu/Swedish_Civic_Test/actions/runs/123\\",\\"status\\":\\"queued\\",\\"headSha\\":\\"abcdef1\\",\\"createdAt\\":\\"2026-05-16T00:00:00Z\\"}]"; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/dispatch-eas-preview-workflow.js', '--run-build', 'true', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'false',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /EAS preview workflow dispatch DISPATCHED/i);
  assert.match(report, /Status \| DISPATCHED/);
  assert.match(report, /EXPO_TOKEN \| present/);
  assert.match(report, /Run build \| true/);
  assert.match(report, /actions\/runs\/123/);
  assert.match(
    ghCalls,
    /workflow run eas-preview-build\.yml --repo SzeChunYiu\/Swedish_Civic_Test -f run_build=true/,
  );
  assert.doesNotMatch(report, /super-secret|token value/i);
});

test('EAS preview dispatch uses injected Actions env and GH_TOKEN without secret-list auth', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-preview-dispatch-actions-env-'));
  const reportPath = path.join(tmpDir, 'dispatch.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@ GH_TOKEN=$GH_TOKEN" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "secret list --repo" ]; then echo "secret list should not be called in Actions" >&2; exit 2; fi',
      'if [ "$1 $2 $3" = "workflow run eas-preview-build.yml" ]; then test -n "$GH_TOKEN"; exit $?; fi',
      'if [ "$1 $2 $3" = "run list --workflow" ]; then printf \'%s\\n\' \'[{"databaseId":321,"url":"https://github.com/SzeChunYiu/Swedish_Civic_Test/actions/runs/321","status":"queued","headSha":"abcdef1","createdAt":"2026-05-16T00:00:00Z"}]\'; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/dispatch-eas-preview-workflow.js', '--run-build', 'false', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'true',
        EXPO_TOKEN: 'super-secret-token',
        GH_TOKEN: 'ghs_fake_token',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /EAS preview workflow dispatch DISPATCHED/i);
  assert.match(report, /Status \| DISPATCHED/);
  assert.match(report, /Secret source \| GitHub Actions injected environment/);
  assert.match(report, /EXPO_TOKEN \| present/);
  assert.match(report, /actions\/runs\/321/);
  assert.match(ghCalls, /workflow run eas-preview-build\.yml/);
  assert.match(ghCalls, /GH_TOKEN=ghs_fake_token/);
  assert.doesNotMatch(ghCalls, /secret list/);
  assert.doesNotMatch(report, /super-secret-token|ghs_fake_token/);
});

test('external release blocker loop runs every safe evidence command and records blocked exits', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-release-loop-'));
  const reportPath = path.join(tmpDir, 'loop.md');
  const commandLog = path.join(tmpDir, 'commands.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      `echo "npx $@" >> "${commandLog}"`,
      'echo "Not logged in" >&2',
      'exit 1',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'node'),
    [
      '#!/bin/sh',
      `echo "node $@" >> "${commandLog}"`,
      'echo "direct evidence command ran"',
      'exit 1',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "npm $@" >> "${commandLog}"`,
      'case "$*" in',
      '  *"release:evidence-index"*) echo "STUBS_READY"; exit 0 ;;',
      '  *"release:owner-action-packet"*) out=""; for arg in "$@"; do out="$arg"; done; echo "# Owner packet" > "$out"; echo "OWNER_PACKET_READY"; exit 1 ;;',
      '  *) echo "blocked by external evidence super-secret-token"; exit 1 ;;',
      'esac',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/run-external-release-loop.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: 'super-secret-token',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ownerPacket = fs.readFileSync(
    path.join(tmpDir, 'release-owner-action-packet-latest.md'),
    'utf8',
  );
  const calls = fs.readFileSync(commandLog, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 1);
  assert.equal(
    pkg.scripts['release:external-blocker-loop'],
    'node scripts/run-external-release-loop.js',
  );
  assert.match(result.stdout, /External release blocker loop BLOCKED/i);
  assert.match(report, /release:eas-access-check/);
  assert.match(report, /release:github-secrets-check/);
  assert.match(report, /release:expo-token-request/);
  assert.match(report, /release:eas-preview-dispatch/);
  assert.match(report, /release:preflight/);
  assert.match(report, /release:evidence-index/);
  assert.match(report, /release:owner-action-packet/);
  assert.match(calls, /npx --yes eas-cli@18\.13\.0 whoami/);
  assert.match(calls, /npm run release:expo-token-request/);
  assert.match(calls, /npm run release:eas-preview-dispatch -- --run-build false/);
  assert.match(calls, /node scripts\/release-preflight\.js/);
  assert.match(calls, /node scripts\/write-release-blocker-snapshot\.js --out /);
  assert.match(calls, /node scripts\/write-release-completion-audit\.js --out /);
  assert.match(calls, /node scripts\/write-release-issue-update\.js --out /);
  assert.match(calls, /npm run release:evidence-index/);
  assert.match(calls, /npm run release:owner-action-packet/);
  assert.match(ownerPacket, /# Owner packet/);
  assert.doesNotMatch(calls, /--run-validate/);
  assert.doesNotMatch(report, /super-secret-token/);
});

test('external release blocker loop times out a stuck step and continues evidence collection', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-release-loop-timeout-'));
  const reportPath = path.join(tmpDir, 'external-release-loop.md');
  const commandLog = path.join(tmpDir, 'commands.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    [
      '#!/bin/sh',
      `echo "npx $@" >> "${commandLog}"`,
      'sleep 0.4',
      'echo "late eas success"',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "npm $@" >> "${commandLog}"`,
      'echo "follow-up evidence ran"',
      'exit 1',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/run-external-release-loop.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: 'super-secret-token',
        EXTERNAL_RELEASE_LOOP_STEP_TIMEOUT_MS: '100',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const calls = fs.readFileSync(commandLog, 'utf8');

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(report, /eas-whoami/);
  assert.match(report, /Timed out after 100ms/);
  assert.match(report, /release:evidence-index/);
  assert.match(calls, /npm run release:evidence-index/);
  assert.doesNotMatch(report, /late eas success/);
});

test('external release blocker loop skips EAS commands when Expo token is absent', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-release-loop-no-token-'));
  const reportPath = path.join(tmpDir, 'external-release-loop.md');
  const commandLog = path.join(tmpDir, 'commands.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    ['#!/bin/sh', `echo "npx $@" >> "${commandLog}"`, 'exit 1', ''].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "npm $@" >> "${commandLog}"`,
      'echo "non-eas evidence ran"',
      'exit 1',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/run-external-release-loop.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: '',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const calls = fs.readFileSync(commandLog, 'utf8');

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(report, /eas-whoami/);
  assert.match(report, /Skipped because EXPO_TOKEN is not configured/);
  assert.doesNotMatch(calls, /npx /);
  assert.doesNotMatch(calls, /release:eas-access-check/);
  assert.doesNotMatch(calls, /release:eas-preview-dispatch/);
  assert.match(calls, /npm run release:github-secrets-check/);
  assert.match(calls, /npm run release:evidence-index/);
});

test('external release blocker loop timeout kills descendant processes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-release-loop-descendant-'));
  const reportPath = path.join(tmpDir, 'external-release-loop.md');
  const commandLog = path.join(tmpDir, 'commands.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npx'),
    ['#!/bin/sh', `echo "npx $@" >> "${commandLog}"`, 'echo "eas blocked"', 'exit 1', ''].join(
      '\n',
    ),
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    [
      '#!/bin/sh',
      `echo "npm $@" >> "${commandLog}"`,
      'case "$*" in',
      "  *\"release:eas-access-check\"*) node -e \"process.on('SIGTERM', () => {}); process.on('SIGHUP', () => {}); setTimeout(() => console.log('late descendant output'), 1000)\" ;;",
      '  *) echo "follow-up evidence ran"; exit 1 ;;',
      'esac',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const startedAt = Date.now();
  const result = spawnSync(
    process.execPath,
    ['scripts/run-external-release-loop.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPO_TOKEN: 'super-secret-token',
        EXTERNAL_RELEASE_LOOP_KILL_GRACE_MS: '100',
        EXTERNAL_RELEASE_LOOP_STEP_TIMEOUT_MS: '100',
        PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  const elapsedMs = Date.now() - startedAt;
  const report = fs.readFileSync(reportPath, 'utf8');
  const calls = fs.readFileSync(commandLog, 'utf8');

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.ok(elapsedMs < 700, `expected process-tree timeout, elapsed ${elapsedMs}ms`);
  assert.match(report, /release:eas-access-check/);
  assert.match(report, /Timed out after 100ms/);
  assert.match(calls, /npm run release:evidence-index/);
  assert.doesNotMatch(report, /late descendant output/);
});

test('manual EAS preview workflow requires Expo token and runs preview build guard', () => {
  const workflowPath = path.join(repoRoot, '.github/workflows/eas-preview-build.yml');
  assert.equal(fs.existsSync(workflowPath), true);

  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /EXPO_TOKEN:\s*\$\{\{ secrets\.EXPO_TOKEN \}\}/);
  assert.match(workflow, /npm run release:eas-access-check/);
  assert.match(workflow, /npm run build:preview -- --check-only/);
  assert.match(workflow, /npm run build:preview/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /actions\/upload-artifact@v6/);
  assert.doesNotMatch(workflow, new RegExp(['Bab', 'bloo'].join(''), 'i'));
});

test('GitHub release validation workflow runs safe validation and blocker evidence checks', () => {
  const workflowPath = path.join(repoRoot, '.github/workflows/release-validation.yml');
  assert.equal(fs.existsSync(workflowPath), true);

  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches:\s*\[\s*main\s*\]/);
  assert.match(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24:\s*true/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /actions\/upload-artifact@v6/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node|upload-artifact)@v4/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run validate/);
  assert.match(workflow, /npm run test:screenshot-manifest/);
  assert.match(workflow, /npm run test:ownership/);
  assert.match(workflow, /npm run test:external-blockers/);
  assert.match(workflow, /npm run release:evidence-index/);
  assert.match(workflow, /STUBS_READY\|READY/);
  assert.ok(
    workflow.indexOf('npm run validate') < workflow.indexOf('npm run test:screenshot-manifest'),
    'release validation should verify the screenshot manifest after the full validation suite',
  );
  assert.ok(
    workflow.indexOf('npm run test:screenshot-manifest') <
      workflow.indexOf('actions/upload-artifact@v6'),
    'release validation should verify the screenshot manifest before uploading artifacts',
  );
  assert.doesNotMatch(workflow, new RegExp(['Bab', 'bloo'].join(''), 'i'));
});

test('E2E specs centralize blocking modal cleanup helpers', () => {
  const e2eDir = path.join(repoRoot, 'tests/e2e');
  const helper = fs.readFileSync(path.join(e2eDir, 'browserLaunch.ts'), 'utf8');

  assert.match(helper, /export async function dismissBlockingModals/);
  assert.match(helper, /export async function closeLaunchAdIfPresent/);
  assert.match(helper, /export async function dismissFirstRunAboutModalIfPresent/);
  assert.match(helper, /export async function dismissLanguagePickerIfPresent/);
  assert.match(helper, /export async function seedSettingsLanguage/);
  assert.match(helper, /settings\\\\language/);
  assert.match(helper, /settings\\\\hasSeenAboutTheTest/);

  const specsWithAllowedLaunchModalAssertions = new Set(['launch-modal-accessibility.spec.ts']);
  const duplicatedLaunchCleanupPattern =
    /closeLaunchAdIfPresent|closeLaunchSponsorAd|Close launch sponsor ad|Stäng startannons/;

  for (const fileName of fs.readdirSync(e2eDir).filter((name) => name.endsWith('.spec.ts'))) {
    if (specsWithAllowedLaunchModalAssertions.has(fileName)) continue;

    const source = fs.readFileSync(path.join(e2eDir, fileName), 'utf8');
    assert.doesNotMatch(
      source,
      duplicatedLaunchCleanupPattern,
      `${fileName} should use dismissBlockingModals from tests/e2e/browserLaunch.ts`,
    );
  }
});

test('Playwright exported-web server port is configurable per worker', () => {
  const config = fs.readFileSync(path.join(repoRoot, 'playwright.config.ts'), 'utf8');
  const staticServer = fs.readFileSync(path.join(repoRoot, 'tests/e2e/serve-dist-web.cjs'), 'utf8');

  assert.match(config, /const DEFAULT_E2E_PORT = 4173/);
  assert.match(config, /process\.env\.E2E_PORT \?\? DEFAULT_E2E_PORT/);
  assert.match(config, /const e2eBaseUrl = `http:\/\/127\.0\.0\.1:\$\{e2ePort\}`/);
  assert.match(config, /baseURL: e2eBaseUrl/);
  assert.match(config, /url: e2eBaseUrl/);
  assert.match(config, /env: \{ PORT: String\(e2ePort\) \}/);
  assert.doesNotMatch(config, /baseURL:\s*['"]http:\/\/127\.0\.0\.1:4173['"]/);
  assert.doesNotMatch(config, /url:\s*['"]http:\/\/127\.0\.0\.1:4173['"]/);
  assert.doesNotMatch(config, /command:\s*['"][^'"]*4173/);
  assert.match(staticServer, /process\.env\.PORT \|\| 4173/);
});

test('manual external blocker loop workflow runs redacted evidence loop and uploads report', () => {
  const workflowPath = path.join(repoRoot, '.github/workflows/external-blocker-loop.yml');
  assert.equal(fs.existsSync(workflowPath), true);

  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24:\s*true/);
  assert.match(workflow, /EXTERNAL_RELEASE_LOOP_STEP_TIMEOUT_MS:\s*120000/);
  assert.match(workflow, /EXTERNAL_RELEASE_LOOP_SKIP_EAS:\s*true/);
  assert.match(workflow, /RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS:\s*true/);
  assert.match(
    workflow,
    /RELEASE_PREFLIGHT_ALLOWED_DIRTY_PATHS:\s*reports\/external-release-loop-latest\.md,reports\/release-owner-action-packet-latest\.md,reports\/release-issue-update-latest\.md,reports\/release-issue-comment-latest\.md,reports\/release-owner-action-packet-comment-latest\.md/,
  );
  assert.match(workflow, /EXPO_TOKEN:\s*\$\{\{ secrets\.EXPO_TOKEN \}\}/);
  assert.match(workflow, /GH_TOKEN:\s*\$\{\{ github\.token \}\}/);
  assert.match(workflow, /actions:\s*write/);
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /actions\/upload-artifact@v6/);
  assert.match(workflow, /npm ci/);
  assert.match(
    workflow,
    /npm run release:external-blocker-loop -- --out reports\/external-release-loop-latest\.md/,
  );
  assert.match(workflow, /EXTERNAL_RELEASE_LOOP_EXIT=\$code/);
  assert.match(
    workflow,
    /node scripts\/post-release-issue-update\.js --body-out reports\/release-issue-update-latest\.md --out reports\/release-issue-comment-latest\.md/,
  );
  assert.doesNotMatch(workflow, /npm run release:issue-comment/);
  assert.match(workflow, /RELEASE_ISSUE_COMMENT_EXIT=\$code/);
  assert.match(
    workflow,
    /node scripts\/post-release-owner-action-packet\.js --body-file reports\/release-owner-action-packet-latest\.md --out reports\/release-owner-action-packet-comment-latest\.md/,
  );
  assert.match(workflow, /OWNER_ACTION_PACKET_COMMENT_EXIT=\$code/);
  assert.match(workflow, /exit 0/);
  assert.match(workflow, /reports\/external-release-loop-latest\.md/);
  assert.match(workflow, /reports\/release-owner-action-packet-latest\.md/);
  assert.match(workflow, /reports\/release-issue-update-latest\.md/);
  assert.match(workflow, /reports\/release-issue-comment-latest\.md/);
  assert.match(workflow, /reports\/release-owner-action-packet-comment-latest\.md/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node|upload-artifact)@v4/);
  assert.doesNotMatch(workflow, new RegExp(['Bab', 'bloo'].join(''), 'i'));
});

test('owner action packet comment posts existing packet body and writes non-secret report', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owner-action-packet-comment-'));
  const bodyPath = path.join(tmpDir, 'owner-packet.md');
  const reportPath = path.join(tmpDir, 'owner-packet-comment.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  const ghBody = path.join(tmpDir, 'gh-body.md');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'while [ "$#" -gt 0 ]; do',
      '  if [ "$1" = "--body-file" ]; then shift; cp "$1" "' + ghBody + '"; fi',
      '  shift',
      'done',
      'echo "https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11#issuecomment-1"',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  fs.writeFileSync(bodyPath, '# Owner packet\n\nToken phrase should stay in body file only.\n');

  const result = spawnSync(
    process.execPath,
    ['scripts/post-release-owner-action-packet.js', '--body-file', bodyPath, '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');
  const postedBody = fs.readFileSync(ghBody, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:owner-action-packet-comment'],
    'node scripts/post-release-owner-action-packet.js',
  );
  assert.match(result.stdout, /Release owner action packet comment POSTED/i);
  assert.match(report, /Status \| POSTED/);
  assert.match(report, /Issue \| 11/);
  assert.match(
    report,
    /Issue comment URL \| https:\/\/github\.com\/SzeChunYiu\/Swedish_Civic_Test\/issues\/11#issuecomment-1/,
  );
  assert.match(ghCalls, /issue comment 11 --repo SzeChunYiu\/Swedish_Civic_Test --body-file /);
  assert.equal(postedBody, '# Owner packet\n\nToken phrase should stay in body file only.\n');
  assert.doesNotMatch(report, /Token phrase should stay in body file only/);
});

test('external blocker loop dispatch command starts workflow and writes report', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'external-loop-dispatch-'));
  const reportPath = path.join(tmpDir, 'external-loop-dispatch.md');
  const ghLog = path.join(tmpDir, 'gh.log');
  fs.writeFileSync(
    path.join(tmpDir, 'gh'),
    [
      '#!/bin/sh',
      `echo "$@" >> "${ghLog}"`,
      'if [ "$1 $2 $3" = "workflow run external-blocker-loop.yml" ]; then exit 0; fi',
      'if [ "$1 $2 $3" = "run list --workflow" ]; then echo "[{\\"databaseId\\":456,\\"url\\":\\"https://github.com/SzeChunYiu/Swedish_Civic_Test/actions/runs/456\\",\\"status\\":\\"queued\\",\\"headSha\\":\\"abcdef1\\",\\"createdAt\\":\\"2026-05-16T00:00:00Z\\"}]"; exit 0; fi',
      'echo "unexpected gh command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/dispatch-external-blocker-loop.js', '--out', reportPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
    },
  );
  const report = fs.readFileSync(reportPath, 'utf8');
  const ghCalls = fs.readFileSync(ghLog, 'utf8');
  const pkg = readJson('package.json');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:external-loop-dispatch'],
    'node scripts/dispatch-external-blocker-loop.js',
  );
  assert.match(result.stdout, /External blocker loop dispatch DISPATCHED/i);
  assert.match(report, /Status \| DISPATCHED/);
  assert.match(report, /external-blocker-loop\.yml/);
  assert.match(report, /actions\/runs\/456/);
  assert.match(
    ghCalls,
    /workflow run external-blocker-loop\.yml --repo SzeChunYiu\/Swedish_Civic_Test --ref main/,
  );
  assert.doesNotMatch(report, /super-secret|token value/i);
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

test('production build check-only avoids recursive npm validation', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'production-build-check-only-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    ['#!/bin/sh', `echo "$@" >> "${npmLog}"`, 'exit 99', ''].join('\n'),
    { mode: 0o755 },
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/build-production-guard.js', '--check-only'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Production build blocked/i);
  assert.equal(fs.existsSync(npmLog), false);
});

test('production submit guard blocks placeholder Apple identifiers before release preflight', () => {
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
  assert.doesNotMatch(result.stdout, /release preflight/i);
});

test('production submit check-only avoids recursive npm validation after credentials pass', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'production-submit-check-only-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const easPath = path.join(repoRoot, 'eas.json');
  const originalEas = fs.readFileSync(easPath, 'utf8');
  const fakeServiceAccount = path.join(repoRoot, 'tmp/fake-google-play-service-account.json');
  fs.writeFileSync(
    path.join(tmpDir, 'npm'),
    ['#!/bin/sh', `echo "$@" >> "${npmLog}"`, 'exit 99', ''].join('\n'),
    { mode: 0o755 },
  );

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
        env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Production submit blocked/i);
    assert.match(result.stdout, /release preflight/i);
    assert.equal(fs.existsSync(npmLog), false);
  } finally {
    fs.writeFileSync(easPath, originalEas);
    fs.rmSync(fakeServiceAccount, { force: true });
  }
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
  const appConfig = readJson('app.json').expo;
  const vercelConfig = readJson('vercel.json');
  const redirects = fs.readFileSync(path.join(repoRoot, 'public/_redirects'), 'utf8');
  const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/web-deploy.yml'), 'utf8');

  assert.equal(appConfig.web.output, 'single');
  assert.equal(Object.hasOwn(appConfig.web, 'baseUrl'), false);
  assert.equal(pkg.scripts['build:web:export'], 'expo export --platform web --output-dir dist-web');
  assert.equal(pkg.scripts['postbuild:web:export'], 'node scripts/prepare-web-export.js dist-web');
  assert.equal(
    pkg.scripts['release:web-export-smoke'],
    'rm -rf dist-web && npm run build:web:export',
  );
  assert.equal(vercelConfig.outputDirectory, 'site');
  assert.equal(vercelConfig.framework, null);
  assert.equal(vercelConfig.cleanUrls, true);
  assert.deepEqual(vercelConfig.git, { deploymentEnabled: false });
  assert.deepEqual(vercelConfig.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
  assert.equal(redirects.trim(), '/* /index.html 200');
  assert.match(workflow, /npm run build:web:export/);
  assert.match(workflow, /node scripts\/prepare-web-export\.js --check dist-web/);
  assert.match(workflow, /actions\/upload-artifact@v6/);
  assert.match(workflow, /path:\s+dist-web/);
  assert.match(fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8'), /^dist-web\/$/m);
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/prepare-web-export.js')), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'public/manifest.webmanifest')), true);
});

test('Vercel static-site config ships host-level security headers without changing deploy path', () => {
  const vercelConfig = readJson('vercel.json');
  const headerRule = vercelConfig.headers?.find((rule) => rule.source === '/(.*)');
  assert.ok(headerRule, 'vercel.json must apply response headers to the static site');
  assert.equal(vercelConfig.outputDirectory, 'site');
  assert.equal(vercelConfig.cleanUrls, true);
  assert.deepEqual(vercelConfig.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
  assert.deepEqual(vercelConfig.git, { deploymentEnabled: false });

  const actualHeaders = new Map(
    (headerRule.headers ?? []).map((header) => [String(header.key).toLowerCase(), header.value]),
  );
  for (const expectedHeader of REQUIRED_SECURITY_HEADERS) {
    assert.equal(
      actualHeaders.get(expectedHeader.key),
      expectedHeader.value,
      `${expectedHeader.name} must stay configured in vercel.json`,
    );
  }
  // TODO(static-csp): add a tested report-only CSP after static fonts and inline scripts are removed.
  assert.equal(actualHeaders.has('content-security-policy'), false);
});

test('web export postbuild rewrites root-relative bundle URLs for file and hosted loading', () => {
  const {
    WEB_EXPORT_FRESHNESS_MARKER,
    assertWebExportFreshness,
  } = require('./prepare-web-export.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-export-postbuild-'));
  const outputDir = path.join(tmpDir, 'dist-web');
  const bundleDir = path.join(outputDir, '_expo/static/js/web');
  const canvasColor = readThemeCanvasColor();
  fs.mkdirSync(bundleDir, { recursive: true });
  const manifest = copyPublicWebManifest(outputDir);
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<title>Export</title>',
      '<link rel="preload" href="/_expo/static/js/web/entry-test.js" as="script">',
      '<link rel="icon" href="/assets/favicon.png">',
      '</head>',
      '<body>',
      '<div id="root"></div>',
      '<script src="/_expo/static/js/web/entry-test.js" defer></script>',
      '</body>',
      '</html>',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(bundleDir, 'entry-test.js'),
    'const chunks = {"paths":{"1":"/_expo/static/js/web/chunk-test.js"}}; const icon = {uri:"/assets/icon.png"};',
  );

  const result = spawnSync(process.execPath, ['scripts/prepare-web-export.js', outputDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const index = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
  const fallback = fs.readFileSync(path.join(outputDir, '404.html'), 'utf8');
  const bundle = fs.readFileSync(path.join(bundleDir, 'entry-test.js'), 'utf8');
  const freshnessMarker = JSON.parse(
    fs.readFileSync(path.join(outputDir, WEB_EXPORT_FRESHNESS_MARKER), 'utf8'),
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(index, /data-web-export-loader="true"/);
  assert.match(index, /window\.location\.protocol === "file:" \? "\.\/" : "\/"/);
  assert.match(index, /script\.src = "_expo\/static\/js\/web\/entry-test\.js"/);
  assert.doesNotMatch(index, /src="\/_expo\//);
  assert.doesNotMatch(index, /href="\/_expo\//);
  assert.doesNotMatch(index, /href="\/assets\//);
  assert.match(index, /href="_expo\/static\/js\/web\/entry-test\.js"/);
  assert.match(index, /href="assets\/favicon\.png"/);
  assert.match(index, new RegExp(`<meta name="theme-color" content="${canvasColor}" />`));
  assert.match(index, /<link rel="manifest" href="manifest\.webmanifest" \/>/);
  assert.match(index, new RegExp(`<body style="background-color:${canvasColor}">`));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.webmanifest'), 'utf8')).display,
    'standalone',
  );
  assert.equal(fallback, index);
  assert.match(bundle, /"paths":\{"1":"_expo\/static\/js\/web\/chunk-test\.js"\}/);
  assert.match(bundle, /uri:"assets\/icon\.png"/);
  assert.equal(manifest.name, readJson('app.json').expo.name);
  assert.match(freshnessMarker.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal(freshnessMarker.sourceInputs.includes('app'), true);
  assert.equal(freshnessMarker.sourceInputs.includes('components'), true);
  assert.equal(freshnessMarker.sourceInputs.includes('tests/e2e'), true);
  assert.doesNotThrow(() => assertWebExportFreshness(outputDir, { repoRoot }));

  const checkResult = spawnSync(
    process.execPath,
    ['scripts/prepare-web-export.js', '--check', outputDir],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  assert.equal(checkResult.status, 0, checkResult.stderr || checkResult.stdout);
});

test('dist-web e2e server rejects missing or stale freshness markers before serving', () => {
  const { assertDistWebReady } = require('../tests/e2e/serve-dist-web.cjs');
  const {
    webExportFreshnessMarkerPath,
    writeWebExportFreshnessMarker,
  } = require('./prepare-web-export.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-web-freshness-'));
  const outputDir = path.join(tmpDir, 'dist-web');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), '<!doctype html><title>dist-web</title>\n');

  const marker = writeWebExportFreshnessMarker(outputDir, { repoRoot });
  const markerPath = webExportFreshnessMarkerPath(outputDir);
  assert.doesNotThrow(() => assertDistWebReady(outputDir, repoRoot));

  fs.writeFileSync(
    markerPath,
    `${JSON.stringify({ ...marker, sourceHash: '0'.repeat(64) }, null, 2)}\n`,
  );
  assert.throws(
    () => assertDistWebReady(outputDir, repoRoot),
    /dist-web is stale[\s\S]*npm run build:web:export/,
  );

  fs.rmSync(markerPath);
  assert.throws(
    () => assertDistWebReady(outputDir, repoRoot),
    /web-export-freshness\.json[\s\S]*npm run build:web:export/,
  );
});

test('scheduled Vercel deploy has a site-only main trigger and deploy-hook live smoke gate', () => {
  const pkg = readJson('package.json');
  const workflow = fs.readFileSync(
    path.join(repoRoot, '.github/workflows/scheduled-deploy.yml'),
    'utf8',
  );
  const runCommands = workflow.match(/run: \|\n([\s\S]*)/)?.[1] ?? '';

  assert.equal(pkg.scripts['test:site-live'], 'node scripts/check-live-site.js');
  assert.match(workflow, /schedule:\s*\n\s+- cron: ['"]\*\/30 \* \* \* \*['"]/);
  assert.doesNotMatch(workflow, /cron: ['"]\*\/15 \* \* \* \*['"]/);
  assert.match(workflow, /branches:\s*\n\s+- main/);
  assert.match(workflow, /paths:\s*\n(?:\s+- ['"].+['"]\n)+/);
  assert.match(workflow, /['"]site\/\*\*['"]/);
  assert.match(workflow, /['"]scripts\/check-live-site\.js['"]/);
  assert.match(workflow, /secrets\.VERCEL_DEPLOY_HOOK/);
  assert.match(workflow, /curl [^\n]*-X POST "\$HOOK"/);
  assert.match(workflow, /node scripts\/check-live-site\.js "\$VERCEL_PRODUCTION_URL"/);
  assert.match(workflow, /VERCEL_PRODUCTION_URL/);
  assert.doesNotMatch(workflow, /\bVERCEL_TOKEN\b/);
  assert.doesNotMatch(workflow, /\.vercel\/project\.json/);
  assert.doesNotMatch(runCommands, /npx[\s\S]*vercel/i);
  assert.doesNotMatch(
    runCommands,
    /(?:^|\n)\s*(?:npx\s+[^\n]*|pnpm\s+dlx\s+|yarn\s+dlx\s+)?vercel(?:@\S+)?\s+deploy\b/im,
  );
  assert.doesNotMatch(runCommands, /--token/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/check-live-site.js')), true);
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
