const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('release preflight owns the v1.1 scope guard behind Remove Ads acceptance', () => {
  const packageJson = JSON.parse(readRepoFile('package.json'));
  const releasePreflightScript = readRepoFile('scripts/release-preflight.js');
  const releasePreflightTests = readRepoFile('scripts/release-preflight.test.js');
  const releasePolicySource = readRepoFile('lib/monetization/releasePolicy.ts');
  const profileRouteSource = readRepoFile('app/(tabs)/profile.tsx');

  assert.match(
    packageJson.scripts['test:release-preflight'],
    /tests\/release-scope-v11-guard\.test\.js/,
  );
  assert.match(releasePreflightScript, /release-scope-v11/);
  assert.match(releasePreflightScript, /v1\.1 scope held behind v1\.0 Remove Ads/);
  assert.match(releasePreflightScript, /reports\/release-ads-iap-device-qa\.md/);
  assert.match(releasePreflightScript, /removeAdsStep3StructuralFindings/);
  assert.match(releasePreflightScript, /REMOVE_ADS_PRODUCT_ID/);
  assert.match(releasePreflightScript, /REMOVE_ADS_PRICE_LABEL/);
  assert.doesNotMatch(releasePreflightScript, /grep -qiE "restore"/);
  assert.doesNotMatch(releasePreflightScript, /grep -rqi "remove\.\?ads" app components lib/);
  assert.match(releasePreflightScript, /operator/i);
  assert.match(releasePreflightScript, /allow\|approved\|approval/);
  assert.match(releasePolicySource, /proRuntimeScopeDefaultEnabled:\s*false/);
  assert.match(releasePolicySource, /EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE/);
  assert.match(releasePolicySource, /proRuntimeScopeOverrideGate:\s*'release-scope-v11'/);
  assert.match(profileRouteSource, /isProRuntimeScopeEnabled/);
  assert.match(profileRouteSource, /entitlementsReady && proRuntimeScopeEnabled/);
  assert.match(
    releasePreflightTests,
    /blocks v1\.1 surfaces while v1\.0 Remove Ads acceptance is red/,
  );
  assert.match(
    releasePreflightTests,
    /allows v1\.1 surfaces only with explicit operator override evidence/,
  );
});
