const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const supportedLocales = [
  'en',
  'sv',
  'zh-Hans',
  'zh-Hant',
  'ar',
  'ckb',
  'fa',
  'pl',
  'so',
  'ti',
  'tr',
  'uk',
];
const provenanceKinds = ['uhr', 'derived', 'editorial'];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractConstObject(source, name) {
  const startPattern = new RegExp(`const\\s+${name}\\s*=\\s*\\{`);
  const startMatch = startPattern.exec(source);
  assert.ok(startMatch, `${name} should be declared as a const object`);

  const objectStart = source.indexOf('{', startMatch.index);
  let depth = 0;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return vm.runInNewContext(`(${source.slice(objectStart, index + 1)})`, {}, { timeout: 3000 });
    }
  }
  assert.fail(`${name} object literal should close`);
}

function assertLocaleKeys(object, label) {
  assert.deepEqual(
    Object.keys(object).sort((a, b) => a.localeCompare(b)),
    [...supportedLocales].sort((a, b) => a.localeCompare(b)),
    `${label} should cover every supported site locale`,
  );
}

function assertSourceCitationCopy(source, name, label) {
  const copy = extractConstObject(source, name);
  assertLocaleKeys(copy, label);
  for (const locale of supportedLocales) {
    assert.equal(typeof copy[locale].source, 'string', `${label}.${locale}.source should be text`);
    assert.equal(typeof copy[locale].page, 'string', `${label}.${locale}.page should be text`);
    assert.notEqual(
      copy[locale].source.trim(),
      '',
      `${label}.${locale}.source should not be empty`,
    );
    assert.notEqual(copy[locale].page.trim(), '', `${label}.${locale}.page should not be empty`);
  }
}

function assertProvenanceCopy(source, name, label) {
  const copy = extractConstObject(source, name);
  assert.deepEqual(
    Object.keys(copy).sort(),
    provenanceKinds.sort(),
    `${label} should cover known provenance kinds`,
  );
  for (const provenance of provenanceKinds) {
    assertLocaleKeys(copy[provenance], `${label}.${provenance}`);
    for (const locale of supportedLocales) {
      assert.equal(
        typeof copy[provenance][locale].label,
        'string',
        `${label}.${provenance}.${locale}.label should be text`,
      );
      assert.equal(
        typeof copy[provenance][locale].description,
        'string',
        `${label}.${provenance}.${locale}.description should be text`,
      );
      assert.notEqual(
        copy[provenance][locale].label.trim(),
        '',
        `${label}.${provenance}.${locale}.label should not be empty`,
      );
      assert.notEqual(
        copy[provenance][locale].description.trim(),
        '',
        `${label}.${provenance}.${locale}.description should not be empty`,
      );
    }
  }
}

test('quiz source citations and provenance badges are localized for every supported locale', () => {
  const appSource = read('site/app.js');

  assertSourceCitationCopy(appSource, 'SMT_QUIZ_SOURCE_CITATION_COPY', 'quiz source citation copy');
  assertProvenanceCopy(appSource, 'SMT_QUIZ_PROVENANCE_COPY', 'quiz provenance copy');
  assert.doesNotMatch(appSource, /lang\s*===\s*['"]sv['"]\s*\?\s*`Källa:[\s\S]*?:\s*`Source:/);
  assert.doesNotMatch(appSource, /lang\s*===\s*['"]sv['"]\s*\?\s*['"]sv['"]\s*:\s*['"]en['"]/);
});

test('practice source citations and provenance badges are localized for every supported locale', () => {
  const practiceSource = read('site/practice.js');

  assertSourceCitationCopy(practiceSource, 'sourceCitationCopy', 'practice source citation copy');
  assertProvenanceCopy(practiceSource, 'provenanceCopy', 'practice provenance copy');
  assert.doesNotMatch(practiceSource, /sv\s*\?\s*`Källa:[\s\S]*?:\s*`Source:/);
  assert.doesNotMatch(practiceSource, /\[sv\s*\?\s*['"]sv['"]\s*:\s*['"]en['"]\]/);
});
