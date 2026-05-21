const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
} = require('./helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

function createMemoryLocalStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(String(key)) ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

async function withGlobalProperties(overrides, fn) {
  const previous = new Map();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    if (value === undefined) {
      delete globalThis[key];
    } else {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value,
        writable: true,
      });
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete globalThis[key];
      }
    }
  }
}

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
        createDefaultPurchaseRuntimeOptions,
        getPurchaseEntitlements,
        restoreRemoveAdsPurchase,
      } = loadRemoveAdsWebRuntime();
      const runtimeOptions = createDefaultPurchaseRuntimeOptions(true);

      assert.equal(
        (await getPurchaseEntitlements(runtimeOptions)).adsDisabled,
        false,
        'non-E2E web runtime must revalidate and clear copied Remove Ads records',
      );
      assert.equal(globalThis.localStorage.getItem(REMOVE_ADS_STORAGE_KEY), null);

      const restoreResult = await restoreRemoveAdsPurchase(runtimeOptions);

      assert.equal(restoreResult.status, 'not_found');
      assert.equal(restoreResult.entitlements.adsDisabled, false);
    },
  );
});
