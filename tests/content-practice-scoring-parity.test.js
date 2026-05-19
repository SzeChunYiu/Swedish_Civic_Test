const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('practice scoring parity validates scoreAnswers rule cases', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.practiceScoringRulesValidated, 5);
  assert.equal(summary.practiceScoringRulesParityValidated, true);
  assert.equal(summary.practiceSessionStoreFieldsValidated, 6);
  assert.equal(summary.practiceSessionStoreSchemaParityValidated, true);
  assert.equal(summary.practiceSessionStoreRuntimeParityValidated, true);
});

test('practice session store schema parity rejects optional selected option drift', () => {
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
      .replace('selectedOptionId: string | null;', 'selectedOptionId?: string | null;');
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
    /PracticeSessionState\.selectedOptionId optional=true, expected false/,
  );
});
