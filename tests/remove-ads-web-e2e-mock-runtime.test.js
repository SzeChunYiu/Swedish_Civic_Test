const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createMemoryLocalStorage,
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
  withGlobalProperties,
} = require('./helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

function loadRemoveAdsWebRuntime() {
  const moduleCache = new Map();
  const moduleMocks = {
    react: createReactHookStub(),
    'react-native': createReactNativeWebStub(),
  };

  return {
    ...loadTs('lib/monetization/purchases.ts', undefined, moduleCache, moduleMocks),
    ...loadTs('lib/monetization/useRemoveAdsEntitlements.ts', undefined, moduleCache, moduleMocks),
  };
}

test('web Remove Ads E2E mock owned restore grants only in E2E runtime', async () => {
  await withGlobalProperties(
    {
      __SMT_E2E__: true,
      __SMT_REMOVE_ADS_MOCK_OWNED__: true,
      localStorage: createMemoryLocalStorage(),
    },
    async () => {
      const {
        createDefaultPurchaseRuntimeOptions,
        getPurchaseEntitlements,
        restoreRemoveAdsPurchase,
      } = loadRemoveAdsWebRuntime();
      const runtimeOptions = createDefaultPurchaseRuntimeOptions();

      assert.equal((await getPurchaseEntitlements(runtimeOptions)).adsDisabled, false);

      const restoreResult = await restoreRemoveAdsPurchase(runtimeOptions);

      assert.equal(restoreResult.status, 'restored');
      assert.equal(restoreResult.entitlements.adsDisabled, true);
      assert.equal((await getPurchaseEntitlements(runtimeOptions)).adsDisabled, true);
    },
  );
});

test('createDefaultPurchaseRuntimeOptions fails closed and clears stored entitlement outside E2E', async () => {
  await withGlobalProperties(
    {
      __SMT_E2E__: false,
      __SMT_REMOVE_ADS_MOCK_OWNED__: true,
      localStorage: createMemoryLocalStorage(),
    },
    async () => {
      const {
        REMOVE_ADS_STORAGE_KEY,
        buyRemoveAds,
        createDefaultPurchaseRuntimeOptions,
        getPurchaseEntitlements,
        restoreRemoveAdsPurchase,
      } = loadRemoveAdsWebRuntime();
      const runtimeOptions = createDefaultPurchaseRuntimeOptions(true);

      assert.equal(runtimeOptions.purchaseUnavailableReason, 'web_store_unavailable');
      assert.equal(
        (await getPurchaseEntitlements(runtimeOptions)).adsDisabled,
        false,
        'non-E2E web runtime must revalidate and clear copied Remove Ads records',
      );
      assert.equal(globalThis.localStorage.getItem(REMOVE_ADS_STORAGE_KEY), null);

      const buyResult = await buyRemoveAds(runtimeOptions);
      assert.equal(buyResult.status, 'unavailable');
      assert.equal(buyResult.entitlements.adsDisabled, false);
      assert.equal(globalThis.localStorage.getItem(REMOVE_ADS_STORAGE_KEY), null);

      const restoreResult = await restoreRemoveAdsPurchase(runtimeOptions);

      assert.equal(restoreResult.status, 'unavailable');
      assert.equal(restoreResult.entitlements.adsDisabled, false);
    },
  );
});

test('placement Remove Ads CTA mirrors unavailable public web runtime copy', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
    'utf8',
  );

  assert.match(source, /purchaseUnavailableReason === 'web_store_unavailable'/);
  assert.match(source, /copy\.webUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(source, /Buy in mobile app/);
  assert.match(source, /Restore in mobile app/);
  assert.match(source, /disabled=\{actionsDisabled\}/);
});
