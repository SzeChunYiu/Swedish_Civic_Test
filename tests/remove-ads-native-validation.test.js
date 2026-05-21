const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, moduleCache = new Map()) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod);

  function localRequire(specifier) {
    if (specifier.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), specifier);
      for (const candidate of [
        `${resolvedPath}.ts`,
        `${resolvedPath}.tsx`,
        path.join(resolvedPath, 'index.ts'),
      ]) {
        if (fs.existsSync(candidate) && candidate.startsWith(repoRoot)) {
          return loadTs(path.relative(repoRoot, candidate), moduleCache);
        }
      }
    }
    if (specifier === 'react-native-iap' || specifier === 'expo-secure-store') return {};
    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

test('native Remove Ads provider fails closed unless a platform verifier validates the receipt', async () => {
  const {
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_RECORD_SCHEMA_VERSION,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createNativePurchaseProvider,
    getPurchaseEntitlements,
    restoreRemoveAdsPurchase,
  } = loadTs('lib/monetization/purchases.ts');
  const fakePurchase = {
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: 'fake-token-from-probe',
    transactionId: 'fake-transaction-from-probe',
  };

  function storedFakeRecord() {
    return JSON.stringify({
      grantedAt: '2026-05-19T00:00:00.000Z',
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: fakePurchase.purchaseToken,
      receiptValidatedAt: '2026-05-19T00:00:00.000Z',
      receiptValidationStatus: 'valid',
      schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
      source: 'purchase',
      transactionId: fakePurchase.transactionId,
    });
  }

  function createProvider(validateRemoveAdsReceipt, overrides = {}) {
    let finishCalls = 0;
    return {
      get finishCalls() {
        return finishCalls;
      },
      provider: {
        async connect() {},
        async disconnect() {},
        async finishPurchase() {
          finishCalls += 1;
        },
        async requestRemoveAdsPurchase() {
          if (overrides.requestRemoveAdsPurchase) return overrides.requestRemoveAdsPurchase();
          return fakePurchase;
        },
        async restorePurchases() {
          if (overrides.restorePurchases) return overrides.restorePurchases();
          return [fakePurchase];
        },
        validateRemoveAdsReceipt,
      },
    };
  }

  const unverifiedNativeProvider = createNativePurchaseProvider();
  const unverifiedValidation = await unverifiedNativeProvider.validateRemoveAdsReceipt(
    fakePurchase,
    REMOVE_ADS_PRODUCT_ID,
  );

  assert.deepEqual(unverifiedValidation, {
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: 'fake-token-from-probe',
    status: 'pending',
    transactionId: 'fake-transaction-from-probe',
  });

  const pendingPurchaseProvider = createProvider(unverifiedNativeProvider.validateRemoveAdsReceipt);
  const pendingPurchaseStorage = createMemoryPurchaseStorage();
  const pendingPurchase = await buyRemoveAds({
    provider: pendingPurchaseProvider.provider,
    storage: pendingPurchaseStorage,
  });

  assert.equal(pendingPurchase.status, 'pending');
  assert.equal(pendingPurchase.entitlements.adsDisabled, false);
  assert.equal(pendingPurchaseProvider.finishCalls, 0);
  assert.equal(await pendingPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const pendingRestore = await restoreRemoveAdsPurchase({
    provider: createProvider(unverifiedNativeProvider.validateRemoveAdsReceipt).provider,
    storage: createMemoryPurchaseStorage(),
  });

  assert.equal(pendingRestore.status, 'not_found');
  assert.equal(pendingRestore.entitlements.adsDisabled, false);

  const pendingStoredStorage = createMemoryPurchaseStorage();
  await pendingStoredStorage.setItemAsync(REMOVE_ADS_STORAGE_KEY, storedFakeRecord());
  const pendingStoredProvider = createProvider(unverifiedNativeProvider.validateRemoveAdsReceipt, {
    requestRemoveAdsPurchase: async () => null,
  });
  const pendingStoredPurchase = await buyRemoveAds({
    provider: pendingStoredProvider.provider,
    storage: pendingStoredStorage,
  });

  assert.equal(pendingStoredPurchase.status, 'pending');
  assert.equal(pendingStoredPurchase.entitlements.adsDisabled, false);
  assert.equal(pendingStoredProvider.finishCalls, 0);
  assert.equal(await pendingStoredStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const notFoundStoredStorage = createMemoryPurchaseStorage();
  await notFoundStoredStorage.setItemAsync(REMOVE_ADS_STORAGE_KEY, storedFakeRecord());
  const notFoundStoredRestore = await restoreRemoveAdsPurchase({
    provider: createProvider(unverifiedNativeProvider.validateRemoveAdsReceipt, {
      restorePurchases: async () => [],
    }).provider,
    storage: notFoundStoredStorage,
  });

  assert.equal(notFoundStoredRestore.status, 'not_found');
  assert.equal(notFoundStoredRestore.entitlements.adsDisabled, false);
  assert.equal(await notFoundStoredStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  for (const [label, validatedAt] of [
    ['date-only validator timestamp', '2026-05-20'],
    ['timezone-offset validator timestamp', '2026-05-20T12:34:56.789+00:00'],
    ['rollover validator timestamp', '2026-02-30T00:00:00.000Z'],
  ]) {
    const invalidTimestampProvider = createProvider(async (purchase, productId) => ({
      productId,
      purchaseToken: purchase.purchaseToken ?? null,
      status: 'valid',
      transactionId: purchase.transactionId ?? null,
      validatedAt,
    }));
    const invalidTimestampStorage = createMemoryPurchaseStorage();
    const invalidTimestampPurchase = await buyRemoveAds({
      provider: invalidTimestampProvider.provider,
      storage: invalidTimestampStorage,
    });

    assert.equal(invalidTimestampPurchase.status, 'pending', label);
    assert.equal(invalidTimestampPurchase.entitlements.adsDisabled, false, label);
    assert.equal(invalidTimestampProvider.finishCalls, 0, label);
    assert.equal(await invalidTimestampStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null, label);
  }

  const relaunchStorage = createMemoryPurchaseStorage(true);
  const storedBeforeRelaunch = await relaunchStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY);
  const relaunchEntitlements = await getPurchaseEntitlements({
    storage: relaunchStorage,
  });

  assert.equal(relaunchEntitlements.adsDisabled, true);
  assert.equal(await relaunchStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), storedBeforeRelaunch);

  const verifiedNativeProvider = createNativePurchaseProvider({
    async receiptValidator(purchase, productId) {
      return {
        productId,
        purchaseToken: purchase.purchaseToken ?? null,
        status: 'valid',
        transactionId: purchase.transactionId ?? null,
        validatedAt: '2026-05-19T00:00:00.000Z',
      };
    },
  });

  const verifiedPurchaseProvider = createProvider(verifiedNativeProvider.validateRemoveAdsReceipt);
  const verifiedPurchaseStorage = createMemoryPurchaseStorage();
  const verifiedPurchase = await buyRemoveAds({
    provider: verifiedPurchaseProvider.provider,
    storage: verifiedPurchaseStorage,
  });

  assert.equal(verifiedPurchase.status, 'purchased');
  assert.equal(verifiedPurchase.entitlements.adsDisabled, true);
  assert.equal(verifiedPurchaseProvider.finishCalls, 1);

  const storedPurchaseRecord = JSON.parse(
    await verifiedPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY),
  );
  assert.equal(storedPurchaseRecord.receiptValidationStatus, 'valid');
  assert.equal(storedPurchaseRecord.receiptValidatedAt, '2026-05-19T00:00:00.000Z');

  const verifiedRestore = await restoreRemoveAdsPurchase({
    provider: createProvider(verifiedNativeProvider.validateRemoveAdsReceipt).provider,
    storage: createMemoryPurchaseStorage(),
  });

  assert.equal(verifiedRestore.status, 'restored');
  assert.equal(verifiedRestore.entitlements.adsDisabled, true);
});
