const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createMemoryLocalStorage,
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
  withGlobalProperties,
} = require('./helpers/monetizationRuntimeHarness.cjs');

test('monetization storage harness exposes shared runtime helpers', async () => {
  const localStorage = createMemoryLocalStorage();
  const react = createReactHookStub();
  const reactNativeWeb = createReactNativeWebStub();
  const loadTs = createTsLoader(process.cwd());

  await withGlobalProperties({ localStorage }, async () => {
    globalThis.localStorage.setItem('monetization-harness-check', 'ready');
    assert.equal(globalThis.localStorage.getItem('monetization-harness-check'), 'ready');
  });

  assert.equal(localStorage.getItem('monetization-harness-check'), 'ready');
  assert.equal(typeof react.useState, 'function');
  assert.equal(reactNativeWeb.Platform.OS, 'web');
  assert.equal(typeof loadTs, 'function');
});
