const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const sampleRoot = path.join(repoRoot, 'docs/localization/sample-corpus');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parsePickerLocales() {
  const source = fs.readFileSync(localesPath, 'utf8');
  const blocks = [...source.matchAll(/\{\s*code: '([^']+)'[\s\S]*?available: (true|false),[\s\S]*?fallback: '([^']+)'[\s\S]*?\}/g)];
  assert.ok(blocks.length >= 2, 'expected to parse locale entries from lib/i18n/locales.ts');
  return blocks.map((match) => ({
    code: match[1],
    available: match[2] === 'true',
    fallback: match[3],
  }));
}

function assertSampleCorpusExists(code) {
  const dir = path.join(sampleRoot, code);
  for (const fileName of ['README.md', 'sources.tsv', 'style-guide.md']) {
    assert.ok(fs.existsSync(path.join(dir, fileName)), `${code} missing sample-corpus/${code}/${fileName}`);
  }
}

test('readiness ledger covers every language picker locale', () => {
  const readiness = readJson(readinessPath);
  const pickerLocales = parsePickerLocales();
  const readinessCodes = Object.keys(readiness.locales).sort();
  const pickerCodes = pickerLocales.map((locale) => locale.code).sort();
  assert.deepEqual(readinessCodes, pickerCodes);
});

test('target picker locales have source corpus before translation work', () => {
  for (const locale of parsePickerLocales()) {
    if (locale.code === 'sv') continue;
    assertSampleCorpusExists(locale.code);
  }
});

test('runtime availability stays fail-closed until readiness gate allows it', () => {
  const readiness = readJson(readinessPath);
  for (const locale of parsePickerLocales()) {
    const entry = readiness.locales[locale.code];
    assert.equal(entry.appAvailable, locale.available, `${locale.code} readiness appAvailable must match picker available`);

    if (locale.available) {
      assert.equal(entry.uiStrings, 'complete', `${locale.code} cannot be available without complete UI strings`);
      assert.equal(entry.questionContent, 'complete', `${locale.code} cannot be available without complete question content`);
      assert.equal(entry.releaseGate, 'allowed', `${locale.code} cannot be available unless releaseGate is allowed`);
      assert.notEqual(entry.nativeReview, 'missing', `${locale.code} cannot be available without native review/source-language equivalent`);
      assert.ok(
        entry.accessibilityReview === 'complete' || entry.accessibilityReview === 'complete_for_current_app_surfaces',
        `${locale.code} cannot be available without accessibility review`,
      );
    } else {
      assert.equal(entry.releaseGate, 'blocked', `${locale.code} unavailable locale should remain blocked in readiness ledger`);
    }
  }
});
