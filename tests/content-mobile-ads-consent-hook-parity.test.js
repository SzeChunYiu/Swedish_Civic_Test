const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mobile-ads-consent-hook'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('mobile ads consent hook fails closed around Remove Ads and cached initialization', () => {
  const summary = parseValidationSummary();
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMobileAdsConsent.ts'),
    'utf8',
  );

  assert.equal(summary.mobileAdsConsentHookCasesValidated, 6);
  assert.equal(summary.mobileAdsConsentHookParityValidated, true);
  assert.match(hookSource, /!entitlements\.adsDisabled && adsConfig\.realAdsEnabled/);
  assert.match(hookSource, /trackingTransparencyStatus:/);
  assert.match(hookSource, /umpConsentStatus:/);
  assert.match(hookSource, /getAdSdkInitializationDecision\(state\)/);
  assert.match(
    hookSource,
    /!entitlements\.adsDisabled[\s\S]*cachedInitialization[\s\S]*cachedInitializationPlatform === platform/,
  );
  assert.match(hookSource, /if \(!result\.initialized\) \{[\s\S]*resetInitializationPromise\(\);/);
  assert.match(hookSource, /setResult\(createInitialResult\(entitlements, platform\)\)/);
});

test('mobile ads consent hook parity rejects Remove Ads prompt drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'adsConfig.googleMobileAdsEnabled && !entitlements.adsDisabled && adsConfig.realAdsEnabled;',
        'adsConfig.googleMobileAdsEnabled && adsConfig.realAdsEnabled;'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Mobile Ads consent hook must derive initial prompt state from ads config and Remove Ads entitlements/,
  );
});

test('mobile ads consent hook parity rejects cached Remove Ads initialization drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        /!entitlements\\.adsDisabled\\s*&&\\s*cachedInitialization\\s*&&\\s*cachedInitializationPlatform === platform/,
        'cachedInitialization && cachedInitializationPlatform === platform'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Mobile Ads consent hook must fail closed to initial consent state after async initialization errors/,
  );
});

test('mobile ads consent hook parity rejects blocked result cache drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (!result.initialized) {', 'if (false) {');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Mobile Ads consent hook must retry after non-initialized blocked consent results/,
  );
});
