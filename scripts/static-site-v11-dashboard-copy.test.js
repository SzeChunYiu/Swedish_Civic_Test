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
    this.style = {};
    this.textContent = '';
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

function visibleText(node) {
  return [node.textContent, ...node.children.map(visibleText)].filter(Boolean).join(' ');
}

function renderDashboard(language) {
  const dashboard = new Element('div');
  const storage = new Map([
    ['smt_lang', language],
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
        activeDays: [new Date().toISOString().slice(0, 10)],
        answeredThisWeek: 50,
        days: 1,
        lastDate: new Date().toISOString().slice(0, 10),
      }),
    ],
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
  return visibleText(dashboard).replace(/\s+/g, ' ').trim();
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
  const storage = new Map([['smt_lang', 'en'], ...storageEntries]);
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
