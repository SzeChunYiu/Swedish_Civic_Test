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

test('published question prompts and explanations keep distinct Swedish and English text', () => {
  const summary = readValidationSummary();

  assert.equal(summary.questionBilingualTextPairsValidated, summary.publishedQuestions);
});

test('published question bilingual text rejects copied prompts and explanations', () => {
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
    return String(contents)
      .replace(
        "    questionSv: 'Var ligger Sverige?',",
        "    questionSv: 'Where is Sweden located?',",
      )
      .replace(
        /    explanationSv:\\n      '[\\s\\S]*?',\\n    explanationEn:\\n      '[\\s\\S]*?',/,
        "    explanationSv:\\n      'Copied explanation.',\\n    explanationEn:\\n      'Copied explanation.',",
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
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /q001 questionSv and questionEn must be distinct bilingual text/);
  assert.match(output, /q001 explanationSv and explanationEn must be distinct bilingual text/);
});
