const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary(output) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused dashboard validation should print JSON summary');
  return JSON.parse(match[0]);
}

function runFocusedValidationWithSnapshotPatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/dashboardProgressSnapshot.ts')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
process.argv.push('--focus-dashboard-progress-snapshot');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('focused dashboard progress snapshot validator covers answer history aliases', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-dashboard-progress-snapshot'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);

  assert.equal(summary.dashboardProgressSnapshotCasesValidated, 3);
  assert.equal(summary.dashboardProgressSnapshotParityValidated, true);
});

test('focused dashboard progress snapshot validator rejects missing answerAttempts alias', () => {
  const result = runFocusedValidationWithSnapshotPatch(
    'const historicalProgressAnswers = answerHistory ?? answerAttempts;',
    'const historicalProgressAnswers = answerHistory ?? [];',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /dashboard progress snapshot must treat answerAttempts as the legacy answerHistory alias/,
  );
});

test('focused dashboard progress snapshot validator rejects answerHistory precedence drift', () => {
  const result = runFocusedValidationWithSnapshotPatch(
    'const historicalProgressAnswers = answerHistory ?? answerAttempts;',
    'const historicalProgressAnswers = answerAttempts ?? answerHistory ?? [];',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /dashboard progress snapshot must prefer answerHistory over answerAttempts/,
  );
});

test('focused dashboard progress snapshot validator rejects fallback double-counting', () => {
  const result = runFocusedValidationWithSnapshotPatch(
    '.filter((progress) => !historicalQuestionIds.has(progress.questionId))',
    '.filter(() => true)',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /dashboard progress snapshot must not double-count questionProgress fallback when answerHistory exists/,
  );
});
