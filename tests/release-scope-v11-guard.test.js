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

  assert.match(
    packageJson.scripts['test:release-preflight'],
    /tests\/release-scope-v11-guard\.test\.js/,
  );
  assert.match(releasePreflightScript, /release-scope-v11/);
  assert.match(releasePreflightScript, /v1\.1 scope held behind v1\.0 Remove Ads/);
  assert.match(releasePreflightScript, /reports\/release-ads-iap-device-qa\.md/);
  assert.match(releasePreflightScript, /test -f lib\/monetization\/purchases\.ts/);
  assert.match(releasePreflightScript, /grep -qiE "restore"/);
  assert.match(releasePreflightScript, /grep -rqi "remove\.\?ads" app components lib/);
  assert.match(releasePreflightScript, /operator/i);
  assert.match(releasePreflightScript, /allow\|approved\|approval/);
  assert.match(
    releasePreflightTests,
    /blocks v1\.1 surfaces while v1\.0 Remove Ads acceptance is red/,
  );
  assert.match(
    releasePreflightTests,
    /allows v1\.1 surfaces only with explicit operator override evidence/,
  );
});
