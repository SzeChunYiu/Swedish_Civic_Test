const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function staticQuestion(id, chapterId) {
  return {
    id,
    chapterId,
    q: { en: `Question ${id}`, sv: `Fraga ${id}` },
    opts: [
      { en: 'Correct answer', sv: 'Ratt svar' },
      { en: 'Wrong answer', sv: 'Fel svar' },
    ],
    answer: 0,
    why: { en: `Explanation ${id}`, sv: `Forklaring ${id}` },
    source: {
      title: 'Sverige i fokus',
      chapter: 'Landet Sverige',
      section: 'Geografi',
      page: 7,
    },
  };
}

function createElement(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    classList: { add() {}, remove() {}, toggle() {} },
    dataset: {},
    addEventListener() {},
    closest() {
      return {
        querySelector() {
          return null;
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
}

function createPracticeContext({
  hash = '#/practice',
  storageEntries = [],
  questions,
  chapters,
} = {}) {
  const elements = new Map();
  const storage = new Map([['smt_lang', 'en'], ...storageEntries]);

  function element(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
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
      documentElement: { lang: 'en' },
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
  sandbox.window.scrollTo = () => {};
  sandbox.window.SMT_QUESTIONS =
    questions ||
    Array.from({ length: 20 }, (_, index) => staticQuestion(`q${index + 1}`, (index % 3) + 1));
  sandbox.window.SMT_CHAPTERS_META =
    chapters ||
    [1, 2, 3].map((id) => ({
      id,
      emoji: String(id).padStart(2, '0'),
      title: { en: `Chapter ${id}`, sv: `Kapitel ${id}` },
    }));

  vm.createContext(sandbox);
  return { element, sandbox, storage };
}

function runPracticeScript(context, injectedSource = '') {
  const source = read('site/practice.js').replace(/\}\)\(\);\s*$/, `${injectedSource}\n})();`);
  vm.runInContext(source, context.sandbox, { timeout: 3000 });
}

test('static storage: smtRecordAnswer initializes from a plain smt_progress object only', () => {
  const context = createPracticeContext({
    storageEntries: [['smt_progress', JSON.stringify([{ answered: 9, correct: 9 }])]],
  });
  runPracticeScript(context);

  context.sandbox.window.smtRecordAnswer(1, 'true');
  context.sandbox.window.smtRecordAnswer('1', true);
  context.sandbox.window.smtRecordAnswer('bad', true);

  assert.deepEqual(JSON.parse(context.storage.get('smt_progress')), {
    ch1: { answered: 2, correct: 1 },
  });
});

test('static storage: Practice hub bounds malformed smt_progress counters without dropping valid totals', () => {
  const context = createPracticeContext({
    storageEntries: [
      [
        'smt_progress',
        JSON.stringify({
          ch1: { answered: 10, correct: 12 },
          ch2: { answered: 2.8, correct: 1.7 },
          ch3: { answered: -4, correct: 1 },
          ch4: 'not a progress entry',
          other: { answered: 100, correct: 100 },
        }),
      ],
    ],
  });

  runPracticeScript(
    context,
    ['window.__progressSnapshot = getProgress();', 'renderPracticeHub();'].join('\n'),
  );

  assert.deepEqual(plain(context.sandbox.window.__progressSnapshot), {
    ch1: { answered: 10, correct: 10 },
    ch2: { answered: 2, correct: 1 },
    ch3: { answered: 0, correct: 0 },
  });
  assert.match(context.element('quiz-stage').innerHTML, /<b class="hub__statvalue">12<\/b>/);
  assert.match(context.element('quiz-stage').innerHTML, /<b class="hub__statvalue">92%<\/b>/);
  assert.doesNotMatch(context.element('quiz-stage').innerHTML, /NaN|Infinity/);
});

test('static storage: mock history and smt_mock_cfg keep bounded source-filtered settings', () => {
  const context = createPracticeContext({
    hash: '#/mock',
    questions: [
      staticQuestion('q-uhr-ch1', 1),
      staticQuestion('q-uhr-ch2', 2),
      staticQuestion('q-uhr-ch3', 3),
    ],
    storageEntries: [
      [
        'smt_mocks',
        JSON.stringify([
          { t: 1000, total: 5, correct: 8, pct: 160, duration: -20 },
          { t: 'soon', total: 5, correct: 5, pct: 100 },
        ]),
      ],
      ['smt_mock_cfg', JSON.stringify({ count: 500, minutes: 1, chapters: [2, 2, '3', -1, 1.5] })],
    ],
  });

  runPracticeScript(
    context,
    [
      'window.__mockHistorySnapshot = getMockHistory();',
      'window.__mockCfgSnapshot = loadMockCfg();',
      'window.__pickedMockIds = pickMockQuestions().map((question) => question.id);',
    ].join('\n'),
  );

  assert.deepEqual(plain(context.sandbox.window.__mockHistorySnapshot), [
    { t: 1000, total: 5, correct: 5, pct: 100, duration: 0 },
  ]);
  assert.deepEqual(plain(context.sandbox.window.__mockCfgSnapshot), {
    count: 500,
    minutes: 2,
    chapters: [2],
  });
  assert.deepEqual(plain(context.sandbox.window.__pickedMockIds), ['q-uhr-ch2']);
});
