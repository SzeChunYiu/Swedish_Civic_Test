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

const chapterMeta = [
  {
    id: 1,
    emoji: '01',
    title: { en: 'Land of Sweden', sv: 'Landet Sverige' },
  },
  {
    id: 2,
    emoji: '02',
    title: { en: 'History', sv: 'Historia' },
  },
];

function unsafeQuestion() {
  return {
    ...sampleQuestion,
    q: {
      en: 'Where <img src=x onerror=alert(1)> is Sweden?',
      sv: 'Var <img src=x onerror=alert(1)> ligger Sverige?',
    },
    opts: [
      { en: 'Southern <b>Europe</b> & "near"', sv: 'Södra <b>Europa</b> & "nära"' },
      {
        en: 'Northern <span data-x="1">Europe</span>',
        sv: 'Norra <span data-x="1">Europa</span>',
      },
    ],
    why: {
      en: 'Use <script>alert("x")</script> & civic sources.',
      sv: 'Använd <script>alert("x")</script> & samhällskällor.',
    },
  };
}

function staticMockQuestion({ id, chapterId = 1, tags = [], questionProvenance }) {
  return {
    ...sampleQuestion,
    id,
    chapterId,
    q: {
      en: `Question ${id}`,
      sv: `Fråga ${id}`,
    },
    why: {
      en: `Explanation ${id}`,
      sv: `Förklaring ${id}`,
    },
    tags,
    ...(questionProvenance ? { questionProvenance } : {}),
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function phrase(parts) {
  return parts.join(' ');
}

function qcardRuntimeSource() {
  const source = read('site/app.js');
  const start = source.indexOf('/* ============================ TRY-A-QUESTION DEMO */');
  const end = source.indexOf('/* ============================ ADS + CONSENT */');
  assert.notEqual(start, -1, 'qcard runtime section should exist');
  assert.notEqual(end, -1, 'ads section marker should exist after qcard runtime');
  return source.slice(start, end);
}

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...tokens) {
      tokens.forEach((token) => values.add(token));
    },
    remove(...tokens) {
      tokens.forEach((token) => values.delete(token));
    },
    contains(token) {
      return values.has(token);
    },
    toString() {
      return [...values].join(' ');
    },
  };
}

function createQcardRuntimeContext(language = 'en') {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const elementsById = new Map();

  const card = {
    id: 'qcard',
    classList: createClassList(['qcard']),
    querySelector(selector) {
      if (selector === '#qcard-status') return elementsById.get('qcard-status');
      if (selector === '#qcard-explanation') return elementsById.get('qcard-explanation');
      if (selector === ".qopt[data-correct='true']") {
        return options.find((option) => option.dataset.correct === 'true') || null;
      }
      if (selector === '.qopt[aria-pressed="true"]') {
        return options.find((option) => option.attributes.get('aria-pressed') === 'true') || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      return selector === '.qopt' ? options : [];
    },
  };

  function createOption(textContent, correct) {
    return {
      attributes: new Map([['aria-pressed', 'false']]),
      classList: createClassList(['qopt']),
      dataset: { correct: correct ? 'true' : 'false' },
      disabled: false,
      textContent,
      closest(selector) {
        if (selector === '.qopt') return this;
        return selector === '.qcard' ? card : null;
      },
      setAttribute(name, value) {
        this.attributes.set(name, String(value));
      },
      getAttribute(name) {
        return this.attributes.get(name) ?? null;
      },
      removeAttribute(name) {
        this.attributes.delete(name);
      },
    };
  }

  const options = [
    createOption('A Jantelagen - the law of staying humble', false),
    createOption('B Allemansratten - the right of public access', true),
    createOption('C Lagom - the doctrine of just-enough', false),
    createOption('D Fika - the constitutional coffee break', false),
  ];
  const resetButton = {
    closest(selector) {
      if (selector === '.qopt') return null;
      return selector === '#qreset' ? resetButton : null;
    },
  };
  const status = { id: 'qcard-status', textContent: '' };
  const explanation = {
    id: 'qcard-explanation',
    textContent:
      'Allemansratten - everyone right - lets you walk, swim, ski, camp, and forage on most land in Sweden.',
  };
  elementsById.set('qcard', card);
  elementsById.set('qcard-status', status);
  elementsById.set('qcard-explanation', explanation);

  const sandbox = {
    document: {
      documentElement: {
        getAttribute(name) {
          return name === 'lang' ? language : null;
        },
      },
      addEventListener(type, handler) {
        documentListeners.set(type, handler);
      },
      getElementById(id) {
        return elementsById.get(id) || null;
      },
    },
    i18n: {
      en: {
        'qcard.state.correct': 'Correct answer',
        'qcard.state.selectedCorrect': 'Selected answer, correct',
        'qcard.state.selectedIncorrect': 'Selected answer, incorrect',
        'qcard.feedback.correct': 'Correct.',
        'qcard.feedback.incorrect': 'Not quite.',
      },
      sv: {
        'qcard.state.correct': 'Ratt svar',
        'qcard.state.selectedCorrect': 'Valt svar, ratt',
        'qcard.state.selectedIncorrect': 'Valt svar, fel',
        'qcard.feedback.correct': 'Ratt.',
        'qcard.feedback.incorrect': 'Inte riktigt.',
      },
    },
    smtNormalizeLanguage(lang) {
      return lang === 'sv' ? 'sv' : 'en';
    },
    window: {
      addEventListener(type, handler) {
        windowListeners.set(type, handler);
      },
    },
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  sandbox.window.i18n = sandbox.i18n;
  sandbox.window.smtNormalizeLanguage = sandbox.smtNormalizeLanguage;

  vm.createContext(sandbox);
  vm.runInContext(qcardRuntimeSource(), sandbox, { timeout: 3000 });

  const click = (target) => documentListeners.get('click')({ target });
  const languagechange = () => windowListeners.get('smt:languagechange')();

  return { card, click, explanation, languagechange, options, resetButton, status };
}

function createRenderContext({
  hash = '#/practice?c=1',
  language = 'en',
  mockConfig,
  questions = [sampleQuestion],
} = {}) {
  const elements = new Map();
  const listeners = { document: [], window: [] };
  const storage = new Map([['smt_lang', language]]);
  if (mockConfig) storage.set('smt_mock_cfg', JSON.stringify(mockConfig));

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
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
        closest() {
          return {
            querySelector() {
              return null;
            },
          };
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
  sandbox.window.SMT_QUESTIONS = questions;
  sandbox.window.SMT_CHAPTERS_META = chapterMeta;
  sandbox.window.smtPracticeFilterFor = () => questions;

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

test('static Practice escapes question-bank prompt, option, and explanation HTML', () => {
  const question = unsafeQuestion();
  const { sandbox, element } = createRenderContext({
    hash: '#/practice?c=1',
    language: 'en',
    questions: [question],
  });
  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext('smtQuizRender(); SMT_QUIZ.answers[0] = 0; smtQuizRender();', sandbox, {
    timeout: 3000,
  });

  const html = element('quiz-stage').innerHTML;
  assert.match(html, /Where &lt;img src=x onerror=alert\(1\)&gt; is Sweden\?/);
  assert.match(html, /Southern &lt;b&gt;Europe&lt;\/b&gt; &amp; &quot;near&quot;/);
  assert.match(html, /Northern &lt;span data-x=&quot;1&quot;&gt;Europe&lt;\/span&gt;/);
  assert.match(
    html,
    /Use &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; civic sources\./,
  );
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<b>Europe<\/b>/);
  assert.match(html, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(html, /Source: Sverige i fokus, Landet Sverige, Geografi, p\. 7/);
});

test('static provenance badge copy avoids positive UHR authority wording', () => {
  const source = read('site/practice.js');

  assert.match(source, /Based on UHR's study material Sverige i fokus/);
  assert.match(source, /app-authored, UHR-referenced practice question/);
  assert.doesNotMatch(source, new RegExp(phrase(['Directly', 'from', 'UHR']), 'i'));
  assert.doesNotMatch(source, new RegExp(phrase(['Direkt', 'från', 'UHR']), 'i'));
  assert.doesNotMatch(
    source,
    new RegExp(phrase(['generated', 'from', 'a', 'UHR', 'question']), 'i'),
  );
  assert.doesNotMatch(source, new RegExp(phrase(['genererats', 'från', 'en', 'UHR-fråga']), 'i'));
});

test('static Practice chapter parameter filters the question pool', () => {
  const questions = [
    staticMockQuestion({ id: 'chapter-1-a', chapterId: 1 }),
    staticMockQuestion({ id: 'chapter-2-a', chapterId: 2 }),
    staticMockQuestion({ id: 'chapter-2-b', chapterId: 2 }),
  ];
  const { sandbox } = createRenderContext({
    hash: '#/practice?c=2',
    language: 'en',
    questions,
  });
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'window.__practiceScope = smtPracticeFilterFor().map((question) => question.id);',
      'window.__quizScopeKey = typeof smtQuizScopeKey === "function" ? smtQuizScopeKey() : null;',
      '})();',
    ].join('\n'),
  );

  vm.runInContext(read('site/app.js'), sandbox, { timeout: 3000 });
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.deepEqual(sandbox.window.__practiceScope, ['chapter-2-a', 'chapter-2-b']);
  assert.equal(sandbox.window.__quizScopeKey, 'chapter:2');
});

test('static Home demo qcard renders q039 UHR source metadata', () => {
  const indexHtml = read('site/index.html');
  const appSource = read('site/app.js');
  const qcardMatch = indexHtml.match(
    /<div class="qcard" id="qcard"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
  );
  assert.ok(qcardMatch, 'Home demo qcard should be present');
  const qcardHtml = qcardMatch[0];

  assert.match(qcardHtml, /data-source-question-id="q039"/);
  assert.match(qcardHtml, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(qcardHtml, /Source: Sverige i fokus · Lag och rätt · Allemansrätten · p\. 17/);
  assert.doesNotMatch(qcardHtml, /Grundlagarna/);
  assert.match(appSource, /'qcard\.chip': 'Chapter 5 · q039'/);
  assert.match(
    appSource,
    /'qcard\.src': 'Source: Sverige i fokus · Lag och rätt · Allemansrätten · p\. 17'/,
  );
  assert.doesNotMatch(appSource, /'qcard\.src': '[^']*Grundlagarna/);
});

test('static Home demo qcard exposes accessible answer state', () => {
  const indexHtml = read('site/index.html');
  const appSource = read('site/app.js');
  const extraSource = read('site/i18n-extras.js');
  const qcardMatch = indexHtml.match(
    /<div class="qcard" id="qcard"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
  );
  assert.ok(qcardMatch, 'Home demo qcard should be present');
  const qcardHtml = qcardMatch[0];

  assert.match(qcardHtml, /class="qcard__opts"[\s\S]*role="group"/);
  assert.match(qcardHtml, /aria-labelledby="qcard-options-label"/);
  assert.match(qcardHtml, /data-a11y-label="qcard\.optionsLabel"/);
  assert.match(qcardHtml, /id="qcard-options-label" data-i18n="qcard\.optionsLabel"/);
  assert.equal((qcardHtml.match(/aria-pressed="false"/g) || []).length, 4);
  assert.match(qcardHtml, /id="qcard-explanation"[\s\S]*role="status"[\s\S]*aria-live="polite"/);
  assert.match(qcardHtml, /id="qcard-status"[\s\S]*role="status"[\s\S]*aria-live="polite"/);

  assert.match(appSource, /function smtApplyQcardA11yState/);
  assert.match(appSource, /qcard\.state\.selectedCorrect/);
  assert.match(appSource, /qcard\.state\.selectedIncorrect/);
  assert.match(appSource, /qcard\.state\.correct/);
  assert.match(appSource, /qcard\.feedback\.correct/);
  assert.match(appSource, /qcard\.feedback\.incorrect/);
  assert.match(appSource, /option\.setAttribute\('aria-pressed', isSelected \? 'true' : 'false'\)/);
  assert.match(
    appSource,
    /option\.setAttribute\('aria-label', `\$\{smtQcardOptionLabel\(option\)\}\. \$\{stateText\}`\)/,
  );
  assert.match(appSource, /option\.removeAttribute\('aria-label'\)/);
  assert.match(appSource, /status\.textContent = ''/);
  assert.match(appSource, /window\.addEventListener\('smt:languagechange'/);

  for (const key of [
    'qcard.optionsLabel',
    'qcard.state.correct',
    'qcard.state.selectedCorrect',
    'qcard.state.selectedIncorrect',
    'qcard.feedback.correct',
    'qcard.feedback.incorrect',
  ]) {
    assert.match(appSource, new RegExp(`'${key.replace('.', '\\.')}'`));
    assert.match(extraSource, new RegExp(`'${key.replace('.', '\\.')}'`));
  }
});

test('static Home demo qcard resets selected-correct state through the real handlers', () => {
  const { card, click, explanation, options, resetButton, status } = createQcardRuntimeContext();
  const correctOption = options[1];

  click(correctOption);

  assert.equal(card.classList.contains('is-answered'), true);
  assert.equal(correctOption.classList.contains('is-correct'), true);
  assert.equal(correctOption.classList.contains('is-wrong'), false);
  assert.equal(correctOption.disabled, true);
  assert.equal(correctOption.getAttribute('aria-pressed'), 'true');
  assert.match(correctOption.getAttribute('aria-label'), /Selected answer, correct/);
  assert.equal(
    status.textContent,
    `Correct. ${explanation.textContent.replace(/\s+/g, ' ').trim()}`,
  );
  for (const option of options) {
    assert.equal(option.disabled, true);
  }

  click(resetButton);

  assert.equal(card.classList.contains('is-answered'), false);
  assert.equal(status.textContent, '');
  for (const option of options) {
    assert.equal(option.disabled, false);
    assert.equal(option.classList.contains('is-correct'), false);
    assert.equal(option.classList.contains('is-wrong'), false);
    assert.equal(option.getAttribute('aria-pressed'), 'false');
    assert.equal(option.getAttribute('aria-label'), null);
  }
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
  assert.match(html, /Övningspass klart\./);
  assert.match(html, /100% — 1\/1 rätt/);
  [
    ['God', 'känt'],
    ['Under', 'känt'],
    ['godkänt-', 'gräns'],
  ]
    .map((parts) => parts.join(''))
    .forEach((phrase) => assert.doesNotMatch(html, new RegExp(phrase)));
});

test('static Mock landing renders neutral timed-practice copy', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/mock', language: 'en' });
  sandbox.window.SMT_CHAPTERS_META = [
    { id: 1, emoji: '🇸🇪', title: { en: 'Sweden', sv: 'Sverige' } },
  ];
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    ['renderMockLanding();', '})();'].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  const html = element('mock-stage').innerHTML;
  assert.match(html, /Timed practice/);
  assert.match(html, /Build your practice round/);
  assert.match(html, /Practice timer only/);
  assert.match(html, /Result<\/b> percent correct/);
  assert.match(html, /Start timed practice/);
  [
    ['Real ', 'exam'],
    ['Start ', 'exam'],
    ['Pass', '<\\/b> 75'],
    ['passing ', 'line'],
  ]
    .map((parts) => parts.join(''))
    .forEach((phrase) => assert.doesNotMatch(html, new RegExp(phrase, 'i')));
});

test('static Mock landing escapes chapter metadata rendered as chooser chips', () => {
  const { sandbox, element } = createRenderContext({ hash: '#/mock', language: 'en' });
  sandbox.window.SMT_CHAPTERS_META = [
    {
      id: 1,
      emoji: '<i>01</i>',
      title: { en: 'Sweden <img src=x onerror=alert(2)>', sv: 'Sverige' },
    },
  ];
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    ['renderMockLanding();', '})();'].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  const html = element('mock-stage').innerHTML;
  assert.match(html, /&lt;i&gt;01&lt;\/i&gt;/);
  assert.match(html, /Sweden &lt;img src=x onerror=alert\(2\)&gt;/);
  assert.doesNotMatch(html, /<i>01<\/i>/);
  assert.doesNotMatch(html, /<img src=x/);
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

test('static active Mock question escapes prompt, options, and chapter labels', () => {
  const { sandbox, element } = createRenderContext({
    hash: '#/mock?run=1',
    language: 'en',
    questions: [unsafeQuestion()],
  });
  sandbox.window.SMT_CHAPTERS_META = [
    {
      id: 1,
      emoji: '01',
      title: { en: 'Sweden <img src=x onerror=alert(3)>', sv: 'Sverige' },
    },
  ];
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
  assert.match(html, /Sweden &lt;img src=x onerror=alert\(3\)&gt;/);
  assert.match(html, /Where &lt;img src=x onerror=alert\(1\)&gt; is Sweden\?/);
  assert.match(html, /Southern &lt;b&gt;Europe&lt;\/b&gt; &amp; &quot;near&quot;/);
  assert.match(html, /Northern &lt;span data-x=&quot;1&quot;&gt;Europe&lt;\/span&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>Europe<\/b>/);
  assert.match(html, /class="quiz__provenance quiz__provenance--uhr"/);
  assert.match(html, /Source: Sverige i fokus, Landet Sverige, Geografi, p\. 7/);
});

test('static Mock question navigation dots expose localized answer-state labels', () => {
  function renderDotHtml(language) {
    const questions = [
      staticMockQuestion({ id: 'q-1' }),
      staticMockQuestion({ id: 'q-2' }),
      staticMockQuestion({ id: 'q-3' }),
    ];
    const { sandbox, element } = createRenderContext({
      hash: '#/mock?run=1',
      language,
      questions,
    });
    const source = read('site/practice.js').replace(
      /\}\)\(\);\s*$/,
      [
        'MOCK.questions = window.SMT_QUESTIONS;',
        'MOCK.answers = [1, null, null];',
        'MOCK.i = 1;',
        'MOCK.startedAt = 123456;',
        'MOCK.endsAt = Date.now() + 120000;',
        'MOCK.submitted = false;',
        'renderMockExam();',
        '})();',
      ].join('\n'),
    );
    vm.runInContext(source, sandbox, { timeout: 3000 });
    return element('mock-stage').innerHTML;
  }

  const svHtml = renderDotHtml('sv');
  assert.match(svHtml, /aria-label="Fråga 1 av 3, besvarad"/);
  assert.match(svHtml, /aria-label="Fråga 2 av 3, aktuell" aria-current="step"/);
  assert.match(svHtml, /aria-label="Fråga 3 av 3, obesvarad"/);
  assert.doesNotMatch(svHtml, /aria-label="Question 1"/);

  const enHtml = renderDotHtml('en');
  assert.match(enHtml, /aria-label="Question 1 of 3, answered"/);
  assert.match(enHtml, /aria-label="Question 2 of 3, current" aria-current="step"/);
  assert.match(enHtml, /aria-label="Question 3 of 3, unanswered"/);
  assert.doesNotMatch(enHtml, /aria-label="Question 1"/);
});

test('static Mock picker and landing counts use only direct UHR questions', () => {
  const questions = [
    staticMockQuestion({ id: 'q-uhr-1', chapterId: 1 }),
    staticMockQuestion({ id: 'q-derived-tag', chapterId: 1, tags: ['published-variant'] }),
    staticMockQuestion({ id: 'q-editorial-tag', chapterId: 1, tags: ['editorial'] }),
    staticMockQuestion({ id: 'q-uhr-2', chapterId: 2, questionProvenance: 'uhr' }),
    staticMockQuestion({ id: 'q-derived-provenance', chapterId: 2, questionProvenance: 'derived' }),
  ];
  const { sandbox, element } = createRenderContext({
    hash: '#/mock',
    language: 'en',
    mockConfig: { count: 5, minutes: 30, chapters: 'all' },
    questions,
  });
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'window.__pickedMockQuestionIds = pickMockQuestions().map((question) => question.id).sort();',
      'renderMockLanding();',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.deepEqual(sandbox.window.__pickedMockQuestionIds, ['q-uhr-1', 'q-uhr-2']);
  assert.match(element('mock-stage').innerHTML, /Max 2/);
  assert.doesNotMatch(element('mock-stage').innerHTML, /Max 5/);
});

test('static Mock real exported bank excludes published-variant rows', () => {
  const { sandbox } = createRenderContext({
    hash: '#/mock',
    language: 'en',
    mockConfig: { count: 2000, minutes: 30, chapters: 'all' },
    questions: [],
  });
  vm.runInContext(read('site/questions.js'), sandbox, { timeout: 3000 });
  const expectedUhrCount = sandbox.window.SMT_QUESTIONS.filter(
    (question) =>
      !(question.tags || []).includes('published-variant') &&
      !(question.tags || []).includes('editorial'),
  ).length;
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'window.__mockPool = mockQuestionPool();',
      'window.__pickedMockQuestions = pickMockQuestions();',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.ok(expectedUhrCount > 0, 'expected direct UHR rows in the static bank');
  assert.ok(
    expectedUhrCount < sandbox.window.SMT_QUESTIONS.length,
    'expected supplementary rows too',
  );
  assert.equal(sandbox.window.__mockPool.length, expectedUhrCount);
  assert.equal(sandbox.window.__pickedMockQuestions.length, expectedUhrCount);
  for (const question of sandbox.window.__pickedMockQuestions) {
    assert.equal((question.tags || []).includes('published-variant'), false);
    assert.equal((question.tags || []).includes('editorial'), false);
  }
});

test('static Mock chapter-limited landing count excludes supplementary questions', () => {
  const questions = [
    staticMockQuestion({ id: 'q-uhr-1', chapterId: 1 }),
    staticMockQuestion({ id: 'q-derived-tag', chapterId: 1, tags: ['published-variant'] }),
    staticMockQuestion({ id: 'q-uhr-2', chapterId: 2 }),
  ];
  const { sandbox, element } = createRenderContext({
    hash: '#/mock',
    language: 'en',
    mockConfig: { count: 5, minutes: 30, chapters: [1] },
    questions,
  });
  const source = read('site/practice.js').replace(/\}\)\(\);\s*$/, 'renderMockLanding();\n})();');
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.match(element('mock-stage').innerHTML, /Max 1/);
  assert.doesNotMatch(element('mock-stage').innerHTML, /Max 2/);
});

test('static active and reviewed Mock questions never render supplementary rows', () => {
  const questions = [
    staticMockQuestion({ id: 'q-uhr-1', chapterId: 1 }),
    staticMockQuestion({ id: 'q-derived-tag', chapterId: 1, tags: ['published-variant'] }),
    staticMockQuestion({ id: 'q-derived-provenance', chapterId: 1, questionProvenance: 'derived' }),
  ];
  const { sandbox, element } = createRenderContext({
    hash: '#/mock?run=1',
    language: 'en',
    mockConfig: { count: 5, minutes: 30, chapters: 'all' },
    questions,
  });
  const source = read('site/practice.js').replace(
    /\}\)\(\);\s*$/,
    [
      'MOCK.questions = pickMockQuestions();',
      'MOCK.answers = MOCK.questions.map((question) => question.answer);',
      'MOCK.startedAt = 123456;',
      'MOCK.endsAt = Date.now() + 120000;',
      'MOCK.submitted = false;',
      'renderMockExam();',
      'window.__activeMockHtml = document.getElementById("mock-stage").innerHTML;',
      'MOCK.submitted = true;',
      'renderMockResult();',
      'window.__reviewedMockHtml = document.getElementById("mock-stage").innerHTML;',
      '})();',
    ].join('\n'),
  );
  vm.runInContext(source, sandbox, { timeout: 3000 });

  assert.match(sandbox.window.__activeMockHtml, /Question q-uhr-1/);
  assert.doesNotMatch(sandbox.window.__activeMockHtml, /Question q-derived-tag/);
  assert.doesNotMatch(sandbox.window.__activeMockHtml, /Question q-derived-provenance/);
  assert.match(element('mock-stage').innerHTML, /Question q-uhr-1/);
  assert.doesNotMatch(sandbox.window.__reviewedMockHtml, /Question q-derived-tag/);
  assert.doesNotMatch(sandbox.window.__reviewedMockHtml, /Question q-derived-provenance/);
});
