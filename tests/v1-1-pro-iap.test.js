// Tests for Pro Lifetime IAP wiring (blueprint 13, PR5).
// Run with: node --test tests/v1-1-pro-iap.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

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
  events,
  owned = false,
  pendingPurchase = false,
  receiptValidationStatus = 'valid',
} = {}) {
  let connected = false;
  let ownsPro = owned;
  const push = (event) => events?.push(event);

  return {
    async connect() {
      push('connect');
      connected = true;
    },
    async disconnect() {
      push('disconnect');
      connected = false;
    },
    async finishPurchase() {
      if (!connected) throw new Error('not connected');
      push('finish');
    },
    async requestRemoveAdsPurchase(productId) {
      if (!connected) throw new Error('not connected');
      push('request');
      if (pendingPurchase) return null;
      ownsPro = true;
      return { productId, purchaseToken: 'tok', transactionId: 'tx', raw: { ids: [productId] } };
    },
    async restorePurchases(productIds) {
      if (!connected) throw new Error('not connected');
      push('restore');
      if (!ownsPro) return [];
      const id = productIds[0];
      return [{ productId: id, purchaseToken: 'tok', transactionId: 'tx', raw: { ids: [id] } }];
    },
    async validateRemoveAdsReceipt(purchase, productId) {
      if (!connected) throw new Error('not connected');
      push('validate');
      if (receiptValidationStatus !== 'valid') return { status: receiptValidationStatus };
      return {
        productId,
        purchaseToken: purchase.purchaseToken ?? null,
        status: 'valid',
        transactionId: purchase.transactionId ?? null,
        validatedAt: '2026-05-20T12:00:00.000Z',
      };
    },
  };
}

function makeMemoryStorage({ events, failSet = false, initial = {} } = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    async getItemAsync(k) {
      return store.get(k) ?? null;
    },
    async setItemAsync(k, v) {
      if (failSet) {
        events?.push('persist-fail');
        throw new Error('storage unavailable');
      }
      events?.push('persist');
      store.set(k, v);
    },
    async deleteItemAsync(k) {
      events?.push('cleanup');
      store.delete(k);
    },
  };
}

function createValidReceipt(productId) {
  return {
    productId,
    purchaseToken: 'tok',
    status: 'valid',
    transactionId: 'tx',
    validatedAt: '2026-05-20T12:00:00.000Z',
  };
}

test('proLifetime: product id + price label + storage key exported', () => {
  const m = loadTs('lib/monetization/proLifetimePurchase.ts');
  assert.equal(m.PRO_LIFETIME_PRODUCT_ID, 'com.billyyiu.almostswedish.prolifetime');
  assert.equal(m.PRO_LIFETIME_PRICE_LABEL, '59 SEK');
  assert.match(m.PRO_LIFETIME_STORAGE_KEY, /proLifetime/);
});

test('proLifetime: v1.1 setup docs and identity stay in Pro lane', () => {
  const m = loadTs('lib/monetization/proLifetimePurchase.ts');
  const appStoreIdentitySource = read('lib/monetization/appStoreIdentity.ts');
  const proLifetimeSource = read('lib/monetization/proLifetimePurchase.ts');
  const publishingGateSource = read('scripts/publishing.test.js');

  assert.match(appStoreIdentitySource, /APP_NATIVE_IDENTIFIER = 'com\.billyyiu\.almostswedish'/);
  assert.match(appStoreIdentitySource, /proLifetime:\s*`\$\{APP_NATIVE_IDENTIFIER\}\.prolifetime`/);
  assert.match(proLifetimeSource, /appStoreProductIds\.proLifetime/);
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
  const { buyProLifetime, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const result = await buyProLifetime({ provider: makeMockProvider(), storage });
  assert.equal(result.status, 'purchased');
  assert.equal(result.entitlements.spacedRepetition, true);
  assert.equal(result.entitlements.unlimitedMockExams, true);
  const post = await getProLifetimeEntitlement({ storage });
  assert.equal(post.spacedRepetition, true);
});

test('buyProLifetime: stores a validated record and survives relaunch without bare booleans', async () => {
  const { PRO_LIFETIME_STORAGE_KEY, buyProLifetime, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const result = await buyProLifetime({ provider: makeMockProvider(), storage });
  const stored = JSON.parse(storage.store.get(PRO_LIFETIME_STORAGE_KEY));

  assert.equal(result.status, 'purchased');
  assert.equal(stored.productId, result.productId);
  assert.equal(stored.receiptValidationStatus, 'valid');
  assert.equal(stored.source, 'purchase');
  assert.equal(stored.transactionId, 'tx');
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
});

test('getProLifetimeEntitlement: rejects forged bare true and malformed records', async () => {
  const { PRO_LIFETIME_STORAGE_KEY, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const forgedStorage = makeMemoryStorage({
    initial: {
      [PRO_LIFETIME_STORAGE_KEY]: 'true',
    },
  });
  assert.equal(
    (await getProLifetimeEntitlement({ storage: forgedStorage })).spacedRepetition,
    false,
  );

  const malformedStorage = makeMemoryStorage({
    initial: {
      [PRO_LIFETIME_STORAGE_KEY]: JSON.stringify({
        grantedAt: '2026-05-20T12:00:00.000Z',
        productId: 'debug.pro',
        receiptValidatedAt: '2026-05-20T12:00:00.000Z',
        receiptValidationStatus: 'valid',
        schemaVersion: 1,
        source: 'purchase',
        transactionId: 'tx',
      }),
    },
  });
  assert.equal(
    (await getProLifetimeEntitlement({ storage: malformedStorage })).spacedRepetition,
    false,
  );
});

test('buyProLifetime: invalid and pending receipts do not grant or finish Pro', async () => {
  const { buyProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');

  for (const receiptValidationStatus of ['invalid', 'pending']) {
    const events = [];
    const result = await buyProLifetime({
      provider: makeMockProvider({ events, receiptValidationStatus }),
      storage: makeMemoryStorage(),
    });

    assert.equal(result.status, 'pending');
    assert.equal(result.entitlements.spacedRepetition, false);
    assert.equal(events.includes('finish'), false);
  }
});

test('buyProLifetime: persists before finish and leaves failed persistence unfinished', async () => {
  const { buyProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');

  const successEvents = [];
  const successResult = await buyProLifetime({
    provider: makeMockProvider({ events: successEvents }),
    storage: makeMemoryStorage({ events: successEvents }),
  });

  assert.equal(successResult.status, 'purchased');
  assert.deepEqual(successEvents, [
    'connect',
    'request',
    'validate',
    'persist',
    'finish',
    'disconnect',
  ]);

  const failingEvents = [];
  const failingResult = await buyProLifetime({
    provider: makeMockProvider({ events: failingEvents }),
    storage: makeMemoryStorage({ events: failingEvents, failSet: true }),
  });

  assert.equal(failingResult.status, 'persistence_failed');
  assert.equal(failingResult.entitlements.spacedRepetition, false);
  assert.deepEqual(failingEvents, [
    'connect',
    'request',
    'validate',
    'persist-fail',
    'cleanup',
    'disconnect',
  ]);
  assert.equal(failingEvents.includes('finish'), false);
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
  const { restoreProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const result = await restoreProLifetime({
    provider: makeMockProvider({ owned: true }),
    storage: makeMemoryStorage(),
  });
  assert.equal(result.status, 'restored');
  assert.equal(result.entitlements.spacedRepetition, true);
});

test('restoreProLifetime: invalid receipt does not grant Pro', async () => {
  const { restoreProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const result = await restoreProLifetime({
    provider: makeMockProvider({ owned: true, receiptValidationStatus: 'invalid' }),
    storage: makeMemoryStorage(),
  });
  assert.equal(result.status, 'not_found');
  assert.equal(result.entitlements.spacedRepetition, false);
});

test('setProLifetimeEntitlement: false clears persisted state', async () => {
  const { PRO_LIFETIME_PRODUCT_ID, setProLifetimeEntitlement, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  await setProLifetimeEntitlement(true, {
    receiptValidation: createValidReceipt(PRO_LIFETIME_PRODUCT_ID),
    storage,
  });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
  await setProLifetimeEntitlement(false, { storage });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false);
});

test('setProLifetimeEntitlement: direct true grant requires a valid Pro receipt', async () => {
  const { setProLifetimeEntitlement, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  const entitlements = await setProLifetimeEntitlement(true, { storage });
  assert.equal(entitlements.spacedRepetition, false);
  assert.equal(storage.store.size, 0);
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false);
});

test('mergeWithRemoveAds: Pro purchase preserves all flags even if Remove-Ads is also active', () => {
  const { mergeWithRemoveAds } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const removeAds = { adsDisabled: true, unlimitedMockExams: false, fullMistakeReview: false };
  const pro = {
    adsDisabled: true,
    unlimitedMockExams: true,
    fullMistakeReview: true,
    spacedRepetition: true,
    nativeLangExplanations: true,
    customStudyPlan: true,
    notesExport: true,
    predictedPassProbability: true,
    confidenceSlider: true,
    multiColorHighlights: true,
  };
  const merged = mergeWithRemoveAds(removeAds, pro);
  assert.equal(merged.adsDisabled, true);
  assert.equal(merged.spacedRepetition, true);
  assert.equal(merged.unlimitedMockExams, true);
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
