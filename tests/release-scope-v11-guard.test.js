const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const requiredV11RuntimeSurfaces = [
  'app/dashboard.tsx',
  'components/quiz/ConfidenceRatingPicker.tsx',
  'lib/storage/accessibilityStore.ts',
  'lib/notifications/studyReminder.ts',
  'lib/storage/reviewStore.ts',
  'lib/learning/adaptivePractice.ts',
  'lib/learning/dailyChallenge.ts',
  'lib/storage/companionStore.ts',
  'lib/mascot/catalog.ts',
  'lib/monetization/proLifetimePurchase.ts',
];

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('release preflight owns the v1.1 scope guard behind Remove Ads acceptance', () => {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  const releasePreflightScript = readRepoFile('scripts/release-preflight.js');
  const releasePreflightTests = readRepoFile('scripts/release-preflight.test.js');

  assert.match(
    packageJson.scripts['test:release-preflight'],
    /tests\/release-scope-v11-guard\.test\.js/,
  );
  assert.match(releasePreflightScript, /release-scope-v11/);
  assert.match(releasePreflightScript, /v1\.1 scope held behind v1\.0 Remove Ads/);
  assert.match(releasePreflightScript, /reports\/release-ads-iap-device-qa\.md/);
  assert.match(releasePreflightScript, /Remove Ads structural gate replacing GOAL step 3 grep/);
  assert.match(releasePreflightScript, /RELEASE_PREFLIGHT_REMOVE_ADS_PURCHASES_PATH/);
  assert.match(releasePreflightScript, /requestRemoveAdsPurchase\(REMOVE_ADS_PRODUCT_ID\)/);
  assert.match(releasePreflightScript, /restorePurchases\(\[REMOVE_ADS_PRODUCT_ID\]\)/);
  assert.match(releasePreflightScript, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(releasePreflightScript, /anyRepoFileMatches\(wiringRoots/);
  assert.doesNotMatch(releasePreflightScript, /grep -rqi "remove\.\?ads" app components lib/);
  for (const surfacePath of requiredV11RuntimeSurfaces) {
    assert.ok(fs.existsSync(path.join(repoRoot, surfacePath)), `${surfacePath} exists`);
    assert.match(
      releasePreflightScript,
      new RegExp(surfacePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${surfacePath} is included in the release-scope inventory`,
    );
  }
  assert.match(releasePreflightScript, /operator/i);
  assert.match(releasePreflightScript, /allow\|approved\|approval/);
  assert.match(
    releasePreflightTests,
    /blocks Remove Ads step 3 structural drift without the brittle GOAL grep/,
  );
  assert.match(
    releasePreflightTests,
    /blocks v1\.1 surfaces while v1\.0 Remove Ads acceptance is red/,
  );
  assert.match(
    releasePreflightTests,
    /allows v1\.1 surfaces only with explicit operator override evidence/,
  );
});
