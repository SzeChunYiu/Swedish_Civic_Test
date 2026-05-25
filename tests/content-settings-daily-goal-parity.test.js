const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { createThrowingReadMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

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

function createStudyPlanSettingsStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));
  const writes = [];

  return {
    values,
    writes,
    getBoolean: (key) => values.get(key),
    getNumber: (key) => values.get(key),
    getString: (key) => values.get(key),
    set: (key, nextValue) => {
      writes.push({ key, value: nextValue });
      values.set(key, nextValue);
    },
  };
}

function loadSettingsModuleFromStorage(storage) {
  return loadTsWithStorage(repoRoot, 'lib/storage/settingsStore.ts', {
    settings: storage,
  });
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
  const onboardingRoute = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');

  assert.equal(summary.settingsDailyGoalOptionsValidated, 4);
  assert.equal(summary.settingsDailyGoalParityValidated, true);
  assert.match(settingsStore, /const dailyGoalKey = 'dailyGoalAnswers';/);
  assert.match(settingsStore, /const defaultDailyGoalAnswers = 10;/);
  assert.match(settingsStore, /function normalizeDailyGoalAnswers/);
  assert.match(settingsStore, /const storedValue = readStorageNumber\(dailyGoalKey\);/);
  assert.match(settingsStore, /return normalizeDailyGoalAnswers\(storedValue\);/);
  assert.match(
    settingsStore,
    /function readStorageNumber\(key: string\): number \| undefined \{[\s\S]*settingsStorage\?\.getNumber\(key\),[\s\S]*rememberInitialReadWarning\(result\.warning\);[\s\S]*return result\.value;/,
  );
  assert.match(settingsStore, /const studyPlanTestDateIsoKey = 'studyPlanTestDateIso';/);
  assert.match(settingsStore, /const studyPlanIntensityKey = 'studyPlanIntensity';/);
  assert.match(settingsStore, /const defaultStudyPlanIntensity: StudyIntensity = 'regular';/);
  assert.match(settingsStore, /export function normalizeStudyPlanTestDateIso/);
  assert.match(settingsStore, /function normalizeStudyPlanIntensity/);
  assert.match(settingsStore, /function normalizeImportedStudyPlanIntensity/);
  assert.match(settingsStore, /function readStudyPlanTestDateIso/);
  assert.match(settingsStore, /function readStudyPlanIntensity/);
  assert.match(settingsStore, /studyPlanTestDateIso: string \| null;/);
  assert.match(settingsStore, /studyPlanIntensity: StudyIntensity;/);
  assert.match(settingsStore, /setStudyPlanTestDateIso: \(testDateIso: string \| null\) => void;/);
  assert.match(settingsStore, /setStudyPlanIntensity: \(intensity: StudyIntensity\) => void;/);
  assert.match(
    settingsStore,
    /const studyPlanTestDateIso = normalizeStudyPlanTestDateIso\(candidate\.studyPlanTestDateIso\);/,
  );
  assert.match(
    settingsStore,
    /const studyPlanIntensity = normalizeImportedStudyPlanIntensity\(candidate\.studyPlanIntensity\);/,
  );
  assert.doesNotMatch(settingsStore, /storedValue && storedValue > 0 \? storedValue : 10/);
  assert.match(settingsStore, /Number\.isFinite\(answerCount\)/);
  assert.match(settingsStore, /Number\.isInteger\(answerCount\)/);
  assert.match(
    settingsStore,
    /export const supportedDailyGoalAnswerOptions = \[5, 10, 20, 40\] as const;/,
  );
  assert.match(
    settingsStore,
    /const dailyGoalAnswerOptions = new Set<number>\(supportedDailyGoalAnswerOptions\);/,
  );
  assert.match(settingsStore, /dailyGoalAnswerOptions\.has\(answerCount\)/);
  assert.match(settingsStore, /const safeGoal = normalizeDailyGoalAnswers\(dailyGoalAnswers\);/);
  assert.match(settingsStore, /function normalizeImportedDailyGoalAnswers/);
  assert.match(
    settingsStore,
    /const dailyGoalAnswers = normalizeImportedDailyGoalAnswers\(candidate\.dailyGoalAnswers\);/,
  );
  assert.match(
    settingsStore,
    /if \(dailyGoalAnswers !== undefined\) settings\.dailyGoalAnswers = dailyGoalAnswers;/,
  );
  assert.doesNotMatch(
    settingsStore,
    /settings\.dailyGoalAnswers = normalizeDailyGoalAnswers\(candidate\.dailyGoalAnswers\);/,
  );
  assert.doesNotMatch(settingsStore, /Math\.round\(dailyGoalAnswers\)/);
  assert.match(settingsRoute, /supportedDailyGoalAnswerOptions\.map\(\(goal\) =>/);
  assert.doesNotMatch(settingsRoute, /\[5, 10, 20, 40\]\.map\(\(goal\) =>/);
  assert.match(settingsRoute, /Set daily goal to \$\{goal\} answers/);
  assert.match(settingsRoute, /Ställ in dagligt mål till \$\{goal\} svar/);
  assert.match(settingsRoute, /\$\{answerCount\} svar per dag/);
  assert.match(settingsRoute, /\$\{answerCount\} answers per day/);
  assert.match(settingsRoute, /\{copy\.dailyGoalSummary\(dailyGoalAnswers\)\}/);
  assert.match(onboardingRoute, /supportedDailyGoalAnswerOptions,/);
  assert.match(
    onboardingRoute,
    /type DailyGoalPresetValue = Exclude<\(typeof supportedDailyGoalAnswerOptions\)\[number\], 5>;/,
  );
  assert.match(
    onboardingRoute,
    /supportedDailyGoalAnswerOptions\.filter\(isOnboardingDailyGoalPresetValue\)/,
  );
  assert.doesNotMatch(
    onboardingRoute,
    /const\s+onboardingDailyGoalPresetValues[\s\S]{0,120}=\s*\[/,
  );
});

test('daily goal hydration falls back for unsafe persisted values', () => {
  [
    [undefined, 10],
    [Number.NaN, 10],
    [Infinity, 10],
    [-1, 10],
    [0, 10],
    [3.5, 10],
    [1, 10],
    [6, 10],
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

  [Number.NaN, Infinity, -Infinity, '20', null, undefined, 3.5, -1, 0, 1, 6, 50, 51].forEach(
    (goal) => {
      store.getState().setDailyGoalAnswers(goal);
      const latestWrite = storage.writes.at(-1);
      assert.equal(store.getState().dailyGoalAnswers, 10);
      assert.deepEqual(latestWrite, { key: 'dailyGoalAnswers', value: 10 });
      assert.equal(Number.isFinite(latestWrite.value), true);
    },
  );

  [5, 10, 20, 40].forEach((goal) => {
    store.getState().setDailyGoalAnswers(goal);
    assert.equal(store.getState().dailyGoalAnswers, goal);
    assert.deepEqual(storage.writes.at(-1), { key: 'dailyGoalAnswers', value: goal });
  });
});

test('imported daily goal settings omit malformed snapshot values before persisting', () => {
  const storage = createDailyGoalStorage(20);
  const { importSettingsSnapshot, normalizeImportedSettings, useSettingsStore } =
    loadSettingsModuleFromStorage(storage);

  [Number.NaN, Infinity, -Infinity, '20', null, undefined, 3.5, -1, 0, 1, 6, 50, 51].forEach(
    (goal) => {
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          normalizeImportedSettings({ dailyGoalAnswers: goal }),
          'dailyGoalAnswers',
        ),
        false,
        `invalid imported goal ${String(goal)} must be omitted`,
      );
      importSettingsSnapshot({ dailyGoalAnswers: goal });
      assert.equal(useSettingsStore.getState().dailyGoalAnswers, 20);
      assert.deepEqual(storage.writes, []);
    },
  );

  [5, 10, 20, 40].forEach((goal) => {
    importSettingsSnapshot({ dailyGoalAnswers: goal });
    assert.equal(useSettingsStore.getState().dailyGoalAnswers, goal);
    assert.deepEqual(storage.writes.at(-1), { key: 'dailyGoalAnswers', value: goal });
  });
});

test('study plan date settings normalize optional test date and intensity before persisting', () => {
  const storage = createStudyPlanSettingsStorage({
    studyPlanIntensity: 'serious',
    studyPlanTestDateIso: '2026-08-15',
  });
  const {
    importSettingsSnapshot,
    normalizeImportedSettings,
    normalizeStudyPlanTestDateIso,
    useSettingsStore,
  } = loadSettingsModuleFromStorage(storage);

  assert.equal(normalizeStudyPlanTestDateIso('2026-08-15'), '2026-08-15T00:00:00.000Z');
  assert.equal(
    normalizeStudyPlanTestDateIso('2026-08-15T10:30:00.000Z'),
    '2026-08-15T00:00:00.000Z',
  );
  assert.equal(normalizeStudyPlanTestDateIso('2026-02-31'), null);
  assert.equal(normalizeStudyPlanTestDateIso('not-a-date'), null);
  assert.equal(useSettingsStore.getState().studyPlanTestDateIso, '2026-08-15T00:00:00.000Z');
  assert.equal(useSettingsStore.getState().studyPlanIntensity, 'serious');

  useSettingsStore.getState().setStudyPlanTestDateIso('2026-09-02');
  assert.equal(useSettingsStore.getState().studyPlanTestDateIso, '2026-09-02T00:00:00.000Z');
  assert.deepEqual(storage.writes.at(-1), {
    key: 'studyPlanTestDateIso',
    value: '2026-09-02T00:00:00.000Z',
  });

  useSettingsStore.getState().setStudyPlanTestDateIso('2026-02-31');
  assert.equal(useSettingsStore.getState().studyPlanTestDateIso, null);
  assert.deepEqual(storage.writes.at(-1), { key: 'studyPlanTestDateIso', value: '' });

  useSettingsStore.getState().setStudyPlanIntensity('casual');
  assert.equal(useSettingsStore.getState().studyPlanIntensity, 'casual');
  assert.deepEqual(storage.writes.at(-1), { key: 'studyPlanIntensity', value: 'casual' });

  useSettingsStore.getState().setStudyPlanIntensity('invalid');
  assert.equal(useSettingsStore.getState().studyPlanIntensity, 'regular');
  assert.deepEqual(storage.writes.at(-1), { key: 'studyPlanIntensity', value: 'regular' });

  assert.deepEqual(normalizeImportedSettings({ studyPlanTestDateIso: 'bad-date' }), {});
  assert.deepEqual(normalizeImportedSettings({ studyPlanIntensity: 'too-much' }), {});
  assert.equal(
    normalizeImportedSettings({ studyPlanTestDateIso: '2026-10-01' }).studyPlanTestDateIso,
    '2026-10-01T00:00:00.000Z',
  );
  assert.equal(normalizeImportedSettings({ studyPlanTestDateIso: '' }).studyPlanTestDateIso, null);
  assert.equal(
    normalizeImportedSettings({ studyPlanIntensity: 'regular' }).studyPlanIntensity,
    'regular',
  );

  importSettingsSnapshot({ studyPlanTestDateIso: '2026-12-24', studyPlanIntensity: 'serious' });
  assert.equal(useSettingsStore.getState().studyPlanTestDateIso, '2026-12-24T00:00:00.000Z');
  assert.equal(useSettingsStore.getState().studyPlanIntensity, 'serious');
  assert.deepEqual(storage.writes.slice(-2), [
    { key: 'studyPlanTestDateIso', value: '2026-12-24T00:00:00.000Z' },
    { key: 'studyPlanIntensity', value: 'serious' },
  ]);

  importSettingsSnapshot({ studyPlanTestDateIso: null });
  assert.equal(useSettingsStore.getState().studyPlanTestDateIso, null);
  assert.deepEqual(storage.writes.at(-1), { key: 'studyPlanTestDateIso', value: '' });
});

test('settings hydration falls back when MMKV reads throw', () => {
  const state = loadSettingsFromStorage(createThrowingReadMMKV('settings read failed'));

  assert.equal(state.language, 'sv');
  assert.equal(state.audioEnabled, true);
  assert.equal(state.dailyGoalAnswers, 10);
  assert.equal(state.includeSupplementaryQuestions, false);
  assert.equal(state.hasSeenAboutTheTest, false);
  assert.equal(state.hasCompletedOnboarding, false);
  assert.equal(state.studyPlanTestDateIso, null);
  assert.equal(state.studyPlanIntensity, 'regular');
});

test('daily goal settings parity rejects option-set drift', () => {
  const result = runValidationWithSettingsStorePatch(
    'export const supportedDailyGoalAnswerOptions = [5, 10, 20, 40] as const;',
    'export const supportedDailyGoalAnswerOptions = [5, 20, 40] as const;',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /supportedDailyGoalAnswerOptions is \[5,20,40\], expected \[5,10,20,40\]/);
  assert.match(output, /daily goal options must include the default 10/);
});

test('daily goal settings parity rejects inline settings option arrays', () => {
  const result = runValidationWithSettingsRoutePatch(
    'supportedDailyGoalAnswerOptions.map((goal) =>',
    '[5, 10, 20, 40].map((goal) =>',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /app\/settings\.tsx must render daily goal options from supportedDailyGoalAnswerOptions/,
  );
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
