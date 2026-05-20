const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
const storageById = new Map();

function createFakeStorage(id) {
  const values = new Map();

  return {
    id,
    setCalls: [],
    throwOnSet: false,
    values,
    getBoolean(key) {
      const value = values.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber(key) {
      const value = values.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getString(key) {
      const value = values.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    set(key, value) {
      this.setCalls.push({ key, value });
      if (this.throwOnSet) throw new Error(`${id} write failed`);
      values.set(key, value);
    },
  };
}

function resolveLocalTs(parentFilename, request) {
  const base = path.resolve(path.dirname(parentFilename), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

Module._resolveFilename = function patchedResolve(request, parent, ...args) {
  if (request === 'react-native-mmkv' || request === 'zustand') return `__stub__:${request}`;
  if (request.startsWith('.') && parent?.filename) {
    const localTsPath = resolveLocalTs(parent.filename, request);
    if (localTsPath) return localTsPath;
  }
  return originalResolve.call(this, request, parent, ...args);
};

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'react-native-mmkv') {
    return {
      createMMKV: ({ id }) => {
        if (!storageById.has(id)) storageById.set(id, createFakeStorage(id));
        return storageById.get(id);
      },
    };
  }

  if (request === 'zustand') {
    return {
      create: (factory) => {
        let state;
        const setState = (partial, replace = false) => {
          const next = typeof partial === 'function' ? partial(state) : partial;
          if (next === state || next == null) return;
          state = replace ? next : { ...state, ...next };
        };
        const getState = () => state;
        state = factory(setState, getState);
        const useStore = (selector) => (selector ? selector(state) : state);
        useStore.getState = getState;
        useStore.setState = setState;
        return useStore;
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function resetStorageModules() {
  storageById.clear();
  for (const cacheKey of Object.keys(require.cache)) {
    if (cacheKey.startsWith(path.join(repoRoot, 'lib/storage'))) delete require.cache[cacheKey];
    if (cacheKey.startsWith(path.join(repoRoot, 'lib/learning'))) delete require.cache[cacheKey];
  }
}

function loadTs(relativePath) {
  return require(path.join(repoRoot, relativePath));
}

test('progress writes fail softly while preserving answered-question state', () => {
  resetStorageModules();
  const storage = createFakeStorage('progress');
  storage.throwOnSet = true;
  storageById.set('progress', storage);
  const { useProgressStore } = loadTs('lib/storage/progressStore.ts');

  useProgressStore.getState().recordAnswer('q001', true);

  const failedState = useProgressStore.getState();
  assert.deepEqual(failedState.completedQuestionIds, ['q001']);
  assert.equal(failedState.questionProgress.q001.seenCount, 1);
  assert.equal(failedState.questionProgress.q001.correctCount, 1);
  assert.equal(failedState.persistenceWarning.storageId, 'progress');
  assert.equal(failedState.persistenceWarning.key, 'progressState');
  assert.equal(failedState.persistenceWarning.operation, 'write');
  assert.match(failedState.persistenceWarning.message, /progress write failed/);
  assert.equal(storage.values.has('progressState'), false);

  storage.throwOnSet = false;
  useProgressStore.getState().toggleBookmark('q001');

  const recoveredState = useProgressStore.getState();
  assert.equal(recoveredState.questionProgress.q001.bookmarked, true);
  assert.equal(recoveredState.persistenceWarning, null);
  assert.equal(
    JSON.parse(storage.values.get('progressState')).questionProgress.q001.bookmarked,
    true,
  );
});

test('settings writes fail softly while preserving the selected setting in memory', () => {
  resetStorageModules();
  const storage = createFakeStorage('settings');
  storage.throwOnSet = true;
  storageById.set('settings', storage);
  const { useSettingsStore } = loadTs('lib/storage/settingsStore.ts');

  useSettingsStore.getState().setDailyGoalAnswers(40);

  const failedState = useSettingsStore.getState();
  assert.equal(failedState.dailyGoalAnswers, 40);
  assert.equal(failedState.persistenceWarning.storageId, 'settings');
  assert.equal(failedState.persistenceWarning.key, 'dailyGoalAnswers');
  assert.match(failedState.persistenceWarning.message, /settings write failed/);
  assert.equal(storage.values.has('dailyGoalAnswers'), false);

  storage.throwOnSet = false;
  useSettingsStore.getState().setAudioEnabled(false);

  const recoveredState = useSettingsStore.getState();
  assert.equal(recoveredState.audioEnabled, false);
  assert.equal(recoveredState.persistenceWarning, null);
  assert.equal(storage.values.get('audioEnabled'), false);
});

test('mistake review writes fail softly while preserving wrong-answer review state', () => {
  resetStorageModules();
  const storage = createFakeStorage('mistake-review');
  storage.throwOnSet = true;
  storageById.set('mistake-review', storage);
  const { useMistakeReviewStore } = loadTs('lib/storage/mistakeReviewStore.ts');

  useMistakeReviewStore.getState().recordWrongAnswerReview({
    questionId: 'q002',
    selectedOptionTextEn: 'Wrong answer',
    selectedOptionTextSv: 'Fel svar',
  });

  const failedState = useMistakeReviewStore.getState();
  assert.equal(failedState.wrongAnswerReviews.q002.selectedOptionTextEn, 'Wrong answer');
  assert.equal(failedState.wrongAnswerReviews.q002.selectedOptionTextSv, 'Fel svar');
  assert.equal(failedState.persistenceWarning.storageId, 'mistake-review');
  assert.equal(failedState.persistenceWarning.key, 'mistakeReviewState');
  assert.match(failedState.persistenceWarning.message, /mistake-review write failed/);
  assert.equal(storage.values.has('mistakeReviewState'), false);

  storage.throwOnSet = false;
  useMistakeReviewStore.getState().clearWrongAnswerReviews();

  const recoveredState = useMistakeReviewStore.getState();
  assert.deepEqual(recoveredState.wrongAnswerReviews, {});
  assert.equal(recoveredState.persistenceWarning, null);
  assert.deepEqual(JSON.parse(storage.values.get('mistakeReviewState')).wrongAnswerReviews, {});
});
