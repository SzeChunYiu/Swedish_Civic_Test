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
  const resolvedHookSource = hookSource.slice(
    hookSource.indexOf('export function useResolvedAdEntitlements'),
  );

  assert.equal(result.status, 0, output);
  assert.doesNotMatch(
    output,
    /Remove Ads entitlement hook must fail closed while purchase state loads|native Remove Ads entitlement runtime must provide a native provider and secure storage|explicit ad entitlements must bypass async purchase loading as ready|explicit ad entitlements must skip purchase runtime creation and storage reads|unresolved purchase state must return ad-blocked pending entitlements|failed Remove Ads entitlement reads must stay ad-blocked and expose read_failed state|E2E-owned web Remove Ads mock provider must require __SMT_E2E__|E2E-owned web Remove Ads mock provider must honor __SMT_REMOVE_ADS_MOCK_OWNED__|default web purchase runtime must fail closed without a public mock provider|Home monetization surfaces must wait for Remove Ads entitlements before rendering|PremiumBanner must render localized mobile-app-only copy when web purchases are unavailable/,
  );
  assert.match(hookSource, /AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(hookSource, /RemoveAdsEntitlementStatus = 'loading' \| 'ready' \| 'read_failed'/);
  assert.match(hookSource, /adsDisabled: true/);
  assert.match(hookSource, /__SMT_E2E__\?: boolean/);
  assert.match(hookSource, /__SMT_REMOVE_ADS_MOCK_OWNED__\?: boolean/);
  assert.match(
    hookSource,
    /if \(!runtime\.__SMT_E2E__ \|\| typeof runtime\.__SMT_REMOVE_ADS_MOCK_OWNED__ !== 'boolean'\)/,
  );
  assert.match(
    hookSource,
    /provider: createMockPurchaseProvider\(\{ owned: runtime\.__SMT_REMOVE_ADS_MOCK_OWNED__ \}\)/,
  );
  assert.match(
    hookSource,
    /const e2eRuntimeOptions = createE2EWebPurchaseRuntimeOptions\(initialAdsDisabled\);/,
  );
  assert.match(hookSource, /if \(e2eRuntimeOptions\) return e2eRuntimeOptions;/);
  assert.match(hookSource, /function createUnavailableWebPurchaseProvider\(\)/);
  assert.match(hookSource, /provider: createUnavailableWebPurchaseProvider\(\)/);
  assert.match(hookSource, /purchaseUnavailableReason: 'web_store_unavailable'/);
  assert.match(hookSource, /storage: createWebPurchaseStorage\(false\)/);
  assert.doesNotMatch(hookSource, /provider: createMockPurchaseProvider\(\),/);
  assert.match(hookSource, /defaultNativePurchaseRuntimeOptions/);
  assert.match(hookSource, /createNativeRemoveAdsReceiptValidator/);
  assert.match(hookSource, /const nativePlatform = getNativePurchasePlatform\(\);/);
  assert.match(hookSource, /receiptValidator,\s*\n\s*\}\)/);
  assert.match(hookSource, /native_receipt_validator_unavailable/);
  assert.match(hookSource, /createSecureStorePurchaseStorage/);
  assert.doesNotMatch(hookSource, /if \(Platform\.OS !== 'web'\) return undefined;/);
  assert.match(hookSource, /getPurchaseEntitlements\(purchaseRuntime\)/);
  assert.match(hookSource, /publishRemoveAdsEntitlements\(storedEntitlements\)/);
  assert.match(hookSource, /setCurrentEntitlements\(AD_BLOCKED_PENDING_ENTITLEMENTS\)/);
  assert.match(hookSource, /setEntitlementStatus\('read_failed'\)/);
  assert.match(hookSource, /function useRemoveAdsEntitlementsRuntime/);
  assert.match(hookSource, /purchaseRuntimeEnabled:\s*!skipPurchaseRuntime/);
  assert.match(hookSource, /entitlements: normalizedExplicitEntitlements \?\? FREE_ENTITLEMENTS/);
  assert.match(hookSource, /adsDisabled: explicitEntitlements\.adsDisabled === true/);
  assert.match(hookSource, /purchaseRuntimeEnabled:\s*!hasExplicitEntitlements/);
  assert.match(resolvedHookSource, /useRemoveAdsEntitlementsRuntime\(/);
  assert.doesNotMatch(resolvedHookSource, /useRemoveAdsEntitlements\(/);
  assert.doesNotMatch(resolvedHookSource, /skipPurchaseRuntime/);
  assert.match(hookSource, /entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(hookSource, /entitlementStatus:\s*'ready'\s+as\s+const/);
  assert.match(hookSource, /entitlementStatus,\s*\n\s*\};/);
});

test('Remove Ads entitlement hook parity has focused validator routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-remove-ads-hook-parity/);
  assert.match(validatorSource, /validateRemoveAdsEntitlementHookParity\(\);/);
  assert.match(validatorSource, /removeAdsEntitlementHookCasesValidated/);
  assert.match(validatorSource, /removeAdsEntitlementHookParityValidated/);
});

test('Home Remove Ads surfaces wait for entitlement readiness before rendering', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && monetizationEntitlements\.adsDisabled !== true;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
});

test('Remove Ads entitlement hook parity rejects ungated Home ad entitlements', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('{entitlementsReady ? (', '{true ? (');
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
    /Home monetization surfaces must wait for Remove Ads entitlements before rendering/,
  );
});

test('Remove Ads E2E mock owned runtime has a dedicated focused harness', () => {
  const focusedHarnessSource = fs.readFileSync(
    path.join(repoRoot, 'tests/remove-ads-web-e2e-mock-runtime.test.js'),
    'utf8',
  );
  const runtimeHarnessSource = fs.readFileSync(
    path.join(repoRoot, 'tests/helpers/monetizationRuntimeHarness.cjs'),
    'utf8',
  );
  const monetizationSuiteSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/monetization.test.js'),
    'utf8',
  );
  const monetizationRunnerSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/run-monetization-tests.js'),
    'utf8',
  );
  const storageHarnessSource = fs.readFileSync(
    path.join(repoRoot, 'tests/monetization-storage-harness.test.js'),
    'utf8',
  );
  const monetizationTestFileSources = `${focusedHarnessSource}\n${monetizationSuiteSource}\n${storageHarnessSource}`;
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['test:monetization'], 'node scripts/run-monetization-tests.js');
  assert.match(monetizationRunnerSource, /tests\/remove-ads-web-e2e-mock-runtime\.test\.js/);
  assert.match(monetizationRunnerSource, /tests\/monetization-storage-harness\.test\.js/);
  assert.match(monetizationRunnerSource, /\['--test',\s*\.\.\.forwardedArgs,\s*\.\.\.monetizationTestFiles\]/);
  assert.match(focusedHarnessSource, /__SMT_E2E__/);
  assert.match(focusedHarnessSource, /__SMT_REMOVE_ADS_MOCK_OWNED__/);
  assert.match(focusedHarnessSource, /createDefaultPurchaseRuntimeOptions/);
  assert.match(focusedHarnessSource, /restoreRemoveAdsPurchase/);
  assert.match(focusedHarnessSource, /monetizationRuntimeHarness\.cjs/);
  assert.match(focusedHarnessSource, /createMemoryLocalStorage,\s*[\s\S]*withGlobalProperties,/);
  assert.match(monetizationSuiteSource, /createMemoryLocalStorage,\s*[\s\S]*withGlobalProperties,/);
  assert.match(runtimeHarnessSource, /function createTsLoader/);
  assert.match(runtimeHarnessSource, /function createReactHookStub/);
  assert.match(runtimeHarnessSource, /function createReactNativeWebStub/);
  assert.match(runtimeHarnessSource, /function createMemoryLocalStorage/);
  assert.match(runtimeHarnessSource, /async function withGlobalProperties/);
  assert.doesNotMatch(focusedHarnessSource, /function loadTs|ts\.transpileModule/);
  assert.doesNotMatch(focusedHarnessSource, /function createMemoryLocalStorage/);
  assert.doesNotMatch(focusedHarnessSource, /function withGlobalProperties/);
  assert.doesNotMatch(focusedHarnessSource, /Object\.getOwnPropertyDescriptor\(globalThis/);
  assert.doesNotMatch(focusedHarnessSource, /Object\.defineProperty\(globalThis/);
  assert.doesNotMatch(monetizationSuiteSource, /function createMemoryLocalStorage/);
  assert.doesNotMatch(storageHarnessSource, /function createMemoryLocalStorage/);
  assert.doesNotMatch(monetizationSuiteSource, /function withGlobalProperties/);
  assert.doesNotMatch(storageHarnessSource, /function withGlobalProperties/);
  assert.doesNotMatch(
    monetizationSuiteSource,
    /Object\.getOwnPropertyDescriptor\(globalThis,\s*'localStorage'\)/,
  );
  assert.doesNotMatch(
    monetizationSuiteSource,
    /Object\.defineProperty\(globalThis,\s*'localStorage'/,
  );
  assert.doesNotMatch(monetizationTestFileSources, /function createReactHookStub/);
  assert.doesNotMatch(monetizationTestFileSources, /Platform:\s*\{\s*OS:\s*'web'\s*\}/);
  assert.match(
    focusedHarnessSource,
    /non-E2E web runtime must revalidate and clear copied Remove Ads records/,
  );
  assert.doesNotMatch(
    monetizationSuiteSource,
    /web Remove Ads E2E mock-owned runtime cannot spoof outside E2E/,
  );
});

test('Remove Ads entitlement hook parity rejects public web mock provider drift', () => {
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
      .replace('provider: createUnavailableWebPurchaseProvider(),', 'provider: createMockPurchaseProvider(),');
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
    /default web purchase runtime must fail closed without a public mock provider/,
  );
});

test('Remove Ads entitlement hook parity rejects missing web unavailable paywall copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/PremiumBanner.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('copy.webUnavailableBody(resolvedPriceLabel)', 'copy.body(resolvedPriceLabel)');
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
    /PremiumBanner must render localized mobile-app-only copy when web purchases are unavailable/,
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
      .replace('provider: createNativePurchaseProvider({', 'provider: createMockPurchaseProvider({');
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
    /native Remove Ads entitlement runtime must provide a native provider and secure storage|native Remove Ads entitlement runtime must provide a native provider, receipt validator, and secure storage|native Remove Ads entitlement runtime must fail closed when receipt validator config is missing/,
  );
});

test('Remove Ads entitlement hook parity rejects non-E2E mock-owned web spoof drift', () => {
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
      .replace("!runtime.__SMT_E2E__ || typeof runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ !== 'boolean'", "typeof runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ !== 'boolean'");
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
    /E2E-owned web Remove Ads mock provider must require __SMT_E2E__/,
  );
});

test('Remove Ads entitlement hook parity rejects ignored E2E mock-owned state', () => {
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
      .replace('provider: createMockPurchaseProvider({ owned: runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ }),', 'provider: createMockPurchaseProvider(),');
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
    /E2E-owned web Remove Ads mock provider must honor __SMT_REMOVE_ADS_MOCK_OWNED__/,
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
      .replace(
        'entitlements: normalizedExplicitEntitlements ?? FREE_ENTITLEMENTS,',
        'entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS,',
      );
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

test('Remove Ads entitlement hook parity rejects explicit runtime side effects', () => {
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
      .replace('purchaseRuntimeEnabled: !hasExplicitEntitlements,', 'purchaseRuntimeEnabled: true,');
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
    /explicit ad entitlements must skip purchase runtime creation and storage reads/,
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
