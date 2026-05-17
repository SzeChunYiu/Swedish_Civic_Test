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

test('UX benchmark schema validates the home-screen benchmark data', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const uxBenchmarks = loadTs('data/uxBenchmarks.ts', 'uxBenchmarks');
  const sources = new Set(uxBenchmarks.map((benchmark) => benchmark.source));

  assert.equal(summary.uxBenchmarksValidated, uxBenchmarks.length);
  assert.equal(uxBenchmarks.length, 4);
  assert.equal(sources.size, uxBenchmarks.length);
  uxBenchmarks.forEach((benchmark) => {
    assert.ok(benchmark.product.trim().length > 0);
    assert.ok(benchmark.lesson.trim().length > 0);
    assert.match(benchmark.source, /^https:\/\//);
  });
});
