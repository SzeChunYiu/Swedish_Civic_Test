const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('ad/IAP device QA template is wired into release gates', () => {
  const goal = read('GOAL.md');
  const template = read('reports/release-ads-iap-device-qa.md');
  const releasePreflight = read('scripts/release-preflight.js');
  const releaseGates = JSON.parse(read('reports/release-gates.json')).gates;
  const runbook = read('publishing/post-eas-auth-runbook.md');

  assert.match(goal, /reports\/release-ads-iap-device-qa\.md/);
  assert.ok(releaseGates['ads-iap-device-qa'], 'release gate ads-iap-device-qa is required');
  assert.equal(releaseGates['ads-iap-device-qa'].status, 'BLOCKED');
  assert.match(releaseGates['ads-iap-device-qa'].evidence, /release-ads-iap-device-qa\.md/);

  for (const phrase of [
    /AdMob test units render/i,
    /Remove Ads purchase flow for 29 SEK removes all ad placements/i,
    /persists after force quit and relaunch/i,
    /Restore purchase/i,
    /App Tracking Transparency/i,
    /Google UMP \/ EEA consent prompt/i,
    /Mock exam screen stays ad-free/i,
  ]) {
    assert.match(template, phrase);
  }

  assert.match(releasePreflight, /ads-iap-device-qa/);
  assert.match(releasePreflight, /validateAdsIapDeviceQaEvidence/);
  assert.match(releasePreflight, /unchecked checklist items remain/);
  assert.match(runbook, /--gate ads-iap-device-qa/);
});
