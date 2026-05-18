const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('answer shuffle content parity validates P0 distribution coverage', () => {
  const summary = readValidationSummary();

  assert.ok(summary.answerShuffleSingleChoiceQuestionsValidated > 100);
  assert.equal(
    summary.answerShuffleSingleChoiceQuestionsValidated +
      summary.answerShuffleTrueFalseQuestionsValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.answerShuffleSeedDistributionsValidated, 50);
  assert.equal(summary.answerShuffleDistributionParityValidated, true);
});

test('answer shuffle content parity rejects an identity single-choice shuffle', () => {
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
  if (normalizedPath.endsWith('/lib/quiz/answerOptionShuffle.ts')) {
    return String(contents).replace(
      /export function shuffleQuestionOptionsForSession[\\s\\S]*?\\n}\\n\\nexport function summarizeAnswerShuffleDistribution/,
      "export function shuffleQuestionOptionsForSession<TQuestion extends ShuffleQuestion>(\\n  question: TQuestion,\\n  _sessionId: string,\\n): TQuestion {\\n  return question;\\n}\\n\\nexport function summarizeAnswerShuffleDistribution",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /answer shuffle correct positions exceed|answer shuffle distribution is unbalanced/,
  );
});
