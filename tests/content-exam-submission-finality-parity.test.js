const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('exam submission finality stays aligned with the result route', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.equal(summary.examSubmissionFinalityParityValidated, true);
  assert.equal(summary.examScoringRuntimeCasesValidated, 7);
  assert.equal(summary.examScoringRuntimeParityValidated, true);
  assert.match(examRoute, /Submitted results are final/);
  assert.match(examRoute, /disabled: !completionRecorded/);
  assert.match(examRoute, /<MockExamTimeHeatmap/);
  assert.match(examRoute, /answers=\{completedExamSession\.answers\}/);
  assert.match(examRoute, /onSelectQuestion=\{handleSelectHeatmapQuestion\}/);
  assert.match(examRoute, /completedAt: completedExamSession\.completedAt/);
  assert.match(examRoute, /answers: completedExamSession\.answers\.map/);
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

test('exam scoring runtime parity rejects non-string answer scoring drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const source = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/quiz/examGenerator.ts')) {
    return source.replace(
      "typeof candidateAnswer === 'string' && candidateAnswer === question.correctOptionId",
      "Boolean(candidateAnswer) && String(candidateAnswer) === question.correctOptionId"
    );
  }
  return source;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /scoreExam object answer value returned.*expected/,
  );
});
