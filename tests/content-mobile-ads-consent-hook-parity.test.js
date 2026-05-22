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
  assert.match(hookSource, /shouldCollectMobileAdsConsent\(\{/);
  assert.match(
    hookSource,
    /mobileAdsTestUnitConsentEnabled:\s*adsConfig\.mobileAdsTestUnitConsentEnabled/,
  );
  assert.match(hookSource, /trackingTransparencyStatus:/);
  assert.match(hookSource, /umpConsentStatus:/);
  assert.match(hookSource, /getAdSdkInitializationDecision\(state\)/);
  assert.match(
    hookSource,
    /!isStrictEntitlementFlag\(entitlements\.adsDisabled\)[\s\S]*cachedInitialization/,
  );
  assert.match(hookSource, /cachedInitializationPlatform\s*===\s*platform/);
  assert.match(
    hookSource,
    /if\s*\(\s*!result\.initialized\s*\)\s*\{\s*resetInitializationPromise\(\);\s*return\s+result;\s*\}/,
  );
  assert.match(hookSource, /setResult\(createInitialResult\(entitlements,\s*platform\)\)/);
});

test('mobile ads consent hook parity rejects Remove Ads prompt drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-mobile-ads-consent-hook');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'entitlements,\\n    googleMobileAdsEnabled: adsConfig.googleMobileAdsEnabled,',
        'entitlements: { adsDisabled: false },\\n    googleMobileAdsEnabled: adsConfig.googleMobileAdsEnabled,'
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

test('mobile ads consent hook parity rejects test-unit consent flag drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-mobile-ads-consent-hook');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'mobileAdsTestUnitConsentEnabled: adsConfig.mobileAdsTestUnitConsentEnabled,',
        'mobileAdsTestUnitConsentEnabled: false,'
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
process.argv.push('--focus-mobile-ads-consent-hook');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '!isStrictEntitlementFlag(entitlements.adsDisabled) &&\\n      cachedInitialization &&\\n      cachedInitializationPlatform === platform',
        'cachedInitialization &&\\n      cachedInitializationPlatform === platform'
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

test('mobile ads consent hook parity rejects blocked-result retry drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-mobile-ads-consent-hook');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useMobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '    resetInitializationPromise();\\n    return result;',
        '    return result;'
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
    /Mobile Ads consent hook must reset shared initialization after blocked consent results without caching them/,
  );
});
