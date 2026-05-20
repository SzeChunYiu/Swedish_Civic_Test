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

function createRenderContext({ hash, language = 'en', reducedMotion = false }) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const rootAttributes = new Map();
  const storage = new Map([
    ['smt_lang', language],
    ['smt_mock_cfg', JSON.stringify({ count: 5, minutes: 30, chapters: [1] })],
  ]);
  let reloadCount = 0;

  const settingButtons = ['en', 'sv'].map((value) => ({
    dataset: { val: value },
    classList: { toggle() {} },
  }));
  const a11yControlKeys = new Map([
    ['settings-open', 'a11y.settings.open'],
    ['settings-modal-close', 'a11y.close'],
    ['ad-anchor-close', 'a11y.ad.close'],
    ['dala-bubble-close', 'a11y.close'],
    ['dala-figure', 'a11y.studyBuddy'],
  ]);

  function element(id) {
    if (!elements.has(id)) {
      const attributes = new Map();
      const node = {
        id,
        attributes,
        dataset: a11yControlKeys.has(id) ? { a11yLabel: a11yControlKeys.get(id) } : {},
        hidden: false,
        innerHTML: '',
        max: '',
        style: {},
        textContent: '',
        value: id === 'cfg-count' ? '5' : '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        setAttribute(name, value) {
          attributes.set(name, String(value));
        },
        getAttribute(name) {
          return attributes.get(name) ?? null;
        },
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
  Array.from(a11yControlKeys.keys()).forEach(element);

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
        lang: language,
        setAttribute(name, value) {
          rootAttributes.set(name, String(value));
        },
        getAttribute(name) {
          return rootAttributes.get(name) ?? null;
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
        if (selector === '[data-a11y-label]') {
          return Array.from(elements.values()).filter((node) => node.dataset.a11yLabel);
        }
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
    matchMedia: (query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
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
    changeSettingsMotion(checked) {
      const target = {
        checked,
        dataset: { set: 'motion' },
        matches(selector) {
          return selector === 'input[type=checkbox][data-set]';
        },
      };
      listeners.document
        .filter((entry) => entry.type === 'change')
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
    rootAttribute(name) {
      return rootAttributes.get(name) ?? null;
    },
    sandbox,
    storage,
  };
}

function loadScripts(context, practiceInjection = '') {
  vm.runInContext(read('site/app.js'), context.sandbox, { timeout: 3000 });
  vm.runInContext(read('site/i18n-extras.js'), context.sandbox, { timeout: 3000 });
  const practiceSource = practiceInjection
    ? read('site/practice.js').replace(/\}\)\(\);\s*$/, `${practiceInjection}\n})();`)
    : read('site/practice.js');
  vm.runInContext(practiceSource, context.sandbox, { timeout: 3000 });
  vm.runInContext(read('site/settings.js'), context.sandbox, { timeout: 3000 });
}

test('Static icon-control accessible names follow smtSetLanguage without reload', () => {
  const context = createRenderContext({ hash: '#/', language: 'en' });
  loadScripts(context);

  assert.equal(context.element('settings-open').getAttribute('aria-label'), 'Settings');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), 'Close');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), 'Close ad');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), 'Close');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), 'Study buddy');

  context.clickSettingsLanguage('sv');

  assert.equal(context.element('settings-open').getAttribute('aria-label'), 'Inställningar');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), 'Stäng');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), 'Stäng annons');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), 'Stäng');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), 'Studiekompis');
  assert.equal(context.reloadCount, 0);

  vm.runInContext('smtSetLanguage("zh-Hans");', context.sandbox, { timeout: 3000 });

  assert.equal(context.element('settings-open').getAttribute('aria-label'), '设置');
  assert.equal(context.element('settings-modal-close').getAttribute('aria-label'), '关闭');
  assert.equal(context.element('ad-anchor-close').getAttribute('aria-label'), '关闭广告');
  assert.equal(context.element('dala-bubble-close').getAttribute('aria-label'), '关闭');
  assert.equal(context.element('dala-figure').getAttribute('aria-label'), '学习伙伴');
  assert.equal(context.reloadCount, 0);
});

test('Settings Reduce motion toggle persists smt_motion and updates the static root flag', () => {
  const context = createRenderContext({ hash: '#/', language: 'en' });
  const motionEvents = [];
  loadScripts(context);
  context.sandbox.window.addEventListener('smt:motionchange', (event) => {
    motionEvents.push(event.detail.reduced);
  });

  context.changeSettingsMotion(true);

  assert.equal(context.storage.get('smt_motion'), 'reduce');
  assert.equal(context.rootAttribute('data-motion'), 'reduce');
  assert.deepEqual(motionEvents, [true]);
  assert.equal(context.reloadCount, 0);

  context.changeSettingsMotion(false);

  assert.equal(context.storage.get('smt_motion'), '');
  assert.equal(context.rootAttribute('data-motion'), '');
  assert.deepEqual(motionEvents, [true, false]);
  assert.equal(context.reloadCount, 0);
});

test('Settings applies prefers-reduced-motion on first load without claiming a user preference', () => {
  const context = createRenderContext({ hash: '#/', language: 'en', reducedMotion: true });
  loadScripts(context);

  context.fireWindowEvent('DOMContentLoaded');

  assert.equal(context.rootAttribute('data-motion'), 'reduce');
  assert.equal(context.storage.has('smt_motion'), false);
});

const mockOfficialPassLineClaimPatterns = [
  new RegExp(['passing', 'line'].join('\\s+'), 'i'),
  new RegExp('godk' + '[aä]nt[-\\s]*gr[aä]ns', 'i'),
  new RegExp('75\\s*' + '%\\s*next\\s*time', 'i'),
  new RegExp(['you', 'passed'].join('\\s+'), 'i'),
  new RegExp('underk' + '[aä]nt', 'i'),
  new RegExp('godk' + '[aä]nt', 'i'),
];

function assertNoMockOfficialPassLineCopy(html) {
  for (const pattern of mockOfficialPassLineClaimPatterns) {
    assert.doesNotMatch(html, pattern);
  }
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
  assert.match(context.element('mock-stage').innerHTML, /Practice score/);
  assertNoMockOfficialPassLineCopy(context.element('mock-stage').innerHTML);
  context.clickSettingsLanguage('sv');

  const html = context.element('mock-stage').innerHTML;
  assert.match(html, /Bygg ditt övningsprov\./);
  assert.match(html, /Starta övningsprov/);
  assert.match(html, /Övningspoäng/);
  assertNoMockOfficialPassLineCopy(html);
  assert.doesNotMatch(html, /Skarp tentamen|Bygg din tentamen|Starta tentamen/);
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
  assert.match(html, /Övningsprov/);
  assert.match(html, /Återstår/);
  assert.match(html, /Lämna in/);
  assert.match(html, /Var ligger Sverige\?/);
  assert.doesNotMatch(html, /Skarp tentamen|tentamen/);
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
  assert.match(html, /Övningen är klar/);
  assertNoMockOfficialPassLineCopy(html);
  assert.doesNotMatch(html, /Build your exam|Bygg din tentamen|Starta tentamen|Skarp tentamen/);
  assert.equal(context.reloadCount, 0);
});
