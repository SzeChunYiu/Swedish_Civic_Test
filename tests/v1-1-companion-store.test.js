// Tests for v1.1 companion store (PR10).
// Run with: node --test tests/v1-1-companion-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingGetMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

const Module = require('node:module');
const origResolve = Module._resolveFilename;
const stubs = {
  'react-native-mmkv': () => ({ createMMKV: () => null }),
  zustand: () => ({
    create: (factory) => {
      const setFn = (partial) =>
        Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
      const getFn = () => state;
      const state = factory(setFn, getFn);
      return () => state;
    },
  }),
};
Module._resolveFilename = function patchedResolve(request, ...args) {
  if (stubs[request]) return `__stub__:${request}`;
  return origResolve.call(this, request, ...args);
};
const origLoad = Module._load;
Module._load = function patchedLoad(request, ...args) {
  if (stubs[request]) return stubs[request]();
  return origLoad.call(this, request, ...args);
};

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

test('resolveCompanionId: returns valid mascot id unchanged', () => {
  const { resolveCompanionId } = loadTs('lib/storage/companionStore.ts');
  assert.equal(resolveCompanionId('lucia'), 'lucia');
  assert.equal(resolveCompanionId('dala-horse'), 'dala-horse');
});

test('resolveCompanionId: falls back to DEFAULT on unknown / non-string', () => {
  const { resolveCompanionId } = loadTs('lib/storage/companionStore.ts');
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  assert.equal(resolveCompanionId('not-a-mascot'), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(null), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(undefined), DEFAULT_COMPANION_ID);
  assert.equal(resolveCompanionId(42), DEFAULT_COMPANION_ID);
});

test('companion store source: never Pro-gated (invariant)', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  assert.ok(
    !/hasProEntitlement|isPremiumUser|adsDisabled|ProTierEntitlements/.test(source),
    'companion picker must never be Pro-gated',
  );
});

test('companion store uses MMKV id "companion" (separate from settings)', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  assert.match(source, /const companionStorageId = ['"]companion['"]/);
  assert.match(source, /createMMKV\(\{ id: companionStorageId \}\)/);
});

test('companion store: storage key is versioned for forward-compat', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/storage/companionStore.ts'), 'utf8');
  assert.match(source, /companion\.selectedId\.v1/);
});

test('companion store: throwing MMKV writes keep selected mascot in memory and record warning', () => {
  const storage = createThrowingSetMMKV('companion disk full');
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });

  useCompanionStore.getState().setSelected('lucia');
  const state = useCompanionStore.getState();

  assert.equal(state.selectedId, 'lucia');
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'companion');
  assert.equal(state.persistenceWarning.key, 'companion.selectedId.v1');
  assert.match(state.persistenceWarning.errorMessage, /disk full/);
});

test('companion store: throwing MMKV reads fall back to default mascot and record warning', () => {
  const storage = createThrowingGetMMKV('companion read failed');
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });
  const state = useCompanionStore.getState();

  assert.equal(state.selectedId, DEFAULT_COMPANION_ID);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'companion');
  assert.equal(state.persistenceWarning.key, 'companion.selectedId.v1');
  assert.match(state.persistenceWarning.errorMessage, /read failed/);
});

test('companion store: successful writes persist and clear persistence warning', () => {
  const storage = createMemoryMMKV();
  const { useCompanionStore } = loadTsWithStorage(repoRoot, 'lib/storage/companionStore.ts', {
    companion: storage,
  });

  useCompanionStore.getState().setSelected('dala-horse');
  assert.equal(useCompanionStore.getState().selectedId, 'dala-horse');
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('companion.selectedId.v1'), 'dala-horse');

  useCompanionStore.getState().reset();
  const { DEFAULT_COMPANION_ID } = loadTs('lib/mascot/catalog.ts');
  assert.equal(useCompanionStore.getState().persistenceWarning, null);
  assert.equal(storage.values.get('companion.selectedId.v1'), DEFAULT_COMPANION_ID);
});
