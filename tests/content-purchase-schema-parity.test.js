const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('purchase TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const purchaseSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );

  assert.equal(summary.purchaseTypeUnionsValidated, 2);
  assert.equal(summary.purchaseTypeInterfacesValidated, 8);
  assert.equal(summary.purchaseTypeSchemaParityValidated, true);
  assert.match(purchaseSource, /export type RemoveAdsReceiptValidationStatus =/);
  assert.match(purchaseSource, /export type RemoveAdsPurchaseStatus =/);
  assert.match(purchaseSource, /export interface PurchaseStorage/);
  assert.match(purchaseSource, /deleteItemAsync\?\(key: string\): Promise<void>;/);
  assert.match(purchaseSource, /export interface RemoveAdsPurchaseProvider/);
  assert.match(
    purchaseSource,
    /validateRemoveAdsReceipt\?\([\s\S]*purchase: RemoveAdsPurchaseRecord,[\s\S]*productId: typeof REMOVE_ADS_PRODUCT_ID,[\s\S]*\): Promise<RemoveAdsReceiptValidationResult>;/,
  );
  assert.match(
    purchaseSource,
    /restorePurchases\(productIds: readonly string\[\]\): Promise<RemoveAdsPurchaseRecord\[\]>;/,
  );
  assert.match(purchaseSource, /ownedProductIds\?: readonly string\[\];/);
});

test('purchase schema parity rejects result optionality drift', () => {
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
      .replace('transactionId?: string | null;', 'transactionId: string | null;');
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
    /lib\/monetization\/purchases\.ts RemoveAdsPurchaseRecord\.transactionId optional=false, expected true/,
  );
});
