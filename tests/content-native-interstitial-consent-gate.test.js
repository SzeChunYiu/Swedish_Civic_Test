const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('native practice interstitial uses platform-aware consent gating', () => {
  const nativeSource = read('components/monetization/PracticeInterstitialAd.native.tsx');
  assert.match(
    nativeSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-ad-placement-route-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0);
  assert.doesNotMatch(
    `${result.stdout}\n${result.stderr}`,
    /PracticeInterstitialAd native placement must gate quiz_completed_interstitial through consent-aware/,
  );
});
