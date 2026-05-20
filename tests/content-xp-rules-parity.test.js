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

test('XP progression parity validates answer, completion, and level rules', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { calculateAnswerXp, calculateQuizCompletionXp, calculateLevel } =
    loadTs('lib/learning/xp.ts');

  assert.equal(summary.xpRulesValidated, 20);
  assert.equal(summary.xpRulesParityValidated, true);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: true }), 12);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: false }), 10);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: true }), 4);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: false }), 2);
  assert.equal(calculateAnswerXp({ isCorrect: 'true', explanationRead: true }), 0);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: 'yes' }), 10);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 0, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 9 }), 20);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }), 70);
  assert.equal(calculateQuizCompletionXp({ answeredCount: NaN, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: Infinity, correctCount: Infinity }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10.5, correctCount: 10 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: -1, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 11 }), 0);
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(99), 1);
  assert.equal(calculateLevel(100), 2);
  assert.equal(calculateLevel(400), 3);
  assert.equal(calculateLevel(NaN), 1);
  assert.equal(calculateLevel(Infinity), 1);
});

test('XP progression parity rejects level threshold drift', () => {
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
  if (normalizedPath.endsWith('/lib/learning/xp.ts')) {
    return String(contents).replace('/ 100)) + 1', '/ 200)) + 1');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /XP rule level at 100 XP returned 1, expected 2/,
  );
});
