const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

function runPreflight(options = {}) {
  const result = spawnSync(
    process.execPath,
    ['scripts/release-preflight.js', '--json', ...(options.args || [])],
    {
      encoding: 'utf8',
      env: { ...process.env, ...(options.env || {}) },
    },
  );
  if (options.expectedStatus !== undefined) {
    assert.equal(result.status, options.expectedStatus, result.stderr || result.stdout);
  }
  return JSON.parse(result.stdout);
}

test('release preflight fails closed on external launch blockers', () => {
  const report = runPreflight({ expectedStatus: 1 });
  assert.equal(report.status, 'BLOCKED');
  assert.equal(report.readyForSubmission, false);

  const gateIds = new Set(report.gates.map((gate) => gate.id));
  for (const id of [
    'local-validation',
    'eas-auth',
    'android-device-audio',
    'ios-device-audio',
    'store-records',
    'public-urls',
    'device-screenshots',
  ]) {
    assert.ok(gateIds.has(id), `${id} should be represented`);
  }

  const blocked = report.gates.filter((gate) => gate.status === 'BLOCKED');
  assert.ok(blocked.length >= 5, 'external blockers should remain explicit');
  assert.match(report.nextActions[0], /Expo\/EAS/i);
});

test('release preflight can pass after recorded external evidence and EAS auth are ready', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-preflight-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');
  const fakeNpm = path.join(tmpDir, 'npm');

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        gates: {
          'android-device-audio': {
            status: 'READY',
            evidence:
              'Android Pixel 8 physical-device audio smoke passed; build https://expo.dev/build/android-ready',
          },
          'ios-device-audio': {
            status: 'READY',
            evidence:
              'iPhone 15 TestFlight audio smoke passed; build https://appstoreconnect.apple.com/testflight-ready',
          },
          'store-records': {
            status: 'READY',
            evidence:
              'App Store Connect and Google Play Console records exist for com.billyyiu.swedishcivictest; real ads deferred.',
          },
          'public-urls': {
            status: 'READY',
            evidence:
              'Support and privacy pages verified over HTTPS and entered in both store records.',
          },
          'device-screenshots': {
            status: 'READY',
            evidence:
              'Final screenshots captured from accepted device tooling and recorded in screenshot manifest.',
          },
          submission: {
            status: 'READY',
            evidence:
              'TestFlight, Google Play internal, production submission, and monitoring evidence recorded.',
          },
        },
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    fakeNpm,
    [
      '#!/bin/sh',
      'if [ "$1 $2 $3 $4" = "exec -- eas --version" ]; then echo "eas-cli/18.13.0 test"; exit 0; fi',
      'if [ "$1 $2 $3" = "exec -- eas" ] && [ "$4" = "whoami" ]; then echo "expo-user"; exit 0; fi',
      'echo "unexpected npm command: $@" >&2',
      'exit 2',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );

  const report = runPreflight({
    expectedStatus: 0,
    env: {
      PATH: `${tmpDir}${path.delimiter}${process.env.PATH}`,
      RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
    },
  });

  assert.equal(report.status, 'READY_FOR_STORE_SUBMISSION');
  assert.equal(report.readyForSubmission, true);
  assert.equal(
    report.gates.every((gate) => gate.status === 'READY'),
    true,
  );
});
