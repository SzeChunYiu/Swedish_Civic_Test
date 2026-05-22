const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const tscScript = require.resolve('typescript/bin/tsc');

test('practice scoring parity validates scoreAnswers rule cases', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-practice-scoring-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.practiceScoringRulesValidated, 8);
  assert.equal(summary.practiceScoringRulesParityValidated, true);
});

test('practice scoring parity rejects truthy non-boolean correctness results', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
process.argv.push('scripts/validate-content.js', '--focus-practice-scoring-parity');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath);
  if (normalizedPath.endsWith('/lib/quiz/scoring.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (result === true) correct += 1;', 'if (Boolean(result)) correct += 1;');
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
    /practice scoring rule truthy non-boolean results returned \{"correct":5,"total":6\}, expected \{"correct":1,"total":6\}/,
  );
});

test('practice scoring parity rejects array-only TypeScript signature drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
process.argv.push('scripts/validate-content.js', '--focus-practice-scoring-parity');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath);
  if (normalizedPath.endsWith('/lib/quiz/scoring.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('results: unknown = []', 'results: readonly unknown[] = []');
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
    /scoreAnswers TypeScript signature must accept unknown runtime input/,
  );
});

test('practice scoring type contract accepts unknown runtime inputs', () => {
  const result = spawnSync(
    process.execPath,
    [
      tscScript,
      '--noEmit',
      '--pretty',
      'false',
      '--strict',
      '--skipLibCheck',
      '--moduleResolution',
      'bundler',
      '--module',
      'preserve',
      '--target',
      'ES2022',
      'tests/scoreAnswers-runtime-input-type-contract.ts',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
