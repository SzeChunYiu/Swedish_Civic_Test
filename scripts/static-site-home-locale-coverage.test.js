const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const locales = ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const allowedSharedValues = new Set(['brand']);
const dynamicMetadataKeys = [/^chap\.\d+\.m1$/];
const allowedSharedFragments = [
  /Almost Swedish/,
  /UHR/,
  /Skolverket/,
  /Migrationsverket/,
  /AdSense/,
  /Google/,
  /Premium/,
  /Cookie/i,
  /fika/i,
  /lagom/i,
  /Allemansrätten/,
  /Jantelagen/,
];
const forbiddenTigrinyaWorkWelfareTerms = ['kollektivavtal', 'föräldraledighet', 'sjukpenning'];
const forbiddenStaticHomeEducationTerms = /\b(?:Förskola|förskola|universitet)\b/iu;

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
      '<script src="app.js',
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
      if (dynamicMetadataKeys.some((pattern) => pattern.test(key))) continue;
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

test('Tigrinya Home chapter 4 avoids bare Swedish labor and welfare terms', () => {
  const dictionaries = loadDictionaries();
  const description = dictionaries.ti?.['chap.4.d'];

  assert.equal(typeof description, 'string', 'ti.chap.4.d is translated');
  assert.match(description, /Skatteverket/, 'ti.chap.4.d preserves the agency name');
  assert.match(description, /ሓባራዊ ስምምዓት/, 'ti.chap.4.d localizes collective agreements');
  assert.match(description, /ናይ ወለዲ ዕረፍቲ/, 'ti.chap.4.d localizes parental leave');
  assert.match(description, /ጥቕማጥቕሚ ሕማም/, 'ti.chap.4.d localizes sickness benefit');

  for (const term of forbiddenTigrinyaWorkWelfareTerms) {
    assert.doesNotMatch(
      description,
      new RegExp(term, 'i'),
      `ti.chap.4.d exposes bare Swedish term ${term}`,
    );
  }
});

test('Somali Tigrinya and Turkish Home chapter 6 avoid bare Swedish education terms', () => {
  const dictionaries = loadDictionaries();
  const expectations = {
    so: [/dugsiyada barbaarinta/, /jaamacadda/],
    ti: [/መዋእለ ህጻናት/, /ዩኒቨርሲቲ/],
    tr: [/Anaokulundan/, /üniversiteye/],
  };

  for (const [locale, localizedTerms] of Object.entries(expectations)) {
    const description = dictionaries[locale]?.['chap.6.d'];
    assert.equal(typeof description, 'string', `${locale}.chap.6.d is translated`);
    assert.match(description, /BVC/, `${locale}.chap.6.d preserves BVC`);
    assert.match(description, /1177/, `${locale}.chap.6.d preserves 1177`);
    assert.doesNotMatch(
      description,
      forbiddenStaticHomeEducationTerms,
      `${locale}.chap.6.d exposes bare Swedish education terms`,
    );
    for (const termPattern of localizedTerms) {
      assert.match(description, termPattern, `${locale}.chap.6.d uses ${termPattern}`);
    }
  }
});
