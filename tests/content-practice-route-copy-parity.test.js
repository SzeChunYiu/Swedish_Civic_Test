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

test('practice route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.equal(summary.practiceRouteCopyLabelsValidated, 92);
  assert.equal(summary.practiceRouteCopyParityValidated, true);
  assert.match(source, /const practiceCopy: Record<AppLanguage, PracticeCopy> = \{/);
  assert.match(source, /type PracticeScope/);
  assert.match(source, /const QUICK_ROUND_SIZE = 10;/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = practiceCopy\[language\];/);
  assert.match(source, /const \[practiceStarted, setPracticeStarted\]/);
  assert.match(source, /5-minutersövning/);
  assert.match(source, /Övningsnav/);
  assert.match(source, /Practice hub/);
  assert.match(source, /href="\/exam"/);
  assert.match(source, /getQuestionsForPracticeScope\(/);
  assert.match(
    source,
    /getCompletedQuestionIdsForQuestionBank\(selectedPracticeQuestions, completedQuestionIds\)/,
  );
  assert.match(source, /\{copy\.completedQuestions\(scopedCompletedQuestionIds\.length\)\}/);
  assert.match(source, /startPractice\(\{ type: 'chapter', chapterId: chapter\.id \}\)/);
  assert.match(source, /Question \$\{questionNumber\}/);
  assert.match(source, /Fråga \$\{questionNumber\}/);
  assert.match(source, /Close source details/);
  assert.doesNotMatch(source, /Close about-the-sources|about-the-sources/);
  assert.match(source, /accessibilityLabel=\{copy\.bookmarkAccessibilityLabel\(isBookmarked\)\}/);
  assert.match(source, /\{copy\.scoreLabel\}: \{currentScore\.correct\}\/\{currentScore\.total\}/);
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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /practice route is missing sv copy/);
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
