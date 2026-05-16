const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function makeGatesFile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-gates-writer-'));
  const gatesPath = path.join(tmpDir, 'release-gates.json');
  fs.writeFileSync(
    gatesPath,
    JSON.stringify(
      {
        schemaVersion: 1,
        description: 'test gate file',
        gates: {
          'android-device-audio': {
            status: 'BLOCKED',
            evidence: 'No Android evidence recorded.',
          },
          'public-urls': {
            status: 'READY',
            evidence: 'Support URL and Privacy Policy URL ready.',
          },
        },
      },
      null,
      2,
    ),
  );
  return gatesPath;
}

test('release gate writer updates existing gate evidence without hand-editing JSON', () => {
  const gatesPath = makeGatesFile();

  const result = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence',
      'Android Pixel 8 audio smoke passed; build https://expo.dev/build/android-123',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /android-device-audio/i);
  const updated = JSON.parse(fs.readFileSync(gatesPath, 'utf8'));
  assert.equal(updated.gates['android-device-audio'].status, 'READY');
  assert.equal(
    updated.gates['android-device-audio'].evidence,
    'Android Pixel 8 audio smoke passed; build https://expo.dev/build/android-123',
  );
});

test('release gate writer refuses unknown gates and empty READY evidence', () => {
  const gatesPath = makeGatesFile();

  const unknown = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'not-a-real-gate',
      '--status',
      'BLOCKED',
      '--evidence',
      'blocked',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr || unknown.stdout, /Unknown gate/i);

  const emptyReady = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence',
      '   ',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(emptyReady.status, 1);
  assert.match(emptyReady.stderr || emptyReady.stdout, /READY evidence/i);
});

test('release gate writer accepts longer evidence from a file', () => {
  const gatesPath = makeGatesFile();
  const evidenceFile = path.join(path.dirname(gatesPath), 'android-evidence.txt');
  fs.writeFileSync(
    evidenceFile,
    [
      'Android Pixel 8 physical-device audio smoke passed.',
      'Build URL: https://expo.dev/build/android-456',
      'Tester: release operator',
      '',
    ].join('\n'),
  );

  const result = spawnSync(
    process.execPath,
    [
      'scripts/update-release-gate.js',
      '--path',
      gatesPath,
      '--gate',
      'android-device-audio',
      '--status',
      'READY',
      '--evidence-file',
      evidenceFile,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = JSON.parse(fs.readFileSync(gatesPath, 'utf8'));
  assert.match(updated.gates['android-device-audio'].evidence, /Android Pixel 8/);
  assert.match(
    updated.gates['android-device-audio'].evidence,
    /https:\/\/expo\.dev\/build\/android-456/,
  );
});

test('release evidence stub command creates gate-specific non-secret evidence files', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-stub-'));
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'store-records'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const outputPath = path.join(tmpRoot, 'reports/store-records/store-records.json');
  const stub = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    pkg.scripts['release:evidence-stub'],
    'node scripts/create-release-evidence-stub.js',
  );
  assert.match(result.stdout, /store-records/i);
  assert.equal(stub.gate, 'store-records');
  assert.equal(stub.status, 'blocked');
  assert.equal(stub.bundleIdentifier, 'com.billyyiu.swedishcivictest');
  assert.equal(stub.packageName, 'com.billyyiu.swedishcivictest');
  assert.match(stub.supportUrl, /szechunyiu.github.io/);
  assert.match(stub.privacyPolicyUrl, /szechunyiu.github.io/);

  const secondRun = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'store-records'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(secondRun.status, 1);
  assert.match(secondRun.stderr || secondRun.stdout, /already exists/i);
});

test('release evidence stub command rejects unknown gates', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-stub-unknown-'));
  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--root', tmpRoot, '--gate', 'not-a-gate'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /Unknown gate/i);
});

test('release evidence stub list stays synchronized with blocked manual gates', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/create-release-evidence-stub.js', '--list'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const rows = JSON.parse(result.stdout);
  const gates = JSON.parse(fs.readFileSync(path.join(repoRoot, 'reports/release-gates.json')));
  const blockedManualGates = Object.entries(gates.gates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate)
    .sort();

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(rows.map((row) => row.gate).sort(), blockedManualGates);
  assert.equal(
    rows.some((row) => row.gate === 'public-urls'),
    false,
  );
  for (const row of rows) {
    assert.match(row.path, /^reports\//);
    assert.equal(row.status, 'blocked');
  }
});
