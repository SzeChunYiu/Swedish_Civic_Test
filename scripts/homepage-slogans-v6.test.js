const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const pack = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data/homepage_slogans_v6.json'), 'utf8'),
);
const expected = pack.exactReplacementKeys;
const homepageLocales = [
  'en',
  'sv',
  'zh-Hans',
  'zh-Hant',
  'ar',
  'ckb',
  'fa',
  'so',
  'ti',
  'pl',
  'tr',
  'uk',
];
const rtlLocales = new Set(['ar', 'fa', 'ckb']);
const oldHomepageFragments = [/Plain rules,/i, /Brag at midsommar/i, /Skryt på midsommar/i];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing marker ${marker}`);
  const start = source.indexOf('{', markerIndex);
  assert.notEqual(start, -1, `missing object start for ${marker}`);

  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
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

function loadStaticDictionaries() {
  const app = vm.runInNewContext(`(${extractObjectLiteral(read('site/app.js'), 'const i18n =')})`);
  const extras = vm.runInNewContext(
    `(${extractObjectLiteral(read('site/i18n-extras.js'), 'const extra =')})`,
  );
  return { ...app, ...extras };
}

function loadLanguageHelpers({
  preloadedExtras = false,
  readyState = 'loading',
  savedLanguage = null,
} = {}) {
  const source = read('site/app.js');
  const start = source.indexOf('const i18n =');
  const end = source.indexOf("document.addEventListener('click', (e) => {", start);
  assert.notEqual(start, -1, 'missing i18n helper start');
  assert.notEqual(end, -1, 'missing i18n helper end');

  const extras = vm.runInNewContext(
    `(${extractObjectLiteral(read('site/i18n-extras.js'), 'const extra =')})`,
  );
  const attributes = new Map();
  const translatedElement = {
    dataset: { i18n: 'hero.cta1' },
    innerHTML: '',
  };
  const a11yAttributes = new Map();
  const a11yElement = {
    dataset: { a11yLabel: 'a11y.settings.open' },
    setAttribute(name, value) {
      a11yAttributes.set(name, String(value));
    },
  };
  const languageButtons = homepageLocales.map((locale) => ({
    dataset: { lang: locale },
    classList: {
      toggle(name, on) {
        attributes.set(`button:${locale}:${name}`, String(on));
      },
    },
    setAttribute(name, value) {
      attributes.set(`button:${locale}:${name}`, String(value));
    },
  }));
  const storage = new Map(savedLanguage ? [['smt_lang', savedLanguage]] : []);
  const sandbox = {
    CustomEvent: function CustomEvent(type, init = {}) {
      return { type, detail: init.detail || null };
    },
    Event: function Event(type) {
      return { type };
    },
    document: {
      documentElement: {
        setAttribute(name, value) {
          attributes.set(name, String(value));
          this[name] = String(value);
        },
      },
      readyState,
      querySelectorAll(selector) {
        assert.ok(
          selector === '[data-i18n]' ||
            selector === '[data-a11y-label]' ||
            selector === '.lang button[data-lang]',
          `unexpected selector ${selector}`,
        );
        if (selector === '[data-i18n]') return [translatedElement];
        if (selector === '[data-a11y-label]') return [a11yElement];
        return languageButtons;
      },
      querySelector(selector) {
        assert.equal(selector, 'meta[name="description"]');
        return {
          setAttribute(name, value) {
            attributes.set(`meta:${name}`, String(value));
          },
        };
      },
    },
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
        attributes.set(`localStorage:${key}`, String(value));
      },
    },
    window: {
      __i18n_extra: preloadedExtras ? extras : undefined,
      dispatchEvent() {
        return true;
      },
    },
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(source.slice(start, end), sandbox, { timeout: 3000 });
  if (!preloadedExtras) Object.assign(sandbox.window.i18n, extras);
  return { a11yAttributes, attributes, extras, sandbox, translatedElement };
}

test('homepage slogans v6 exact replacement keys are merged for every supported locale', () => {
  const dictionaries = loadStaticDictionaries();

  assert.deepEqual(Object.keys(expected), homepageLocales);
  for (const locale of homepageLocales) {
    assert.equal(typeof dictionaries[locale], 'object', `missing ${locale} dictionary`);
    for (const [key, value] of Object.entries(expected[locale])) {
      assert.equal(
        dictionaries[locale][key],
        value,
        `${locale}.${key} must match homepage slogans v6`,
      );
      assert.notEqual(
        String(dictionaries[locale][key]).trim(),
        '',
        `${locale}.${key} must not be empty`,
      );
      for (const fragment of oldHomepageFragments) {
        assert.doesNotMatch(
          dictionaries[locale][key],
          fragment,
          `${locale}.${key} kept old placeholder copy`,
        );
      }
    }
    assert.equal(dictionaries[locale].brand, 'Almost Swedish', `${locale} must preserve brand`);
  }
});

test('homepage slogans v6 keeps Chinese locale split and blocks old outcome slogans', () => {
  const dictionaries = loadStaticDictionaries();
  assert.match(dictionaries['zh-Hans']['hero.eyebrow'], /无需账号/);
  assert.match(dictionaries['zh-Hans']['footer.t1'], /备考/);
  assert.doesNotMatch(dictionaries['zh-Hans']['hero.eyebrow'], /不用帳號/);
  assert.doesNotMatch(dictionaries['zh-Hans']['hero.lede'], /步調/);

  assert.match(dictionaries['zh-Hant']['hero.eyebrow'], /不用帳號/);
  assert.match(dictionaries['zh-Hant']['footer.t1'], /準備/);
  assert.doesNotMatch(dictionaries['zh-Hant']['hero.eyebrow'], /无需账号/);
  assert.doesNotMatch(dictionaries['zh-Hant']['hero.lede'], /步调/);

  const joinedHomeCopy = homepageLocales
    .flatMap((locale) => Object.keys(expected[locale]).map((key) => dictionaries[locale][key]))
    .join('\n');
  for (const pattern of [
    /Pass the test/i,
    /Earn the passport/i,
    /Klara provet/i,
    /Få passet/i,
    /拿到护照/,
    /拿到護照/,
  ]) {
    assert.doesNotMatch(
      joinedHomeCopy,
      pattern,
      `homepage copy contains outcome promise ${pattern}`,
    );
  }
});

test('homepage language helpers set rtl direction for Arabic, Persian, and Central Kurdish only', () => {
  const { sandbox, attributes } = loadLanguageHelpers();

  for (const locale of homepageLocales) {
    vm.runInContext(`smtSetLanguage(${JSON.stringify(locale)})`, sandbox, { timeout: 3000 });
    assert.equal(attributes.get('lang'), locale, `${locale} lang attribute`);
    assert.equal(
      attributes.get('dir'),
      rtlLocales.has(locale) ? 'rtl' : 'ltr',
      `${locale} dir attribute`,
    );
    assert.equal(attributes.get('localStorage:smt_lang'), locale, `${locale} persisted language`);
  }

  vm.runInContext('smtSetLanguage("not-a-locale")', sandbox, { timeout: 3000 });
  assert.equal(attributes.get('lang'), 'en');
  assert.equal(attributes.get('dir'), 'ltr');
});

test('homepage language helpers consume preloaded extra locales before saved language apply', () => {
  const { a11yAttributes, attributes, extras, sandbox, translatedElement } = loadLanguageHelpers({
    preloadedExtras: true,
    savedLanguage: 'so',
  });

  assert.equal(sandbox.window.__i18n_extra, undefined);
  assert.equal(typeof sandbox.window.i18n.so, 'object');

  vm.runInContext('smtApplySavedLanguage()', sandbox, { timeout: 3000 });

  assert.equal(attributes.get('lang'), 'so');
  assert.equal(attributes.get('dir'), 'ltr');
  assert.equal(attributes.get('localStorage:smt_lang'), 'so');
  assert.equal(translatedElement.innerHTML, expected.so['hero.cta1']);
  assert.equal(a11yAttributes.get('aria-label'), extras.so['a11y.settings.open']);
});

test('homepage language helpers apply preloaded saved locale after DOM is ready', () => {
  const { a11yAttributes, attributes, extras, sandbox, translatedElement } = loadLanguageHelpers({
    preloadedExtras: true,
    readyState: 'complete',
    savedLanguage: 'so',
  });

  assert.equal(sandbox.window.__i18n_extra, undefined);
  assert.equal(attributes.get('lang'), 'so');
  assert.equal(attributes.get('dir'), 'ltr');
  assert.equal(attributes.get('localStorage:smt_lang'), 'so');
  assert.equal(translatedElement.innerHTML, expected.so['hero.cta1']);
  assert.equal(a11yAttributes.get('aria-label'), extras.so['a11y.settings.open']);
});
