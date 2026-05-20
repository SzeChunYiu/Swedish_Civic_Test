const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const locales = ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const allowedSharedValues = new Set(['brand']);
const allowedSharedFragments = [
  /Almost Swedish/,
  /UHR/,
  /Skolverket/,
  /Migrationsverket/,
  /AdSense/,
  /Google/,
  /Cookie/i,
  /fika/i,
  /lagom/i,
  /Allemansrätten/,
  /Jantelagen/,
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing marker ${marker}`);
  const start = source.indexOf('{', markerIndex);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated object for ${marker}`);
}

function loadDictionaries() {
  const app = vm.runInNewContext(`(${extractObjectLiteral(read('site/app.js'), 'const i18n =')})`);
  const extras = vm.runInNewContext(
    `(${extractObjectLiteral(read('site/i18n-extras.js'), 'const extra =')})`,
  );
  return { ...app, ...extras };
}

function block(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notEqual(start, -1, `missing block ${startMarker}`);
  const end = endMarker ? html.indexOf(endMarker, start) : html.length;
  assert.notEqual(end, -1, `missing end ${endMarker}`);
  return html.slice(start, end);
}

function homeVisibleKeys() {
  const html = read('site/index.html');
  const visibleBlocks = [
    block(html, '<header', '<main data-screen-label="01 Home"'),
    block(html, '<main data-screen-label="01 Home"', '<main data-screen-label="02 Privacy"'),
    block(
      html,
      '<!-- ============================================================ FOOTER',
      '<!-- ============================================================ SETTINGS',
    ),
    block(
      html,
      '<!-- ============================================================ SETTINGS',
      '<!-- ============================================================ COOKIE CONS',
    ),
    block(
      html,
      '<!-- ============================================================ COOKIE CONS',
      '<script src="app.js"',
    ),
  ];
  return [
    ...new Set(
      [...visibleBlocks.join('\n').matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]),
    ),
  ].sort();
}

function htmlToText(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

test('extra locales translate every displayed home, nav, footer, settings, and consent string', () => {
  const dictionaries = loadDictionaries();
  const keys = homeVisibleKeys();

  for (const locale of locales) {
    const dictionary = dictionaries[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary exists`);
    for (const key of keys) {
      const value = dictionary[key];
      assert.equal(typeof value, 'string', `${locale}.${key} is translated`);
      assert.notEqual(value.trim(), '', `${locale}.${key} is not empty`);

      if (locale === 'en' || allowedSharedValues.has(key)) continue;
      const english = dictionaries.en[key];
      if (!english) continue;
      const sameAsEnglish = htmlToText(value) === htmlToText(english);
      const allowedShared = allowedSharedFragments.some((pattern) => pattern.test(value));
      assert.ok(
        !sameAsEnglish || allowedShared,
        `${locale}.${key} falls back to English: ${value}`,
      );
    }
  }
});
