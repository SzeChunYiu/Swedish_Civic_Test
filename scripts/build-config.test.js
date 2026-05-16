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
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
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
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
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
      env: { ...process.env, PATH: `${tmpDir}${path.delimiter}${process.env.PATH}` },
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
  assert.match(workflow, /npm run test:ownership/);
  assert.match(workflow, /npm run test:external-blockers/);
  assert.match(workflow, /npm run release:evidence-index/);
  assert.match(workflow, /STUBS_READY\|READY/);
  assert.doesNotMatch(workflow, new RegExp(['Bab', 'bloo'].join(''), 'i'));
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
