const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
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

  assert.equal(summary.xpRulesValidated, 11);
  assert.equal(summary.xpRulesParityValidated, true);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: true }), 12);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: false }), 10);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: true }), 4);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: false }), 2);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 0, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 9 }), 20);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }), 70);
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(99), 1);
  assert.equal(calculateLevel(100), 2);
  assert.equal(calculateLevel(400), 3);
});
