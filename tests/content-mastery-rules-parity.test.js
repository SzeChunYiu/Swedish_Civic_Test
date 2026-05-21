const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return mod.exports;
}

test('mastery runtime parity validates scoring and weak-chapter rules', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mastery-rules'],
    {
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { calculateMastery, calculateChapterMastery, findWeakChapterIds } =
    loadTs('lib/learning/mastery.ts');
  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };
  const malformedProgress = {
    q1: { correctCount: Number.NaN, seenCount: 2, wrongCount: 0 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: Infinity, wrongCount: 0 },
  };

  assert.equal(summary.masteryRulesValidated, 17);
  assert.equal(summary.masteryRulesParityValidated, true);
  assert.equal(
    calculateMastery({ correctCount: 8, seenCount: 10, totalQuestions: 20, recent: true }),
    0.75,
  );
  assert.equal(
    calculateMastery({ correctCount: 20, seenCount: 10, totalQuestions: 5, recent: false }),
    0.8,
  );
  assert.equal(calculateChapterMastery('ch01', questions, progress), 0.67);
  assert.equal(calculateChapterMastery('ch99', questions, progress), 0);
  assert.equal(calculateChapterMastery('ch01', questions, malformedProgress), 0.85);
  assert.deepEqual(findWeakChapterIds(questions, progress, 0.7), ['ch01']);
  assert.deepEqual(
    findWeakChapterIds(
      questions,
      {
        q1: { correctCount: Number.NaN, seenCount: 2, wrongCount: 0 },
        q2: { correctCount: 1, seenCount: Infinity, wrongCount: 0 },
        q3: { correctCount: 0, seenCount: 0, wrongCount: Number.NaN },
      },
      0.7,
    ),
    [],
  );
  [
    { correctCount: Number.NaN, seenCount: 10, totalQuestions: 20, recent: true },
    { correctCount: 8, seenCount: Infinity, totalQuestions: 20, recent: true },
    { correctCount: -1, seenCount: 10, totalQuestions: 20, recent: true },
    { correctCount: 5, seenCount: 10, totalQuestions: 20.5, recent: true },
    { correctCount: '5', seenCount: 10, totalQuestions: 20, recent: true },
  ].forEach((input) => {
    assert.equal(calculateMastery(input), 0);
  });
  assert.equal(
    calculateMastery({ correctCount: 8, seenCount: 10, totalQuestions: 20, recent: 'yes' }),
    0.55,
  );
  assert.deepEqual(findWeakChapterIds(questions, progress, Number.NaN), []);
  assert.deepEqual(findWeakChapterIds(questions, progress, -1), []);
});

test('mastery runtime parity rejects recency-weight drift', () => {
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
  if (normalizedPath.endsWith('/lib/learning/mastery.ts')) {
    return String(contents).replace('0.2 * recencyScore', '0 * recencyScore');
  }
  return contents;
};
process.argv.push('--focus-mastery-rules');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /mastery rule weighted accuracy coverage and recency returned 0\.55, expected 0\.75/,
  );
});
