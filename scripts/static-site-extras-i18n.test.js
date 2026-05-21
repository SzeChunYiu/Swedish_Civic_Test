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

function assertLocaleMap(map, label) {
  assert.deepEqual(
    Object.keys(map).sort((a, b) => a.localeCompare(b)),
    [...supportedLocales].sort((a, b) => a.localeCompare(b)),
    `${label} should cover every supported site locale`,
  );
  for (const locale of supportedLocales) {
    assert.equal(typeof map[locale], 'string', `${label}.${locale} should be text`);
    assert.notEqual(map[locale].trim(), '', `${label}.${locale} should not be empty`);
  }
}

test('extras easter-egg display copy is localized for every supported locale', () => {
  const extrasSource = read('site/extras.js');
  const copy = extractConstObject(extrasSource, 'EXTRAS_COPY');

  for (const [key, value] of Object.entries(copy)) {
    if (Array.isArray(value)) {
      assert.ok(value.length > 0, `${key} should not be empty`);
      value.forEach((entry, index) => assertLocaleMap(entry, `${key}[${index}]`));
    } else {
      assertLocaleMap(value, key);
    }
  }

  assert.doesNotMatch(
    extrasSource,
    /smtBuddyCelebrate\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*\)/,
  );
  assert.doesNotMatch(extrasSource, /lang\(\)\s*===\s*['"]sv['"]\s*\?\s*1\s*:\s*0/);
  assert.doesNotMatch(extrasSource, /const facts\s*=\s*\[/);
});
