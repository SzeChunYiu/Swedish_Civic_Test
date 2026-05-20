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

// Test fixtures: a minimal in-memory provider + storage.

function makeMockProvider({ events = [], owned = false } = {}) {
  let connected = false;
  let ownsPro = owned;
  return {
    async connect() {
      events.push('connect');
      connected = true;
    },
    async disconnect() {
      events.push('disconnect');
      connected = false;
    },
    async finishPurchase(purchase) {
      if (!connected) throw new Error('not connected');
      events.push(`finish:${purchase.productId}`);
    },
    async requestRemoveAdsPurchase(productId) {
      if (!connected) throw new Error('not connected');
      events.push(`request:${productId}`);
      ownsPro = true;
      return { productId, purchaseToken: 'tok', transactionId: 'tx', raw: { ids: [productId] } };
    },
    async restorePurchases(productIds) {
      if (!connected) throw new Error('not connected');
      events.push(`restore:${productIds.join(',')}`);
      if (!ownsPro) return [];
      const id = productIds[0];
      return [{ productId: id, purchaseToken: 'tok', transactionId: 'tx', raw: { ids: [id] } }];
    },
  };
}

function makeMemoryStorage({ events = [], failSet = false } = {}) {
  const store = new Map();
  return {
    async getItemAsync(k) {
      return store.get(k) ?? null;
    },
    async setItemAsync(k, v) {
      events.push(`set:${k}:${v}`);
      if (failSet) throw new Error('secure store write failed');
      store.set(k, v);
    },
    async deleteItemAsync(k) {
      store.delete(k);
    },
  };
}

test('proLifetime: product id + price label + storage key exported', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8')).expo;
  const identity = loadTs('lib/monetization/appStoreIdentity.ts');
  const m = loadTs('lib/monetization/proLifetimePurchase.ts');
  assert.equal(identity.APP_NATIVE_IDENTIFIER, appJson.ios.bundleIdentifier);
  assert.equal(identity.APP_NATIVE_IDENTIFIER, appJson.android.package);
  assert.equal(m.PRO_LIFETIME_PRODUCT_ID, `${identity.APP_NATIVE_IDENTIFIER}.prolifetime`);
  assert.equal(m.PRO_LIFETIME_PRODUCT_ID, identity.appStoreProductIds.proLifetime);
  assert.equal(m.PRO_LIFETIME_PRICE_LABEL, '59 SEK');
  assert.match(m.PRO_LIFETIME_STORAGE_KEY, /proLifetime/);
});

test('proLifetime: active store identity follows the current app namespace', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/proLifetimePurchase.ts'),
    'utf8',
  );
  const identitySource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/appStoreIdentity.ts'),
    'utf8',
  );

  assert.match(source, /appStoreProductIds/);
  assert.match(identitySource, /APP_NATIVE_IDENTIFIER/);
  assert.doesNotMatch(source, /swedishcivictest\.prolifetime/);
  assert.doesNotMatch(identitySource, /swedishcivictest/);
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

test('buyProLifetime: persists Pro entitlement before finishing the store purchase', async () => {
  const { buyProLifetime, PRO_LIFETIME_STORAGE_KEY } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const events = [];
  const storage = makeMemoryStorage({ events });
  const result = await buyProLifetime({ provider: makeMockProvider({ events }), storage });

  const persistIndex = events.indexOf(`set:${PRO_LIFETIME_STORAGE_KEY}:true`);
  const finishIndex = events.findIndex((event) => event.startsWith('finish:'));

  assert.equal(result.status, 'purchased');
  assert.notEqual(persistIndex, -1, 'Pro entitlement should be persisted');
  assert.notEqual(finishIndex, -1, 'store purchase should be finished after persistence');
  assert.ok(
    persistIndex < finishIndex,
    `expected persistence before finish, got ${events.join(' -> ')}`,
  );
});

test('buyProLifetime: persistence failure stays pending and does not finish purchase', async () => {
  const { buyProLifetime } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const events = [];
  const storage = makeMemoryStorage({ events, failSet: true });
  const result = await buyProLifetime({ provider: makeMockProvider({ events }), storage });

  assert.equal(result.status, 'pending');
  assert.equal(result.failureReason, 'entitlement_persistence_failed');
  assert.equal(result.entitlements.spacedRepetition, false);
  assert.equal(result.purchaseToken, 'tok');
  assert.equal(
    events.some((event) => event.startsWith('finish:')),
    false,
  );
  assert.equal(events.at(-1), 'disconnect');
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

test('setProLifetimeEntitlement: false clears persisted state', async () => {
  const { setProLifetimeEntitlement, getProLifetimeEntitlement } = loadTs(
    'lib/monetization/proLifetimePurchase.ts',
  );
  const storage = makeMemoryStorage();
  await setProLifetimeEntitlement(true, { storage });
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
  await setProLifetimeEntitlement(false, { storage });
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
