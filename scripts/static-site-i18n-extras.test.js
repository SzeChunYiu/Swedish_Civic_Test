const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedHomepageSlogans = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data/homepage_slogans_v6.json'), 'utf8'),
).exactReplacementKeys;

const somaliHighFrequencyKeys = [
  'hero.eyebrow',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.language',
  'settings.text',
  'settings.misc',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.h.fika',
];

const arabicHighFrequencyKeys = [
  'hero.eyebrow',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'nav.ebook',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.language',
  'settings.text',
  'settings.misc',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.h.fika',
  'footer.about.p',
  'footer.fika',
];

const expectedSomaliCopy = {
  'hero.h1a': expectedHomepageSlogans.so['hero.h1a'],
  'hero.lede': expectedHomepageSlogans.so['hero.lede'],
  'hero.cta1': expectedHomepageSlogans.so['hero.cta1'],
  'hero.cta2': expectedHomepageSlogans.so['hero.cta2'],
  'demo.h1': expectedHomepageSlogans.so['demo.h1'],
  'demo.h2': expectedHomepageSlogans.so['demo.h2'],
  'footer.t1': expectedHomepageSlogans.so['footer.t1'],
  'footer.t2': expectedHomepageSlogans.so['footer.t2'],
  'consent.body':
    'Waxaan isticmaalnaa Google AdSense si aan u muujinno xayaysiisyo kooban. AdSense waxay isticmaashaa cookies, waxaana laga yaabaa inay u adeegsato xayaysiisyo la shakhsiyeeyay. Aqbal dhammaan, kaliya kuwa lagama maarmaanka ah, ama akhri <a href="#/privacy">bogga asturnaanta</a>.',
  'settings.title': 'Dejinta',
  'settings.theme.auto': 'Si otomaatig ah',
  'settings.done': 'Dhammay',
};

const expectedArabicCopy = {
  'hero.h1a': expectedHomepageSlogans.ar['hero.h1a'],
  'hero.lede': expectedHomepageSlogans.ar['hero.lede'],
  'hero.cta1': expectedHomepageSlogans.ar['hero.cta1'],
  'hero.cta2': expectedHomepageSlogans.ar['hero.cta2'],
  'demo.h1': expectedHomepageSlogans.ar['demo.h1'],
  'demo.h2': expectedHomepageSlogans.ar['demo.h2'],
  'footer.t1': expectedHomepageSlogans.ar['footer.t1'],
  'footer.t2': expectedHomepageSlogans.ar['footer.t2'],
  'nav.ebook': 'دليل الدراسة',
  'consent.body':
    'نستخدم Google AdSense لعرض عدد قليل من الإعلانات. قد يستخدم AdSense ملفات تعريف الارتباط، وقد يستعملها للإعلانات المخصّصة. اقبل الكل، أو الضروري فقط، أو اقرأ <a href="#/privacy">صفحة الخصوصية</a>.',
  'settings.theme': 'المظهر',
  'settings.consent.reset': 'إعادة ضبط موافقة ملفات تعريف الارتباط / الإعلانات…',
  'footer.about.p':
    'هذه أداة دراسة مستقلة. يمكنك البدء مجاناً، ومراجعة الدروس، وتجربة الاختبارات التدريبية.',
  'footer.fika': 'صُنع بروح لاغوم · جُرِّب مع القهوة.',
};

const forbiddenSomaliFragments = [
  'Goobinta',
  'Toosan',
  'Gudaha',
  'qaab gaar ah',
  'ka yaraan cabsida ka yaraan',
];

const forbiddenArabicFragments = [
  'اختبار وهمي',
  'موافقة الكوكيز',
  'مُختبر بالقهوة',
  'بناها أشخاص اجتازوا الاختبار',
];

const extraLocales = ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const chapterTwoCivicTermSnippets = {
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
const expectedFooterRoadmapLabels = {
  ckb: 'نەخشەی ڕێگا',
  so: 'Qorshaha horumarinta',
  ti: 'መደብ ምዕባለ',
};
const expectedCentralKurdishLegalReadingTimes = {
  'privacy.meta3.v': '~3 خولەک',
  'terms.meta3.v': '~2 خولەک خوێندنەوە',
};
const forbiddenTigrinyaWorkWelfareTerms = ['kollektivavtal', 'föräldraledighet', 'sjukpenning'];
const forbiddenStaticHomeEducationTerms = /\b(?:Förskola|förskola|universitet)\b/iu;

const englishFallbacksByKey = {
  'hero.lede': "A friendly, unofficial study app for Sweden's medborgarskapsprov.",
  'consent.body': 'We use Google AdSense',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.auto': 'Auto',
  'settings.language': 'Language',
  'settings.text': 'Text size',
  'settings.misc': 'Other',
  'settings.consent.reset': 'Reset cookie',
  'settings.savedHint': 'Changes save automatically',
  'settings.done': 'Done',
  'footer.about.p': 'built by people',
  'footer.app.5': 'Roadmap',
  'footer.fika': 'Fika-tested',
  'nav.ebook': 'Ebook',
};
const chineseScriptLocales = ['zh-Hans', 'zh-Hant'];
const chineseTextPattern = /[\u3400-\u9fff]/;
const asciiSentencePunctuationNearChinese = /[\u3400-\u9fff][,:;?!.]|[,:;?!.][\u3400-\u9fff]/;

function loadExtraI18n() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

function withoutAllowedMarkupAndTokens(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/#[/a-z0-9_-]+/gi, ' ')
    .replace(
      /\b(?:Almost Swedish|Google AdSense|Google Mobile Ads|AdMob|Cookie|cookies|UHR|Skolverket|Migrationsverket|BankID|MVP|EN|SV|SEK|Jantelagen|Allemansrätten|Lagom|Fika|fika)\b/g,
      ' ',
    );
}

test('Somali static-site high-frequency labels use reviewed local copy', () => {
  const extra = loadExtraI18n();
  const somali = extra?.so;

  assert.equal(typeof somali, 'object');
  for (const [key, expected] of Object.entries(expectedSomaliCopy)) {
    assert.equal(somali[key], expected, `Somali ${key} should use reviewed copy`);
  }
});

test('Somali static-site labels reject known machine-like strings and English fallback', () => {
  const extra = loadExtraI18n();
  const somali = extra?.so;

  assert.equal(typeof somali, 'object');
  for (const key of somaliHighFrequencyKeys) {
    const value = somali[key];
    assert.equal(typeof value, 'string', `Somali ${key} must be a string`);
    assert.notEqual(value.trim(), '', `Somali ${key} must not be empty`);

    const englishFallback = englishFallbacksByKey[key];
    if (englishFallback) {
      assert.doesNotMatch(value, new RegExp(englishFallback, 'i'), `${key} uses English fallback`);
    }
  }

  const serializedSomali = Object.values(somali).join('\n');
  for (const fragment of forbiddenSomaliFragments) {
    assert.doesNotMatch(
      serializedSomali,
      new RegExp(fragment, 'i'),
      `Somali dictionary still contains ${fragment}`,
    );
  }
});

test('Chinese static-site labels use script-native sentence punctuation', () => {
  const extra = loadExtraI18n();
  let checkedValues = 0;

  for (const locale of chineseScriptLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    for (const [key, value] of Object.entries(dictionary)) {
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      if (!chineseTextPattern.test(value)) continue;

      checkedValues += 1;
      const learnerText = withoutAllowedMarkupAndTokens(value);
      assert.doesNotMatch(
        learnerText,
        asciiSentencePunctuationNearChinese,
        `${locale}.${key} uses Latin sentence punctuation next to Chinese text`,
      );
    }
  }

  assert.ok(checkedValues > 0, 'Chinese punctuation guard must inspect learner-facing text');
});

test('extra locale footer.app.5 Roadmap English fallback guard covers Central Kurdish Somali and Tigrinya', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['footer.app.5'];
    assert.equal(typeof value, 'string', `${locale}.footer.app.5 must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.footer.app.5 must not be empty`);
    assert.doesNotMatch(
      value,
      /Roadmap/i,
      `${locale}.footer.app.5 must not use the English Roadmap fallback`,
    );
  }

  for (const [locale, expected] of Object.entries(expectedFooterRoadmapLabels)) {
    assert.equal(extra[locale]['footer.app.5'], expected, `${locale}.footer.app.5`);
  }
});

test('Central Kurdish legal reading-time metadata uses localized minutes', () => {
  const extra = loadExtraI18n();
  const centralKurdish = extra?.ckb;

  assert.equal(typeof centralKurdish, 'object');
  for (const [key, expected] of Object.entries(expectedCentralKurdishLegalReadingTimes)) {
    const value = centralKurdish[key];
    assert.equal(value, expected, `ckb.${key}`);
    assert.match(value, /خولەک/, `ckb.${key} should use the Central Kurdish minute unit`);
    assert.doesNotMatch(value, /\bmin\b/i, `ckb.${key} must not contain English min`);
  }
});

test('Tigrinya Home chapter 4 localizes labor and welfare common terms', () => {
  const extra = loadExtraI18n();
  const tigrinya = extra?.ti;

  assert.equal(typeof tigrinya, 'object');
  const description = tigrinya['chap.4.d'];
  assert.equal(typeof description, 'string', 'ti.chap.4.d must be a string');
  assert.match(description, /Skatteverket/, 'ti.chap.4.d should preserve the agency name');
  assert.match(description, /ሓባራዊ ስምምዓት/, 'ti.chap.4.d should localize collective agreements');
  assert.match(description, /ናይ ወለዲ ዕረፍቲ/, 'ti.chap.4.d should localize parental leave');
  assert.match(description, /ጥቕማጥቕሚ ሕማም/, 'ti.chap.4.d should localize sickness benefit');

  for (const term of forbiddenTigrinyaWorkWelfareTerms) {
    assert.doesNotMatch(
      description,
      new RegExp(term, 'i'),
      `ti.chap.4.d must not expose bare Swedish term ${term}`,
    );
  }
});

test('Somali Tigrinya and Turkish Home chapter 6 localize education terms', () => {
  const extra = loadExtraI18n();
  const expectations = {
    so: [/dugsiyada barbaarinta/, /jaamacadda/],
    ti: [/መዋእለ ህጻናት/, /ዩኒቨርሲቲ/],
    tr: [/Anaokulundan/, /üniversiteye/],
  };

  for (const [locale, localizedTerms] of Object.entries(expectations)) {
    const description = extra?.[locale]?.['chap.6.d'];
    assert.equal(typeof description, 'string', `${locale}.chap.6.d must be a string`);
    assert.match(description, /BVC/, `${locale}.chap.6.d should preserve BVC`);
    assert.match(description, /1177/, `${locale}.chap.6.d should preserve 1177`);
    assert.doesNotMatch(
      description,
      forbiddenStaticHomeEducationTerms,
      `${locale}.chap.6.d must not expose bare Swedish education terms`,
    );
    for (const termPattern of localizedTerms) {
      assert.match(description, termPattern, `${locale}.chap.6.d should use ${termPattern}`);
    }
  }
});

test('Arabic static-site high-frequency labels use reviewed local copy', () => {
  const extra = loadExtraI18n();
  const arabic = extra?.ar;

  assert.equal(typeof arabic, 'object');
  for (const [key, expected] of Object.entries(expectedArabicCopy)) {
    assert.equal(arabic[key], expected, `Arabic ${key} should use reviewed copy`);
  }
});

test('Arabic static-site labels reject known machine-like strings and English fallback', () => {
  const extra = loadExtraI18n();
  const arabic = extra?.ar;

  assert.equal(typeof arabic, 'object');
  for (const key of arabicHighFrequencyKeys) {
    const value = arabic[key];
    assert.equal(typeof value, 'string', `Arabic ${key} must be a string`);
    assert.notEqual(value.trim(), '', `Arabic ${key} must not be empty`);

    const englishFallback = englishFallbacksByKey[key];
    if (englishFallback) {
      assert.doesNotMatch(value, new RegExp(englishFallback, 'i'), `${key} uses English fallback`);
    }
  }

  const serializedArabic = Object.values(arabic).join('\n');
  for (const fragment of forbiddenArabicFragments) {
    assert.doesNotMatch(
      serializedArabic,
      new RegExp(fragment, 'i'),
      `Arabic dictionary still contains ${fragment}`,
    );
  }
});
