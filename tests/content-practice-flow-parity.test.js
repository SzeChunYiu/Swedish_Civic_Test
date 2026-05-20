const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

test('practice flow runtime selection stays in parity with the published question bank', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.practiceFlowCasesValidated, 16);
  assert.equal(summary.practiceFlowParityValidated, true);
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

test('practice flow parity rejects cross-filter completed progress drift', () => {
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
      .replace(
        'completedQuestionIds.filter((id) => questionIds.has(id))',
        'completedQuestionIds.filter((id) => typeof id === "string")',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice flow completion outside visible bank is ignored scoped completed ids returned \["q003"\], expected \[\]/,
  );
});
