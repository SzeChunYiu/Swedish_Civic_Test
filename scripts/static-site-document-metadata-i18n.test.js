const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function assertLocaleMetadata(source, locale) {
  const objectKey = locale.includes('-') ? `'${locale}'` : locale;
  const start = source.indexOf(`${objectKey}: {`);
  assert.notEqual(start, -1, `${locale} object exists`);
  const block = source.slice(start, start + 700);
  assert.match(block, /'meta\.title'/, `${locale} has title`);
  assert.match(block, /'meta\.description'/, `${locale} has description`);
}

test('static document title and description follow the selected locale', () => {
  const app = read('site/app.js');
  const extras = read('site/i18n-extras.js');
  const index = read('site/index.html');
  const locales = [
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

  assert.match(index, /<title>Almost Swedish — Study and practice\.<\/title>/);
  assert.match(app, /function smtApplyDocumentMetadata\(lang\)/);
  assert.match(app, /document\.title = title/);
  assert.match(app, /meta\[name="description"\]/);
  assert.match(app, /smtApplyDocumentMetadata\(lang\)/);

  for (const locale of locales) {
    assertLocaleMetadata(locale === 'en' || locale === 'sv' ? app : extras, locale);
  }
});
