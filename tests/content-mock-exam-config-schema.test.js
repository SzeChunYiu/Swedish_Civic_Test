const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('default mock exam config stays UHR-based and ad-free during exams', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');

  assert.equal(summary.mockExamConfigValidated, true);
  assert.equal(config.sourceScope, 'uhr_based');
  assert.equal(config.showExplanationsDuringExam, false);
  assert.equal(config.adsAllowedDuringExam, false);
  assert.ok(Number.isInteger(config.questionCount));
  assert.ok(config.questionCount > 0);
  assert.ok(config.questionCount <= summary.publishedQuestions);
  assert.ok(Number.isInteger(config.durationMinutes));
  assert.ok(config.durationMinutes > 0);
});
