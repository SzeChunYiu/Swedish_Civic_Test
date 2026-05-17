const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

test('published question types stay answerable by quiz runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.publishedQuestionTypesValidated, 500);
  assert.equal(summary.publishedQuestionTypesValidated, summary.publishedQuestions);
});

test('published question type schema rejects non-answerable flashcards', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "    type: 'single_choice',",
      "    type: 'flashcard',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 published question type flashcard is not quiz-answerable/,
  );
});
