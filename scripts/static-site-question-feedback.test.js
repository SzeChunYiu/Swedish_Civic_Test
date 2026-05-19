const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const sampleQuestion = {
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

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createRenderContext({ hash = '#/practice?c=1', language = 'en' } = {}) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const storage = new Map([['smt_lang', language]]);

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      });
    }
    return elements.get(id);
  }

  const sandbox = {
    console,
    confirm: () => true,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: { hash },
    document: {
      documentElement: { lang: language },
      getElementById: element,
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      addEventListener(type, handler) {
        listeners.document.push({ type, handler });
      },
    },
    window: {},
    setInterval: () => 1,
    clearInterval() {},
    setTimeout(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
    requestAnimationFrame(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
  };

  sandbox.window = sandbox;
  sandbox.window.addEventListener = (type, handler) => {
    listeners.window.push({ type, handler });
  };
  sandbox.window.scrollTo = () => {};
  sandbox.window.SMT_QUESTIONS = [sampleQuestion];
  sandbox.window.SMT_CHAPTERS_META = [];
  sandbox.window.smtPracticeFilterFor = () => [sampleQuestion];

  vm.createContext(sandbox);
  return { sandbox, element };
}

test('static Practice answer feedback renders citation and independent-study disclaimer', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/practice?c=1', language: 'en' });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext('smtQuizRender(); SMT_QUIZ.answers[0] = 0; smtQuizRender();', sandbox, {
    timeout: 3000,
  });

  const html = element('quiz-stage').innerHTML;
  assert.match(html, /class="quiz__feedback is-wrong"/);
  assert.match(html, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(html, /Provenance: UHR\. Source note:/);
  assert.match(html, /Source: Sverige i fokus, Landet Sverige, Geografi, p\. 7/);
  assert.match(html, /Independent study practice, not a real exam or an official UHR question\./);
});

test('static Mock review renders citation and disclaimer for every reviewed question', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/mock?run=1', language: 'sv' });
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [1];',
      'MOCK.submitted = true;',
      'renderMockResult();',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  const html = element('mock-stage').innerHTML;
  assert.match(html, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(html, /Källtyp: UHR\. Källanteckning:/);
  assert.match(html, /Källa: Sverige i fokus, Landet Sverige, Geografi, s\. 7/);
  assert.match(
    html,
    /class="mock-review__disclaimer">Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga\.<\/p>/,
  );
});

test('static active Mock question renders citation and independent-study disclaimer', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [null];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = false;',
      'renderMockExam();',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  const html = element('mock-stage').innerHTML;
  assert.match(html, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(html, /Provenance: UHR\. Source note:/);
  assert.match(html, /Source: Sverige i fokus, Landet Sverige, Geografi, p\. 7/);
  assert.match(
    html,
    /class="quiz__disclaimer">Independent study practice, not a real exam or an official UHR question\.<\/p>/,
  );
});
