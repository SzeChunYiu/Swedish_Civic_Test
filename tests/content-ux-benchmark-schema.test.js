const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

test('UX benchmark schema rejects duplicate products, duplicate sources, and non-HTTPS URLs', () => {
  const uxBenchmarks = loadTs('data/uxBenchmarks.ts', 'uxBenchmarks');
  const duplicateProduct = uxBenchmarks[0].product;
  const duplicateSource = uxBenchmarks[0].source;
  const duplicateTargetProduct = uxBenchmarks[1].product;
  const duplicateTargetSource = uxBenchmarks[1].source;
  const insecureTargetProduct = uxBenchmarks[2].product;
  const insecureTargetSource = uxBenchmarks[2].source;
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const duplicateProduct = ${JSON.stringify(duplicateProduct)};
const duplicateSource = ${JSON.stringify(duplicateSource)};
const duplicateTargetProduct = ${JSON.stringify(duplicateTargetProduct)};
const duplicateTargetSource = ${JSON.stringify(duplicateTargetSource)};
const insecureTargetSource = ${JSON.stringify(insecureTargetSource)};
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/uxBenchmarks.ts')) {
    return String(contents)
      .replace(\`product: '\${duplicateTargetProduct}'\`, \`product: '\${duplicateProduct}'\`)
      .replace(\`source: '\${duplicateTargetSource}'\`, \`source: '\${duplicateSource}'\`)
      .replace(\`source: '\${insecureTargetSource}'\`, \`source: '\${insecureTargetSource.replace(/^https:/, 'http:')}'\`);
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
  assert.match(
    output,
    new RegExp(`${escapeRegExp(duplicateProduct)} duplicates UX benchmark product`),
  );
  assert.match(
    output,
    new RegExp(`${escapeRegExp(duplicateProduct)} duplicates UX benchmark source`),
  );
  assert.match(
    output,
    new RegExp(`${escapeRegExp(insecureTargetProduct)} source must be an HTTPS URL`),
  );
});
