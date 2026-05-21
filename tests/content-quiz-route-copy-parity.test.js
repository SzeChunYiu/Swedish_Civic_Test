const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-native-quiz-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('routed quiz shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');
  const searchSource = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');
  const backToPracticeLinks =
    source.match(
      /<Link\b[\s\S]*?accessibilityLabel=\{copy\.backToPracticeAccessibilityLabel\}[\s\S]*?<\/Link>/g,
    ) ?? [];

  assert.equal(summary.quizRouteCopyLabelsValidated, 20);
  assert.equal(summary.quizRouteCopyParityValidated, true);
  assert.match(source, /const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = quizSessionCopy\[language\];/);
  assert.match(
    source,
    /getChapterContextForQuizSession\(chapters, pickedQuestion, normalizedChapterId\)/,
  );
  assert.match(source, /chapterId\?: string \| string\[\];/);
  assert.match(source, /Frågan hittades inte/);
  assert.match(source, /Vi hittar ingen övningsfråga för den här länken\./);
  assert.match(source, /Sök övningsfrågor/);
  assert.match(source, /Question not found/);
  assert.match(source, /We could not find a practice question for this link\./);
  assert.match(source, /q\?: string \| string\[\];/);
  assert.match(source, /query\?: string \| string\[\];/);
  assert.match(source, /const backToSearchHref = getBackToSearchHref\(returnSearchQuery\);/);
  assert.match(source, /href=\{backToSearchHref\}/);
  assert.match(source, /return `\/search\?q=\$\{encodeURIComponent\(searchQuery\)\}` as Href;/);
  assert.equal(backToPracticeLinks.length, 3);
  for (const backToPracticeLink of backToPracticeLinks) {
    assert.match(backToPracticeLink, /href="\/practice"/);
    assert.match(backToPracticeLink, /\bdismissTo\b|\breplace\b/);
  }
  assert.match(source, /Tillbaka till övning/);
  assert.match(source, /Back to Practice/);
  assert.match(source, /Session \$\{currentSessionId\}/);
  assert.match(source, /Frågepass \$\{currentSessionId\}/);
  assert.match(source, /Quiz session: \$\{chapterTitle\}/);
  assert.match(source, /Frågepass: \$\{chapterTitle\}/);
  assert.match(source, /\{sessionTitle\}/);
  assert.match(source, /\{sessionSubtitle\}/);
  assert.match(source, /Försök igen med den här frågan/);
  assert.match(source, /Try this quiz question again/);
  assert.match(searchSource, /function getQuestionResultHref\(questionId: string, query: string\)/);
  assert.match(
    searchSource,
    /`\/quiz\/\$\{questionId\}\?q=\$\{encodeURIComponent\(trimmedQuery\)\}`/,
  );
  assert.match(
    searchSource,
    /href=\{getQuestionResultHref\(result\.question\.id, trimmedQuery\)\}/,
  );
  assert.doesNotMatch(
    source,
    new RegExp(
      ['Starta ' + 'quiz', 'Quiz' + 'pass', 'quiz' + 'frågor', 'quiz' + 'frågan'].join('|'),
    ),
  );
  assert.match(source, /<QuestionDisclaimer language=\{language\} \/>/);
  assert.match(source, /<QuestionCard question=\{question\} language=\{language\} \/>/);
  assert.match(source, /<UHRReferenceCard language=\{language\}/);
  assert.match(source, /return exactMatch;/);
  assert.doesNotMatch(source, /stableIndex|charCodeAt|return\s+questions\[/);
});

test('native routed Swedish study copy avoids learner-facing quiz loanwords', () => {
  const sources = [
    'app/chapter/[chapterId].tsx',
    'app/quiz/[sessionId].tsx',
    'scripts/validate-content.js',
    'tests/content-chapter-route-header-parity.test.js',
    'tests/content-quiz-route-copy-parity.test.js',
  ]
    .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
    .join('\n');
  const bannedSwedishLearnerCopy = [
    new RegExp(['Starta', 'quiz'].join(' ')),
    new RegExp(['Quiz', 'pass'].join('')),
    new RegExp(['quiz', 'frågor'].join('')),
    new RegExp(['quiz', 'frågan'].join('')),
  ];

  for (const pattern of bannedSwedishLearnerCopy) {
    assert.doesNotMatch(sources, pattern);
  }
  assert.match(sources, /Starta frågepass/);
  assert.match(sources, /Frågepass/);
  assert.match(sources, /övningsfrågor/);
  assert.match(sources, /övningsfrågan/);
});

test('routed quiz copy parity rejects bypassing the settings language', () => {
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
      .replace('const copy = quizSessionCopy[language];', 'const copy = quizSessionCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /quiz route must select copy from settings language/,
  );
});

test('routed quiz copy parity rejects missing Swedish shell copy', () => {
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
      .replace(
        "'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.'",
        "'Answer the routed question, then review the source-backed feedback.'",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /quiz route is missing sv copy/);
});

test('routed quiz copy parity rejects hashing unknown session ids to questions', () => {
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
      .replace(
        '  return exactMatch;\\n}',
        '  if (exactMatch || questions.length === 0) return exactMatch;\\n\\n  const stableIndex =\\n    [...sessionId].reduce((total, character) => total + character.charCodeAt(0), 0) %\\n    questions.length;\\n\\n  return questions[stableIndex];\\n}',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /routed quiz must not hash unknown session ids into real questions/,
  );
});

test('routed quiz copy parity rejects Swedish quiz loanwords', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const oldPass = ['Quiz', 'pass'].join('');
const oldQuestionList = ['quiz', 'frågor'].join('');
const oldQuestion = ['quiz', 'frågan'].join('');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Frågepass'", "'" + oldPass + "'")
      .replace("'Det finns inga övningsfrågor ännu.'", "'Det finns inga " + oldQuestionList + " ännu.'")
      .replace("\`Frågepass \${currentSessionId}\`", "\`" + oldPass + " \${currentSessionId}\`")
      .replace("'Försök igen med den här frågan'", "'Försök igen med den här " + oldQuestion + "'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /quiz route Swedish copy must avoid English quiz loanwords/,
  );
});

test('routed quiz copy parity rejects dropping chapter route context', () => {
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
      .replace(
        'getChapterContextForQuizSession(chapters, pickedQuestion, normalizedChapterId)',
        'null',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /quiz route must resolve chapter context from the routed question/,
  );
});

test('routed quiz copy parity rejects missing localized disclaimer wiring', () => {
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
      .replace('<QuestionDisclaimer language={language} />', '<QuestionDisclaimer />');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-native-quiz-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /routed quiz disclaimer must receive settings language/,
  );
});
