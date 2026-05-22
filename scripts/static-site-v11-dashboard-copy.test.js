const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { assertStaticV11ReadinessCopySource } = require('./static-v11-readiness-copy-guard');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.className = '';
    this.classList = {
      add: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.className = [...classes].join(' ');
      },
      remove: (...names) => {
        const remove = new Set(names);
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !remove.has(name))
          .join(' ');
      },
      toggle: (name, force) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
        this.className = [...classes].join(' ');
        return shouldAdd;
      },
    };
    this.style = {};
    this.textContent = '';
    this.listeners = {};
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }
}

function visibleText(node) {
  return [node.textContent, ...node.children.map(visibleText)].filter(Boolean).join(' ');
}

function collectElementsByClass(node, className) {
  const classes = new Set(
    String(node.className || '')
      .split(/\s+/)
      .filter(Boolean),
  );
  const matches = classes.has(className) ? [node] : [];
  return matches.concat(...node.children.map((child) => collectElementsByClass(child, className)));
}

function renderDashboardArtifacts(language, storageOverrides = [], chaptersMeta = null) {
  const dashboard = new Element('div');
  const dashboardEyebrow = new Element('span');
  const today = dateKey(new Date());
  const storage = new Map([
    ['smt_lang', language],
    ['smt_signed_in', '1'],
    [
      'smt_progress',
      JSON.stringify({
        ch1: { answered: 30, correct: 24 },
        ch2: { answered: 20, correct: 16 },
      }),
    ],
    ['smt_mocks', JSON.stringify([{ t: Date.now(), total: 40, correct: 32, pct: 80 }])],
    [
      'smt_streak',
      JSON.stringify({
        activeDays: [today],
        answeredThisWeek: 50,
        days: 1,
        lastDate: today,
      }),
    ],
    ...storageOverrides,
  ]);

  const listeners = {};
  const sandbox = {
    Event: function Event(type) {
      return { type };
    },
    console,
    document: {
      addEventListener(type, handler) {
        listeners[type] = handler;
      },
      createElement(tagName) {
        return new Element(tagName);
      },
      createElementNS(_namespace, tagName) {
        return new Element(tagName);
      },
      getElementById(id) {
        return id === 'v11-dashboard' ? dashboard : null;
      },
      querySelector(selector) {
        return selector === '#v11-dashboard-wrap .eyebrow' ? dashboardEyebrow : null;
      },
      readyState: 'complete',
    },
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: { hash: '#/dashboard' },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    window: {},
  };

  sandbox.window = sandbox;
  sandbox.window.SMT_CHAPTERS_META = chaptersMeta || [
    { id: 1, title: 'Landet Sverige', questionCount: 40 },
    { id: 2, title: 'Demokrati', questionCount: 40 },
  ];
  sandbox.window.SMT_QUESTIONS = [{ id: 'q001' }];
  sandbox.window.addEventListener = (type, handler) => {
    listeners[type] = handler;
  };
  sandbox.window.dispatchEvent = (event) => {
    if (listeners[event.type]) listeners[event.type](event);
    return true;
  };

  vm.createContext(sandbox);
  vm.runInContext(read('site/v11.js'), sandbox, { timeout: 3000 });
  return {
    dashboard,
    text: visibleText(dashboard).replace(/\s+/g, ' ').trim(),
  };
}

function renderDashboard(language, storageOverrides = [], chaptersMeta = null) {
  return renderDashboardArtifacts(language, storageOverrides, chaptersMeta).text;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function mondayKey(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
}

function loadDashboardStorageSnapshot(storageEntries) {
  const dashboard = new Element('div');
  const dashboardEyebrow = new Element('span');
  const storage = new Map([['smt_lang', 'en'], ['smt_signed_in', '1'], ...storageEntries]);
  const listeners = {};
  const sandbox = {
    Event: function Event(type) {
      return { type };
    },
    console,
    document: {
      addEventListener(type, handler) {
        listeners[type] = handler;
      },
      createElement(tagName) {
        return new Element(tagName);
      },
      createElementNS(_namespace, tagName) {
        return new Element(tagName);
      },
      getElementById(id) {
        return id === 'v11-dashboard' ? dashboard : null;
      },
      querySelector(selector) {
        return selector === '#v11-dashboard-wrap .eyebrow' ? dashboardEyebrow : null;
      },
      readyState: 'complete',
    },
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: { hash: '#/' },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    window: {},
  };

  sandbox.window = sandbox;
  sandbox.window.SMT_CHAPTERS_META = [
    { id: 1, title: 'Landet Sverige', questionCount: 40 },
    { id: 2, title: 'Demokrati', questionCount: 40 },
    { id: 3, title: 'Lagar', questionCount: 40 },
  ];
  sandbox.window.SMT_QUESTIONS = [{ id: 'q001' }];
  sandbox.window.addEventListener = (type, handler) => {
    listeners[type] = handler;
  };
  sandbox.window.dispatchEvent = (event) => {
    if (listeners[event.type]) listeners[event.type](event);
    return true;
  };

  const source = read('site/v11.js').replace(
    /\}\)\(\);\s*$/,
    [
      'window.__storageSnapshot = {',
      '  progress: getProgress(),',
      '  mocks: getMocks(),',
      '  streak: getStreak(),',
      '  freeze: getFreeze(),',
      '};',
      'renderDashboard();',
      '})();',
    ].join('\n'),
  );

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return {
    snapshot: sandbox.window.__storageSnapshot,
    text: visibleText(dashboard).replace(/\s+/g, ' ').trim(),
  };
}

test('static v1.1 dashboard frames the score as a local practice signal', () => {
  const source = read('site/v11.js');

  assert.deepEqual(assertStaticV11ReadinessCopySource(source), {
    requiredCopyValidated: 12,
    unsupportedPatternsValidated: 4,
  });

  assert.throws(
    () => assertStaticV11ReadinessCopySource(source.replace('Local practice signal', 'Readiness')),
    /unsupported readiness\/pass-prediction copy/,
  );
  assert.throws(
    () =>
      assertStaticV11ReadinessCopySource(
        source.replace(
          'Based only on practice and mock attempts on this device, not an official result forecast.',
          '',
        ),
      ),
    /must keep local-practice labels/,
  );
});

test('static v1.1 dashboard renders localized local-practice caveats', () => {
  const englishText = renderDashboard('en');
  const swedishText = renderDashboard('sv');

  assert.match(englishText, /Local practice signal/);
  assert.match(englishText, /Strong practice base/);
  assert.match(englishText, /Based only on practice and mock attempts on this device/);
  assert.match(englishText, /not an official result forecast/);
  assert.match(englishText, /Practice accuracy 80%/);
  assert.match(englishText, /Chapter coverage 100%/);
  assert.match(englishText, /Mock average 80%/);

  assert.match(swedishText, /Lokal övningssignal/);
  assert.match(swedishText, /Stark övningsgrund/);
  assert.match(swedishText, /Bygger bara på övningar och övningsprov på den här enheten/);
  assert.match(swedishText, /inte en officiell prognos/);
  assert.match(swedishText, /Rätt 80%/);
  assert.match(swedishText, /Kapiteltäckning 100%/);
  assert.match(swedishText, /Övningsprov 80%/);

  [englishText, swedishText].forEach((text) => {
    assert.doesNotMatch(text, /Readiness|Din beredskap|Almost ready|Nästan redo/);
  });
});

test('static v1.1 dashboard weak chapter titles resolve from the active locale', () => {
  const source = read('site/v11.js');
  const chaptersMeta = [
    {
      id: 1,
      title: { en: 'English weak chapter one', sv: 'Svenskt svagt kapitel ett' },
      questionCount: 40,
    },
    {
      id: 2,
      title: { en: 'English weak chapter two', sv: 'Svenskt svagt kapitel två' },
      questionCount: 40,
    },
  ];

  assert.doesNotMatch(
    source,
    /ch\.title\[l\]/,
    'weak chapter titles must not read an undeclared l',
  );
  assert.match(source, /ch\.title\[lang\(\)\] \|\| ch\.title\.en/);

  const englishText = renderDashboard('en', [], chaptersMeta);
  const swedishText = renderDashboard('sv', [], chaptersMeta);

  assert.match(englishText, /English weak chapter/);
  assert.doesNotMatch(englishText, /Svenskt svagt kapitel/);
  assert.match(swedishText, /Svenskt svagt kapitel/);
  assert.doesNotMatch(swedishText, /English weak chapter/);
});

test('static v1.1 signed-out dashboard renders a localized lock without progress leakage', () => {
  const { dashboard, text } = renderDashboardArtifacts('sv', [
    ['smt_signed_in', '0'],
    [
      'smt_progress',
      JSON.stringify({
        ch1: { answered: 30, correct: 24 },
        ch2: { answered: 6, correct: 2 },
      }),
    ],
    ['smt_mocks', JSON.stringify([{ t: Date.now(), total: 40, correct: 32, pct: 80 }])],
  ]);

  const grids = collectElementsByClass(dashboard, 'v11-grid');
  const weakTitles = collectElementsByClass(dashboard, 'v11-weak-title');

  assert.equal(grids.length, 1);
  assert.equal(grids[0].attributes['aria-hidden'], 'true');
  assert.equal(weakTitles.length, 0);
  assert.match(text, /Logga in för att låsa upp din panel/);
  assert.match(text, /Logga in för att visa/);
  assert.match(text, /Dolda tills du loggar in/);
  assert.doesNotMatch(text, /Landet Sverige|Demokrati|Rätt 80%|Practice accuracy|Mock average|80%/);
  assert.doesNotMatch(text, /undefined|l is not defined/i);
});

test('static v1.1 dashboard uses natural Swedish streak protection copy', () => {
  const today = dateKey(new Date());
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const currentWeek = mondayKey(new Date());
  const swedishText = renderDashboard('sv', [
    [
      'smt_streak',
      JSON.stringify({
        activeDays: [today, dateKey(twoDaysAgo)],
        answeredThisWeek: 50,
        days: 2,
        lastDate: today,
      }),
    ],
    [
      'smt_freeze',
      JSON.stringify({
        available: 2,
        lastEarnedWeek: currentWeek,
        lifetimeSpent: 0,
        rescuedDays: [],
      }),
    ],
  ]);

  assert.match(swedishText, /Svit/);
  assert.match(swedishText, /Svitskydd/);
  assert.match(swedishText, /Sviten är räddad — 1 svitskydd kvar/);
  assert.doesNotMatch(swedishText, /\b(?:streak|freeze|freezes)\b|Strecket|frysar|Frysar/i);
});

test('static v1.1 weak chapter CTAs use the supported Practice chapter parameter', () => {
  const { dashboard } = renderDashboardArtifacts('en');
  const weakChapterLinks = collectElementsByClass(dashboard, 'v11-weak-link').map(
    (link) => link.href,
  );

  assert.deepEqual(new Set(weakChapterLinks), new Set(['#/practice?c=1', '#/practice?c=2']));
  assert.equal(weakChapterLinks.length, 2);
  weakChapterLinks.forEach((href) => {
    assert.match(href, /^#\/practice\?c=\d+$/);
    assert.doesNotMatch(href, /[?&]ch=/);
  });
  assert.doesNotMatch(read('site/v11.js'), /#\/practice\?ch=/);
});

test('static storage: v1.1 dashboard bounds local study-data shapes before rendering', () => {
  const today = dateKey(new Date());
  const currentWeek = mondayKey(new Date());
  const { snapshot, text } = loadDashboardStorageSnapshot([
    [
      'smt_progress',
      JSON.stringify({
        ch1: { answered: 30, correct: 24 },
        ch2: { answered: 20, correct: 99 },
        ch3: 'not progress',
        other: { answered: 100, correct: 100 },
      }),
    ],
    [
      'smt_mocks',
      JSON.stringify([
        { t: Date.now(), total: 10, correct: 12, pct: 150, duration: -5 },
        { t: 'later', total: 10, correct: 10, pct: 100 },
      ]),
    ],
    [
      'smt_streak',
      JSON.stringify({
        days: 999999,
        lastDate: 'not-a-date',
        activeDays: [today, today, 'not-a-date'],
        answeredThisWeek: -1,
      }),
    ],
    [
      'smt_freeze',
      JSON.stringify({
        available: 9,
        lastEarnedWeek: 'not-a-date',
        lifetimeSpent: -5,
        rescuedDays: [today, 'not-a-date', today],
      }),
    ],
  ]);

  assert.deepEqual(plain(snapshot.progress), {
    ch1: { answered: 30, correct: 24 },
    ch2: { answered: 20, correct: 20 },
  });
  assert.deepEqual(plain(snapshot.mocks), [
    { t: snapshot.mocks[0].t, total: 10, correct: 10, pct: 100, duration: 0 },
  ]);
  assert.equal(snapshot.streak.days, 100000);
  assert.equal(snapshot.streak.lastDate, '');
  assert.deepEqual(plain(snapshot.streak.activeDays), [today]);
  assert.equal(snapshot.streak.answeredThisWeek, 0);
  assert.deepEqual(plain(snapshot.freeze), {
    available: 4,
    lastEarnedWeek: currentWeek,
    lifetimeSpent: 0,
    rescuedDays: [today],
  });
  assert.match(text, /Practice accuracy 88%/);
  assert.match(text, /Mock average 100%/);
  assert.doesNotMatch(text, /NaN|Infinity/);
});
