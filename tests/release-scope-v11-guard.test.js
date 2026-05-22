const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
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

  assert.match(
    packageJson.scripts['test:release-preflight'],
    /scripts\/run-release-preflight-tests\.js/,
  );
  assert.match(
    readRepoFile('scripts/run-release-preflight-tests.js'),
    /tests\/release-scope-v11-guard\.test\.js/,
  );
  assert.match(releasePreflightScript, /release-scope-v11/);
  assert.match(releasePreflightScript, /v1\.1 scope held behind v1\.0 Remove Ads/);
  assert.match(releasePreflightScript, /RELEASE_PREFLIGHT_V11_SCOPE_ROOTS/);
  assert.match(releasePreflightScript, /v1\.1 source marker/);
  assert.match(releasePreflightScript, /formatV11ScopeSurface/);
  assert.match(releasePreflightScript, /reports\/release-ads-iap-device-qa\.md/);
  assert.match(releasePreflightScript, /Remove Ads structural gate replacing GOAL step 3 grep/);
  assert.match(releasePreflightScript, /RELEASE_PREFLIGHT_REMOVE_ADS_PURCHASES_PATH/);
  assert.match(releasePreflightScript, /requestRemoveAdsPurchase\(REMOVE_ADS_PRODUCT_ID\)/);
  assert.match(releasePreflightScript, /restorePurchases\(\[REMOVE_ADS_PRODUCT_ID\]\)/);
  assert.match(releasePreflightScript, /REMOVE_ADS_IOS_PRODUCT_ID/);
  assert.match(releasePreflightScript, /REMOVE_ADS_ANDROID_PRODUCT_ID/);
  assert.match(releasePreflightScript, /REMOVE_ADS_STORE_PRODUCT_IDS/);
  assert.match(releasePreflightScript, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(releasePreflightScript, /anyRepoFileMatches\(wiringRoots/);
  assert.doesNotMatch(releasePreflightScript, /grep -rqi "remove\.\?ads" app components lib/);
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
  assert.match(releasePreflightTests, /labels v1\.1 source-marker surfaces/);
  assert.match(
    releasePreflightTests,
    /text output labels v1\.1 source-marker surfaces without temp-root noise/,
  );
  assert.match(
    releasePreflightTests,
    /allows v1\.1 surfaces only with explicit operator override evidence/,
  );
});

test('release preflight npm wrapper forwards test filters before files', () => {
  const childEnv = { ...process.env };
  Object.keys(childEnv).forEach((key) => {
    if (key.startsWith('NODE_TEST')) {
      delete childEnv[key];
    }
  });
  childEnv.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--v8-pool-size=1'].filter(Boolean).join(' ');

  const result = spawnSync(
    'npm',
    [
      'run',
      'test:release-preflight',
      '--',
      '--test-name-pattern',
      'blocks v1.1 surfaces|labels v1.1 source-marker',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: childEnv,
    },
  );
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0, output);
  assert.match(
    output,
    /release preflight blocks v1\.1 surfaces while v1\.0 Remove Ads acceptance is red/,
  );
  assert.match(
    output,
    /release preflight labels v1\.1 source-marker surfaces without temp-root noise/,
  );
  assert.match(
    output,
    /release preflight text output labels v1\.1 source-marker surfaces without temp-root noise/,
  );
  assert.match(output, /tests 3/);
  assert.doesNotMatch(output, /release preflight fails closed on external launch blockers/);
  assert.doesNotMatch(output, /tests\/release-scope-v11-guard\.test\.js/);
});
