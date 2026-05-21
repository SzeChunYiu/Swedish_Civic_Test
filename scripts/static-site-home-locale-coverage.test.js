const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const locales = ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const extraLocales = ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const allowedSharedValues = new Set(['brand']);
const dynamicMetadataKeys = [/^chap\.\d+\.m1$/];
const localizedChapterOneFolkhemmetTerms = {
  'zh-Hans': /人民之家/,
  'zh-Hant': /人民之家/,
  ar: /بيت الشعب/,
  ckb: /ماڵی گەل/,
  fa: /خانه‌ی مردم/,
  pl: /dom ludu/i,
  so: /guriga dadka/i,
  ti: /ቤት ህዝቢ/,
  tr: /halkın evi/i,
  uk: /народний дім/i,
};
const localizedChapterTwoCivicTerms = {
  'zh-Hans': /市镇、大区/,
  'zh-Hant': /市鎮、大區/,
  ar: /البلديات، والمناطق/,
  ckb: /شارەوانییەکان، هەرێمەکان/,
  fa: /شهرداری‌ها، منطقه‌ها/,
  pl: /gminy i regiony/,
  so: /degmooyinka iyo gobollada/,
  ti: /ናይ ከባቢ ምምሕዳራት፡ ክልላት/,
  tr: /belediyeler ve bölgeler/,
  uk: /муніципалітети й регіони/,
};
const localizedChapterSixEducationTerms = {
  so: /dugsiyada barbaarinta.+jaamacadda/,
  ti: /መዋእለ ህጻናት.+ዩኒቨርሲቲ/,
  tr: /Anaokulundan.+üniversiteye/,
};
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

test('extra locale Home chapter 1 cards render folkhemmet as localized gloss first', () => {
  const dictionaries = loadDictionaries();

  for (const locale of extraLocales) {
    const value = dictionaries[locale]['chap.1.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.1.d is translated`);

    const localizedIndex = value.search(localizedChapterOneFolkhemmetTerms[locale]);
    const glossaryIndex = value.toLowerCase().indexOf('folkhemmet');
    assert.notEqual(localizedIndex, -1, `${locale}.chap.1.d should localize folkhemmet`);
    assert.notEqual(glossaryIndex, -1, `${locale}.chap.1.d should keep folkhemmet as glossary`);
    assert.ok(
      localizedIndex < glossaryIndex,
      `${locale}.chap.1.d should show the localized term before folkhemmet`,
    );
    assert.doesNotMatch(
      value,
      /[←→]\s*folkhemmet\s*(?:[←→.]|$)/i,
      `${locale}.chap.1.d must not render bare folkhemmet in the timeline`,
    );
  }
});

test('extra locale Home chapter 2 cards localize kommun and region labels', () => {
  const dictionaries = loadDictionaries();

  for (const locale of extraLocales) {
    const value = dictionaries[locale]['chap.2.d'];
    assert.match(
      value,
      localizedChapterTwoCivicTerms[locale],
      `${locale}.chap.2.d should use localized municipality/region nouns`,
    );
    assert.doesNotMatch(
      value,
      /\b(?:kommun|region|regering)\b/i,
      `${locale}.chap.2.d must not render bare Swedish civic-term tokens`,
    );
  }
});

test('Somali Tigrinya and Turkish Home chapter 6 cards localize education labels', () => {
  const dictionaries = loadDictionaries();

  for (const [locale, localizedTerms] of Object.entries(localizedChapterSixEducationTerms)) {
    const value = dictionaries[locale]['chap.6.d'];
    assert.match(
      value,
      localizedTerms,
      `${locale}.chap.6.d should use localized preschool/university nouns`,
    );
    assert.match(value, /BVC/, `${locale}.chap.6.d should preserve the BVC acronym`);
    assert.match(value, /1177/, `${locale}.chap.6.d should preserve the 1177 reference`);
    assert.doesNotMatch(
      value,
      forbiddenStaticHomeEducationTerms,
      `${locale}.chap.6.d must not render bare Swedish education-term tokens`,
    );
  }
});
