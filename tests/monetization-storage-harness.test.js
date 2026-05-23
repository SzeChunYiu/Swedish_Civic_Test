const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createMemoryLocalStorage,
  createTsLoader,
  withGlobalProperties,
} = require('./helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

test('storage harness keeps web storage checks focused on shared helpers', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const focusedSource = fs.readFileSync(__filename, 'utf8');
  const runnerSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/run-monetization-tests.js'),
    'utf8',
  );
  const broadMonetizationSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/monetization.test.js'),
    'utf8',
  );
  const harnessSource = fs.readFileSync(
    path.join(repoRoot, 'tests/helpers/monetizationRuntimeHarness.cjs'),
    'utf8',
  );

  assert.match(packageJson.scripts['test:monetization'], /scripts\/run-monetization-tests\.js/);
  assert.match(runnerSource, /tests\/monetization-storage-harness\.test\.js/);
  assert.match(runnerSource, /\['--test', \.\.\.forwardedArgs, \.\.\.monetizationTestFiles\]/);
  assert.match(focusedSource, /monetizationRuntimeHarness\.cjs/);
  assert.match(focusedSource, /createMemoryLocalStorage,\s*[\s\S]*withGlobalProperties,/);
  const memoryLocalStorageDefinitionPattern = new RegExp('function createMemory' + 'LocalStorage');
  const globalPropertiesDefinitionPattern = new RegExp('function withGlobal' + 'Properties');
  const localStorageDriftPattern = new RegExp('previousLocal' + 'Storage|localStorage' + 'Values');

  assert.match(harnessSource, memoryLocalStorageDefinitionPattern);
  assert.match(harnessSource, new RegExp('async ' + globalPropertiesDefinitionPattern.source));
  assert.doesNotMatch(focusedSource, memoryLocalStorageDefinitionPattern);
  assert.doesNotMatch(focusedSource, globalPropertiesDefinitionPattern);
  assert.doesNotMatch(focusedSource, localStorageDriftPattern);
  assert.doesNotMatch(broadMonetizationSource, /webStorageAfterReload/);
  assert.doesNotMatch(broadMonetizationSource, /web-session-1/);
});

test('mock exam access persistence reloads from web localStorage', async () => {
  const {
    createWebMockExamAccessStorage,
    getStoredMockExamAccess,
    recordStoredMockExamCompletion,
  } = loadTs('lib/monetization/rewardedExam.ts');

  await withGlobalProperties({ localStorage: createMemoryLocalStorage() }, async () => {
    const webStorage = createWebMockExamAccessStorage();

    await recordStoredMockExamCompletion({
      date: '2026-05-18T09:00:00.000Z',
      sessionId: 'web-session-1',
      storage: webStorage,
    });

    const webStorageAfterReload = createWebMockExamAccessStorage();

    assert.equal(
      (
        await getStoredMockExamAccess({
          date: '2026-05-18T10:00:00.000Z',
          storage: webStorageAfterReload,
        })
      ).completedMockExamsToday,
      1,
    );
  });
});

test('Remove Ads web storage persists stored entitlement across reload and clear', async () => {
  const purchaseExports = loadTs('lib/monetization/purchases.ts');
  const {
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMockPurchaseProvider,
    createWebPurchaseStorage,
    getPurchaseEntitlements,
  } = purchaseExports;

  const localStorage = createMemoryLocalStorage();
  await withGlobalProperties({ localStorage }, async () => {
    const webProvider = createMockPurchaseProvider();
    const webStorage = createWebPurchaseStorage();
    await buyRemoveAds({
      provider: webProvider,
      storage: webStorage,
    });

    const webStorageAfterReload = createWebPurchaseStorage();
    assert.equal(
      (await getPurchaseEntitlements({ provider: webProvider, storage: webStorageAfterReload }))
        .adsDisabled,
      true,
    );

    await purchaseExports.setRemoveAdsEntitlement(false, { storage: webStorageAfterReload });
    assert.equal(localStorage.getItem(REMOVE_ADS_STORAGE_KEY), null);
  });
});
