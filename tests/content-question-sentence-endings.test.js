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

test('published question prompts and explanations end as complete sentences', () => {
  const summary = readValidationSummary();

  assert.equal(summary.questionSentenceEndingsValidated, summary.publishedQuestions);
});

test('published question sentence endings reject incomplete learner-facing text', () => {
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
      'part of northern Europe.\\',',
      'part of northern Europe\\',',
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
    /q001 explanationEn must end with sentence punctuation/,
  );
});

test('published question sentence endings reject incomplete prompts', () => {
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
      'Var ligger Sverige?',
      'Var ligger Sverige',
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
    /q001 questionSv must end with sentence punctuation/,
  );
});
