const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('settings route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsRouteCopyLabelsValidated, 84);
  assert.equal(summary.settingsRouteCopyParityValidated, true);
  assert.match(source, /type SettingsCopy =/);
  assert.match(source, /const settingsCopy: Record<AppLanguage, SettingsCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = settingsCopy\[language\];/);
  assert.match(source, /Styr studiespråk, ljud och ditt dagliga mål\./);
  assert.match(source, /Control study language, audio, and your daily goal\./);
  assert.match(source, /const label = language === 'sv' \? labelSv : labelEn;/);
  assert.match(source, /renderLanguageButton\('sv', 'Swedish', 'Svenska'\)/);
  assert.match(source, /renderLanguageButton\('en', 'English support', 'Engelskt stöd'\)/);
  assert.match(source, /accessibilityLabel=\{copy\.backToProfileAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.languageAccessibilityLabel\(label\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.setDailyGoalAccessibilityLabel\(goal\)\}/);
  assert.equal(source.match(/accessibilityRole="radiogroup"/g)?.length, 2);
  assert.equal(source.match(/accessibilityRole="radio"/g)?.length, 2);
  assert.match(source, /aria-label=\{copy\.questionLanguageTitle\}/);
  assert.match(source, /aria-label=\{copy\.dailyGoalTitle\}/);
  assert.match(source, /aria-checked=\{language === value\}/);
  assert.match(source, /aria-checked=\{dailyGoalAnswers === goal\}/);
  assert.match(source, /accessibilityState=\{\{ checked: language === value \}\}/);
  assert.match(source, /accessibilityState=\{\{ checked: dailyGoalAnswers === goal \}\}/);
  assert.match(source, /previewLocalStudyDataImport\(importText\)/);
  assert.match(source, /applyLocalStudyDataImport\(result\.preview\)/);
  assert.match(source, /Importera studiedata/);
  assert.match(source, /Import study data/);
  assert.match(source, /Köp, kvitton och IAP-data importeras inte/);
  assert.match(source, /Purchases, receipts, and IAP data are not imported/);
  assert.match(source, /accessibilityLabel=\{copy\.importPasteLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.confirmImportAccessibilityLabel\}/);
  assert.doesNotMatch(source, /aria-selected=\{language === value\}/);
  assert.doesNotMatch(source, /aria-selected=\{dailyGoalAnswers === goal\}/);
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
require('./scripts/validate-content.js');
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
      .replace("'Styr studiespråk, ljud och ditt dagliga mål.'", "'Control study language, audio, and your daily goal.'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
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
require('./scripts/validate-content.js');
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
require('./scripts/validate-content.js');
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
