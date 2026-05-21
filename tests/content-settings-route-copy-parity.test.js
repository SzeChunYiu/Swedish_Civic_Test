const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-settings-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('settings route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsRouteCopyLabelsValidated, 112);
  assert.equal(summary.settingsRouteCopyParityValidated, true);
  assert.match(source, /type SettingsCopy =/);
  assert.match(source, /const settingsCopy: Record<AppLanguage, SettingsCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = settingsCopy\[language\];/);
  assert.match(source, /Styr studiespråk, ljud, tema och ditt dagliga mål\./);
  assert.match(source, /Control study language, audio, theme, and your daily goal\./);
  assert.match(source, /Lyssna först/);
  assert.match(source, /Spelar automatiskt upp den svenska frågan och svarsalternativen/);
  assert.match(source, /Listen first/);
  assert.match(source, /Automatically plays the Swedish question and answer options/);
  assert.match(source, /Byt studiespråk till \$\{label\}/);
  assert.match(source, /Set study language to \$\{label\}/);
  assert.match(source, /Studiespråk/);
  assert.match(source, /Study language/);
  assert.match(source, /const label = language === 'sv' \? labelSv : labelEn;/);
  assert.match(source, /renderLanguageButton\('sv', 'Swedish', 'Svenska'\)/);
  assert.match(source, /renderLanguageButton\('en', 'English support', 'Engelskt stöd'\)/);
  assert.match(source, /\$\{count\} repetitionsdagar/);
  assert.match(source, /\$\{count\} repetitionskort/);
  assert.match(source, /\$\{count\} markerade kravområden/);
  assert.match(source, /Studiesvit och svitskydd ingår/);
  assert.match(source, /LOCAL_STUDY_DATA_IMPORT_MAX_BYTES/);
  assert.match(source, /maxLength=\{LOCAL_STUDY_DATA_IMPORT_MAX_BYTES\}/);
  assert.match(source, /högst \$\{localStudyDataImportMaxLabel\}/);
  assert.match(source, /JSON-exporten är större än \$\{localStudyDataImportMaxLabel\}/);
  assert.match(source, /fält för köp i appen eller kvitton/);
  assert.match(source, /Fält: \$\{detail\}/);
  assert.match(source, /data om köp i appen importeras inte/);
  assert.match(source, /\$\{count\} FSRS review days/);
  assert.match(source, /\$\{count\} FSRS review cards/);
  assert.match(source, /\$\{count\} marked requirements checklist items/);
  assert.match(source, /under \$\{localStudyDataImportMaxLabel\}/);
  assert.match(source, /The JSON export is larger than \$\{localStudyDataImportMaxLabel\}/);
  assert.match(source, /Field: \$\{detail\}/);
  assert.match(source, /copy\.importErrorMessage\(result\.code, result\.detail\)/);
  assert.doesNotMatch(
    source,
    /dagar med FSRS-repetition|FSRS-repetitionskort|frysstatus|IAP-fält|IAP-data/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.backToProfileAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.languageAccessibilityLabel\(label\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.setThemeModeAccessibilityLabel\(label\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.setDailyGoalAccessibilityLabel\(goal\)\}/);
  assert.match(source, /const themeMode = useAccessibilityStore\(\(state\) => state\.themeMode\);/);
  assert.match(source, /const accessibilityPersistenceWarning = useAccessibilityStore\(/);
  assert.match(source, /\(state\) => state\.persistenceWarning,/);
  assert.match(
    source,
    /const setThemeMode = useAccessibilityStore\(\(state\) => state\.setThemeMode\);/,
  );
  assert.match(source, /\(state\) => state\.listenFirstAudioEnabled\)?[,)]/);
  assert.match(source, /\(state\) => state\.setListenFirstAudioEnabled,/);
  assert.match(source, /aria-checked=\{listenFirstAudioEnabled\}/);
  assert.match(source, /accessibilityState=\{\{ checked: listenFirstAudioEnabled \}\}/);
  assert.match(
    source,
    /onPress=\{\(\) => setListenFirstAudioEnabled\(!listenFirstAudioEnabled\)\}/,
  );
  assert.match(source, /const clearAccessibilityPersistenceWarning = useAccessibilityStore\(/);
  assert.match(source, /\(state\) => state\.clearPersistenceWarning,/);
  assert.match(source, /warning=\{accessibilityPersistenceWarning\}/);
  assert.match(source, /warningScope="accessibilityPreferences"/);
  assert.match(source, /onDismiss=\{clearAccessibilityPersistenceWarning\}/);
});

test('settings route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = settingsCopy[language];', 'const copy = settingsCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route must select copy from settings language/,
  );
});

test('settings route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Styr studiespråk, ljud, tema och ditt dagliga mål.'", "'Control study language, audio, theme, and your daily goal.'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /settings route is missing sv copy/);
});

test('settings route copy parity rejects hardcoded language button labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("const label = language === 'sv' ? labelSv : labelEn;", 'const label = labelEn;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route language buttons must choose visible labels from settings language/,
  );
});

test('settings route copy parity rejects Swedish import-summary scheduler jargon', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('\${count} repetitionsdagar', '\${count} dagar med FSRS-repetition')
      .replace('\${count} repetitionskort', '\${count} FSRS-repetitionskort')
      .replace('Studiesvit och svitskydd ingår', 'Studiesvit och frysstatus ingår');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route Swedish import summary copy must hide scheduler jargon/,
  );
});

test('settings route copy parity rejects Swedish IAP import jargon', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('fält för köp i appen eller kvitton', 'köp-, kvitto- eller IAP-fält')
      .replace('data om köp i appen importeras inte', 'IAP-data importeras inte');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route Swedish import copy must describe purchases in appen without IAP acronym/,
  );
});

test('settings route copy parity rejects selected-button segmented controls', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replaceAll('accessibilityRole="radio"', 'accessibilityRole="button"')
      .replaceAll('aria-checked=', 'aria-selected=')
      .replaceAll('accessibilityState={{ checked:', 'accessibilityState={{ selected:');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-parity');require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route language and daily-goal options must use radio semantics|must not use aria-selected/,
  );
});
