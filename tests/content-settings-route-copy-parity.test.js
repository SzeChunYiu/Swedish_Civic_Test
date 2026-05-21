const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-settings-route'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function assertIncludes(source, text, context) {
  assert.ok(source.includes(text), `${context} must include ${text}`);
}

test('settings route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsRouteCopyLabelsValidated, 123);
  assert.equal(summary.settingsRouteCopyParityValidated, true);
  assert.match(source, /import \{ useLocalSearchParams \} from 'expo-router';/);
  assert.match(source, /const \{ focus \} = useLocalSearchParams<\{ focus\?: string \}>\(\);/);
  assert.match(source, /const studyFocusActive = focus === 'study';/);
  assert.match(source, /studyControlsTitle: 'Dagligt mål, språk och ljud'/);
  assert.match(source, /studyControlsTitle: 'Daily goal, language, and audio'/);
  assert.match(
    source,
    /studyControlsFocusLabel: 'Studieinställningarna från profilen är markerade här\.'/,
  );
  assert.match(
    source,
    /studyControlsFocusLabel: 'The study setup controls from Profile are highlighted here\.'/,
  );
  assert.match(source, /nativeID="study-settings-controls"/);
  assert.match(source, /testID="study-settings-controls"/);
  assert.match(source, /studyFocusActive \? styles\.studyControlsGroupFocused : null/);
  assert.match(source, /\{studyFocusActive \? \(/);
  assert.match(source, /\{copy\.studyControlsFocusLabel\}/);
  assert.match(source, /type SettingsCopy =/);
  assert.match(source, /const settingsCopy: Record<AppLanguage, SettingsCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = settingsCopy\[language\];/);
  assert.match(source, /Styr studiespråk, ljud, tema, studiekompis och ditt dagliga mål\./);
  assert.match(
    source,
    /Control study language, audio, theme, study companion, and your daily goal\./,
  );
  assert.match(
    source,
    /import \{ CompanionPicker \} from '\.\.\/components\/mascot\/CompanionPicker';/,
  );
  assert.match(source, /import \{ useCompanionStore \} from '\.\.\/lib\/storage\/companionStore';/);
  assert.match(source, /Välj en studiekompis för övningen/);
  assert.match(source, /Choose a study companion for practice/);
  assert.match(source, /selectedId=\{selectedCompanionId\}/);
  assert.match(source, /onSelect=\{setSelectedCompanion\}/);
  assert.match(source, /Byt studiespråk till \$\{label\}/);
  assert.match(source, /Set study language to \$\{label\}/);
  assert.match(source, /Studiespråk/);
  assert.match(source, /Study language/);
  assert.match(source, /const label = language === 'sv' \? labelSv : labelEn;/);
  assert.match(source, /renderLanguageButton\('sv', 'Swedish', 'Svenska'\)/);
  assert.match(source, /renderLanguageButton\('en', 'English support', 'Engelskt stöd'\)/);
  assert.match(source, /one: 'repetitionsdag'/);
  assert.match(source, /other: 'repetitionsdagar'/);
  assert.match(source, /one: 'repetitionskort'/);
  assert.match(source, /other: 'repetitionskort'/);
  assert.match(source, /one: 'genomfört övningsprov'/);
  assert.match(source, /other: 'genomförda övningsprov'/);
  assert.match(source, /one: 'markerat kravområde'/);
  assert.match(source, /other: 'markerade kravområden'/);
  assert.match(source, /Studiesvit och svitskydd ingår/);
  assert.match(source, /one: 'FSRS review day'/);
  assert.match(source, /other: 'FSRS review days'/);
  assert.match(source, /one: 'FSRS review card'/);
  assert.match(source, /other: 'FSRS review cards'/);
  assert.match(source, /one: 'completed mock exam'/);
  assert.match(source, /other: 'completed mock exams'/);
  assert.doesNotMatch(source, /dagar med FSRS-repetition|FSRS-repetitionskort|frysstatus/);
  assert.match(source, /accessibilityLabel=\{copy\.backToProfileAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.languageAccessibilityLabel\(label\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.setThemeModeAccessibilityLabel\(label\)\}/);
  assert.match(
    source,
    /const renderThemeButton = \(value: ThemeMode, label: string\) => \{[\s\S]*aria-checked=\{selected\}[\s\S]*accessibilityRole="radio"[\s\S]*accessibilityState=\{\{ checked: selected \}\}/,
  );
  assert.match(
    source,
    /aria-label=\{copy\.themeModeTitle\}[\s\S]*accessibilityLabel=\{copy\.themeModeTitle\}[\s\S]*accessibilityRole="radiogroup"[\s\S]*\{themeOptions\.map/,
  );
  assert.doesNotMatch(
    source,
    /aria-selected=\{selected\}|accessibilityState=\{\{\s*selected(?::\s*selected)?\s*\}\}/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.setDailyGoalAccessibilityLabel\(goal\)\}/);
  assert.match(source, /const themeMode = useAccessibilityStore\(\(state\) => state\.themeMode\);/);
  assert.match(
    source,
    /const setThemeMode = useAccessibilityStore\(\(state\) => state\.setThemeMode\);/,
  );
});

test('settings import summary copy keeps singular and plural labels for bookmark wrong-answer mock exam FSRS and citizenship rows', () => {
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/settings-import-confirm-apply.spec.ts'),
    'utf8',
  );
  const labelSnippets = [
    "one: 'fråga med sparad progression'",
    "other: 'frågor med sparad progression'",
    "one: 'bokmärke'",
    "other: 'bokmärken'",
    "one: 'granskning av fel svar'",
    "other: 'granskningar av fel svar'",
    "one: 'genomfört övningsprov'",
    "other: 'genomförda övningsprov'",
    "one: 'repetitionskort'",
    "other: 'repetitionskort'",
    "one: 'repetitionsdag'",
    "other: 'repetitionsdagar'",
    "one: 'sparad inställning'",
    "other: 'sparade inställningar'",
    "one: 'markerat kravområde'",
    "other: 'markerade kravområden'",
    "one: 'question with saved progress'",
    "other: 'questions with saved progress'",
    "one: 'bookmark'",
    "other: 'bookmarks'",
    "one: 'wrong-answer review'",
    "other: 'wrong-answer reviews'",
    "one: 'completed mock exam'",
    "other: 'completed mock exams'",
    "one: 'FSRS review card'",
    "other: 'FSRS review cards'",
    "one: 'FSRS review day'",
    "other: 'FSRS review days'",
    "one: 'saved setting'",
    "other: 'saved settings'",
    "one: 'marked requirement'",
    "other: 'marked requirements'",
  ];
  const pluralPreviewRows = [
    '3 frågor med sparad progression',
    '2 bokmärken',
    '2 granskningar av fel svar',
    '2 genomförda övningsprov',
    '2 repetitionskort',
    '2 repetitionsdagar',
    '5 sparade inställningar',
    '3 markerade kravområden',
    '3 questions with saved progress',
    '2 bookmarks',
    '2 wrong-answer reviews',
    '2 completed mock exams',
    '2 FSRS review cards',
    '2 FSRS review days',
    '5 saved settings',
    '3 marked requirements',
  ];
  const singularPreviewRows = [
    '1 bokmärke',
    '1 granskning av fel svar',
    '1 genomfört övningsprov',
    '1 repetitionskort',
    '1 repetitionsdag',
    '1 bookmark',
    '1 wrong-answer review',
    '1 completed mock exam',
    '1 FSRS review card',
    '1 FSRS review day',
  ];

  for (const snippet of labelSnippets) {
    assertIncludes(settingsSource, snippet, 'settings import summary copy');
  }
  for (const row of [...pluralPreviewRows, ...singularPreviewRows]) {
    assertIncludes(e2eSource, row, 'settings import E2E preview assertions');
  }
  assertIncludes(e2eSource, "name: 'plural'", 'settings import E2E payload cases');
});

test('settings import reset coverage proves no-write preview and feedback clearing', () => {
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/settings-import-confirm-apply.spec.ts'),
    'utf8',
  );

  assert.match(
    settingsSource,
    /const handleResetImport = \(\) => \{[\s\S]*setImportText\(''\);[\s\S]*setImportPreview\(null\);[\s\S]*setImportFeedback\(null\);[\s\S]*\};/,
    'Settings reset handler must clear text, preview, and feedback state',
  );
  assertIncludes(settingsSource, "importReset: 'Återställ importfält'", 'settings reset copy');
  assertIncludes(settingsSource, "importReset: 'Reset import field'", 'settings reset copy');
  assertIncludes(e2eSource, "resetName: 'Återställ importfält'", 'settings reset E2E labels');
  assertIncludes(e2eSource, "resetName: 'Reset import field'", 'settings reset E2E labels');
  assertIncludes(e2eSource, 'expectImportFormCleared', 'settings reset E2E clearing helper');
  assertIncludes(e2eSource, 'JSON kunde inte läsas.', 'settings reset E2E error feedback');
  assertIncludes(e2eSource, 'JSON could not be read.', 'settings reset E2E error feedback');
  assertIncludes(
    e2eSource,
    'settings import reset clears preview and feedback without writes',
    'settings reset E2E test',
  );
  assertIncludes(
    e2eSource,
    'await expectNoImportApplied(page, scenario.language);',
    'settings reset E2E no-write assertions',
  );
});

test('settings import rejected purchase-field alerts include bounded field detail', () => {
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/settings-import-deep-nesting.spec.ts'),
    'utf8',
  );

  assertIncludes(
    settingsSource,
    'formatLocalStudyDataImportErrorDetail',
    'settings import detail formatter import',
  );
  assertIncludes(
    settingsSource,
    'importErrorMessage: (code: LocalStudyDataImportErrorCode, detail?: string) => string',
    'settings import error message detail signature',
  );
  assertIncludes(settingsSource, 'fieldLabel: string', 'settings import field label helper');
  assertIncludes(settingsSource, "'Fält'", 'settings import Swedish field label');
  assertIncludes(settingsSource, "'Field'", 'settings import English field label');
  assertIncludes(
    settingsSource,
    'copy.importErrorMessage(result.code, result.detail)',
    'settings import preview must pass rejected field detail',
  );
  assertIncludes(
    e2eSource,
    "await expect(alert).toContainText('Fält: source.level0.level1.[...]');",
    'settings deep import E2E bounded head detail',
  );
  assertIncludes(
    e2eSource,
    "await expect(alert).toContainText('level479.removeAdsReceipt');",
    'settings deep import E2E final forbidden key',
  );
  assertIncludes(
    e2eSource,
    "await expect(alert).toContainText('Field: source.level0.level1.[...]');",
    'settings deep import E2E English bounded head detail',
  );
  assertIncludes(
    e2eSource,
    "await expect(alert).not.toContainText('level2.level3.level4');",
    'settings deep import E2E middle path truncation',
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
      .replace("one: 'repetitionsdag'", "one: 'dag med FSRS-repetition'")
      .replace("other: 'repetitionsdagar'", "other: 'dagar med FSRS-repetition'")
      .replace("one: 'repetitionskort'", "one: 'FSRS-repetitionskort'")
      .replace('Studiesvit och svitskydd ingår', 'Studiesvit och frysstatus ingår');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-route');
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
process.argv.push('--focus-settings-route');
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
      .replace("'Styr studiespråk, ljud, tema, studiekompis och ditt dagliga mål.'", "'Control study language, audio, theme, study companion, and your daily goal.'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-route');
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
process.argv.push('--focus-settings-route');
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

test('settings route copy parity rejects theme selected-button semantics', () => {
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
      .replace('aria-checked={selected}', 'aria-selected={selected}')
      .replace('accessibilityState={{ checked: selected }}', 'accessibilityState={{ selected }}');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-route');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route theme-mode options must use radio checked semantics/,
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
process.argv.push('--focus-settings-route');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route language and daily-goal options must use radio semantics|settings route theme-mode options must use radio checked semantics|must not use aria-selected/,
  );
});
