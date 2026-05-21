const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('study buddy visible chrome has non-English fallbacks for every site locale', () => {
  const source = read('site/buddies.js');
  const locales = ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];

  assert.match(source, /const BUDDY_GENERIC_COPY = \{/);
  assert.match(source, /buddyGenericCopy\(currentLang\(\)\)\.subtitle/);
  assert.match(source, /b\.tips\[lang\] \|\| buddyGenericCopy\(lang\)\.tips/);
  assert.match(source, /b\.pet\[lang\] \|\| buddyGenericCopy\(lang\)\.pet/);
  assert.match(source, /BUDDY_GREETING_LINES\[lang\] \|\| buddyGenericCopy\(lang\)\.greetings/);
  assert.match(source, /buddyGenericCopy\(lang\)\.page\[path\]/);
  assert.match(source, /buddyGenericCopy\(lang\)\.selected\(b\.name\)/);

  for (const locale of locales) {
    const key = locale.includes('-') ? `'${locale}': {` : `${locale}: {`;
    const start = source.indexOf(key);
    assert.notEqual(start, -1, `${locale} generic buddy copy exists`);
    const block = source.slice(start, start + 1200);
    for (const field of [
      'subtitle',
      'factPrefix',
      'facts',
      'tips',
      'greetings',
      'page',
      'pet',
      'selected',
    ]) {
      assert.match(block, new RegExp(`${field}:`), `${locale} has ${field}`);
    }
  }
});
