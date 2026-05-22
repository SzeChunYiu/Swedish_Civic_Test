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
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-spaced-repetition-schema'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { spacedRepetitionSchedule, getNextReviewAt, retrievability, isDue, sortByDueAscending } =
    loadTs('lib/learning/spacedRepetition.ts');
  const answeredAt = '2026-05-15T10:00:00.000Z';

  assert.deepEqual(spacedRepetitionSchedule, expectedSchedule);
  assert.equal(summary.spacedRepetitionIntervalsValidated, expectedSchedule.length);
  assert.equal(summary.spacedRepetitionRuntimeParityValidated, true);
  assert.equal(summary.spacedRepetitionRuntimeInputCasesValidated, 12);
  assert.equal(summary.spacedRepetitionRuntimeInputParityValidated, true);
  assert.equal(summary.spacedRepetitionDueTimestampCasesValidated, 7);
  assert.equal(summary.spacedRepetitionDueTimestampParityValidated, true);
  assert.equal(
    getNextReviewAt({ isCorrect: false, correctStreak: 99, answeredAt }),
    daysAfter(answeredAt, 1),
  );
  assert.equal(
    getNextReviewAt({ isCorrect: true, correctStreak: 50, answeredAt }),
    daysAfter(answeredAt, expectedSchedule.at(-1)),
  );
  assert.equal(isDue({ dueAt: '2026-03-02T00:00:00.000Z' }, '2026-03-02T12:00:00.000Z'), true);
  assert.equal(isDue({ dueAt: '2026-02-30T00:00:00.000Z' }, '2026-03-02T12:00:00.000Z'), false);
  assert.equal(isDue({ dueAt: '2026-03-02' }, '2026-03-02T12:00:00.000Z'), false);
  assert.equal(isDue({ dueAt: '2026-03-02T12:00:00+00:00' }, '2026-03-02T12:00:00.000Z'), false);
  assert.equal(retrievability(Number.NaN, 1), 0);
  assert.equal(retrievability(Number.POSITIVE_INFINITY, 1), 0);
  assert.equal(retrievability(0, 1), 0);
  assert.equal(retrievability(-1, 1), 0);
  assert.equal(retrievability(1, Number.NaN), 0);
  assert.equal(retrievability(1, Number.POSITIVE_INFINITY), 0);
  assert.equal(retrievability(1, -1), 0);
  assert.deepEqual(
    [
      { questionId: 'date-only', dueAt: '2026-03-01' },
      { questionId: 'future', dueAt: '2026-03-03T00:00:00.000Z' },
      { questionId: 'rollover', dueAt: '2026-02-30T00:00:00.000Z' },
      { questionId: 'past', dueAt: '2026-03-01T00:00:00.000Z' },
    ]
      .sort(sortByDueAscending)
      .map((card) => card.questionId),
    ['past', 'future', 'date-only', 'rollover'],
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
process.argv.push('--focus-spaced-repetition-schema');
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

test('spaced repetition schema rejects loose due timestamp parsing', () => {
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
      "if (typeof value !== 'string') return null;\\n  const timestamp = Date.parse(value);\\n  if (!Number.isFinite(timestamp)) return null;\\n  return new Date(timestamp).toISOString() === value ? timestamp : null;",
      "if (typeof value !== 'string') return null;\\n  const timestamp = Date.parse(value);\\n  return Number.isFinite(timestamp) ? timestamp : null;",
    );
  }
  return contents;
};
process.argv.push('--focus-spaced-repetition-schema');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /spaced repetition due timestamp rollover dueAt returned true/);
  assert.match(output, /spaced repetition due timestamp date-only dueAt returned true/);
});

test('review store due-limit focus rejects Array.slice coercion regressions', () => {
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
  if (normalizedPath.endsWith('/lib/storage/reviewStore.ts')) {
    return String(contents).replace(
      "function normalizeDueCardsLimit(limit: unknown): number | undefined {\\n  if (limit === undefined || limit === Number.POSITIVE_INFINITY) return undefined;\\n  if (isNonNegativeInteger(limit)) return limit;\\n  return undefined;\\n}",
      "function normalizeDueCardsLimit(limit: unknown): number | undefined {\\n  return limit as number | undefined;\\n}",
    );
  }
  return contents;
};
process.argv.push('--focus-review-store-due-limit');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /review-store due limit malformed negative limit/);
  assert.match(output, /review-store due limit malformed fractional limit/);
});
