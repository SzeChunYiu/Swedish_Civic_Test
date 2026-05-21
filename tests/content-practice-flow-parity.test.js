const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('practice flow runtime selection stays in parity with the published question bank', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-practice-flow-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.practiceFlowCasesValidated, 6);
  assert.equal(summary.practiceFlowParityValidated, true);
  assert.equal(summary.practiceSessionStoreFieldsValidated, 11);
  assert.equal(summary.practiceSessionStoreRuntimeParityValidated, true);
  assert.equal(summary.practiceInterstitialQuestionCapValidated, true);
});

test('practice flow parity rejects active-question unlock drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/practiceFlow.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (activeQuestion) return activeQuestion;', 'if (false && activeQuestion) return activeQuestion;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-flow-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice flow active question remains locked returned "q002", expected "q001"/,
  );
});

test('practice flow parity rejects struck-option selection drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/practiceSessionStore.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'if (state.struckOptionIdsByQuestionId[questionId]?.includes(optionId)) {',
        'if (false && state.struckOptionIdsByQuestionId[questionId]?.includes(optionId)) {',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-practice-flow-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice session selectOption must not select a struck option/,
  );
});
