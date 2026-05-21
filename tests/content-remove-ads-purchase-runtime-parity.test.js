const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { assertPurchaseActionInFlightGuard } = require('../scripts/purchase-inflight-guard');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-remove-ads-purchase-runtime-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('Remove Ads purchase runtime uses the canonical non-consumable product contract', () => {
  const summary = parseValidationSummary();
  const purchaseSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );
  const placementCtaSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
    'utf8',
  );
  const paywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );
  const nativeReceiptValidationBlock =
    purchaseSource.match(
      /async validateRemoveAdsReceipt\(purchase, productId\) \{([\s\S]*?)\n    \},\n    async requestRemoveAdsPurchase/,
    )?.[1] ?? '';

  assert.equal(summary.removeAdsPurchaseRuntimeCasesValidated, 26);
  assert.equal(summary.removeAdsPurchaseRuntimeParityValidated, true);
  assert.match(purchaseSource, /REMOVE_ADS_RECORD_SCHEMA_VERSION = 1/);
  assert.match(purchaseSource, /interface StoredRemoveAdsEntitlementRecord/);
  assert.match(purchaseSource, /receiptValidationStatus: 'valid'/);
  assert.match(purchaseSource, /receiptValidatedAt: string/);
  assert.match(purchaseSource, /function isCanonicalUtcIsoTimestamp/);
  assert.match(purchaseSource, /parsed\.toISOString\(\) === value/);
  assert.doesNotMatch(purchaseSource, /function isValidIsoDate/);
  assert.match(purchaseSource, /parseStoredRemoveAdsEntitlementRecord\(storedValue\)/);
  assert.doesNotMatch(purchaseSource, /storedValue === STORED_TRUE/);
  assert.match(purchaseSource, /requestRemoveAdsPurchase\(REMOVE_ADS_PRODUCT_ID\)/);
  assert.match(purchaseSource, /restorePurchases\(\[REMOVE_ADS_PRODUCT_ID\]\)/);
  assert.match(purchaseSource, /validateRemoveAdsReceipt\?\(/);
  assert.match(purchaseSource, /export type NativeRemoveAdsReceiptValidator =/);
  assert.match(purchaseSource, /receiptValidator\?: NativeRemoveAdsReceiptValidator/);
  assert.match(purchaseSource, /if \(!receiptValidator\) \{/);
  assert.match(purchaseSource, /status: 'pending'/);
  assert.doesNotMatch(nativeReceiptValidationBlock, /createReceiptValidationResult\s*\(/);
  assert.match(purchaseSource, /return receiptValidator\(purchase, productId\)/);
  assert.match(purchaseSource, /const receiptValidation = await validateRemoveAdsReceipt/);
  assert.match(
    purchaseSource,
    /:\s*\(\{ status: 'pending' \} satisfies RemoveAdsReceiptValidationResult\)/,
  );
  assert.match(purchaseSource, /function getFailClosedPurchaseEntitlements\(\{/);
  assert.match(purchaseSource, /revalidateStoredRemoveAdsEntitlementRecordWithConnectedProvider/);
  assert.match(
    purchaseSource,
    /createResult\(\s*'pending',\s*await getFailClosedPurchaseEntitlements\(\{\s*provider,\s*storage\s*\}\)/,
  );
  assert.match(
    purchaseSource,
    /createResult\(\s*'not_found',\s*await getFailClosedPurchaseEntitlements\(\{\s*provider,\s*storage\s*\}\)/,
  );
  assert.doesNotMatch(
    purchaseSource,
    /createResult\(\s*'(?:pending|not_found)',\s*await getPurchaseEntitlements\(\{\s*storage\s*\}\)/,
  );
  assert.match(purchaseSource, /if \(!provider\) \{[\s\S]*return removeAdsEntitlements\(true\);/);
  assert.match(purchaseSource, /source: 'purchase'/);
  assert.match(purchaseSource, /source: 'restore'/);
  assert.match(purchaseSource, /hasStoreConfirmation\(record\)/);
  assert.match(purchaseSource, /isConsumable: false/);
  assert.match(purchaseSource, /type: 'in-app'/);
  assert.match(placementCtaSource, /restoreRemoveAdsPurchase/);
  assert.match(placementCtaSource, /runPurchaseAction\('restore', restoreRemoveAdsPurchase\)/);
  assert.match(placementCtaSource, /purchaseUnavailableReason === 'web_store_unavailable'/);
  assert.match(placementCtaSource, /copy\.webUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(placementCtaSource, /copy\.webUnavailableAccessibilityHint/);
  assert.match(placementCtaSource, /Buy in mobile app/);
  assert.match(placementCtaSource, /Köp i mobilappen/);
  assert.match(placementCtaSource, /Restore in mobile app/);
  assert.match(placementCtaSource, /Återställ i mobilappen/);
  assert.match(placementCtaSource, /mobile app store purchase/);
  assert.match(placementCtaSource, /butiksköp i mobilappen/);
  assert.match(
    placementCtaSource,
    /const actionsDisabled = activeAction !== null \|\| purchaseUnavailable;/,
  );
  assert.match(placementCtaSource, /disabled=\{actionsDisabled\}/);
  assert.match(placementCtaSource, /setStatus\('unavailable'\);/);
  assert.match(placementCtaSource, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(placementCtaSource, /copy\.restoreAccessibilityHint/);
  assert.match(placementCtaSource, /Purchase restored\. Study ads are being removed/);
  assert.match(placementCtaSource, /const purchaseActionInFlightRef = useRef\(false\);/);
  assert.match(placementCtaSource, /if \(purchaseActionInFlightRef\.current\) return;/);
  assert.match(placementCtaSource, /purchaseActionInFlightRef\.current = true;/);
  assert.match(placementCtaSource, /purchaseActionInFlightRef\.current = false;/);
  assert.doesNotThrow(() =>
    assertPurchaseActionInFlightGuard(placementCtaSource, {
      awaitedCalls: ['await purchaseAction('],
      surfaceName: 'RemoveAdsPlacementCta',
    }),
  );
  assert.doesNotThrow(() =>
    assertPurchaseActionInFlightGuard(paywallSource, {
      awaitedCalls: ['await buyRemoveAds(', 'await restoreRemoveAdsPurchase('],
      surfaceName: 'PremiumBanner',
    }),
  );
});

test('Remove Ads purchase runtime parity rejects placement CTA web-unavailable drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/RemoveAdsPlacementCta.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("purchaseRuntime?.purchaseUnavailableReason === 'web_store_unavailable'", 'false');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /RemoveAdsPlacementCta must render localized mobile-app-only copy when web purchases are unavailable|RemoveAdsPlacementCta must disable buy and restore actions for unavailable web purchase runtime/,
  );
});

test('Remove Ads purchase runtime parity rejects native self-validation fallback', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/purchases.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        \`if (!receiptValidator) {
        return {
          productId,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'pending',
          transactionId: purchase.transactionId ?? null,
        };
      }\`,
        \`if (!receiptValidator) {
        return createReceiptValidationResult(purchase);
      }\`,
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /native Remove Ads provider must fail closed without an injected receipt verifier/,
  );
});

test('Remove Ads purchase runtime parity rejects buy product-id drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/purchases.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);',
        'const purchase = await provider.requestRemoveAdsPurchase("debug.removeads");',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /buyRemoveAds must request canonical Remove Ads product id/,
  );
});

test('Remove Ads purchase runtime parity rejects consumable transaction drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/purchases.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('isConsumable: false,', 'isConsumable: true,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /native Remove Ads finish transaction must be non-consumable/,
  );
});

test('Remove Ads purchase runtime parity rejects finishing before entitlement persistence', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/purchases.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const persistenceResult = await persistValidatedRemoveAdsEntitlement({',
        'await provider.finishPurchase?.(purchase);\\n    const persistenceResult = await persistValidatedRemoveAdsEntitlement({',
      )
      .replace(
        "\\n    await provider.finishPurchase?.(purchase);\\n    return createResult('purchased', persistenceResult.entitlements, purchase);",
        "\\n    return createResult('purchased', persistenceResult.entitlements, purchase);",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Remove Ads buy flow must persist the entitlement before finishing the native transaction/,
  );
});

test('Remove Ads purchase runtime parity rejects placement CTA restore drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/RemoveAdsPlacementCta.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("runPurchaseAction('restore', restoreRemoveAdsPurchase)", "runPurchaseAction('restore', buyRemoveAds)");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /RemoveAdsPlacementCta must wire restoreRemoveAdsPurchase through the shared purchase runtime/,
  );
});

test('Remove Ads purchase runtime parity rejects missing in-flight purchase guards', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (
    normalizedPath.endsWith('/components/monetization/PremiumBanner.tsx') ||
    normalizedPath.endsWith('/components/monetization/RemoveAdsPlacementCta.tsx')
  ) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (purchaseActionInFlightRef.current) return;\\n\\n    purchaseActionInFlightRef.current = true;\\n', '')
      .replace('      purchaseActionInFlightRef.current = false;\\n', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /RemoveAdsPlacementCta must return early from the ref-backed in-flight guard before activating it|PremiumBanner must return early from the ref-backed in-flight guard before activating it|ref-backed in-flight guard before awaiting store calls|must reset purchaseActionInFlightRef\.current inside finally/,
  );
});

test('Remove Ads purchase runtime parity rejects late in-flight guard activation', () => {
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
      .replace(
        'purchaseActionInFlightRef.current = true;\\n    setActiveAction(action);',
        'setActiveAction(action);'
      )
      .replace(
        'const result =\\n        action === \\'buy\\'\\n          ? await buyRemoveAds(purchaseRuntime)',
        'const result =\\n        action === \\'buy\\'\\n          ? await buyRemoveAds(purchaseRuntime)\\n          : await restoreRemoveAdsPurchase(purchaseRuntime);\\n\\n      purchaseActionInFlightRef.current = true;\\n      const ignoredResult = action === \\'buy\\' ? result'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-remove-ads-purchase-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /PremiumBanner must set purchaseActionInFlightRef\.current before awaiting store calls/,
  );
});
