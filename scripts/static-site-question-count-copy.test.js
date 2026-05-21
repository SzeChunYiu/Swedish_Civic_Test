const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function staticQuestionCount() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return context.window.SMT_QUESTIONS.length;
}

function normalizeStaticText(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeStaticStringLiteral(literal) {
  return vm.runInNewContext(literal, {}, { timeout: 1000 });
}

function footerAboutMarkerCount(source) {
  return Array.from(
    source.matchAll(/(?:['"]footer\.about\.p['"]\s*:|data-i18n=["']footer\.about\.p["'])/g),
  ).length;
}

function footerAboutValues(source) {
  const translationPattern =
    /['"]footer\.about\.p['"]\s*:\s*('(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*")/g;
  const htmlFallbackPattern = /<p\b[^>]*\bdata-i18n=["']footer\.about\.p["'][^>]*>([\s\S]*?)<\/p>/g;

  return [
    ...Array.from(source.matchAll(translationPattern), (match) =>
      decodeStaticStringLiteral(match[1]),
    ),
    ...Array.from(source.matchAll(htmlFallbackPattern), (match) => normalizeStaticText(match[1])),
  ];
}

function unsupportedMockParityPatterns() {
  return [
    new RegExp(['real', 'timing'].join('\\s+'), 'i'),
    new RegExp(['real', 'format'].join('\\s+'), 'i'),
    new RegExp(['look', 'and', 'feel', 'like', 'the', 'real', 'thing'].join('\\s+'), 'i'),
    new RegExp(['ready', 'for', 'the', 'real', 'thing'].join('\\s+'), 'i'),
    new RegExp(['känns', 'som', 'det', 'riktiga'].join('\\s+'), 'i'),
    new RegExp(['Kör', 'riktigt', 'format'].join('\\s+'), 'i'),
    new RegExp(['riktig', 'tid'].join('\\s+'), 'i'),
    new RegExp(['Nästan', 'redo', 'för', 'det', 'riktiga'].join('\\s+'), 'i'),
  ];
}

function renderStaticTranslations(lang, keys) {
  const nodes = keys.map((key) => ({
    dataset: { i18n: key },
    innerHTML: '',
  }));
  const languageButtons = ['en', 'sv'].map((value) => ({
    dataset: { lang: value },
    classList: { toggle() {} },
  }));
  const sandbox = {
    CustomEvent: function CustomEvent(type, init = {}) {
      return { detail: init.detail || null, type };
    },
    Event: function Event(type) {
      return { type };
    },
    console,
    document: {
      addEventListener() {},
      createElement() {
        return {};
      },
      documentElement: {
        lang: 'en',
        dir: 'ltr',
        setAttribute(name, value) {
          this[name] = value;
        },
        style: { setProperty() {} },
      },
      getElementById() {
        return null;
      },
      head: { appendChild() {} },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '[data-i18n]') return nodes;
        if (selector === '.lang button[data-lang]') return languageButtons;
        return [];
      },
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    addEventListener() {},
    dispatchEvent() {
      return true;
    },
    location: { hash: '#/' },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame() {},
    sessionStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    setTimeout() {},
    scrollTo() {},
    window: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  sandbox.applyLang(lang);

  return new Map(nodes.map((node) => [node.dataset.i18n, node.innerHTML]));
}

test('static site product-count copy rejects stale hardcoded 500 claims', () => {
  const questionCount = staticQuestionCount();
  const surface = [read('site/index.html'), read('site/app.js'), read('site/i18n-extras.js')].join(
    '\n',
  );
  const footerValues = footerAboutValues(surface);

  assert.ok(questionCount > 500, 'test expects the current bank to exceed 500 questions');
  assert.equal(
    footerValues.length,
    footerAboutMarkerCount(surface),
    'all static footer translations should be inspected',
  );
  assert.ok(footerValues.length >= 6, 'static footer translations should cover shipped locales');
  assert.ok(footerValues.every((value) => !/\b500\b|500\+/.test(value)));

  [
    /core\s*500/i,
    /500\+\s*questions/i,
    /500\+\s*fr.gor/i,
    /footer\.about\.p["']?\s*:\s*["'][^"']*500/,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site count-sensitive copy uses non-numeric current-bank wording', () => {
  const surface = [read('site/index.html'), read('site/app.js'), read('site/i18n-extras.js')].join(
    '\n',
  );

  [
    /source-backed/i,
    /visible source lines/i,
    /k.llst.tt/i,
    /tydliga k.llrader/i,
    /Free to start, free to study, and free to take mock exams/,
    /Free to start, study, and take mock exams/,
    /Gratis att b.rja, plugga och .va med .vningsprov/,
    /Gratis att b.rja, plugga och g.ra .vningsprov/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static Swedish mock exam copy uses natural unofficial practice wording', () => {
  const keys = [
    'nav.mock',
    'hero.lede',
    'demo.li3',
    'chap.12.t',
    'chap.12.d',
    'how.s3.p',
    'faq.1.a',
    'faq.4.a',
    'support.s1.li5',
    'footer.app.4',
    'footer.about.p',
  ];
  const rendered = renderStaticTranslations('sv', keys);
  const surface = [read('site/app.js'), ...rendered.values()].join('\n');

  assert.doesNotMatch(surface, /provexempel/i);
  assert.equal(rendered.get('nav.mock'), 'Övningsprov');
  assert.match(rendered.get('hero.lede'), /tidsatt övningsprov/);
  assert.match(rendered.get('demo.li3'), /tidsatt övning/);
  assert.equal(rendered.get('chap.12.t'), 'Övningsprov & överlevnadsguide');
  assert.match(rendered.get('chap.12.d'), /Tidsatta övningsprov i full längd/);
  assert.match(rendered.get('chap.12.d'), /träna provsituationen/);
  assert.match(rendered.get('how.s3.p'), /Det officiella upplägget kan ändras/);
  assert.match(rendered.get('faq.4.a'), /göra övningsprov/);
  assert.match(rendered.get('support.s1.li5'), /ett övningsprov som inte går att avsluta/);
  assert.equal(rendered.get('footer.app.4'), 'Övningsprov');
  assert.match(rendered.get('footer.about.p'), /göra övningsprov/);
  assert.match(rendered.get('faq.1.a'), /inte kopplade till UHR/);
  unsupportedMockParityPatterns().forEach((pattern) => {
    assert.doesNotMatch(surface, pattern);
  });
});

test('static English mock exam copy remains available', () => {
  const rendered = renderStaticTranslations('en', [
    'nav.mock',
    'demo.li3',
    'chap.12.d',
    'how.s3.p',
    'faq.4.a',
    'footer.app.4',
  ]);
  const surface = [read('site/app.js'), ...rendered.values()].join('\n');

  assert.equal(rendered.get('nav.mock'), 'Mock exam');
  assert.match(rendered.get('demo.li3'), /timed practice flow/);
  assert.match(rendered.get('chap.12.d'), /without claiming to mirror the official test/);
  assert.match(rendered.get('how.s3.p'), /official format can still change/);
  assert.match(rendered.get('faq.4.a'), /take mock exams/);
  assert.equal(rendered.get('footer.app.4'), 'Mock exam');
  unsupportedMockParityPatterns().forEach((pattern) => {
    assert.doesNotMatch(surface, pattern);
  });
});
