const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const QUESTION_DISCLAIMER_FOCUS_FLAG = '--focus-question-disclaimer-parity';
const expectedQuestionDisclaimerRoutes = [
  'app/onboarding.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/review.tsx',
  'app/chapter/[chapterId].tsx',
  'app/quiz/[sessionId].tsx',
];
const supplementalDisclaimerRoutes = ['app/(tabs)/learn.tsx'];
const expectedDisclaimerCounts = new Map([
  ['app/onboarding.tsx', 1],
  ['app/(tabs)/learn.tsx', 1],
  ['app/(tabs)/practice.tsx', 1],
  ['app/(tabs)/exam.tsx', 3],
  ['app/(tabs)/mistakes.tsx', 1],
  ['app/review.tsx', 1],
  ['app/chapter/[chapterId].tsx', 1],
  ['app/quiz/[sessionId].tsx', 1],
]);
const expectedQuestionCardRoutes = [
  'app/(tabs)/practice.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/review.tsx',
  'app/quiz/[sessionId].tsx',
];

function countQuestionDisclaimerOccurrences(source) {
  return (source.match(/<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/g) || []).length;
}

test('question disclaimer coverage stays aligned across study surfaces', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', QUESTION_DISCLAIMER_FOCUS_FLAG],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const disclaimerSource = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
    'utf8',
  );

  assert.equal(summary.questionDisclaimerRoutesValidated, expectedQuestionDisclaimerRoutes.length);
  assert.equal(summary.questionDisclaimerCopyValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
  assert.match(disclaimerSource, /useSettingsStore/);
  assert.match(disclaimerSource, /Oberoende studieverktyg/);
  assert.match(disclaimerSource, /inte riktiga provfrågor/);
  assert.match(disclaimerSource, /Independent study tool/);
  assert.match(disclaimerSource, /Not official/);
  assert.match(disclaimerSource, /not real exam questions/);

  for (const routeFile of [...expectedQuestionDisclaimerRoutes, ...supplementalDisclaimerRoutes]) {
    const source = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
    assert.match(source, /QuestionDisclaimer/);
    assert.match(source, /<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/);
    assert.equal(
      countQuestionDisclaimerOccurrences(source),
      expectedDisclaimerCounts.get(routeFile),
      `${routeFile} should keep disclaimer coverage for each question-bearing branch`,
    );
  }
});

test('question disclaimer stays separate from source citation rendering', () => {
  const disclaimerSource = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
    'utf8',
  );
  const questionCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/QuestionCard.tsx'),
    'utf8',
  );

  assert.doesNotMatch(disclaimerSource, /getQuestionSourceCitation|Källa\/Source|Source citation/);
  assert.doesNotMatch(disclaimerSource, /uhrReference|UHRReferenceCard/);
  assert.doesNotMatch(questionCardSource, /QuestionDisclaimer/);

  for (const routeFile of expectedQuestionCardRoutes) {
    const source = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
    assert.ok(
      source.search(/<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/) <
        source.indexOf('<QuestionCard'),
      `${routeFile} should show the independent-study disclaimer before question cards`,
    );
  }

  const chapterSource = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  assert.match(
    chapterSource,
    /const renderListHeader = \(\) => \([\s\S]*<QuestionDisclaimer \/>[\s\S]*\);/,
    'app/chapter/[chapterId].tsx should render the disclaimer from the FlatList header',
  );
  assert.match(
    chapterSource,
    /const renderQuestionItem:[\s\S]*<QuestionCard question=\{question\} language=\{language\} \/>/,
    'app/chapter/[chapterId].tsx should render question cards from the item renderer',
  );
  assert.match(
    chapterSource,
    /ListHeaderComponent=\{renderListHeader\}/,
    'app/chapter/[chapterId].tsx should pass the disclaimer header to FlatList before items',
  );
  assert.match(
    chapterSource,
    /renderItem=\{renderQuestionItem\}/,
    'app/chapter/[chapterId].tsx should keep question cards in the FlatList item renderer',
  );

  const learnSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  assert.ok(
    learnSource.search(/<QuestionDisclaimer(?:\s+language=\{language\})?\s*\/>/) <
      learnSource.indexOf('<View style={styles.flashcardDeck}>'),
    'app/(tabs)/learn.tsx should show the independent-study disclaimer before flashcards',
  );
});

test('question disclaimer parity rejects a study surface without the disclaimer', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<QuestionDisclaimer language={language} />', '<></>');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${QUESTION_DISCLAIMER_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /app\/quiz\/\[sessionId\]\.tsx is missing/);
});

test('question disclaimer parity rejects weakened non-official copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionDisclaimer.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Not official', 'Unofficial');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${QUESTION_DISCLAIMER_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /QuestionDisclaimer missing required/);
});
