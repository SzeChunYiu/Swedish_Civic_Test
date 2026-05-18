const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function sampleQuestion(index) {
  return {
    id: `q-practice-result-${index}`,
    type: 'single_choice',
    chapter: 'Ch. 1',
    chapterId: 1,
    q: {
      en: `Practice result question ${index}`,
      sv: `Övningsresultat fråga ${index}`,
    },
    opts: [
      { en: 'Correct answer', sv: 'Rätt svar' },
      { en: 'Wrong answer', sv: 'Fel svar' },
    ],
    answer: 0,
    why: {
      en: 'The correct answer is correct.',
      sv: 'Det rätta svaret är rätt.',
    },
    source: {
      title: 'Sverige i fokus',
      chapter: 'Landet Sverige',
      section: 'Geografi',
      page: 7,
    },
  };
}

function createRenderContext({ language }) {
  const elements = new Map();
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
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: { hash: '#/practice?c=mix' },
    document: {
      documentElement: { lang: language },
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
  sandbox.window.SMT_CHAPTERS_META = [];
  sandbox.window.SMT_QUESTIONS = Array.from({ length: 10 }, (_, index) =>
    sampleQuestion(index + 1),
  );
  sandbox.window.smtPracticeFilterFor = () => sandbox.window.SMT_QUESTIONS;

  vm.createContext(sandbox);
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext(
    'SMT_QUIZ.scope = "chapter:mix"; SMT_QUIZ.i = 10; SMT_QUIZ.score = 7; smtQuizRender();',
    sandbox,
    { timeout: 3000 },
  );

  return element('quiz-stage').innerHTML;
}

test('static Practice result breakdown is spaced and localized in Swedish', () => {
  const html = createRenderContext({ language: 'sv' });

  assert.match(html, /<li><b>7<\/b> Rätt<\/li>/);
  assert.match(html, /<li><b>3<\/b> Fel<\/li>/);
  assert.match(html, /<li><b>70%<\/b> Poäng<\/li>/);
  assert.doesNotMatch(html, /70%score|<b>7<\/b>Rätt|<b>3<\/b>Fel/);
});

test('static Practice result breakdown is spaced and localized in English', () => {
  const html = createRenderContext({ language: 'en' });

  assert.match(html, /<li><b>7<\/b> Correct<\/li>/);
  assert.match(html, /<li><b>3<\/b> Wrong<\/li>/);
  assert.match(html, /<li><b>70%<\/b> Score<\/li>/);
  assert.doesNotMatch(html, /70%score|<b>7<\/b>Correct|<b>3<\/b>Wrong/);
});
