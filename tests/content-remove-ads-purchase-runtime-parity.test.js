const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
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

  assert.equal(summary.removeAdsPurchaseRuntimeCasesValidated, 14);
  assert.equal(summary.removeAdsPurchaseRuntimeParityValidated, true);
  assert.match(purchaseSource, /'persistence_failed'/);
  assert.match(purchaseSource, /interface RemoveAdsPersistenceResult/);
  assert.match(purchaseSource, /async function persistValidatedRemoveAdsEntitlement/);
  assert.match(purchaseSource, /return createResult\('persistence_failed'/);
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
