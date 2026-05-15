const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

function runPreflight() {
  const result = spawnSync(process.execPath, ['scripts/release-preflight.js', '--json'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('release preflight fails closed on external launch blockers', () => {
  const report = runPreflight();
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
