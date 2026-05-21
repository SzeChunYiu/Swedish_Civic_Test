const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary(args = ['--focus-mobile-ads-consent-parity']) {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
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
  const runtimeSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
    'utf8',
  );

  assert.equal(summary.mobileAdsConsentHookCasesValidated, 5);
  assert.equal(summary.mobileAdsConsentHookParityValidated, true);
  assert.equal(summary.mobileAdsConsentRuntimeCasesValidated, 4);
  assert.equal(summary.mobileAdsConsentRuntimeParityValidated, true);
  assert.match(hookSource, /!entitlements\.adsDisabled && adsConfig\.realAdsEnabled/);
  assert.match(hookSource, /trackingTransparencyStatus:/);
  assert.match(hookSource, /umpConsentStatus:/);
  assert.match(hookSource, /getAdSdkInitializationDecision\(state\)/);
  assert.match(hookSource, /cachedInitializationPlatform === platform/);
  assert.match(hookSource, /setResult\(createInitialResult\(entitlements, platform\)\)/);
  assert.doesNotMatch(runtimeSource, /Promise\.all/);
  assert.ok(
    runtimeSource.indexOf('const umpConsentStatus = await resolveUmpConsentStatus(') <
      runtimeSource.indexOf(
        'const trackingTransparencyStatus = await requestTrackingTransparencyStatusIfNeeded(',
      ),
  );
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
process.argv.push('--focus-mobile-ads-consent-parity');
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
        '!entitlements.adsDisabled &&\\n      cachedInitialization &&\\n      cachedInitializationPlatform === platform',
        'cachedInitialization &&\\n      cachedInitializationPlatform === platform'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mobile-ads-consent-parity');
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

test('mobile ads consent parity rejects concurrent ATT and UMP collection', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const umpConsentStatus = await resolveUmpConsentStatus(',
        'const umpConsentStatus = await Promise.all([resolveUmpConsentStatus('
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mobile-ads-consent-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Mobile Ads consent runtime must not collect ATT and UMP through Promise\.all/,
  );
});
