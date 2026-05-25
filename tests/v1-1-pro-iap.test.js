// Tests for Pro Lifetime IAP wiring (blueprint 13, PR5).
// Run with: node --test tests/v1-1-pro-iap.test.js

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { assertPurchaseActionInFlightGuard } = require('../scripts/purchase-inflight-guard');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function staleNativeIdentifierPattern() {
  return new RegExp(['com', 'billyyiu', 'swedishcivictest'].join('\\.'), 'i');
}

// Test fixtures: a minimal in-memory provider + storage.

function makeMockProvider({
  owned = false,
  receiptValidationStatus = 'valid',
  restorePurchase,
} = {}) {
  let connected = false;
  let ownsPro = owned;
  return {
    async connect() {
      connected = true;
    },
    async disconnect() {
      connected = false;
    },
    async finishPurchase() {
      if (!connected) throw new Error('not connected');
    },
    async validateRemoveAdsReceipt(purchase, productId) {
      if (!connected) throw new Error('not connected');
      if (receiptValidationStatus !== 'valid') return { status: receiptValidationStatus };
      return {
        productId,
        purchaseToken: purchase.purchaseToken ?? null,
        status: 'valid',
        transactionId: purchase.transactionId ?? null,
        validatedAt: '2026-05-21T00:00:00.000Z',
      };
    },
    async requestRemoveAdsPurchase(productId) {
      if (!connected) throw new Error('not connected');
      ownsPro = true;
      return { productId, purchaseToken: 'tok', transactionId: 'tx', raw: { ids: [productId] } };
    },
    async restorePurchases(productIds) {
      if (!connected) throw new Error('not connected');
      if (!ownsPro) return [];
      const id = productIds[0];
      return [
        restorePurchase ?? {
          productId: id,
          purchaseToken: 'tok',
          transactionId: 'tx',
          raw: { ids: [id] },
        },
      ];
    },
  };
}

function makeMemoryStorage() {
  const store = new Map();
  return {
    async getItemAsync(k) {
      return store.get(k) ?? null;
    },
    async setItemAsync(k, v) {
      store.set(k, v);
    },
    async deleteItemAsync(k) {
      store.delete(k);
    },
  };
}

function validProReceipt({ productId, purchaseToken = 'tok', transactionId = 'tx' }) {
  return {
    productId,
    purchaseToken,
    status: 'valid',
    transactionId,
    validatedAt: '2026-05-21T00:00:00.000Z',
  };
}

test('proLifetime: product id + price label + storage key exported', () => {
  const m = loadTs('lib/monetization/proLifetimePurchase.ts');
  assert.equal(m.PRO_LIFETIME_PRODUCT_ID, 'com.billyyiu.almostswedish.prolifetime');
  assert.equal(m.PRO_LIFETIME_PRICE_LABEL, '59 SEK');
  assert.match(m.PRO_LIFETIME_STORAGE_KEY, /proLifetime/);
  assert.deepEqual(Object.values(m.PRO_LIFETIME_PURCHASE_UNAVAILABLE_REASONS).sort(), [
    'native_receipt_validator_unavailable',
    'web_store_unavailable',
  ]);
});

test('proLifetime: v1.1 setup docs and identity stay in Pro lane', () => {
  const m = loadTs('lib/monetization/proLifetimePurchase.ts');
  const appStoreIdentitySource = read('lib/monetization/appStoreIdentity.ts');
  const proLifetimeSource = read('lib/monetization/proLifetimePurchase.ts');
  const publishingGateSource = read('scripts/publishing.test.js');

  assert.match(appStoreIdentitySource, /APP_NATIVE_IDENTIFIER = 'com\.billyyiu\.almostswedish'/);
  assert.match(appStoreIdentitySource, /proLifetime:\s*`\$\{APP_NATIVE_IDENTIFIER\}\.prolifetime`/);
  assert.match(proLifetimeSource, /appStoreProductIds\.proLifetime/);
  assert.match(
    proLifetimeSource,
    /import\s*\{\s*isCanonicalUtcIsoTimestamp\s*\}\s*from\s*['"]\.\.\/time\/canonicalTimestamp['"]/,
  );
  assert.doesNotMatch(
    proLifetimeSource,
    /import\s*\{[^}]*\bisCanonicalUtcIsoTimestamp\b[^}]*\}\s*from\s*['"]\.\/purchases['"]/,
  );
  assert.doesNotMatch(appStoreIdentitySource, staleNativeIdentifierPattern());
  assert.doesNotMatch(proLifetimeSource, staleNativeIdentifierPattern());
  assert.doesNotMatch(publishingGateSource, /proLifetime|Pro Lifetime|PRO_LIFETIME/);

  for (const productSetupCopy of [
    read('publishing/admob-iap-setup-runbook.md'),
    read('publishing/operator-todo.md'),
  ]) {
    assert.match(productSetupCopy, /v1\.1/i);
    assert.match(productSetupCopy, /Pro Lifetime/i);
    assert.match(productSetupCopy, new RegExp(escapeRegExp(m.PRO_LIFETIME_PRODUCT_ID), 'i'));
    assert.match(productSetupCopy, new RegExp(escapeRegExp(m.PRO_LIFETIME_PRICE_LABEL), 'i'));
    assert.match(
      productSetupCopy,
      /after v1\.0 is live|after v1\.0 mobile is LIVE|Do not merge\s+it with the v1\.0 Remove Ads product/i,
    );
  }
});

test('buyProLifetime: fresh buy persists entitlement and returns purchased status', async () => {
  const { PRO_LIFETIME_STORAGE_KEY, buyProLifetime, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const result = await buyProLifetime({ provider: makeMockProvider(), storage });
  assert.equal(result.status, 'purchased');
  assert.equal(result.entitlements.spacedRepetition, true);
  assert.equal(result.entitlements.unlimitedMockExams, true);
  const storedRecord = JSON.parse(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY));
  assert.equal(storedRecord.receiptValidationStatus, 'valid');
  assert.equal(storedRecord.schemaVersion, 1);
  assert.equal(storedRecord.source, 'purchase');
  const post = await getProLifetimeEntitlement({ storage });
  assert.equal(post.spacedRepetition, true);
});

test('buyProLifetime and restoreProLifetime: unavailable runtime fails closed without store calls', async () => {
  const { buyProLifetime, restoreProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');
  let connected = false;
  const provider = {
    async connect() {
      connected = true;
      throw new Error('unavailable runtime must not connect');
    },
    async disconnect() {},
    async requestRemoveAdsPurchase() {
      throw new Error('unavailable runtime must not buy');
    },
    async restorePurchases() {
      throw new Error('unavailable runtime must not restore');
    },
  };
  const runtimeOptions = {
    provider,
    purchaseUnavailableReason: 'web_store_unavailable',
    storage: makeMemoryStorage(),
  };

  const buyResult = await buyProLifetime(runtimeOptions);
  const restoreResult = await restoreProLifetime({
    ...runtimeOptions,
    purchaseUnavailableReason: 'native_receipt_validator_unavailable',
  });

  assert.equal(connected, false);
  assert.equal(buyResult.status, 'unavailable');
  assert.equal(buyResult.entitlements.spacedRepetition, false);
  assert.equal(restoreResult.status, 'unavailable');
  assert.equal(restoreResult.entitlements.spacedRepetition, false);
});

test('restoreProLifetime: with no prior purchase returns not_found', async () => {
  const { restoreProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const result = await restoreProLifetime({
    provider: makeMockProvider({ owned: false }),
    storage: makeMemoryStorage(),
  });
  assert.equal(result.status, 'not_found');
  assert.equal(result.entitlements.spacedRepetition, false);
});

test('restoreProLifetime: with prior purchase persists entitlement', async () => {
  const { PRO_LIFETIME_STORAGE_KEY, restoreProLifetime } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const result = await restoreProLifetime({
    provider: makeMockProvider({ owned: true }),
    storage,
  });
  assert.equal(result.status, 'restored');
  assert.equal(result.entitlements.spacedRepetition, true);
  const storedRecord = JSON.parse(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY));
  assert.equal(storedRecord.source, 'restore');
});

test('setProLifetimeEntitlement: rejects bare true and clears persisted state', async () => {
  const {
    PRO_LIFETIME_PRODUCT_ID,
    PRO_LIFETIME_STORAGE_KEY,
    getProLifetimeEntitlement,
    setProLifetimeEntitlement,
  } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const storage = makeMemoryStorage();
  await storage.setItemAsync(PRO_LIFETIME_STORAGE_KEY, 'true');
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false);

  const rejected = await setProLifetimeEntitlement(true, { storage });
  assert.equal(rejected.spacedRepetition, false);
  assert.equal(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), 'true');

  await setProLifetimeEntitlement(true, {
    purchase: {
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'tok',
      transactionId: 'tx',
    },
    receiptValidation: validProReceipt({ productId: PRO_LIFETIME_PRODUCT_ID }),
    storage,
  });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
  await setProLifetimeEntitlement(false, { storage });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false);
});

test('proLifetime: stored entitlement timestamps must be canonical UTC ISO strings', async () => {
  const { PRO_LIFETIME_PRODUCT_ID, PRO_LIFETIME_STORAGE_KEY, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const canonicalTimestamp = '2026-05-20T12:34:56.789Z';

  for (const { grantedAt, label, receiptValidatedAt } of [
    {
      grantedAt: '2026-05-20',
      label: 'date-only grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: '2026-02-30T00:00:00.000Z',
      label: 'rollover grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'blank receiptValidatedAt',
      receiptValidatedAt: '',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'date-only receiptValidatedAt',
      receiptValidatedAt: '2026-05-20',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'timezone-offset receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56.789+00:00',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'rollover receiptValidatedAt',
      receiptValidatedAt: '2026-02-30T00:00:00.000Z',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'missing-milliseconds receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56Z',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'malformed receiptValidatedAt',
      receiptValidatedAt: 'not-a-date',
    },
  ]) {
    await storage.setItemAsync(
      PRO_LIFETIME_STORAGE_KEY,
      JSON.stringify({
        grantedAt,
        productId: PRO_LIFETIME_PRODUCT_ID,
        purchaseToken: 'tok-pro-lifetime',
        receiptValidatedAt,
        receiptValidationStatus: 'valid',
        schemaVersion: 1,
        source: 'purchase',
        transactionId: 'tx-pro-lifetime',
      }),
    );
    assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false, label);
  }

  await storage.setItemAsync(
    PRO_LIFETIME_STORAGE_KEY,
    JSON.stringify({
      grantedAt: canonicalTimestamp,
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'tok-pro-lifetime',
      receiptValidatedAt: canonicalTimestamp,
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'purchase',
      transactionId: 'tx-pro-lifetime',
    }),
  );
  const validPersistedRecord = await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY);
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
  assert.equal(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), validPersistedRecord);
});

test('buyProLifetime: invalid receipt and persistence failure fail closed before finish', async () => {
  const { PRO_LIFETIME_PRODUCT_ID, PRO_LIFETIME_STORAGE_KEY, buyProLifetime } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const invalidStorage = makeMemoryStorage();
  const invalidResult = await buyProLifetime({
    provider: makeMockProvider({ receiptValidationStatus: 'invalid' }),
    storage: invalidStorage,
  });

  assert.equal(invalidResult.status, 'pending');
  assert.equal(invalidResult.entitlements.spacedRepetition, false);
  assert.equal(await invalidStorage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), null);

  for (const [label, validatedAt] of [
    ['blank validator timestamp', ''],
    ['date-only validator timestamp', '2026-05-20'],
    ['timezone-offset validator timestamp', '2026-05-20T12:34:56.789+00:00'],
    ['rollover validator timestamp', '2026-02-30T00:00:00.000Z'],
    ['missing-milliseconds validator timestamp', '2026-05-20T12:34:56Z'],
    ['malformed validator timestamp', 'not-a-date'],
  ]) {
    const invalidTimestampStorage = makeMemoryStorage();
    const invalidTimestampProvider = {
      ...makeMockProvider(),
      async validateRemoveAdsReceipt(purchase, productId) {
        return {
          productId,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'valid',
          transactionId: purchase.transactionId ?? null,
          validatedAt,
        };
      },
    };
    const invalidTimestampResult = await buyProLifetime({
      provider: invalidTimestampProvider,
      storage: invalidTimestampStorage,
    });

    assert.equal(invalidTimestampResult.status, 'pending', label);
    assert.equal(invalidTimestampResult.entitlements.spacedRepetition, false, label);
    assert.equal(await invalidTimestampStorage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), null, label);
  }

  const events = [];
  const failingStorage = {
    async getItemAsync() {
      return null;
    },
    async setItemAsync() {
      events.push('persist-fail');
      throw new Error('storage unavailable');
    },
    async deleteItemAsync() {
      events.push('cleanup');
    },
  };
  const provider = {
    async connect() {
      events.push('connect');
    },
    async disconnect() {
      events.push('disconnect');
    },
    async finishPurchase() {
      events.push('finish');
    },
    async requestRemoveAdsPurchase(productId) {
      events.push('request');
      return {
        productId,
        purchaseToken: 'tok-persist',
        transactionId: 'tx-persist',
      };
    },
    async restorePurchases() {
      return [];
    },
    async validateRemoveAdsReceipt(purchase, productId) {
      events.push('validate');
      return validProReceipt({
        productId,
        purchaseToken: purchase.purchaseToken,
        transactionId: purchase.transactionId,
      });
    },
  };
  const failingResult = await buyProLifetime({ provider, storage: failingStorage });

  assert.equal(PRO_LIFETIME_PRODUCT_ID, 'com.billyyiu.almostswedish.prolifetime');
  assert.equal(failingResult.status, 'persistence_failed');
  assert.equal(failingResult.entitlements.spacedRepetition, false);
  assert.deepEqual(events, [
    'connect',
    'request',
    'validate',
    'persist-fail',
    'cleanup',
    'disconnect',
  ]);
});

test('getProLifetimeEntitlement: provider revalidates, refreshes, and clears stored records', async () => {
  const {
    PRO_LIFETIME_PRODUCT_ID,
    PRO_LIFETIME_STORAGE_KEY,
    getProLifetimeEntitlement,
    setProLifetimeEntitlement,
  } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const storage = makeMemoryStorage();

  await setProLifetimeEntitlement(true, {
    grantedAt: new Date('2026-05-20T00:00:00.000Z'),
    purchase: {
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'old-token',
      transactionId: 'old-tx',
    },
    receiptValidation: validProReceipt({
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'old-token',
      transactionId: 'old-tx',
    }),
    storage,
  });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);

  const refreshedProvider = makeMockProvider({
    owned: true,
    restorePurchase: {
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'old-token',
      transactionId: 'new-tx',
      raw: { ids: [PRO_LIFETIME_PRODUCT_ID] },
    },
  });
  const refreshed = await getProLifetimeEntitlement({ provider: refreshedProvider, storage });
  assert.equal(refreshed.spacedRepetition, true);
  const refreshedRecord = JSON.parse(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY));
  assert.equal(refreshedRecord.transactionId, 'new-tx');
  assert.equal(refreshedRecord.source, 'restore');

  const staleStorage = makeMemoryStorage();
  await setProLifetimeEntitlement(true, {
    purchase: {
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'stale-token',
      transactionId: 'stale-tx',
    },
    receiptValidation: validProReceipt({
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'stale-token',
      transactionId: 'stale-tx',
    }),
    storage: staleStorage,
  });
  const missing = await getProLifetimeEntitlement({
    provider: makeMockProvider({ owned: false }),
    storage: staleStorage,
  });
  assert.equal(missing.spacedRepetition, false);
  assert.equal(await staleStorage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), null);

  const invalidStorage = makeMemoryStorage();
  await setProLifetimeEntitlement(true, {
    purchase: {
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'invalid-token',
      transactionId: 'invalid-tx',
    },
    receiptValidation: validProReceipt({
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'invalid-token',
      transactionId: 'invalid-tx',
    }),
    storage: invalidStorage,
  });
  const invalid = await getProLifetimeEntitlement({
    provider: makeMockProvider({ owned: true, receiptValidationStatus: 'pending' }),
    storage: invalidStorage,
  });
  assert.equal(invalid.spacedRepetition, false);
  assert.equal(await invalidStorage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), null);
});

test('mergeWithRemoveAds: Pro purchase preserves shipped flags even if Remove-Ads is also active', () => {
  const { mergeWithRemoveAds } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const removeAds = { adsDisabled: true, unlimitedMockExams: false, fullMistakeReview: false };
  const pro = {
    adsDisabled: true,
    unlimitedMockExams: true,
    fullMistakeReview: true,
    spacedRepetition: true,
    nativeLangExplanations: false,
    customStudyPlan: true,
    notesExport: true,
    predictedPassProbability: false,
    confidenceSlider: true,
    multiColorHighlights: true,
  };
  const merged = mergeWithRemoveAds(removeAds, pro);
  assert.equal(merged.adsDisabled, true);
  assert.equal(merged.spacedRepetition, true);
  assert.equal(merged.unlimitedMockExams, true);
  assert.equal(merged.nativeLangExplanations, false);
  assert.equal(merged.predictedPassProbability, false);
});

test('mergeWithRemoveAds: Remove-Ads alone does NOT promote to Pro', () => {
  const { mergeWithRemoveAds } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const removeAds = { adsDisabled: true, unlimitedMockExams: false, fullMistakeReview: false };
  const noPro = {
    adsDisabled: false,
    unlimitedMockExams: false,
    fullMistakeReview: false,
    spacedRepetition: false,
    nativeLangExplanations: false,
    customStudyPlan: false,
    notesExport: false,
    predictedPassProbability: false,
    confidenceSlider: false,
    multiColorHighlights: false,
  };
  const merged = mergeWithRemoveAds(removeAds, noPro);
  assert.equal(merged.adsDisabled, true);
  assert.equal(merged.spacedRepetition, false);
  assert.equal(merged.unlimitedMockExams, false);
});

test('ProPaywall: buy and restore actions use the shared in-flight guard contract', () => {
  const source = read('components/monetization/ProPaywall.tsx');

  assert.doesNotThrow(() =>
    assertPurchaseActionInFlightGuard(source, {
      awaitedCalls: ['await buyProLifetime(', 'await restoreProLifetime('],
      surfaceName: 'ProPaywall',
    }),
  );
});

test('ProPaywall: unavailable reason copy is exhaustive and disables store actions', () => {
  const proLifetimeSource = read('lib/monetization/proLifetimePurchase.ts');
  const proHookSource = read('lib/monetization/useProLifetimeEntitlements.ts');
  const paywallSource = read('components/monetization/ProPaywall.tsx');

  assert.match(
    proLifetimeSource,
    /export const PRO_LIFETIME_PURCHASE_UNAVAILABLE_REASONS = \{[\s\S]*nativeReceiptValidatorUnavailable: 'native_receipt_validator_unavailable'[\s\S]*webStoreUnavailable: 'web_store_unavailable'/,
  );
  assert.match(
    proLifetimeSource,
    /export type ProLifetimePurchaseUnavailableReason =[\s\S]*PRO_LIFETIME_PURCHASE_UNAVAILABLE_REASONS/,
  );
  assert.match(
    proLifetimeSource,
    /purchaseUnavailableReason\?: ProLifetimePurchaseUnavailableReason/,
  );
  assert.match(
    proHookSource,
    /purchaseUnavailableReason:\s*'web_store_unavailable'/,
    'web Pro runtime must be explicitly unavailable outside E2E',
  );
  assert.match(
    proHookSource,
    /purchaseUnavailableReason:\s*receiptValidator\s*\?\s*undefined\s*:\s*'native_receipt_validator_unavailable'/,
    'native Pro runtime must expose receipt-validator-unavailable when validator wiring is absent',
  );
  assert.match(paywallSource, /function getProLifetimeUnavailableCopy\(/);
  assert.match(paywallSource, /case 'web_store_unavailable':/);
  assert.match(paywallSource, /case 'native_receipt_validator_unavailable':/);
  assert.match(paywallSource, /return assertNever\(reason\);/);
  assert.match(paywallSource, /disabled: activeAction !== null \|\| purchaseUnavailable/);
  assert.match(paywallSource, /disabled=\{activeAction !== null \|\| purchaseUnavailable\}/);
  assert.match(paywallSource, /setStatus\('unavailable'\);/);
  assert.match(paywallSource, /Buy in mobile app/);
  assert.match(paywallSource, /Buy unavailable/);
  assert.match(
    paywallSource,
    /Pro purchases are temporarily unavailable because receipt validation is not configured/,
  );
});

test('ProPaywall: guard contract rejects late purchase lock activation', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { assertPurchaseActionInFlightGuard } = require('./scripts/purchase-inflight-guard');
const source = fs
  .readFileSync('components/monetization/ProPaywall.tsx', 'utf8')
  .replace('purchaseActionInFlightRef.current = true;\\n      setActiveAction(action);', 'setActiveAction(action);');
assert.throws(
  () =>
    assertPurchaseActionInFlightGuard(source, {
      awaitedCalls: ['await buyProLifetime(', 'await restoreProLifetime('],
      surfaceName: 'ProPaywall',
    }),
  /ProPaywall must return early from the ref-backed in-flight guard before activating it|ProPaywall must set purchaseActionInFlightRef\\.current before awaiting store calls/,
);
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('focus-pro-lifetime validator reports relaunch receipt-backed counters', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-pro-lifetime-relaunch-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused Pro Lifetime validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  assert.deepEqual(summary, {
    proLifetimeBareTrueRejectionValidated: 1,
    proLifetimeStructuredRecordParsingValidated: 1,
    proLifetimeProviderReceiptRevalidationValidated: 1,
    proLifetimeFailClosedClearingValidated: 1,
    proLifetimeNativeHookProviderWiringValidated: 1,
    proLifetimeUnavailableReasonExhaustiveValidated: 1,
    proLifetimeRelaunchParityValidated: true,
  });
});
