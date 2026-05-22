const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingReadMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function loadSettingsStateFromStorage(storage) {
  const { useSettingsStore } = loadTsWithStorage(repoRoot, 'lib/storage/settingsStore.ts', {
    settings: storage,
  });
  return useSettingsStore.getState();
}

function loadSettingsStoreWithSpeechStub(storage) {
  const speech = {
    stopCalls: 0,
    speak() {},
    stop() {
      this.stopCalls += 1;
    },
  };
  const { useSettingsStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/settingsStore.ts',
    {
      settings: storage,
    },
    {
      'expo-speech': () => speech,
    },
  );

  return { speech, useSettingsStore };
}

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

test('audio setting stays in parity between storage and settings switch', () => {
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
  const normalizedSettingsRoute = settingsRoute.replace(/\s+/g, ' ');

  assert.equal(summary.settingsAudioLabelsValidated, 2);
  assert.equal(summary.settingsAudioParityValidated, true);
  assert.match(settingsStore, /const audioEnabledKey = 'audioEnabled';/);
  assert.match(settingsStore, /const storedValue = readStorageBoolean\(audioEnabledKey\);/);
  assert.match(settingsStore, /return storedValue \?\? true;/);
  assert.match(
    settingsStore,
    /function readStorageBoolean\(key: string\): boolean \| undefined \{[\s\S]*readRecoverably\(settingsStorage, settingsStorageId, key,[\s\S]*settingsStorage\?\.getBoolean\(key\),[\s\S]*return result\.value;/,
  );
  assert.match(settingsRoute, /accessibilityRole="switch"/);
  assert.match(settingsRoute, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(settingsRoute, /setAudioEnabled\(!audioEnabled\)/);
  assert.match(
    normalizedSettingsRoute,
    /audioEnabled \? copy\.disableAudioAccessibilityLabel : copy\.enableAudioAccessibilityLabel/,
  );
  assert.match(
    normalizedSettingsRoute,
    /audioEnabled \? copy\.audioEnabledLabel : copy\.audioDisabledLabel/,
  );
  assert.match(settingsRoute, /Ljud på/);
  assert.match(settingsRoute, /Ljud avstängt/);
  assert.match(settingsRoute, /Stäng av ljud/);
  assert.match(settingsRoute, /Slå på ljud/);
  assert.match(settingsRoute, /Audio enabled/);
  assert.match(settingsRoute, /Audio disabled/);
});

test('audio setting hydration falls back when MMKV getBoolean throws', () => {
  const state = loadSettingsStateFromStorage(createThrowingReadMMKV('settings read failed'));

  assert.equal(state.audioEnabled, true);
});

test('audio muting stops active speech once and persists disabled state', () => {
  const storage = createMemoryMMKV({ audioEnabled: true });
  const { speech, useSettingsStore } = loadSettingsStoreWithSpeechStub(storage);

  useSettingsStore.getState().setAudioEnabled(false);

  assert.equal(speech.stopCalls, 1);
  assert.equal(useSettingsStore.getState().audioEnabled, false);
  assert.equal(storage.values.get('audioEnabled'), false);
});

test('invalid audio setter input no-ops without stopping speech or writing storage', () => {
  const storage = createMemoryMMKV({ audioEnabled: true });
  const { speech, useSettingsStore } = loadSettingsStoreWithSpeechStub(storage);

  useSettingsStore.getState().setAudioEnabled('nope');

  assert.equal(speech.stopCalls, 0);
  assert.equal(useSettingsStore.getState().audioEnabled, true);
  assert.equal(storage.values.get('audioEnabled'), true);
});

test('audio setting parity rejects missing route labels', () => {
  const result = runValidationWithSettingsRoutePatch('Audio disabled', 'Audio enabled');

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/settings\.tsx is missing audio label "Audio disabled"/,
  );
});

test('audio setting parity rejects a mute path that does not stop active speech', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/storage/settingsStore.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("import { stopSpeech } from '../audio/speak';\\n\\n", '')
      .replace('    if (!audioEnabled) {\\n      stopSpeech();\\n    }\\n', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-store');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /setAudioEnabled\(false\) must stop any in-flight speech before muting/,
  );
});

test('settings store schema stays in parity with persisted settings state', () => {
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

  assert.equal(summary.settingsStoreFieldsValidated, 12);
  assert.equal(summary.settingsStoreSchemaParityValidated, true);
  assert.match(settingsStore, /type SettingsState = \{/);
  assert.match(settingsStore, /language: AppLanguage;/);
  assert.match(settingsStore, /audioEnabled: boolean;/);
  assert.match(settingsStore, /dailyGoalAnswers: number;/);
  assert.match(settingsStore, /setLanguage: \(language: AppLanguage\) => void;/);
  assert.match(settingsStore, /setAudioEnabled: \(enabled: boolean\) => void;/);
  assert.match(settingsStore, /setDailyGoalAnswers: \(answerCount: number\) => void;/);
  assert.match(settingsStore, /createMMKV\(\{ id: 'settings' \}\)/);
});

test('settings store schema parity rejects setter optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/storage/settingsStore.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('setLanguage: (language: AppLanguage) => void;', 'setLanguage?: (language: AppLanguage) => void;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-store');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /SettingsState\.setLanguage optional=true, expected false/,
  );
});
