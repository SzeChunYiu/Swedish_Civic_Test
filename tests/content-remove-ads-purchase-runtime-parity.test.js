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
  const nativeReceiptValidatorSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/removeAdsReceiptValidator.native.ts'),
    'utf8',
  );
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const nativeReceiptValidationBlock =
    purchaseSource.match(
      /async validateRemoveAdsReceipt\(purchase, productId\) \{([\s\S]*?)\n    \},\n    async requestRemoveAdsPurchase/,
    )?.[1] ?? '';
  const storedRevalidationBlock =
    purchaseSource.match(
      /async function revalidateStoredRemoveAdsEntitlementRecordWithConnectedProvider\(\{[\s\S]*?\nfunction createResult/,
    )?.[0] ?? '';

  assert.equal(summary.removeAdsPurchaseRuntimeCasesValidated, 40);
  assert.equal(summary.removeAdsPurchaseRuntimeParityValidated, true);
  assert.match(purchaseSource, /REMOVE_ADS_RECORD_SCHEMA_VERSION = 1/);
  assert.match(purchaseSource, /interface RemoveAdsProductMetadata/);
  assert.match(purchaseSource, /displayPrice: string/);
  assert.match(purchaseSource, /localizedPrice\?: string \| null/);
  assert.match(purchaseSource, /REMOVE_ADS_IOS_PRODUCT_ID = REMOVE_ADS_PRODUCT_ID/);
  assert.match(purchaseSource, /REMOVE_ADS_ANDROID_PRODUCT_ID = 'removeads'/);
  assert.match(purchaseSource, /REMOVE_ADS_STORE_PRODUCT_IDS = \{/);
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
  assert.match(purchaseSource, /function normalizeRemoveAdsStorePlatform\(platform/);
  assert.match(purchaseSource, /export function getRemoveAdsStoreProductId/);
  assert.match(purchaseSource, /const storeProductId = getPurchaseStoreProductId/);
  assert.match(purchaseSource, /fetchRemoveAdsProductMetadata/);
  assert.match(
    purchaseSource,
    /fetchProducts\(\{[\s\S]*skus:\s*\[\s*storeProductId\s*\],[\s\S]*type:\s*'in-app'/,
  );
  assert.match(purchaseSource, /apple: \{ sku: storeProductId \}/);
  assert.match(purchaseSource, /google: \{ skus: \[storeProductId\] \}/);
  assert.match(purchaseSource, /validateRemoveAdsReceipt\?\(/);
  assert.match(purchaseSource, /export type NativeRemoveAdsReceiptValidator =/);
  assert.match(purchaseSource, /receiptValidator\?: NativeRemoveAdsReceiptValidator/);
  assert.match(nativeReceiptValidatorSource, /function createReceiptPayload\(raw/);
  assert.match(nativeReceiptValidatorSource, /receipt: createReceiptPayload\(purchase\.raw\)/);
  assert.doesNotMatch(nativeReceiptValidatorSource, /raw: purchase\.raw/);
  assert.doesNotMatch(nativeReceiptValidatorSource, /accountEmail|debugPayload|userId/);
  assert.match(purchaseSource, /native_receipt_validator_unavailable/);
  assert.match(purchaseSource, /\| 'unavailable'/);
  assert.match(purchaseSource, /createResult\(\s*'unavailable'/);
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
  assert.match(storedRevalidationBlock, /purchaseMatchesStoredRecord\(purchase, record\)/);
  assert.doesNotMatch(storedRevalidationBlock, /availablePurchases\.find\(isRemoveAdsPurchase\)/);
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
  assert.match(
    fs.readFileSync(path.join(repoRoot, 'scripts/monetization.test.js'), 'utf8'),
    /failed remove-ads actions preserve a valid stored entitlement only after matching revalidation/,
  );
  assert.match(purchaseSource, /isConsumable: false/);
  assert.match(purchaseSource, /type: 'in-app'/);
  assert.match(placementCtaSource, /restoreRemoveAdsPurchase/);
  assert.match(placementCtaSource, /runPurchaseAction\('restore', restoreRemoveAdsPurchase\)/);
  assert.match(placementCtaSource, /purchaseUnavailableReason === 'web_store_unavailable'/);
  assert.match(
    placementCtaSource,
    /purchaseUnavailableReason === 'native_receipt_validator_unavailable'/,
  );
  assert.match(placementCtaSource, /copy\.webUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(placementCtaSource, /copy\.nativeUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(placementCtaSource, /copy\.webUnavailableAccessibilityHint/);
  assert.match(placementCtaSource, /copy\.nativeUnavailableAccessibilityHint/);
  assert.match(placementCtaSource, /Buy in mobile app/);
  assert.match(placementCtaSource, /Köp i mobilappen/);
  assert.match(placementCtaSource, /Buy unavailable/);
  assert.match(placementCtaSource, /Köp inte tillgängligt/);
  assert.match(placementCtaSource, /Restore in mobile app/);
  assert.match(placementCtaSource, /Återställ i mobilappen/);
  assert.match(placementCtaSource, /Restore unavailable/);
  assert.match(placementCtaSource, /Återställ inte tillgängligt/);
  assert.match(placementCtaSource, /receipt validation is not configured/);
  assert.match(placementCtaSource, /kvittovalidering inte är konfigurerad/);
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
  assert.match(placementCtaSource, /finish_failed:/);
  assert.match(placementCtaSource, /The store could not mark the purchase as finished/);
  assert.match(placementCtaSource, /Butiken kunde inte markera köpet som slutfört/);
  assert.match(purchaseSource, /'finish_failed'/);
  assert.match(
    purchaseSource,
    /catch \{[\s\S]*return createResult\('finish_failed', persistenceResult\.entitlements, purchase\);[\s\S]*\}/,
  );
  assert.match(paywallSource, /status === 'finish_failed'/);
  assert.match(paywallSource, /The store could not mark the purchase as finished/);
  assert.match(paywallSource, /Butiken kunde inte markera köpet som slutfört/);
  assert.match(paywallSource, /useRemoveAdsPriceLabel\(purchaseRuntime, priceLabel\)/);
  assert.match(paywallSource, /resolvedPriceLabel/);
  assert.match(paywallSource, /copy\.webUnavailableBody\(resolvedPriceLabel\)/);
  assert.match(paywallSource, /copy\.nativeUnavailableBody\(resolvedPriceLabel\)/);
  assert.match(paywallSource, /copy\.body\(resolvedPriceLabel\)/);
  assert.match(paywallSource, /copy\.buyAccessibilityLabel\(resolvedPriceLabel\)/);
  assert.match(paywallSource, /copy\.buyIdle\(resolvedPriceLabel\)/);
  assert.match(paywallSource, /copy\.nativeUnavailableAccessibilityHint/);
  assert.match(paywallSource, /Buy unavailable/);
  assert.match(paywallSource, /Köp inte tillgängligt/);
  assert.match(paywallSource, /Restore unavailable/);
  assert.match(paywallSource, /Återställ inte tillgängligt/);
  assert.match(paywallSource, /receipt validation is not configured/);
  assert.match(
    homeSource,
    /const removeAdsPriceLabel = useRemoveAdsPriceLabel\(purchaseRuntime\);/,
  );
  assert.match(homeSource, /<PricingWedge[\s\S]*priceLabel=\{removeAdsPriceLabel\}/);
  assert.match(homeSource, /<PremiumBanner[\s\S]*priceLabel=\{removeAdsPriceLabel\}/);
  assert.match(
    paywallSource,
    /const actionsDisabled = activeAction !== null \|\| adsDisabled \|\| purchaseUnavailable;/,
  );
  assert.equal(paywallSource.match(/disabled=\{actionsDisabled\}/g)?.length, 2);
  assert.equal(paywallSource.match(/disabled: actionsDisabled/g)?.length, 2);
  assert.doesNotMatch(
    paywallSource,
    /disabled=\{activeAction !== null \|\| adsDisabled \|\| purchaseUnavailable\}/,
  );
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

test('Remove Ads purchase runtime parity rejects placement CTA persistence_failed status drift', () => {
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
      .replace('statusMessages: Record<PlacementPurchaseStatus, string>;', 'statusMessages: Partial<Record<PlacementPurchaseStatus, string>>;')
      .replace("      persistence_failed:\\n        'Purchase was confirmed, but ad-free status could not be saved on this device. Try restoring the purchase.',\\n", '');
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
    /RemoveAdsPlacementCta must keep a total status-message map for every purchase status|RemoveAdsPlacementCta must render localized persistence_failed recovery copy/,
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

test('Remove Ads purchase runtime parity rejects PremiumBanner disabled prop drift', () => {
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
      .replace('disabled={actionsDisabled}', 'disabled={activeAction !== null || adsDisabled || purchaseUnavailable}');
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
    /PremiumBanner buy and restore actions must share actionsDisabled for disabled props and accessibility state/,
  );
});

test('Remove Ads purchase runtime parity rejects PremiumBanner disabled accessibility drift', () => {
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
      .replace('disabled: actionsDisabled', 'disabled: activeAction !== null');
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
    /PremiumBanner buy and restore actions must share actionsDisabled for disabled props and accessibility state/,
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

test('Remove Ads purchase runtime parity rejects Android store product-id drift', () => {
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
      .replace("export const REMOVE_ADS_ANDROID_PRODUCT_ID = 'removeads';", 'export const REMOVE_ADS_ANDROID_PRODUCT_ID = REMOVE_ADS_PRODUCT_ID;');
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
    /Remove Ads store product ids must map iOS to the canonical bundle id and Android to Play Console removeads/,
  );
});

test('Remove Ads purchase runtime parity rejects native store-id mapping drift', () => {
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
        'if (productId === REMOVE_ADS_PRODUCT_ID) return getRemoveAdsStoreProductId(platform);',
        'if (productId === REMOVE_ADS_PRODUCT_ID) return productId;',
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
    /native Remove Ads purchase request must map Android to removeads and iOS to the canonical bundle id/,
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
        "    try {\\n      await provider.finishPurchase?.(purchase);\\n    } catch {\\n      return createResult('finish_failed', persistenceResult.entitlements, purchase);\\n    }\\n\\n",
        '',
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
    /Remove Ads buy flow must persist the entitlement before finishing the native transaction and recover from post-persistence finish failures/,
  );
});

test('Remove Ads purchase runtime parity rejects missing post-persistence finish recovery', () => {
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
        "    } catch {\\n      return createResult('finish_failed', persistenceResult.entitlements, purchase);\\n    }",
        "    } catch {\\n      throw new Error('finish failed');\\n    }",
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
    /Remove Ads buy flow must persist the entitlement before finishing the native transaction and recover from post-persistence finish failures/,
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
