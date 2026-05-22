const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('chapter metadata schema validates every chapter', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-chapter-metadata'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
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
process.argv.push('--focus-chapter-metadata');
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /ch01 nameSv and nameEn must be distinct bilingual text|ch02 questionCount is 0, expected/,
  );
  assert.match(output, /ch02 has invalid questionCount|ch02 questionCount is 0, expected/);
});

test('chapter metadata schema rejects localized sv/en drift', () => {
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
      .replace("      sv: 'Landet Sverige',", "      sv: 'Landet  Sverige',")
      .replace("      en: 'The country of Sweden',", "      en: '',");
  }
  return contents;
};
process.argv.push('--focus-chapter-metadata');
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /ch01 nameText\.sv must match nameSv|site\/questions\.js semantic drift|Changed chapter ids: 1/,
  );
  assert.match(
    output,
    /ch01 nameText\.en must be filled|site\/questions\.js semantic drift|Changed chapter ids: 1/,
  );
});
