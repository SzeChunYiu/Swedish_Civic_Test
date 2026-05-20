const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('audio setting stays in parity between storage and settings switch', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsAudioLabelsValidated, 2);
  assert.equal(summary.settingsAudioParityValidated, true);
  assert.match(settingsStore, /const audioEnabledKey = 'audioEnabled';/);
  assert.match(settingsStore, /settingsStorage\?\.getBoolean\(audioEnabledKey\)/);
  assert.match(settingsStore, /return storedValue \?\? true;/);
  assert.match(settingsStore, /import \{ stopSpeech \} from '\.\.\/audio\/speak';/);
  assert.match(settingsStore, /if \(!audioEnabled\) \{\s*stopSpeech\(\);\s*\}/);
  assert.match(settingsRoute, /accessibilityRole="switch"/);
  assert.match(settingsRoute, /accessibilityState=\{\{ checked: audioEnabled \}\}/);
  assert.match(settingsRoute, /setAudioEnabled\(!audioEnabled\)/);
  assert.match(
    settingsRoute,
    /audioEnabled \? copy\.disableAudioAccessibilityLabel : copy\.enableAudioAccessibilityLabel/,
  );
  assert.match(settingsRoute, /audioEnabled \? copy\.audioEnabledLabel : copy\.audioDisabledLabel/);
  assert.match(settingsRoute, /Ljud på/);
  assert.match(settingsRoute, /Ljud avstängt/);
  assert.match(settingsRoute, /Stäng av ljud/);
  assert.match(settingsRoute, /Slå på ljud/);
  assert.match(settingsRoute, /Audio enabled/);
  assert.match(settingsRoute, /Audio disabled/);
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
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );

  assert.equal(summary.settingsStoreFieldsValidated, 10);
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
