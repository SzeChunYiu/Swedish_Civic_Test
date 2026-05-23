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

function extractPracticeRouteLaunchNormalizerSource(practiceSource) {
  const match = practiceSource.match(
    /function normalizePracticeRouteLaunchMode\([\s\S]*?\n\}/,
  );
  assert.ok(match, 'Practice route must define normalizePracticeRouteLaunchMode');
  return match[0];
}

function assertPracticeRouteLaunchParity(practiceSource, homeSource) {
  const requiredPracticeRules = [
    [/import \{ useEffect, useMemo, useRef, useState \} from 'react';/, 'route launch ref import'],
    [/import \{ Link, useLocalSearchParams \} from 'expo-router';/, 'route search params import'],
    [/import \{ buildDailyChallenge \}/, 'daily challenge selector import'],
    [/type PracticeRouteLaunchMode = 'challenge' \| 'quick';/, 'route launch mode type'],
    [/\| \{ type: 'challenge'; questionIds: string\[\] \};/, 'challenge practice scope'],
    [/function normalizePracticeRouteLaunchMode\(/, 'route launch mode normalizer'],
    [/rawValue === 'challenge' \|\| rawValue === 'quick'/, 'accepted launch modes'],
    [
      /const \{ mode \} = useLocalSearchParams<\{ mode\?: string \| string\[\] \}>/,
      'route mode read',
    ],
    [
      /const consumedRouteLaunchModeRef = useRef<PracticeRouteLaunchMode \| null>\(null\);/,
      'route launch idempotency ref',
    ],
    [/buildDailyChallenge\(\{ bank: filteredQuestions \}\)/, 'filtered daily challenge bank'],
    [/const routeLaunchMode = normalizePracticeRouteLaunchMode\(mode\);/, 'normalized route mode'],
    [
      /if \(!routeLaunchMode \|\| consumedRouteLaunchModeRef\.current === routeLaunchMode\) return;/,
      'route launch idempotency guard',
    ],
    [/routeLaunchMode === 'challenge'/, 'challenge mode branch'],
    [/type: 'challenge', questionIds: dailyChallenge\.questionIds/, 'challenge scope ids'],
    [/\{ type: 'quick', limit: 10 \}/, 'quick route scope'],
    [
      /const nextQuestionBank = getQuestionsForPracticeScope\(filteredQuestions, nextScope\);/,
      'route launch uses scoped bank',
    ],
    [/consumedRouteLaunchModeRef\.current = routeLaunchMode;/, 'route launch consumed marker'],
    [
      /startSession\(nextQuestionBank\[0\]\?\.id \?\? null\);/,
      'route launch starts first scoped question',
    ],
    [/setPracticeScope\(nextScope\);/, 'route launch enters practice mode'],
  ];

  for (const [pattern, label] of requiredPracticeRules) {
    assert.match(practiceSource, pattern, `Practice route missing ${label}`);
  }

  assert.match(
    homeSource,
    /href="\/practice\?mode=challenge"/,
    'Home daily challenge CTA should deep-link into the challenge practice mode',
  );
}

test('practice route launch normalizer accepts quick and challenge but rejects invalid mode aliases', () => {
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const normalizerSource = extractPracticeRouteLaunchNormalizerSource(practiceSource);

  assert.match(
    practiceSource,
    /type PracticeRouteLaunchMode = 'challenge' \| 'quick';/,
    'Practice route launch mode type should only include supported route modes',
  );
  assert.match(
    normalizerSource,
    /value: string \| string\[\] \| undefined/,
    'Practice route normalizer should cover Expo string, array, and empty route values',
  );
  assert.match(
    normalizerSource,
    /const rawValue = Array\.isArray\(value\) \? value\[0\] : value;/,
    'Practice route normalizer should use the first array query param value',
  );
  assert.match(
    normalizerSource,
    /return rawValue === 'challenge' \|\| rawValue === 'quick' \? rawValue : null;/,
    'Practice route normalizer should only accept challenge and quick',
  );
  assert.doesNotMatch(
    normalizerSource,
    /\breview\b/,
    'Practice route normalizer must reject stale review aliases',
  );
  assert.doesNotMatch(
    normalizerSource,
    /includes\(|\.some\(|value\[(?!0\])/,
    'Practice route normalizer must not accept broader mode lists or stale array fallbacks',
  );
});

test('native Swedish övningsprov copy guard preserves English mock exam copy', () => {
  const summary = parseFocusedNativeMockExamCopySummary();
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.equal(summary.nativeMockExamComponentCopyLabelsValidated, 6);
  assert.equal(summary.nativeMockExamComponentLegalCopyValidated, true);
  assert.equal(summary.nativeMockExamScoreSourceCopyValidated, true);
  assert.equal(summary.nativeMockExamLibraryLabelsValidated, 7);
  assert.equal(summary.nativeMockExamSwedishCopyNaturalnessValidated, true);
  assert.equal(summary.nativeMockExamTierCopyValidated, true);
  assert.match(homeSource, /Gå till övningsprov/);
  assert.match(homeSource, /\$\{title\}: gå till övningsprovet när steget är klart\./);
  assert.match(practiceSource, /Aldrig en del av övningsprovet\./);
  assert.match(homeSource, /Go to mock exam/);
  assert.match(practiceSource, /Never part of the mock exam\./);
  assert.doesNotMatch(homeSource, /mockprov|mock-provet/i);
  assert.doesNotMatch(practiceSource, /mockprov|mock-provet/i);
});

test('practice route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.equal(summary.practiceRouteCopyLabelsValidated, 76);
  assert.equal(summary.practiceRouteCopyParityValidated, true);
  assert.equal(summary.provenanceAuthorityCopyFilesValidated, 8);
  assert.equal(summary.provenanceAuthorityCopyParityValidated, true);
  assert.match(source, /const practiceCopy: Record<AppLanguage, PracticeCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = practiceCopy\[language\];/);
  assert.match(source, /5-minutersövning/);
  assert.match(source, /const filteredQuestions = useMemo\(/);
  assert.match(source, /import \{ explainAdaptivePick \}/);
  assert.match(
    source,
    /const answeredQuestionIds = usePracticeSessionStore\(\(state\) => state\.answeredQuestionIds\);/,
  );
  assert.match(source, /buildAdaptivePracticeProgress\(questionProgress, answerHistory\)/);
  assert.match(
    source,
    /getAvailableQuestionsForPracticeSession\(practiceQuestionBank, answeredQuestionIds\)/,
  );
  assert.match(source, /explainAdaptivePick\(\{[\s\S]*bank: adaptiveSummaryQuestionBank/);
  assert.match(source, /accessibilityLabel=\{adaptiveSummaryAccessibilityLabel\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /nativeID="practice-adaptive-summary-status"/);
  assert.match(source, /\{copy\.adaptiveSummaryTitle\}/);
  assert.match(source, /\{adaptiveSummaryText\}/);
  assert.match(
    source,
    /getCompletedQuestionIdsForQuestionBank\(practiceQuestionBank, completedQuestionIds\)/,
  );
  assert.match(source, /const handleSupplementaryToggle = \(\) => \{/);
  assert.match(source, /const nextIncludeSupplementary = !includeSupplementary;/);
  assert.match(
    source,
    /const nextFilteredQuestions = filterQuestionsByProvenance\(questions, \{[\s\S]*?includeSupplementary: nextIncludeSupplementary,[\s\S]*?\}\);/,
  );
  assert.match(
    source,
    /const nextQuestionBank = getQuestionsForPracticeScope\(nextFilteredQuestions, practiceScope\);/,
  );
  assert.match(
    source,
    /const nextQuestion = getPracticeQuestionForSession\(\s*nextQuestionBank,\s*completedQuestionIds,\s*null,\s*\);/,
  );
  assert.match(source, /startSession\(nextQuestion\?\.id \?\? null\);/);
  assert.match(source, /onPress=\{handleSupplementaryToggle\}/);
  assert.doesNotMatch(
    source,
    /onPress=\{\(\) => setIncludeSupplementary\(!includeSupplementary\)\}/,
  );
  assert.match(source, /<Badge>\{copy\.badge\}<\/Badge>/);
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
  assert.match(source, /aria-pressed=\{isBookmarked\}/);
  assert.doesNotMatch(source, /aria-selected=\{isBookmarked\}/);
  assert.match(source, /accessibilityState=\{bookmarkAccessibilityState\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
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
  assert.match(companionCard, /href="\/settings\?focus=companion"/);
  assert.match(companionCard, /<MascotArtwork[\s\S]*mascotId=\{mascot\.id\}/);
  assert.doesNotMatch(companionCard, /label\.slice\(0,\s*1\)\.toUpperCase\(\)/);
  assert.match(mascotArtwork, /SvgUri/);
  assert.match(mascotArtwork, /study-companion-artwork-\$\{mascotId\}-\$\{expression\}/);
  assert.match(mascotArtwork, /feedbackState === 'correct'[\s\S]*return 'happy'/);
  assert.match(mascotArtwork, /feedbackState === 'incorrect'[\s\S]*return 'oops'/);
  assert.match(mascotArtwork, /return 'idle'/);
  assert.doesNotMatch(source, /selectedCompanionId[\s\S]{0,120}recordAnswer/);
});

test('practice route bookmark uses web pressed toggle semantics', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.match(source, /import \{ Platform, Pressable, ScrollView, StyleSheet, Text, View \}/);
  assert.match(source, /aria-pressed=\{isBookmarked\}/);
  assert.doesNotMatch(source, /aria-selected=\{isBookmarked\}/);
  assert.match(
    source,
    /const bookmarkAccessibilityState =\s*Platform\.OS === 'web' \? undefined : \{ selected: isBookmarked \};/,
  );
  assert.match(source, /accessibilityState=\{bookmarkAccessibilityState\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected: isBookmarked \}\}/);
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

test('practice bookmark e2e covers reload persistence without selected state', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/practice-header-controls.spec.ts'),
    'utf8',
  );

  assert.match(source, /practice bookmark pressed state persists after reload and unbookmark/);
  assert.match(source, /await page\.reload\(\{ waitUntil: 'networkidle' \}\);/);
  assert.match(source, /Remove this question bookmark/);
  assert.match(source, /Persisted bookmark control/);
  assert.match(source, /Persisted cleared bookmark control/);
  assert.match(source, /toHaveAttribute\('aria-pressed', 'true'\)/);
  assert.match(source, /toHaveAttribute\('aria-pressed', 'false'\)/);
  assert.match(source, /not\.toHaveAttribute\('aria-selected'\)/);
  assert.match(source, /page\.getByText\('Bookmarked', \{ exact: true \}\)\)\.toHaveCount\(0\)/);
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
    /const bookmark = page\.getByRole\('button', \{ name: labels\.bookmark \}\);[\s\S]*await expectTouchTarget\(bookmark\);/,
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
    /source drawer copy must not contain hyphenated about-the-sources|practice route is missing en copy "Close source details"/,
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
    /practice route Swedish native copy must use övningsprov|practice route is missing sv copy/,
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
