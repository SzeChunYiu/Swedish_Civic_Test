const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
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

  assert.equal(summary.removeAdsPurchaseRuntimeCasesValidated, 18);
  assert.equal(summary.removeAdsPurchaseRuntimeParityValidated, true);
  assert.match(purchaseSource, /REMOVE_ADS_RECORD_SCHEMA_VERSION = 1/);
  assert.match(purchaseSource, /interface StoredRemoveAdsEntitlementRecord/);
  assert.match(purchaseSource, /receiptValidationStatus: 'valid'/);
  assert.match(purchaseSource, /receiptValidatedAt: string/);
  assert.match(purchaseSource, /parseStoredRemoveAdsEntitlementRecord\(storedValue\)/);
  assert.doesNotMatch(purchaseSource, /storedValue === STORED_TRUE/);
  assert.match(purchaseSource, /requestRemoveAdsPurchase\(REMOVE_ADS_PRODUCT_ID\)/);
  assert.match(purchaseSource, /restorePurchases\(\[REMOVE_ADS_PRODUCT_ID\]\)/);
  assert.match(purchaseSource, /validateRemoveAdsReceipt\?\(/);
  assert.match(purchaseSource, /const receiptValidation = await validateRemoveAdsReceipt/);
  assert.match(purchaseSource, /source: 'purchase'/);
  assert.match(purchaseSource, /source: 'restore'/);
  assert.match(purchaseSource, /hasStoreConfirmation\(record\)/);
  assert.match(purchaseSource, /isConsumable: false/);
  assert.match(purchaseSource, /type: 'in-app'/);
  assert.match(placementCtaSource, /restoreRemoveAdsPurchase/);
  assert.match(placementCtaSource, /runPurchaseAction\('restore', restoreRemoveAdsPurchase\)/);
  assert.match(placementCtaSource, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(placementCtaSource, /accessibilityHint=\{copy\.restoreAccessibilityHint\}/);
  assert.match(placementCtaSource, /Purchase restored\. Study ads are being removed/);
  assert.match(placementCtaSource, /const purchaseActionInFlightRef = useRef\(false\);/);
  assert.match(placementCtaSource, /if \(purchaseActionInFlightRef\.current\) return;/);
  assert.match(placementCtaSource, /purchaseActionInFlightRef\.current = true;/);
  assert.match(placementCtaSource, /purchaseActionInFlightRef\.current = false;/);
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
        '\\n    await provider.finishPurchase?.(purchase);\\n    return createResult(\\'purchased\\', persistenceResult.entitlements, purchase);',
        '\\n    return createResult(\\'purchased\\', persistenceResult.entitlements, purchase);',
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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Remove Ads buy\/restore handlers must use a ref-backed in-flight guard before awaiting store calls/,
  );
});
