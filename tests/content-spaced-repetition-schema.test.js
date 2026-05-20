const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const expectedSchedule = [1, 3, 7, 15, 30];

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function daysAfter(baseIso, days) {
  const dayInMs = 24 * 60 * 60 * 1000;
  return new Date(new Date(baseIso).getTime() + days * dayInMs).toISOString();
}

test('spaced repetition schema validates schedule intervals and runtime parity', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { spacedRepetitionSchedule, getNextReviewAt } = loadTs('lib/learning/spacedRepetition.ts');
  const answeredAt = '2026-05-15T10:00:00.000Z';

  assert.deepEqual(spacedRepetitionSchedule, expectedSchedule);
  assert.equal(summary.spacedRepetitionIntervalsValidated, expectedSchedule.length);
  assert.equal(summary.spacedRepetitionRuntimeParityValidated, true);
  assert.equal(
    getNextReviewAt({ isCorrect: false, correctStreak: 99, answeredAt }),
    daysAfter(answeredAt, 1),
  );
  assert.equal(
    getNextReviewAt({ isCorrect: true, correctStreak: 50, answeredAt }),
    daysAfter(answeredAt, expectedSchedule.at(-1)),
  );
});

test('spaced repetition schema rejects schedule drift and non-increasing intervals', () => {
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
  if (normalizedPath.endsWith('/lib/learning/spacedRepetition.ts')) {
    return String(contents).replace(
      'export const spacedRepetitionSchedule: number[] = [1, 3, 7, 15, 30];',
      'export const spacedRepetitionSchedule: number[] = [1, 3, 3, 15, 30];',
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
  assert.match(output, /spacedRepetitionSchedule is \[1,3,3,15,30\]/);
  assert.match(output, /spacedRepetitionSchedule\[2\] must be greater than the previous interval/);
});
