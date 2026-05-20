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

function footerAboutValues(source) {
  return Array.from(source.matchAll(/"footer\.about\.p": "([^"]+)"/g), (match) => match[1]);
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
    scrollTo() {},
    sessionStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    setTimeout() {},
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
  assert.ok(footerValues.length >= 6, 'all static footer translations should be inspected');
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
    /Source-backed questions/,
    /K.llst.dda fr.gor/,
    /Free to start, study, and take mock exams/,
    /Gratis att b.rja, plugga och g.ra .vningsprov/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static Swedish mock exam copy uses natural unofficial practice wording', () => {
  const keys = [
    'nav.mock',
    'hero.lede',
    'chap.12.t',
    'chap.12.d',
    'faq.1.a',
    'faq.4.a',
    'support.s1.li5',
    'footer.app.4',
    'footer.about.p',
  ];
  const rendered = renderStaticTranslations('sv', keys);
  const staleTerm = ['prov', 'exempel'].join('');
  const surface = [read('site/app.js'), ...rendered.values()].join('\n');

  assert.doesNotMatch(surface, new RegExp(staleTerm, 'i'));
  assert.equal(rendered.get('nav.mock'), 'Övningsprov');
  assert.match(rendered.get('hero.lede'), /tidsatt övningsprov/);
  assert.equal(rendered.get('chap.12.t'), 'Övningsprov & överlevnadsguide');
  assert.match(rendered.get('chap.12.d'), /Tidsatta övningsprov i full längd/);
  assert.match(rendered.get('chap.12.d'), /träna provsituationen/);
  assert.match(rendered.get('faq.4.a'), /göra övningsprov/);
  assert.match(rendered.get('support.s1.li5'), /ett övningsprov som inte går att avsluta/);
  assert.equal(rendered.get('footer.app.4'), 'Övningsprov');
  assert.match(rendered.get('footer.about.p'), /göra övningsprov/);
  assert.match(rendered.get('faq.1.a'), /inte kopplade till UHR/);
});

test('static English mock exam copy remains available', () => {
  const rendered = renderStaticTranslations('en', ['nav.mock', 'faq.4.a', 'footer.app.4']);

  assert.equal(rendered.get('nav.mock'), 'Mock exam');
  assert.match(rendered.get('faq.4.a'), /take mock exams/);
  assert.equal(rendered.get('footer.app.4'), 'Mock exam');
});

test('static footer exposes localized mock exam route', () => {
  const footerHtml = read('site/index.html').match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';

  assert.match(footerHtml, /<a href="#\/mock" data-i18n="footer\.app\.4">Mock exam<\/a>/);
});
