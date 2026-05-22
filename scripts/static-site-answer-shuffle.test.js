const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const MAX_CORRECT_POSITION_SHARE = 0.35;

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
    Array,
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
  sandbox.window.SMT_CHAPTERS_META = [];

  vm.createContext(sandbox);
  return { sandbox, element, listeners };
}

function loadSiteQuestions() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return context.window.SMT_QUESTIONS;
}

function sampleQuestion(id = 'q-static-shuffle') {
  return {
    id,
    type: 'single_choice',
    chapter: 'Ch. 1',
    chapterId: 1,
    q: {
      en: 'Which option should be scored as correct?',
      sv: 'Vilket alternativ ska räknas som rätt?',
    },
    opts: [
      { en: 'Original correct answer', sv: 'Ursprungligt rätt svar' },
      { en: 'Original wrong answer B', sv: 'Ursprungligt fel svar B' },
      { en: 'Original wrong answer C', sv: 'Ursprungligt fel svar C' },
      { en: 'Original wrong answer D', sv: 'Ursprungligt fel svar D' },
    ],
    answer: 0,
    why: {
      en: 'The original correct answer is still correct after display shuffling.',
      sv: 'Det ursprungliga rätta svaret är fortfarande rätt efter visningsblandning.',
    },
    source: {
      title: 'Sverige i fokus',
      chapter: 'Landet Sverige',
      section: 'Geografi',
      page: 7,
    },
  };
}

function displayOrderFor(sandbox, question, sessionId) {
  sandbox.__question = question;
  sandbox.__sessionId = sessionId;
  return vm.runInContext(
    'smtQuizDisplayOptions(__question, __sessionId).map((entry) => entry.originalIndex)',
    sandbox,
    { timeout: 3000 },
  );
}

function practiceAttemptSessionId(scope, attempt) {
  return `practice:${scope}:attempt:${attempt}`;
}

function pickMovedCorrectQuestion(sandbox, sessionId) {
  for (let index = 0; index < 50; index += 1) {
    const question = sampleQuestion(`q-static-shuffle-${index}`);
    const order = displayOrderFor(sandbox, question, sessionId);
    if (order.indexOf(question.answer) !== question.answer) {
      return { question, order };
    }
  }
  throw new Error(`No moved-correct shuffle seed found for ${sessionId}`);
}

function pickAttemptChangingQuestion(sandbox, scope) {
  const firstSessionId = practiceAttemptSessionId(scope, 1);
  const secondSessionId = practiceAttemptSessionId(scope, 2);
  for (let index = 0; index < 150; index += 1) {
    const question = sampleQuestion(`q-static-attempt-${index}`);
    const firstOrder = displayOrderFor(sandbox, question, firstSessionId);
    const secondOrder = displayOrderFor(sandbox, question, secondSessionId);
    if (firstOrder.join(',') !== secondOrder.join(',')) {
      return { firstOrder, question, secondOrder };
    }
  }
  throw new Error(`No attempt-changing shuffle seed found for ${scope}`);
}

function parseDataIndexes(html, attribute) {
  return Array.from(html.matchAll(new RegExp(`${attribute}="(\\d+)"`, 'g')), (match) =>
    Number(match[1]),
  );
}

test('static answer shuffle keeps correct positions under the P0 concentration limit', () => {
  const questions = loadSiteQuestions();
  const { sandbox } = createRenderContext();
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });

  sandbox.window.SMT_QUESTIONS = questions;
  const summary = vm.runInContext(
    'smtQuizAnswerShuffleSummary(window.SMT_QUESTIONS, "static-site-p0")',
    sandbox,
    { timeout: 3000 },
  );

  assert.ok(summary.totalQuestions > 100, 'expected the static single-choice bank to be audited');
  assert.ok(
    summary.maxCorrectPositionShare <= MAX_CORRECT_POSITION_SHARE,
    `correct-answer display positions are too concentrated: ${JSON.stringify(summary)}`,
  );
});

test('static answer shuffle leaves true false order stable by product decision', () => {
  const { sandbox } = createRenderContext();
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });

  const order = displayOrderFor(
    sandbox,
    {
      id: 'q-true-false',
      type: 'true_false',
      q: { en: 'True or false?', sv: 'Sant eller falskt?' },
      opts: [
        { en: 'True', sv: 'Sant' },
        { en: 'False', sv: 'Falskt' },
      ],
      answer: 0,
    },
    'static-site-p0',
  );

  assert.deepEqual(order, [0, 1]);
});

test('static Practice renders shuffled labels while scoring the original correct answer', () => {
  const { sandbox, element, listeners } = createRenderContext({
    hash: '#/practice?c=1',
    language: 'en',
  });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  const { question, order } = pickMovedCorrectQuestion(
    sandbox,
    practiceAttemptSessionId('chapter:1', 1),
  );
  sandbox.window.SMT_QUESTIONS = [question];
  sandbox.window.smtPracticeFilterFor = () => [question];

  vm.runInContext('smtQuizRender();', sandbox, { timeout: 3000 });
  assert.deepEqual(parseDataIndexes(element('quiz-stage').innerHTML, 'data-i'), order);

  const correctOption = {
    dataset: { i: String(question.answer) },
    hasAttribute: () => false,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 120, height: 44 }),
  };
  const event = {
    target: {
      closest(selector) {
        return selector === '#quiz-stage .quiz__opt' ? correctOption : null;
      },
    },
  };
  for (const listener of listeners.document.filter((entry) => entry.type === 'click')) {
    listener.handler(event);
  }

  assert.equal(vm.runInContext('SMT_QUIZ.score', sandbox, { timeout: 3000 }), 1);
  const html = element('quiz-stage').innerHTML;
  assert.match(html, /Original correct answer/);
  assert.match(html, /class="quiz__opt is-correct" data-i="0"/);
});

test('static Practice quiz-again starts a fresh attempt seed for the same scope', () => {
  const { sandbox, element, listeners } = createRenderContext({
    hash: '#/practice?c=1',
    language: 'en',
  });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  const { firstOrder, question, secondOrder } = pickAttemptChangingQuestion(sandbox, 'chapter:1');
  sandbox.window.SMT_QUESTIONS = [question];
  sandbox.window.smtPracticeFilterFor = () => [question];

  vm.runInContext('smtQuizRender();', sandbox, { timeout: 3000 });
  assert.deepEqual(parseDataIndexes(element('quiz-stage').innerHTML, 'data-i'), firstOrder);

  const correctOption = {
    dataset: { i: String(question.answer) },
    hasAttribute: () => false,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 120, height: 44 }),
  };
  const nextButton = { hasAttribute: () => false };
  const againButton = { hasAttribute: () => false };
  const clickListeners = listeners.document.filter((entry) => entry.type === 'click');

  for (const listener of clickListeners) {
    listener.handler({
      target: {
        closest(selector) {
          return selector === '#quiz-stage .quiz__opt' ? correctOption : null;
        },
      },
    });
  }
  for (const listener of clickListeners) {
    listener.handler({
      target: {
        closest(selector) {
          return selector === '#quiz-next' ? nextButton : null;
        },
      },
    });
  }
  assert.match(element('quiz-stage').innerHTML, /id="quiz-again"/);

  for (const listener of clickListeners) {
    listener.handler({
      target: {
        closest(selector) {
          return selector === '#quiz-again' ? againButton : null;
        },
      },
    });
  }

  assert.deepEqual(parseDataIndexes(element('quiz-stage').innerHTML, 'data-i'), secondOrder);
  assert.notDeepEqual(firstOrder, secondOrder);
  assert.equal(vm.runInContext('SMT_QUIZ.attempt', sandbox, { timeout: 3000 }), 2);
  assert.equal(vm.runInContext('SMT_QUIZ.score', sandbox, { timeout: 3000 }), 0);
});

test('static Practice route re-entry starts a fresh attempt seed for the same scope', () => {
  const { sandbox, element, listeners } = createRenderContext({
    hash: '#/practice?c=1',
    language: 'en',
  });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  const { firstOrder, question, secondOrder } = pickAttemptChangingQuestion(sandbox, 'chapter:1');
  sandbox.window.SMT_QUESTIONS = [question];
  sandbox.window.smtPracticeFilterFor = () => [question];

  vm.runInContext('smtQuizRenderRoute();', sandbox, { timeout: 3000 });
  assert.deepEqual(parseDataIndexes(element('quiz-stage').innerHTML, 'data-i'), firstOrder);

  sandbox.location.hash = '#/';
  for (const listener of listeners.window.filter((entry) => entry.type === 'hashchange')) {
    listener.handler();
  }
  assert.equal(vm.runInContext('SMT_QUIZ.routeActive', sandbox, { timeout: 3000 }), false);

  sandbox.location.hash = '#/practice?c=1';
  for (const listener of listeners.window.filter((entry) => entry.type === 'hashchange')) {
    listener.handler();
  }

  assert.deepEqual(parseDataIndexes(element('quiz-stage').innerHTML, 'data-i'), secondOrder);
  assert.notDeepEqual(firstOrder, secondOrder);
  assert.equal(vm.runInContext('SMT_QUIZ.attempt', sandbox, { timeout: 3000 }), 2);
});

test('static Mock renders shuffled labels and reviews the selected original answer', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/mock?run=1', language: 'en' });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  const { question, order } = pickMovedCorrectQuestion(sandbox, 'mock:123456:0');
  sandbox.window.SMT_QUESTIONS = [question];

  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'MOCK.questions = window.SMT_QUESTIONS;',
      'MOCK.answers = [null];',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = false;',
      'renderMockExam();',
      'window.__mockExamHtml = document.getElementById("mock-stage").innerHTML;',
      'MOCK.answers = [0];',
      'MOCK.submitted = true;',
      'renderMockResult();',
      'window.__mockReviewHtml = document.getElementById("mock-stage").innerHTML;',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.deepEqual(parseDataIndexes(sandbox.window.__mockExamHtml, 'data-pick'), order);
  const reviewHtml = element('mock-stage').innerHTML;
  assert.match(reviewHtml, /<div class="mock-result is-strong">/);
  assert.match(reviewHtml, /<span class="result-ch__score">1\/1<\/span>/);
  assert.match(reviewHtml, /Original correct answer/);
  assert.match(reviewHtml, /<b>Correct<\/b>/);
  assert.match(
    reviewHtml,
    /The original correct answer is still correct after display shuffling\./,
  );
});
