const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const chapterFocusArgs = ['scripts/validate-content.js', '--focus-chapter-localized-text'];

test('chapter metadata text fields are trimmed and single-spaced', () => {
  const output = execFileSync(process.execPath, chapterFocusArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.chapterTextFieldsNormalizedValidated, 13);
  assert.equal(summary.chapterTextFieldsNormalizedValidated, summary.chapterSchemasValidated);
});

test('chapter metadata text normalization rejects whitespace drift', () => {
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
  if (normalizedPath.endsWith('/data/chapters.ts')) {
    return String(contents)
      .replace("nameSv: 'Landet Sverige',", "nameSv: ' Landet  Sverige',")
      .replace(
        "descriptionEn: 'Geography, climate, nature, population, natural resources, and climate change.',",
        "descriptionEn: 'Geography,  climate, nature, population, natural resources, and climate change. ',",
      );
  }
  return contents;
};
process.argv.push('--focus-chapter-localized-text');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /ch01 nameSv must be trimmed and single-spaced/);
  assert.match(output, /ch01 descriptionEn must be trimmed and single-spaced/);
});
