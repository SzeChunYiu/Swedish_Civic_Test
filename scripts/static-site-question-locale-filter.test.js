const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function localizedQuestion(id) {
  return {
    id,
    chapterId: 1,
    chapter: 'Ch. 1',
    questionProvenance: 'uhr',
    q: { en: `Question ${id}`, sv: `Fråga ${id}`, 'zh-Hans': `问题 ${id}` },
    opts: [
      { en: 'Wrong', sv: 'Fel', 'zh-Hans': '错误' },
      { en: 'Correct', sv: 'Rätt', 'zh-Hans': '正确' },
    ],
    answer: 1,
    why: { en: `Why ${id}`, sv: `Varför ${id}`, 'zh-Hans': `解释 ${id}` },
    source: { title: 'Sverige i fokus', chapter: 'Landet Sverige', section: 'Geografi', page: 7 },
  };
}

function englishOnlyQuestion(id) {
  const q = localizedQuestion(id);
  delete q.q['zh-Hans'];
  delete q.why['zh-Hans'];
  q.opts.forEach((opt) => delete opt['zh-Hans']);
  return q;
}

function createContext({ hash = '#/practice?c=1', language = 'zh-Hans', questions }) {
  const storage = new Map([['smt_lang', language]]);
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        hidden: false,
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
      documentElement: { lang: language, dir: 'ltr', setAttribute() {} },
      body: { style: {} },
      getElementById: element,
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {},
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
  sandbox.window.addEventListener = () => {};
  sandbox.window.dispatchEvent = () => true;
  sandbox.window.scrollTo = () => {};
  sandbox.window.SMT_QUESTIONS = questions;
  sandbox.window.SMT_CHAPTERS_META = [
    { id: 1, emoji: '01', title: { en: 'Chapter', sv: 'Kapitel', 'zh-Hans': '章节' } },
  ];
  vm.createContext(sandbox);
  return { sandbox, element };
}

test('practice and mock filter out questions missing the selected locale', () => {
  const questions = [englishOnlyQuestion('missing'), localizedQuestion('localized')];
  const { sandbox } = createContext({ questions });
  const practiceSource = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    'window.__mockQuestionPool = mockQuestionPool;\n})();',
  );
  vm.runInContext(practiceSource, sandbox, { timeout: 3000 });

  assert.deepEqual(
    sandbox.window.smtPracticeFilterFor().map((q) => q.id),
    ['localized'],
  );
  assert.deepEqual(
    sandbox.window.__mockQuestionPool().map((q) => q.id),
    ['localized'],
  );
});

test('practice renders no-questions state instead of falling back to untranslated bank', () => {
  const questions = [englishOnlyQuestion('missing')];
  const { sandbox, element } = createContext({ questions });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext(read('site/practice.js'), sandbox, { timeout: 3000 });
  vm.runInContext('smtQuizRender();', sandbox, { timeout: 3000 });

  const html = element('quiz-stage').innerHTML;
  assert.match(html, /未找到任何题目/);
  assert.doesNotMatch(html, /Question missing/);
  assert.doesNotMatch(html, /Wrong|Correct|Why missing/);
});

test('practice question chrome uses localized chapter labels with localized questions', () => {
  const questions = [localizedQuestion('localized')];
  questions[0].chapter = 'Ch. 01 · The country of Sweden';
  const { sandbox, element } = createContext({ questions });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext(read('site/practice.js'), sandbox, { timeout: 3000 });
  vm.runInContext('smtQuizRender();', sandbox, { timeout: 3000 });

  const html = element('quiz-stage').innerHTML;
  assert.match(html, /问题 localized/);
  assert.match(html, /章节/);
  assert.doesNotMatch(html, /The country of Sweden|Ch\. 01/);
});
