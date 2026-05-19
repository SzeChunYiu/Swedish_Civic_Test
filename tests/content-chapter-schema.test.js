const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

test('chapter metadata schema validates every chapter', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.chapterSchemasValidated, 13);
  assert.equal(summary.chapterSchemasValidated, summary.chapters);
});

test('chapter metadata schema rejects invalid counts and copied bilingual names', () => {
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
      .replace("    nameEn: 'The country of Sweden',", "    nameEn: 'Landet Sverige',")
      .replace('    questionCount: 50,', '    questionCount: 0,');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /ch01 nameSv and nameEn must be distinct bilingual text/);
  assert.match(output, /ch02 has invalid questionCount/);
});
