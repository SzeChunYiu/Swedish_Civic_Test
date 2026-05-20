const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runValidation() {
  return spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-remove-ads-hook-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

function validationOutput(result) {
  return `${result.stdout}\n${result.stderr}`;
}

test('Remove Ads entitlement hook fails closed until purchase state resolves', () => {
  const result = runValidation();
  const output = validationOutput(result);
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
    'utf8',
  );

  assert.doesNotMatch(
    output,
    /Remove Ads entitlement hook must fail closed while purchase state loads|native Remove Ads entitlement runtime must provide a native provider and secure storage|explicit ad entitlements must bypass async purchase loading as ready|unresolved purchase state must return ad-blocked pending entitlements|failed Remove Ads entitlement reads must stay ad-blocked and expose read_failed state|Home monetization surfaces must wait for Remove Ads entitlements before rendering/,
  );
  assert.match(hookSource, /AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(hookSource, /RemoveAdsEntitlementStatus = 'loading' \| 'ready' \| 'read_failed'/);
  assert.match(hookSource, /adsDisabled: true/);
  assert.match(hookSource, /defaultNativePurchaseRuntimeOptions/);
  assert.match(
    hookSource,
    /createNativePurchaseProvider\(\{ platform: getNativePurchasePlatform\(\) \}\)/,
  );
  assert.match(hookSource, /createSecureStorePurchaseStorage/);
  assert.doesNotMatch(hookSource, /if \(Platform\.OS !== 'web'\) return undefined;/);
  assert.match(hookSource, /getPurchaseEntitlements\(purchaseRuntime\)/);
  assert.match(hookSource, /publishRemoveAdsEntitlements\(storedEntitlements\)/);
  assert.match(hookSource, /setCurrentEntitlements\(AD_BLOCKED_PENDING_ENTITLEMENTS\)/);
  assert.match(hookSource, /setEntitlementStatus\('read_failed'\)/);
  assert.match(hookSource, /entitlements: explicitEntitlements/);
  assert.match(hookSource, /entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(hookSource, /entitlementStatus:\s*'ready'\s+as\s+const/);
  assert.match(hookSource, /entitlementStatus,\s*\n\s*\};/);
});

test('Home Remove Ads surfaces wait for entitlement readiness before rendering', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && !monetizationEntitlements\.adsDisabled;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
});

test('Remove Ads entitlement hook parity rejects pending ad enablement', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('adsDisabled: true,', 'adsDisabled: false,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-hook-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Remove Ads entitlement hook must fail closed while purchase state loads/,
  );
});

test('Remove Ads entitlement hook parity rejects missing native default provider', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('provider: createNativePurchaseProvider({ platform: getNativePurchasePlatform() }),', 'provider: createMockPurchaseProvider(),');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-hook-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /native Remove Ads entitlement runtime must provide a native provider and secure storage/,
  );
});

test('Remove Ads entitlement hook parity rejects explicit entitlement bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('entitlements: explicitEntitlements,', 'entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-hook-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /explicit ad entitlements must bypass async purchase loading as ready/,
  );
});

test('Remove Ads entitlement hook parity rejects read-failure active-state drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("setEntitlementStatus('read_failed');", "setEntitlementStatus('ready');");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-hook-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /failed Remove Ads entitlement reads must stay ad-blocked and expose read_failed state/,
  );
});
