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
const expectedSomaliAccountSyncFragment =
  'calaamadahaaga, qoraalladaada iyo dashboard-kaaga ayaa la isku waafajinayaa dhammaan qalabkaaga';

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
  'dhban',
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
const chapterThreeFundamentalLawLocales = ['ar', 'ckb', 'so', 'ti', 'tr', 'uk'];
const chapterThreeFundamentalLawSnippets = {
  ar: /القوانين الأساسية\s*\(Grundlagarna\)/,
  ckb: /یاسا بنەڕەتییەکان\s*\(Grundlagarna\)/,
  so: /Shuruucda aasaasiga ah\s*\(Grundlagarna\)/i,
  ti: /መሰረታዊ ሕግታት\s*\(Grundlagarna\)/,
  tr: /Temel yasalar\s*\(Grundlagarna\)/i,
  uk: /Основні закони\s*\(Grundlagarna\)/i,
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
const unusedStaticFooterAppKeyAllowlist = {
  'footer.app.1':
    'Retained for legacy marketing-footer dictionaries; the current static footer renders nav.home instead.',
  'footer.app.2':
    'Retained for legacy marketing-footer dictionaries; the current static footer renders nav.practice instead.',
  'footer.app.3':
    'Retained for legacy marketing-footer dictionaries; the current static footer links to the ebook instead of the old Chapters label.',
  'footer.app.5':
    'Retained for legacy marketing-footer dictionaries; Roadmap is not part of the current static footer link set.',
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
const privacyPurchaseActionKeys = ['privacy.lede', 'privacy.s5.p'];
const englishPrivacyPurchaseActionLabel = /\bRemove Ads\b/i;
const purchaseBackendMissingEnglishFallback =
  /Purchase setup|purchase-intent table|Online purchases are not enabled|Something went wrong/i;
const forbiddenTigrinyaWorkWelfareTerms = ['kollektivavtal', 'föräldraledighet', 'sjukpenning'];
const forbiddenStaticHomeEducationTerms = /\b(?:Förskola|förskola|universitet)\b/iu;
const cheatsheetCopyKeys = [
  'cheatsheetClose',
  'cheatsheetTitle',
  'cheatsheetOr',
  'cheatsheetFika',
  'cheatsheetAbba',
  'cheatsheetSnow',
  'cheatsheetVasa',
  'cheatsheetIkea',
  'cheatsheetSkal',
  'cheatsheetLagom',
  'cheatsheetBrand',
  'cheatsheetFlag',
  'cheatsheetQuiet',
  'cheatsheetFact',
  'cheatsheetSwedenMode',
  'cheatsheetToggle',
  'cheatsheetFoot',
];
const cheatsheetEnglishFallbacks = {
  cheatsheetClose: /^Close$/i,
  cheatsheetTitle: /^Hidden things$/i,
  cheatsheetFika: /^coffee break$/i,
  cheatsheetSnow: /^winter$/i,
  cheatsheetVasa: /^a ship sails by$/i,
  cheatsheetIkea: /^some assembly required$/i,
  cheatsheetSkal: /^cheers$/i,
  cheatsheetLagom: /^just right$/i,
  cheatsheetBrand: /^click brand logo$/i,
  cheatsheetFlag: /^flag$/i,
  cheatsheetQuiet: /^click anywhere quiet$/i,
  cheatsheetFact: /^Sweden fact$/i,
  cheatsheetSwedenMode: /^Sweden mode$/i,
  cheatsheetToggle: /^toggle this$/i,
  cheatsheetFoot: /Swedish secrets unlocked/i,
};

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
const chineseQcardAllowedLatinTokens = new Set([
  'Allemansrätten',
  'BankID',
  'Fika',
  'Jantelagen',
  'Lag',
  'Lagom',
  'Sverige',
  'UHR',
  'fokus',
  'i',
  'och',
  'p',
  'rätt',
]);
const chineseQcardAllowedLatinPattern =
  /\b(?:Allemansrätten|BankID|Fika|Jantelagen|Lagom|Sverige|UHR|Lag|fokus|i|och|p|rätt)\b/g;

function loadExtraI18n() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

function loadBaseI18n() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/app.js'), 'utf8');
  const start = source.indexOf('const i18n = (window.i18n = {');
  const endMarker = '\n});\n\nfunction smtMergePreloadedExtraI18n';
  const end = source.indexOf(endMarker, start);

  assert.notEqual(start, -1, 'site/app.js should define the base i18n dictionary');
  assert.notEqual(end, -1, 'base i18n dictionary should end before merge helper');

  const sandbox = { window: {} };
  const dictionarySource = source.slice(start, end + '\n});'.length);
  vm.createContext(sandbox);
  vm.runInContext(`${dictionarySource}\nwindow.i18n;`, sandbox, { timeout: 3000 });
  return sandbox.window.i18n;
}

function loadStaticExtrasCopy() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/extras.js'), 'utf8');
  const instrumented = source.replace(
    '\n  function extrasText(key) {',
    '\n  window.__EXTRAS_COPY = EXTRAS_COPY;\n\n  function extrasText(key) {',
  );
  assert.notEqual(instrumented, source, 'site/extras.js should expose EXTRAS_COPY in test VM');

  const noop = () => {};
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    localStorage: { getItem: () => 'en' },
    window: { addEventListener: noop },
    document: {
      addEventListener: noop,
      querySelectorAll: () => [],
      documentElement: { getAttribute: () => '' },
      body: { appendChild: noop },
      getElementById: () => null,
      createElement: () => ({
        addEventListener: noop,
        remove: noop,
        querySelector: (selector) =>
          selector === '.cheats__close' || selector === '.cheats__panel' ? { focus: noop } : null,
        style: {},
        set id(value) {
          this._id = value;
        },
        get id() {
          return this._id;
        },
        set innerHTML(value) {
          this._innerHTML = value;
        },
        get innerHTML() {
          return this._innerHTML;
        },
      }),
    },
    IntersectionObserver: function IntersectionObserver() {
      this.observe = noop;
      this.unobserve = noop;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(instrumented, sandbox, { timeout: 3000 });
  return sandbox.window.__EXTRAS_COPY;
}

function renderCheatsheetHtml(locale) {
  const source = fs.readFileSync(path.join(repoRoot, 'site/extras.js'), 'utf8');
  const listeners = {};
  const noop = () => {};
  const appended = [];
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    localStorage: { getItem: (key) => (key === 'smt_lang' ? locale : null) },
    window: { addEventListener: noop },
    document: {
      activeElement: null,
      addEventListener: (type, handler) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
      },
      querySelectorAll: () => [],
      documentElement: { getAttribute: () => '' },
      body: { appendChild: (element) => appended.push(element) },
      getElementById: () => null,
      createElement: () => ({
        addEventListener: noop,
        remove: noop,
        querySelector: (selector) =>
          selector === '.cheats__close' || selector === '.cheats__panel' ? { focus: noop } : null,
        style: {},
        set id(value) {
          this._id = value;
        },
        get id() {
          return this._id;
        },
        set innerHTML(value) {
          this._innerHTML = value;
        },
        get innerHTML() {
          return this._innerHTML;
        },
      }),
    },
    IntersectionObserver: function IntersectionObserver() {
      this.observe = noop;
      this.unobserve = noop;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });

  const keydownHandlers = listeners.keydown || [];
  assert.ok(keydownHandlers.length > 0, 'site/extras.js should register keyboard handlers');
  for (const handler of keydownHandlers) {
    handler({ key: '?', shiftKey: false });
  }

  assert.equal(appended.length, 1, `${locale} should render one cheatsheet overlay`);
  return appended[0].innerHTML;
}

function staticFooterHtml() {
  const html = fs.readFileSync(path.join(repoRoot, 'site/index.html'), 'utf8');
  const start = html.indexOf('<footer class="footer">');
  const end = html.indexOf('</footer>', start);

  assert.notEqual(start, -1, 'site/index.html should render the static footer');
  assert.notEqual(end, -1, 'static footer should have a closing footer tag');

  return html.slice(start, end + '</footer>'.length);
}

function collectRenderedStaticFooterAppLinkKeys() {
  const keys = new Set();
  const footer = staticFooterHtml();
  const anchorPattern = /<a\b[^>]*>/g;
  let match;

  while ((match = anchorPattern.exec(footer))) {
    const anchor = match[0];
    const href = anchor.match(/\bhref="([^"]+)"/)?.[1];
    const key = anchor.match(/\bdata-i18n="(footer\.app\.\d+)"/)?.[1];
    if (!key) continue;

    assert.equal(typeof href, 'string', `${key} footer link must include an href`);
    assert.match(href, /^#\//, `${key} footer link should target a static hash route`);
    keys.add(key);
  }

  return keys;
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

test('Somali optional account FAQ uses reviewed dashboard sync wording', () => {
  const extra = loadExtraI18n();
  const somali = extra?.so;

  assert.equal(typeof somali, 'object');
  assert.match(somali['faq.3.a'], new RegExp(expectedSomaliAccountSyncFragment));
  assert.doesNotMatch(somali['faq.3.a'], /\bdhban\b/i);
  assert.doesNotMatch(somali['faq.3.a'], /isugu\s+dhban/i);
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

test('Chinese Home qcard strings reject stray English common nouns', () => {
  const extra = loadExtraI18n();

  for (const locale of chineseScriptLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    for (const [key, value] of Object.entries(dictionary)) {
      if (!key.startsWith('qcard.')) continue;

      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      const learnerText = value.replace(chineseQcardAllowedLatinPattern, ' ');
      const latinTokens = learnerText.match(/\b[A-Za-z][A-Za-z-]*\b/g) ?? [];
      const unexpectedTokens = latinTokens.filter(
        (token) => !chineseQcardAllowedLatinTokens.has(token),
      );

      assert.deepEqual(
        unexpectedTokens,
        [],
        `${locale}.${key} contains non-allowlisted Latin tokens`,
      );
    }
  }

  assert.match(extra['zh-Hans']['qcard.q'], /采摘莓果/);
  assert.doesNotMatch(extra['zh-Hans']['qcard.q'], /\bberries\b/i);
  assert.match(extra['zh-Hant']['qcard.q'], /採莓果/);
});

test('static cheatsheet easter egg copy is localized for every shipped language', () => {
  const extrasCopy = loadStaticExtrasCopy();
  const locales = ['en', 'sv', ...extraLocales];
  const source = fs.readFileSync(path.join(repoRoot, 'site/extras.js'), 'utf8');

  assert.match(source, /aria-label="\$\{extrasText\('cheatsheetClose'\)\}"/);
  assert.match(source, /<h3 id="smt-cheats-title">\$\{extrasText\('cheatsheetTitle'\)\}<\/h3>/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="smt-cheats-title"/);
  assert.doesNotMatch(source, /<h3>Hidden things<\/h3>/);
  assert.doesNotMatch(source, /aria-label="Close"/);
  assert.doesNotMatch(source, /coffee break<\/li>|some assembly required<\/li>|Hej hej\.<\/p>/);

  for (const key of cheatsheetCopyKeys) {
    const dictionary = extrasCopy?.[key];
    assert.equal(typeof dictionary, 'object', `${key} copy dictionary must exist`);

    for (const locale of locales) {
      const value = dictionary[locale];
      assert.equal(typeof value, 'string', `${key}.${locale} must be a string`);
      assert.notEqual(value.trim(), '', `${key}.${locale} must not be empty`);
    }

    for (const locale of extraLocales) {
      const fallback = cheatsheetEnglishFallbacks[key];
      if (!fallback) continue;
      assert.doesNotMatch(
        dictionary[locale],
        fallback,
        `${key}.${locale} must not fall back to English cheatsheet copy`,
      );
    }
  }

  assert.equal(extrasCopy.cheatsheetTitle.sv, 'Gömda saker');
  assert.equal(extrasCopy.cheatsheetClose.ar, 'إغلاق');
  assert.match(extrasCopy.cheatsheetFoot.so, /siraha yar ee Iswiidhan/i);
});

test('static cheatsheet keyboard toggle renders localized overlay HTML for every extra locale', () => {
  for (const locale of extraLocales) {
    const html = renderCheatsheetHtml(locale);

    assert.match(html, /<kbd>fika<\/kbd>/, `${locale} keeps fika command token`);
    assert.match(html, /<kbd>abba<\/kbd>/, `${locale} keeps abba command token`);
    assert.match(html, /<kbd>snö<\/kbd>/, `${locale} keeps snö command token`);
    assert.match(html, /<kbd>snow<\/kbd>/, `${locale} keeps snow command token`);
    assert.match(html, /<kbd>vasa<\/kbd>/, `${locale} keeps vasa command token`);
    assert.match(html, /<kbd>ikea<\/kbd>/, `${locale} keeps ikea command token`);
    assert.match(html, /<kbd>skål<\/kbd>/, `${locale} keeps skål command token`);
    assert.match(html, /<kbd>lagom<\/kbd>/, `${locale} keeps lagom command token`);
    assert.match(html, /<kbd>↑↑↓↓←→←→ b a<\/kbd>/, `${locale} keeps Konami command token`);
    assert.match(html, /<kbd>\?<\/kbd>/, `${locale} keeps question-mark toggle token`);
    assert.doesNotMatch(html, /aria-label="Close"/, `${locale} close label is localized`);
    assert.doesNotMatch(html, /<h3>Hidden things<\/h3>/, `${locale} heading is localized`);
    assert.doesNotMatch(html, /coffee break|some assembly required|click anywhere quiet/);
    assert.doesNotMatch(html, /<p class="cheats__foot">Hej hej\.<\/p>/);
  }
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

test('static footer app dictionary keys are rendered links or explicit legacy unused keys', () => {
  const base = loadBaseI18n();
  const extra = loadExtraI18n();
  const renderedLinkKeys = collectRenderedStaticFooterAppLinkKeys();
  const dictionaries = { en: base.en, sv: base.sv, ...extra };
  const footerAppKeyPattern = /^footer\.app\.\d+$/;
  const unusedKeys = new Set();

  assert.deepEqual(
    [...renderedLinkKeys].sort(),
    ['footer.app.4'],
    'the current static footer should render only the Mock exam footer.app link',
  );

  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);
    const footerAppKeys = Object.keys(dictionary).filter((key) => footerAppKeyPattern.test(key));
    assert.ok(footerAppKeys.length > 0, `${locale} should define footer.app.* keys`);

    for (const key of footerAppKeys) {
      if (renderedLinkKeys.has(key)) continue;

      const rationale = unusedStaticFooterAppKeyAllowlist[key];
      assert.equal(
        typeof rationale,
        'string',
        `${locale}.${key} is kept in dictionaries but is neither rendered as a footer link nor allowlisted`,
      );
      assert.notEqual(rationale.trim(), '', `${key} allowlist entry should explain why it is kept`);
      unusedKeys.add(key);
    }
  }

  assert.deepEqual(
    [...unusedKeys].sort(),
    Object.keys(unusedStaticFooterAppKeyAllowlist).sort(),
    'unused footer.app.* dictionary keys should be intentionally allowlisted with rationale',
  );
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

test('extra locale Privacy copy localizes Remove Ads purchase-action labels', () => {
  const extra = loadExtraI18n();

  for (const locale of extraLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    for (const key of privacyPurchaseActionKeys) {
      const value = dictionary[key];
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      assert.notEqual(value.trim(), '', `${locale}.${key} must not be empty`);
      assert.doesNotMatch(
        value,
        englishPrivacyPurchaseActionLabel,
        `${locale}.${key} must not leak the English Remove Ads action label`,
      );
    }
  }

  assert.match(extra.ti['privacy.lede'], /መወዓውዒታት ኣወግድ/);
  assert.match(extra.ti['privacy.s5.p'], /መወዓውዒታት ኣወግድ/);
});

test('extra locale purchase backend-missing status is localized for every static language', () => {
  const extra = loadExtraI18n();
  const base = loadBaseI18n();

  for (const locale of extraLocales) {
    const value = extra?.[locale]?.['purchase.status.backendMissing'];
    assert.equal(typeof value, 'string', `${locale}.purchase.status.backendMissing must exist`);
    assert.notEqual(value.trim(), '', `${locale}.purchase.status.backendMissing must not be empty`);
    assert.notEqual(
      value,
      base.en['purchase.status.backendMissing'],
      `${locale}.purchase.status.backendMissing must not fall back to English`,
    );
    assert.doesNotMatch(
      value,
      purchaseBackendMissingEnglishFallback,
      `${locale}.purchase.status.backendMissing must not use an English backend-missing fallback`,
    );
  }

  assert.match(extra.ckb['purchase.status.backendMissing'], /خشتەی نیتی کڕین/);
  assert.match(extra.so['purchase.status.backendMissing'], /ujeeddada iibsiga/);
  assert.match(extra.ti['purchase.status.backendMissing'], /ናይ ዕድጊ ድሌት/);
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

test('Arabic Central Kurdish Somali Tigrinya Turkish and Ukrainian Home chapter 3 fundamental laws use localized glosses', () => {
  const extra = loadExtraI18n();

  for (const locale of chapterThreeFundamentalLawLocales) {
    const dictionary = extra?.[locale];
    assert.equal(typeof dictionary, 'object', `${locale} dictionary must exist`);

    const value = dictionary['chap.3.d'];
    assert.equal(typeof value, 'string', `${locale}.chap.3.d must be a string`);
    assert.notEqual(value.trim(), '', `${locale}.chap.3.d must not be empty`);
    assert.match(
      value,
      chapterThreeFundamentalLawSnippets[locale],
      `${locale}.chap.3.d should explain Grundlagarna with a localized term first`,
    );
    assert.ok(
      value.search(chapterThreeFundamentalLawSnippets[locale]) < value.indexOf('Grundlagarna'),
      `${locale}.chap.3.d should place the localized term before the Swedish glossary`,
    );
    assert.doesNotMatch(
      value,
      /^Grundlagarna\b/,
      `${locale}.chap.3.d must not start with bare Swedish Grundlagarna`,
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
