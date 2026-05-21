const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function phrase(parts) {
  return parts.join(' ');
}

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-practice-route-copy-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function parseFocusedNativeMockExamCopySummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-sv-native-mock-exam-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused native mock-exam copy validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('native Swedish övningsprov copy guard preserves English mock exam copy', () => {
  const summary = parseFocusedNativeMockExamCopySummary();
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.equal(summary.nativeSwedishMockExamCopyLabelsValidated, 8);
  assert.equal(summary.nativeSwedishMockExamCopyParityValidated, true);
  assert.match(homeSource, /Gå till övningsprov/);
  assert.match(homeSource, /\$\{title\}: gå till övningsprov när steget är klart\./);
  assert.match(practiceSource, /Aldrig en del av övningsprovet\./);
  assert.match(homeSource, /Go to mock exam/);
  assert.match(practiceSource, /Never part of the mock exam\./);
  assert.doesNotMatch(homeSource, /mockprov|mock-provet/i);
  assert.doesNotMatch(practiceSource, /mockprov|mock-provet/i);
});

test('practice route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.equal(summary.practiceRouteCopyLabelsValidated, 70);
  assert.equal(summary.practiceRouteCopyParityValidated, true);
  assert.equal(summary.provenanceAuthorityCopyFilesValidated, 8);
  assert.equal(summary.provenanceAuthorityCopyParityValidated, true);
  assert.match(source, /const practiceCopy: Record<AppLanguage, PracticeCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = practiceCopy\[language\];/);
  assert.match(source, /5-minutersövning/);
  assert.match(source, /const filteredQuestions = useMemo\(/);
  assert.match(
    source,
    /getCompletedQuestionIdsForQuestionBank\(practiceQuestionBank, completedQuestionIds\)/,
  );
  assert.match(source, /<Badge>\{isChallengeMode \? copy\.challengeBadge : copy\.badge\}<\/Badge>/);
  assert.match(source, /copy\.completedQuestions\(visibleCompletedQuestionIds\.length\)/);
  assert.doesNotMatch(source, /copy\.completedQuestions\(completedQuestionIds\.length\)/);
  assert.match(source, /Question \$\{questionNumber\}/);
  assert.match(source, /Fråga \$\{questionNumber\}/);
  assert.match(source, /Close source details/);
  assert.doesNotMatch(source, /Close about-the-sources|about-the-sources/);
  assert.doesNotMatch(source, new RegExp(phrase(['traced', 'directly', 'to', 'UHR']), 'i'));
  assert.doesNotMatch(
    source,
    new RegExp(phrase(['generated', 'from', 'a', 'UHR', 'question']), 'i'),
  );
  assert.doesNotMatch(source, new RegExp(phrase(['kommer', 'direkt', 'från', 'UHR']), 'i'));
  assert.match(source, /Aldrig en del av övningsprovet/);
  assert.doesNotMatch(source, /\bmock\s*-?\s*prov(?:et)?\b/i);
  assert.match(source, /accessibilityLabel=\{copy\.bookmarkAccessibilityLabel\(isBookmarked\)\}/);
  assert.match(source, /\{copy\.scoreLabel\}: \{currentScore\.correct\}\/\{currentScore\.total\}/);
});

test('practice route source wires selected companion copy to answer feedback state', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const companionCard = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/StudyCompanionCard.tsx'),
    'utf8',
  );
  const mascotArtwork = fs.readFileSync(
    path.join(repoRoot, 'components/mascot/MascotArtwork.tsx'),
    'utf8',
  );

  assert.match(source, /import \{ StudyCompanionCard \}/);
  assert.match(source, /import \{ useCompanionStore \}/);
  assert.match(
    source,
    /const selectedCompanionId = useCompanionStore\(\(state\) => state\.selectedId\);/,
  );
  assert.match(
    source,
    /const companionFeedbackState = hasSelectedAnswer[\s\S]*\? selectedIsCorrect[\s\S]*\? 'correct'[\s\S]*: 'incorrect'[\s\S]*: 'neutral';/,
  );
  assert.match(
    source,
    /<StudyCompanionCard[\s\S]*language=\{language\}[\s\S]*mascotId=\{selectedCompanionId\}/,
  );
  assert.match(companionCard, /settingsAccessibilityLabel: 'Change study companion in Settings'/);
  assert.match(companionCard, /settingsAccessibilityLabel: 'Byt studiekompis i Inställningar'/);
  assert.match(companionCard, /href="\/settings"/);
  assert.match(companionCard, /<MascotArtwork[\s\S]*mascotId=\{mascot\.id\}/);
  assert.doesNotMatch(companionCard, /label\.slice\(0,\s*1\)\.toUpperCase\(\)/);
  assert.match(mascotArtwork, /SvgUri/);
  assert.match(mascotArtwork, /study-companion-artwork-\$\{mascotId\}-\$\{expression\}/);
  assert.match(mascotArtwork, /feedbackState === 'correct'[\s\S]*return 'happy'/);
  assert.match(mascotArtwork, /feedbackState === 'incorrect'[\s\S]*return 'oops'/);
  assert.match(mascotArtwork, /return 'idle'/);
  assert.doesNotMatch(source, /selectedCompanionId[\s\S]{0,120}recordAnswer/);
});

test('web aria false-state e2e covers localized Practice control labels', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/web-aria-false-state.spec.ts'),
    'utf8',
  );

  assert.match(source, /const localeCases: PracticeAriaLocaleCase\[\] = \[/);
  assert.match(source, /for \(const labels of localeCases\)/);
  assert.match(source, /seedSettingsLanguage\(page, labels\.language\)/);
  assert.match(source, /page\.getByText\(labels\.questionTitle, \{ exact: true \}\)/);
  assert.match(source, /page\.getByRole\('switch', \{ name: labels\.supplementaryOff \}\)/);
  assert.match(source, /page\.getByRole\('button', \{ name: labels\.aboutSourcesOpen \}\)/);
  assert.match(
    source,
    /aboutSourcesOpen: 'About the sources'[\s\S]*audioEnabled: 'Audio enabled, tap to mute'[\s\S]*language: 'en'[\s\S]*questionTitle: 'Question 1'[\s\S]*supplementaryOff: 'UHR questions only'/,
  );
  assert.match(
    source,
    /aboutSourcesOpen: 'Om källorna'[\s\S]*audioEnabled: 'Ljud är på, tryck för att stänga av'[\s\S]*language: 'sv'[\s\S]*questionTitle: 'Fråga 1'[\s\S]*supplementaryOff: 'Bara UHR-frågor'/,
  );
});

test('practice route coverage keeps hero controls at the touch-target bar', () => {
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/web-aria-false-state.spec.ts'),
    'utf8',
  );

  assert.match(
    practiceSource,
    /accessibilityLabel=\{copy\.bookmarkAccessibilityLabel\(isBookmarked\)\}[\s\S]*?hitSlop=\{space\[1\]\}/,
  );
  assert.match(
    practiceSource,
    /accessibilityRole="switch"[\s\S]*?accessibilityState=\{\{ checked: includeSupplementary \}\}[\s\S]*?hitSlop=\{space\[1\]\}/,
  );
  assert.match(
    practiceSource,
    /accessibilityState=\{\{ expanded: aboutSourcesOpen \}\}[\s\S]*?hitSlop=\{space\[1\]\}/,
  );
  assert.match(practiceSource, /bookmarkButton:\s*\{[\s\S]*?minHeight:\s*space\[6\]/);
  assert.match(practiceSource, /bookmarkButton:\s*\{[\s\S]*?minWidth:\s*space\[6\]/);
  assert.match(practiceSource, /aboutSourcesTrigger:\s*\{[\s\S]*?minHeight:\s*space\[6\]/);
  assert.match(practiceSource, /aboutSourcesTrigger:\s*\{[\s\S]*?minWidth:\s*space\[6\]/);
  assert.match(e2eSource, /async function expectTouchTarget\(locator: Locator\)/);
  assert.match(e2eSource, /toBeGreaterThanOrEqual\(44\)/);
  assert.match(
    e2eSource,
    /await expectTouchTarget\(page\.getByRole\('button', \{ name: labels\.bookmark \}\)\)/,
  );
  assert.match(e2eSource, /await expectTouchTarget\(uhrOnly\)/);
  assert.match(e2eSource, /await expectTouchTarget\(supplementary\)/);
  assert.match(e2eSource, /await expectTouchTarget\(aboutSources\)/);
  assert.match(e2eSource, /await expectTouchTarget\(closeSources\)/);
});

test('practice route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = practiceCopy[language];', 'const copy = practiceCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-route-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice route must select copy from settings language/,
  );
});

test('practice route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Nästa fråga'", "'Next question'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-route-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /practice route is missing sv copy/);
});

test('practice route copy parity rejects raw completed-question counts', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'copy.completedQuestions(visibleCompletedQuestionIds.length)',
        'copy.completedQuestions(completedQuestionIds.length)',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-route-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /completed-question metadata must render localized copy/,
  );
});

test('practice route copy parity rejects stale English source drawer close copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Close source details'", "'Close about-the-sources'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-route-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /source drawer copy must not contain hyphenated about-the-sources/,
  );
});

test('practice route copy parity rejects Swedish mockprov wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Aldrig en del av övningsprovet', 'Aldrig en del av mock-provet');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-sv-native-mock-exam-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice route Swedish native copy must use övningsprov/,
  );
});

test('provenance copy parity rejects positive UHR authority wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const current =
  "Questions written from UHR's study material Sverige i fokus. The mock exam uses only UHR-referenced questions.";
const stale = [
  'Questions traced',
  'directly to',
  "UHR's study material Sverige i fokus. The mock exam is always UHR-only.",
].join(' ');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync.call(this, filePath, ...args).replace(current, stale);
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-route-copy-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /positive provenance authority wording/);
});
