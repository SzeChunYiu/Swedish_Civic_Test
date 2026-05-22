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
const chapterOneFolkhemmetSnippets = {
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
const chapterSixEducationLocales = ['so', 'ti', 'tr'];
const chapterSixEducationSnippets = {
  so: /dugsiyada barbaarinta.+jaamacadda/,
  ti: /መዋእለ ህጻናት.+ዩኒቨርሲቲ/,
  tr: /Anaokulundan.+üniversiteye/,
};
const chapterElevenCitizenshipSnippets = {
  'zh-Hans': /公民身份（medborgarskap）/,
  'zh-Hant': /公民身分（medborgarskap）/,
  ar: /الجنسية\s*\(medborgarskap\)/,
  ckb: /هاووڵاتیبوون\s*\(medborgarskap\)/,
  fa: /شهروندی\s*\(medborgarskap\)/,
  pl: /obywatelstwem\s*\(medborgarskap\)/i,
  so: /jinsiyadda\s*\(medborgarskap\)/i,
  ti: /ዜግነት\s*\(medborgarskap\)/,
  tr: /vatandaşlık\s*\(medborgarskap\)/i,
  uk: /громадянством\s*\(medborgarskap\)/i,
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
const supportMetadataValueKeys = ['support.meta1.v', 'support.meta2.v', 'support.meta3.v'];
const supportMetadataEnglishFallbacks = {
  'support.meta1.v': /~2 business days/i,
  'support.meta2.v': /English or Swedish/i,
  'support.meta3.v': /^Free$/i,
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

function assertMedborgarskapOnlyAsParentheticalGloss(value, label) {
  const lower = value.toLowerCase();
  let index = lower.indexOf('medborgarskap');
  assert.notEqual(index, -1, `${label} should keep medborgarskap only as a glossary token`);

  while (index !== -1) {
    const previousCharacter = value[index - 1];
    assert.ok(
      previousCharacter === '(' || previousCharacter === '（',
      `${label} must place medborgarskap inside parentheses after a localized term`,
    );
    index = lower.indexOf('medborgarskap', index + 1);
  }
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

test('extra locale Support metadata values reject English fallbacks', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    for (const key of supportMetadataValueKeys) {
      const value = dictionary[key];
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      assert.notEqual(value.trim(), '', `${locale}.${key} must not be empty`);
      assert.doesNotMatch(
        value,
        supportMetadataEnglishFallbacks[key],
        `${locale}.${key} must not use an English fallback`,
      );
    }
  }

  assert.equal(extra.ckb['support.meta1.v'], '~2 ڕۆژی کاری');
  assert.match(extra.ckb['support.meta1.v'], /ڕۆژی کاری/);
});

test('extra locale Home chapter 1 folkhemmet glossary terms use localized wording first', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['chap.1.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.1.d must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.chap.1.d must not be empty`);

    const localizedIndex = value.search(chapterOneFolkhemmetSnippets[locale]);
    const glossaryIndex = value.toLowerCase().indexOf('folkhemmet');
    assert.notEqual(localizedIndex, -1, `${locale}.chap.1.d should explain folkhemmet locally`);
    assert.notEqual(glossaryIndex, -1, `${locale}.chap.1.d should retain folkhemmet as glossary`);
    assert.ok(
      localizedIndex < glossaryIndex,
      `${locale}.chap.1.d should put localized wording before folkhemmet`,
    );
    assert.doesNotMatch(
      value,
      /[←→]\s*folkhemmet\s*(?:[←→.]|$)/i,
      `${locale}.chap.1.d must not render bare folkhemmet in the timeline`,
    );
  }
});

test('extra locale Home chapter 2 civic terms use localized nouns', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['chap.2.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.2.d must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.chap.2.d must not be empty`);
    assert.match(
      value,
      chapterTwoCivicTermSnippets[locale],
      `${locale}.chap.2.d should localize kommun/region civic terms`,
    );
    assert.doesNotMatch(
      value,
      /\b(?:kommun|region|regering)\b/i,
      `${locale}.chap.2.d must not keep bare Swedish civic-term tokens`,
    );
  }
});

test('Somali Tigrinya and Turkish Home chapter 6 education terms use localized nouns', () => {
  const extra = loadExtraI18n();

  for (const locale of chapterSixEducationLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['chap.6.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.6.d must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.chap.6.d must not be empty`);
    assert.match(
      value,
      chapterSixEducationSnippets[locale],
      `${locale}.chap.6.d should localize preschool/university nouns`,
    );
    assert.match(value, /BVC/, `${locale}.chap.6.d should preserve the BVC acronym`);
    assert.match(value, /1177/, `${locale}.chap.6.d should preserve the 1177 reference`);
    assert.doesNotMatch(
      value,
      forbiddenStaticHomeEducationTerms,
      `${locale}.chap.6.d must not keep bare Swedish education terms`,
    );
  }
});

test('extra locale Home chapter 11 citizenship terms use localized wording before glossary', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['chap.11.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.11.d must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.chap.11.d must not be empty`);
    assert.match(
      value,
      chapterElevenCitizenshipSnippets[locale],
      `${locale}.chap.11.d should localize citizenship before the Swedish glossary`,
    );
    assertMedborgarskapOnlyAsParentheticalGloss(value, `${locale}.chap.11.d`);
    assert.match(value, /PUT/, `${locale}.chap.11.d should preserve the PUT acronym`);
    assert.doesNotMatch(
      value,
      /PUT[^.。؟]*,\s*medborgarskap|medborgarskap\s*[（(]/iu,
      `${locale}.chap.11.d must not render bare medborgarskap before the localized term`,
    );
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
