const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const sampleQuestion = {
  id: 'q-settings-language',
  type: 'single_choice',
  chapter: 'Ch. 1',
  chapterId: 1,
  q: {
    en: 'Where is Sweden located?',
    sv: 'Var ligger Sverige?',
  },
  opts: [
    { en: 'In southern Europe', sv: 'I södra Europa' },
    { en: 'In the Nordic region in northern Europe', sv: 'I Norden i norra Europa' },
  ],
  answer: 1,
  why: {
    en: 'Sweden is part of the Nordic region in northern Europe.',
    sv: 'Sverige är en del av Norden i norra Europa.',
  },
  source: {
    title: 'Sverige i fokus',
    chapter: 'Landet Sverige',
    section: 'Geografi',
    page: 7,
  },
};

const chapterMeta = [
  {
    id: 1,
    emoji: '01',
    title: {
      en: 'Land of Sweden',
      sv: 'Landet Sverige',
    },
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createRenderContext({ buttonLanguages = ['en', 'sv'], hash, language = 'en' }) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const storage = new Map([
    ['smt_lang', language],
    ['smt_mock_cfg', JSON.stringify({ count: 5, minutes: 30, chapters: [1] })],
  ]);
  let reloadCount = 0;

  const settingButtons = buttonLanguages.map((value) => {
    const classes = new Set();
    return {
      dataset: { val: value },
      classList: {
        contains(name) {
          return classes.has(name);
        },
        toggle(name, force) {
          const on = force === undefined ? !classes.has(name) : Boolean(force);
          if (on) classes.add(name);
          else classes.delete(name);
        },
      },
    };
  });

  function element(id) {
    if (!elements.has(id)) {
      const node = {
        id,
        hidden: false,
        innerHTML: '',
        max: '',
        style: {},
        textContent: '',
        value: id === 'cfg-count' ? '5' : '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        closest() {
          return {
            querySelector() {
              return { textContent: '' };
            },
          };
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      };
      elements.set(id, node);
    }
    return elements.get(id);
  }

  const sandbox = {
    Array,
    CustomEvent: function CustomEvent(type, init = {}) {
      return { type, detail: init.detail || null };
    },
    console,
    confirm: () => true,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      removeItem(key) {
        storage.delete(key);
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: {
      hash,
      reload() {
        reloadCount += 1;
      },
    },
    document: {
      body: { style: {} },
      documentElement: {
        dir: language === 'ar' ? 'rtl' : 'ltr',
        lang: language,
        setAttribute(name, value) {
          this[name] = String(value);
        },
        style: { setProperty() {} },
      },
      createElement() {
        return {
          async: false,
          crossOrigin: '',
          src: '',
        };
      },
      getElementById: element,
      head: { appendChild() {} },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '[data-set="language"] button') return settingButtons;
        return [];
      },
      addEventListener(type, handler) {
        listeners.document.push({ type, handler });
      },
    },
    sessionStorage: {
      getItem() {
        return null;
      },
      removeItem() {},
      setItem() {},
    },
    window: {},
    clearInterval() {},
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
    }),
    requestAnimationFrame(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
    setInterval: () => 1,
    setTimeout(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
  };

  sandbox.window = sandbox;
  sandbox.window.SMT_CHAPTERS_META = chapterMeta;
  sandbox.window.SMT_QUESTIONS = [sampleQuestion];
  sandbox.window.addEventListener = (type, handler) => {
    listeners.window.push({ type, handler });
  };
  sandbox.window.dispatchEvent = (event) => {
    listeners.window
      .filter((entry) => entry.type === event.type)
      .forEach((entry) => entry.handler(event));
    return true;
  };
  sandbox.window.scrollTo = () => {};

  vm.createContext(sandbox);
  return {
    clickSettingsLanguage(nextLanguage) {
      const target = {
        dataset: { val: nextLanguage },
        parentElement: { dataset: { set: 'language' } },
        closest(selector) {
          return selector === '[data-set] button[data-val]:not(.set-palette)' ? this : null;
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'click')
        .forEach((entry) => entry.handler({ target }));
    },
    clickSettingsOpen() {
      const target = {
        closest(selector) {
          return selector === '#settings-open' ? this : null;
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'click')
        .forEach((entry) => entry.handler({ target }));
    },
    element,
    fireWindowEvent(type) {
      listeners.window
        .filter((entry) => entry.type === type)
        .forEach((entry) => entry.handler({ type }));
    },
    get reloadCount() {
      return reloadCount;
    },
    sandbox,
    selectedSettingsLanguage() {
      return settingButtons.find((button) => button.classList.contains('is-on'))?.dataset.val;
    },
    storage,
  };
}

function loadScripts(context, practiceInjection = '', { includeExtras = false } = {}) {
  vm.runInContext(read('site/app.js'), context.sandbox, { timeout: 3000 });
  if (includeExtras)
    vm.runInContext(read('site/i18n-extras.js'), context.sandbox, { timeout: 3000 });
  const practiceSource = practiceInjection
    ? read('site/practice.js').replace(/\}\)\(\);\s*$/, `${practiceInjection}\n})();`)
    : read('site/practice.js');
  vm.runInContext(practiceSource, context.sandbox, { timeout: 3000 });
  vm.runInContext(read('site/settings.js'), context.sandbox, { timeout: 3000 });
}

test('Settings language change rerenders an active Practice question without reload', () => {
  const context = createRenderContext({ hash: '#/practice?c=1', language: 'en' });
  loadScripts(context);
  vm.runInContext('smtQuizRender();', context.sandbox, { timeout: 3000 });

  assert.match(context.element('quiz-stage').innerHTML, /Where is Sweden located\?/);
  context.clickSettingsLanguage('sv');

  const html = context.element('quiz-stage').innerHTML;
  assert.match(html, /Var ligger Sverige\?/);
  assert.match(html, /I Norden i norra Europa/);
  assert.match(html, /Fråga 1 \/ 1/);
  assert.equal(context.storage.get('smt_lang'), 'sv');
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders the Mock landing without reload', () => {
  const context = createRenderContext({ hash: '#/mock', language: 'en' });
  loadScripts(context, 'renderMockLanding();');

  assert.match(context.element('mock-stage').innerHTML, /Build your exam\./);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Bygg din tentamen\./);
  assert.match(html, /Starta tentamen/);
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders an active Mock exam without reload', () => {
  const context = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  loadScripts(
    context,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [null];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = false;',
      'renderMockExam();',
    ].join('\n'),
  );

  assert.match(context.element('mock-stage').innerHTML, /Mock exam/);
  assert.match(context.element('mock-stage').innerHTML, /Time left/);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Skarp tentamen/);
  assert.match(html, /Återstår/);
  assert.match(html, /Lämna in/);
  assert.match(html, /Var ligger Sverige\?/);
  assert.equal(context.reloadCount, 0);
});

test('Settings language change rerenders submitted Mock results without restarting', () => {
  const context = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  loadScripts(
    context,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [1];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = true;',
      'renderMockResult();',
    ].join('\n'),
  );

  assert.match(context.element('mock-stage').innerHTML, /Question review/);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Frågegenomgång/);
  assert.match(html, /Rätt svar/);
  assert.doesNotMatch(html, /Build your exam|Bygg din tentamen/);
  assert.equal(context.reloadCount, 0);
});

test('Unsupported saved static-site language falls back to English on boot and in Settings', () => {
  const context = createRenderContext({
    buttonLanguages: ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'so', 'bogus-locale'],
    hash: '#/',
    language: 'bogus-locale',
  });
  loadScripts(context, '', { includeExtras: true });

  context.fireWindowEvent('DOMContentLoaded');
  context.clickSettingsOpen();

  assert.equal(context.sandbox.document.documentElement.lang, 'en');
  assert.equal(context.sandbox.document.documentElement.dir, 'ltr');
  assert.equal(context.storage.get('smt_lang'), 'en');
  assert.equal(context.selectedSettingsLanguage(), 'en');

  context.clickSettingsLanguage('bogus-locale');

  assert.equal(context.sandbox.document.documentElement.lang, 'en');
  assert.equal(context.sandbox.document.documentElement.dir, 'ltr');
  assert.equal(context.storage.get('smt_lang'), 'en');
  assert.equal(context.selectedSettingsLanguage(), 'en');
  assert.equal(context.reloadCount, 0);
});

test('Valid extra static-site languages survive normalization and Arabic sets RTL direction', () => {
  const context = createRenderContext({
    buttonLanguages: ['en', 'sv', 'zh-Hans', 'zh-Hant', 'ar', 'so'],
    hash: '#/',
    language: 'ar',
  });
  loadScripts(context, '', { includeExtras: true });

  context.fireWindowEvent('DOMContentLoaded');
  context.clickSettingsOpen();

  assert.equal(context.sandbox.document.documentElement.lang, 'ar');
  assert.equal(context.sandbox.document.documentElement.dir, 'rtl');
  assert.equal(context.storage.get('smt_lang'), 'ar');
  assert.equal(context.selectedSettingsLanguage(), 'ar');

  context.clickSettingsLanguage('zh-Hans');

  assert.equal(context.sandbox.document.documentElement.lang, 'zh-Hans');
  assert.equal(context.sandbox.document.documentElement.dir, 'ltr');
  assert.equal(context.storage.get('smt_lang'), 'zh-Hans');
  assert.equal(context.selectedSettingsLanguage(), 'zh-Hans');
  assert.equal(context.reloadCount, 0);
});
