const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const { createThrowingReadMMKV } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function runValidationWithSettingsRoutePatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
process.argv.push('--focus-settings-store');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function runValidationWithSettingsStorePatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/storage/settingsStore.ts')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
process.argv.push('--focus-settings-store');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function createDailyGoalStorage(storedValue) {
  let value = storedValue;
  const writes = [];
  return {
    writes,
    getBoolean: () => undefined,
    getNumber: (key) => (key === 'dailyGoalAnswers' ? value : undefined),
    getString: () => undefined,
    set: (key, nextValue) => {
      writes.push({ key, value: nextValue });
      if (key === 'dailyGoalAnswers') value = nextValue;
    },
  };
}

function loadSettingsModuleFromStorage(storage) {
  const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  const originalTsExtension = require.extensions['.ts'];

  Module._resolveFilename = function patchedResolve(request, parent, ...args) {
    if (request === 'react-native-mmkv' || request === 'zustand' || request === 'expo-speech') {
      return `__stub__:${request}`;
    }
    return originalResolve.call(this, request, parent, ...args);
  };
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'react-native-mmkv') {
      return {
        createMMKV: () => storage,
      };
    }

    if (request === 'zustand') {
      return {
        create: (factory) => {
          let state;
          const setState = (partial) => {
            const next = typeof partial === 'function' ? partial(state) : partial;
            if (next == null) return;
            state = { ...state, ...next };
          };
          state = factory(setState, () => state);
          const useStore = (selector) => (selector ? selector(state) : state);
          useStore.getState = () => state;
          useStore.setState = setState;
          return useStore;
        },
      };
    }
    if (request === 'expo-speech') {
      return {
        speak() {},
        stop() {},
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

  try {
    delete require.cache[settingsStorePath];
    return require(settingsStorePath);
  } finally {
    delete require.cache[settingsStorePath];
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
    if (originalTsExtension) {
      require.extensions['.ts'] = originalTsExtension;
    } else {
      delete require.extensions['.ts'];
    }
  }
}

function loadSettingsStoreFromStorage(storage) {
  return loadSettingsModuleFromStorage(storage).useSettingsStore;
}

function loadSettingsFromStorage(storage) {
  return loadSettingsStoreFromStorage(storage).getState();
}

function loadDailyGoalFromStorage(storedValue) {
  return loadSettingsFromStorage(createDailyGoalStorage(storedValue)).dailyGoalAnswers;
}

test('daily goal settings stay in parity between storage and settings controls', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-settings-store'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsDailyGoalOptionsValidated, 4);
  assert.equal(summary.settingsDailyGoalParityValidated, true);
  assert.match(settingsStore, /const dailyGoalKey = 'dailyGoalAnswers';/);
  assert.match(settingsStore, /const defaultDailyGoalAnswers = 10;/);
  assert.match(settingsStore, /function normalizeDailyGoalAnswers/);
  assert.match(settingsStore, /const storedValue = readStorageNumber\(dailyGoalKey\);/);
  assert.match(settingsStore, /return normalizeDailyGoalAnswers\(storedValue\);/);
  assert.match(
    settingsStore,
    /function readStorageNumber\(key: string\): number \| undefined \{[\s\S]*settingsStorage\?\.getNumber\(key\);[\s\S]*return undefined;/,
  );
  assert.doesNotMatch(settingsStore, /storedValue && storedValue > 0 \? storedValue : 10/);
  assert.match(settingsStore, /Number\.isFinite\(answerCount\)/);
  assert.match(settingsStore, /Number\.isInteger\(answerCount\)/);
  assert.match(settingsStore, /const dailyGoalAnswerOptions = \[5, 10, 20, 40\] as const;/);
  assert.match(settingsStore, /dailyGoalAnswerOptions\.includes/);
  assert.match(settingsStore, /const safeGoal = normalizeDailyGoalAnswers\(dailyGoalAnswers\);/);
  assert.match(
    settingsStore,
    /const importedDailyGoalAnswers = normalizeImportedDailyGoalAnswers\(candidate\.dailyGoalAnswers\);/,
  );
  assert.match(
    settingsStore,
    /if \(importedDailyGoalAnswers !== undefined\) \{[\s\S]*settings\.dailyGoalAnswers = importedDailyGoalAnswers;/,
  );
  assert.doesNotMatch(settingsStore, /Math\.round\(dailyGoalAnswers\)/);
  assert.match(settingsRoute, /\[5, 10, 20, 40\]\.map\(\(goal\) =>/);
  assert.match(settingsRoute, /Set daily goal to \$\{goal\} answers/);
  assert.match(settingsRoute, /Ställ in dagligt mål till \$\{goal\} svar/);
  assert.match(settingsRoute, /\$\{answerCount\} svar per dag/);
  assert.match(settingsRoute, /\$\{answerCount\} answers per day/);
  assert.match(settingsRoute, /\{copy\.dailyGoalSummary\(dailyGoalAnswers\)\}/);
});

test('daily goal hydration falls back for unsafe persisted values', () => {
  [
    [undefined, 10],
    [Number.NaN, 10],
    [Infinity, 10],
    [-1, 10],
    [0, 10],
    [1, 10],
    [3.5, 10],
    [15, 10],
    [19.6, 10],
    [39.6, 10],
    [50, 10],
    [999, 10],
    [5, 5],
    [10, 10],
    [20, 20],
    [40, 40],
  ].forEach(([storedValue, expected]) => {
    assert.equal(loadDailyGoalFromStorage(storedValue), expected);
  });
});

test('daily goal setter falls back for malformed runtime inputs before persisting', () => {
  const storage = createDailyGoalStorage(20);
  const store = loadSettingsStoreFromStorage(storage);

  [
    Number.NaN,
    Infinity,
    -Infinity,
    '20',
    null,
    undefined,
    3.5,
    -1,
    0,
    1,
    15,
    19.6,
    39.6,
    50,
    51,
  ].forEach((goal) => {
    store.getState().setDailyGoalAnswers(goal);
    const latestWrite = storage.writes.at(-1);
    assert.equal(store.getState().dailyGoalAnswers, 10);
    assert.deepEqual(latestWrite, { key: 'dailyGoalAnswers', value: 10 });
    assert.equal(Number.isFinite(latestWrite.value), true);
  });

  [5, 10, 20, 40].forEach((goal) => {
    store.getState().setDailyGoalAnswers(goal);
    assert.equal(store.getState().dailyGoalAnswers, goal);
    assert.deepEqual(storage.writes.at(-1), { key: 'dailyGoalAnswers', value: goal });
  });
});

test('imported daily goal settings ignore malformed snapshot values before persisting', () => {
  const storage = createDailyGoalStorage(20);
  const { importSettingsSnapshot, useSettingsStore } = loadSettingsModuleFromStorage(storage);

  [
    Number.NaN,
    Infinity,
    -Infinity,
    '20',
    null,
    undefined,
    3.5,
    -1,
    0,
    1,
    15,
    19.6,
    39.6,
    50,
    51,
  ].forEach((goal) => {
    const writeCount = storage.writes.length;
    importSettingsSnapshot({ dailyGoalAnswers: goal });
    assert.equal(useSettingsStore.getState().dailyGoalAnswers, 20);
    assert.equal(storage.writes.length, writeCount);
  });

  [5, 10, 20, 40].forEach((goal) => {
    importSettingsSnapshot({ dailyGoalAnswers: goal });
    assert.equal(useSettingsStore.getState().dailyGoalAnswers, goal);
    assert.deepEqual(storage.writes.at(-1), { key: 'dailyGoalAnswers', value: goal });
  });
});

test('settings hydration falls back when MMKV reads throw', () => {
  const state = loadSettingsFromStorage(createThrowingReadMMKV('settings read failed'));

  assert.equal(state.language, 'sv');
  assert.equal(state.audioEnabled, true);
  assert.equal(state.dailyGoalAnswers, 10);
  assert.equal(state.includeSupplementaryQuestions, false);
  assert.equal(state.hasSeenAboutTheTest, false);
});

test('daily goal settings parity rejects option-set drift', () => {
  const result = runValidationWithSettingsRoutePatch(
    '[5, 10, 20, 40].map((goal) =>',
    '[5, 20, 40].map((goal) =>',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /app\/settings\.tsx daily goal options are \[\[5,20,40\]\], expected \[5,10,20,40\]/,
  );
  assert.match(output, /daily goal options must include the default 10/);
});

test('daily goal settings parity rejects raw runtime clamp in the setter', () => {
  const result = runValidationWithSettingsStorePatch(
    'const safeGoal = normalizeDailyGoalAnswers(dailyGoalAnswers);',
    'const safeGoal = Math.max(1, Math.min(50, Math.round(dailyGoalAnswers)));',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /setDailyGoalAnswers must normalize runtime daily-goal input/);
  assert.match(output, /setDailyGoalAnswers must not persist a raw Math.round daily-goal clamp/);
});

test('daily goal settings parity rejects raw positive-number hydration', () => {
  const result = runValidationWithSettingsStorePatch(
    'return normalizeDailyGoalAnswers(storedValue);',
    'return storedValue && storedValue > 0 ? storedValue : 10;',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /readDailyGoalAnswers must normalize the raw persisted value/);
  assert.match(output, /readDailyGoalAnswers must not hydrate raw positive persisted values/);
});
