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

const staticLanguageOptions = [
  { value: 'en', label: 'English' },
  { value: 'sv', label: 'Svenska' },
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'ar', label: 'العربية' },
  { value: 'so', label: 'Soomaali' },
];

const translatedKeys = [
  'brand',
  'nav.home',
  'nav.mock',
  'hero.cta1',
  'consent.title',
  'settings.title',
  'footer.honest.p',
  'terms.h1a',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createRenderContext({ hash, language = 'en' }) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const storage = new Map([
    ['smt_lang', language],
    ['smt_mock_cfg', JSON.stringify({ count: 5, minutes: 30, chapters: [1] })],
  ]);
  let reloadCount = 0;
  const translatedNodes = new Map(
    translatedKeys.map((key) => [key, { dataset: { i18n: key }, innerHTML: '' }]),
  );

  function makeClassList() {
    const values = new Set();
    return {
      contains(name) {
        return values.has(name);
      },
      toggle(name, on) {
        if (on) values.add(name);
        else values.delete(name);
      },
    };
  }

  const settingButtons = staticLanguageOptions.map(({ value }) => ({
    dataset: { val: value },
    classList: makeClassList(),
  }));

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
        lang: language,
        dir: language === 'ar' ? 'rtl' : 'ltr',
        setAttribute(name, value) {
          this[name] = value;
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
        if (selector === '[data-i18n]') return [...translatedNodes.values()];
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
    element,
    languageButton(value) {
      return settingButtons.find((button) => button.dataset.val === value);
    },
    get reloadCount() {
      return reloadCount;
    },
    sandbox,
    storage,
    translatedText(key) {
      return translatedNodes.get(key)?.innerHTML ?? '';
    },
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
test('Settings language selector exposes every shipped static dictionary', () => {
  const indexHtml = read('site/index.html');
  const settingsSource = read('site/settings.js');

  for (const option of staticLanguageOptions) {
    assert.ok(
      indexHtml.includes(`data-val="${option.value}"`),
      `${option.value} should be selectable from Settings`,
    );
    assert.ok(indexHtml.includes(option.label), `${option.value} should use its native label`);
  }

  assert.match(settingsSource, /group === ['"]language['"]/);
  assert.match(settingsSource, /window\.smtSetLanguage/);
});

test('extra Settings languages rerender high-frequency UI with English fallback', () => {
  const context = createRenderContext({ hash: '#/', language: 'sv' });
  loadScripts(context);

  context.clickSettingsLanguage('sv');
  assert.equal(context.translatedText('terms.h1a'), 'Enkla regler,');

  context.clickSettingsLanguage('zh-Hans');
  assert.equal(context.storage.get('smt_lang'), 'zh-Hans');
  assert.equal(context.sandbox.document.documentElement.lang, 'zh-Hans');
  assert.equal(context.sandbox.document.documentElement.dir, 'ltr');
  assert.equal(context.reloadCount, 0);
  assert.equal(context.languageButton('zh-Hans').classList.contains('is-on'), true);
  assert.equal(context.translatedText('brand'), 'Almost Swedish');
  assert.equal(context.translatedText('nav.home'), '首页');
  assert.equal(context.translatedText('nav.mock'), '模拟考');
  assert.equal(context.translatedText('settings.title'), '设置');
  assert.equal(context.translatedText('consent.title'), 'Cookie,刚刚好。');
  assert.equal(context.translatedText('hero.cta1'), '开始练习 →');
  assert.equal(context.translatedText('terms.h1a'), 'Plain rules,');

  context.clickSettingsLanguage('ar');
  assert.equal(context.storage.get('smt_lang'), 'ar');
  assert.equal(context.sandbox.document.documentElement.lang, 'ar');
  assert.equal(context.sandbox.document.documentElement.dir, 'rtl');
  assert.equal(context.languageButton('ar').classList.contains('is-on'), true);
  assert.equal(context.languageButton('zh-Hans').classList.contains('is-on'), false);
  assert.equal(context.translatedText('nav.home'), 'الرئيسية');
  assert.equal(context.translatedText('settings.title'), 'الإعدادات');
  assert.equal(context.translatedText('consent.title'), 'ملفات تعريف الارتباط، باعتدال.');
  assert.equal(
    context.translatedText('footer.honest.p'),
    'غير رسمي. مستقل. لا ينتمي إلى UHR أو Skolverket أو Migrationsverket أو الحكومة السويدية.',
  );
});

test('extra static dictionaries avoid pass/passport outcome slogans', () => {
  const extras = read('site/i18n-extras.js');
  const staleOutcomeSnippets = [
    '通过测试',
    '拿到护照',
    '通過測試',
    '拿到護照',
    'اجتز الاختبار',
    'احصل على الجواز',
    'Imtixaanka uga gud',
    'Hel baasaboorka',
  ];

  for (const snippet of staleOutcomeSnippets) {
    assert.equal(
      extras.includes(snippet),
      false,
      `extra dictionary should not expose "${snippet}"`,
    );
  }
});

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
