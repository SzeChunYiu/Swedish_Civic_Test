const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('authored source questions stay reviewed and publish without field drift', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.authoredSourceQuestionsValidated, summary.sourceQuestions);
  assert.equal(summary.sourcePublicationParityValidated, summary.sourceQuestions);
});

test('authored source schema rejects invalid review status values', () => {
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
      "    reviewStatus: 'reviewed',",
      "    reviewStatus: 'verified',",
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
  assert.match(output, /q001 authored source reviewStatus is verified, expected reviewed/);
  assert.match(output, /q001 has invalid reviewStatus verified/);
});

test('authored source parity rejects published source field drift', () => {
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
    const marker = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]);\`;
    const replacement = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]).map((question) =>
  question.id === 'q001'
    ? {
        ...question,
        explanationEn:
          'The published source row drifted away from the authored source explanation.',
      }
    : question,
);\`;
    return String(contents).replace(marker, replacement);
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
    /q001 published source explanationEn does not match authored source/,
  );
});
