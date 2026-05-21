const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const packetRoot = path.join(repoRoot, 'docs/localization/review-packets/question-i18n-v8');
const targetLocales = ['ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk', 'zh-Hans', 'zh-Hant'];
const expectedIds = Array.from(
  { length: 177 },
  (_, index) => `q${String(index + 1).padStart(3, '0')}`,
);
const expectedHeader = [
  'id',
  'locale',
  'chapter_id',
  'chapter_label',
  'source_chapter',
  'source_section',
  'source_page',
  'question_sv',
  'question_en',
  'question_target',
  'correct_option_id',
  'correct_option_sv',
  'correct_option_en',
  'correct_option_target',
  'options_sv',
  'options_en',
  'options_target',
  'explanation_sv',
  'explanation_en',
  'explanation_target',
  'native_review_status',
  'reviewer_notes',
];

function parseTsv(text) {
  return text
    .trimEnd()
    .split('\n')
    .map((line) => line.split('\t'));
}

test('question i18n v8 native-review packets are reproducible', () => {
  execFileSync(
    process.execPath,
    ['scripts/export-question-localization-review-packets.js', '--check'],
    {
      cwd: repoRoot,
      stdio: 'pipe',
    },
  );
});

test('question i18n v8 native-review packets cover every target locale and UHR question', () => {
  const readme = fs.readFileSync(path.join(packetRoot, 'README.md'), 'utf8');
  assert.match(readme, /machine-assisted q001-q177 question localization review packets/);
  assert.match(readme, /Do not use these packets to enable a locale/);

  for (const locale of targetLocales) {
    const rows = parseTsv(fs.readFileSync(path.join(packetRoot, `${locale}.tsv`), 'utf8'));
    assert.deepEqual(rows[0], expectedHeader, `${locale} TSV header changed`);
    assert.equal(rows.length - 1, expectedIds.length, `${locale} should have 170 review rows`);
    assert.deepEqual(
      rows.slice(1).map((row) => row[0]),
      expectedIds,
      `${locale} should list q001-q177 in order`,
    );

    for (const row of rows.slice(1)) {
      const byColumn = Object.fromEntries(
        expectedHeader.map((column, index) => [column, row[index]]),
      );
      assert.equal(byColumn.locale, locale, `${locale} row ${byColumn.id} locale mismatch`);
      for (const column of [
        'question_sv',
        'question_en',
        'question_target',
        'correct_option_target',
        'options_target',
        'explanation_target',
      ]) {
        assert.ok(byColumn[column]?.trim(), `${locale} ${byColumn.id} ${column} missing`);
        assert.doesNotMatch(
          byColumn[column],
          /[\u0E00-\u0E7F]/,
          `${locale} ${byColumn.id} Thai residue`,
        );
      }
      assert.equal(byColumn.native_review_status, 'pending_native_review');
    }
  }
});

test('question i18n v8 native-review export rejects unblocked question readiness gates', () => {
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
  if (normalizedPath.endsWith('/docs/localization/readiness.json')) {
    const readiness = JSON.parse(String(contents));
    readiness.locales.ar.appAvailable = true;
    readiness.locales.ar.questionContent = 'native_reviewed';
    readiness.locales.ar.nativeReview = 'complete';
    readiness.locales.ar.releaseGate = 'allowed';
    return JSON.stringify(readiness);
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-question-localization-review-packets.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /ar question readiness must remain fail-closed/i,
  );
});
