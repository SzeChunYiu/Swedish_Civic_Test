const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('answer feedback runtime stays in parity with every published question option set', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.answerValidationTypeUnionsValidated, 1);
  assert.equal(summary.answerValidationTypeInterfacesValidated, 1);
  assert.equal(summary.answerValidationTypeSchemaParityValidated, true);
  assert.equal(summary.answerFeedbackQuestionsValidated, summary.publishedQuestions);
  assert.ok(summary.answerFeedbackOptionsValidated > summary.publishedQuestions);
  assert.equal(summary.answerFeedbackRuntimeParityValidated, true);
});

test('answer feedback schema parity rejects tone union drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/answerValidation.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'idle' | 'correct' | 'incorrect'", "'idle' | 'correct' | 'warning'");
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
    /lib\/quiz\/answerValidation\.ts AnswerOptionFeedbackTone values/,
  );
});
