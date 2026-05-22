const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('exam submission finality stays aligned with the result route', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-exam-submission-finality-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.deepEqual(Object.keys(summary), ['examSubmissionFinalityParityValidated']);
  assert.equal(summary.examSubmissionFinalityParityValidated, true);
  assert.match(examRoute, /Submitted results are final/);
  assert.match(
    examRoute,
    /disabled:\s*!completionRecorded \|\| !canStartAccessibleExam \|\| startingAccessibleExam/,
  );
  assert.match(examRoute, /completionStoreFailure/);
  assert.match(examRoute, /setAccessStatusMessage\(copy\.completionStoreFailure\)/);
  assert.match(
    examRoute,
    /\.catch\(\(\) => \{[\s\S]*?setCompletionRecorded\(true\);[\s\S]*?setAccessStatusMessage\(copy\.completionStoreFailure\);[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(examRoute, /Back to exam answers|Back to answers/);
  assert.doesNotMatch(examRoute, /onPress=\{\(\) => setSubmitted\(false\)\}/);
});

test('exam submission finality rejects a back-to-answers regression', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Submitted results are final', 'Back to answers');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-exam-submission-finality-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /exam result screen must tell users submitted results are final/,
  );
});
