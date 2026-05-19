// Tests for v1.1 review store (blueprint 14, PR6).
// Run with: node --test tests/v1-1-review-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

// Stub react-native-mmkv and zustand so we can load store modules in Node
// without their native / RN-specific deps. The store under test is exercised
// via its pure selectors only — the stubs are sufficient for that surface.
const Module = require('node:module');
const origResolve = Module._resolveFilename;
const stubs = {
  'react-native-mmkv': () => ({ createMMKV: () => null }),
  zustand: () => ({
    create: (factory) => {
      const setFn = (partial) =>
        Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
      const getFn = () => state;
      const state = factory(setFn, getFn);
      return () => state;
    },
  }),
};
Module._resolveFilename = function patchedResolve(request, ...args) {
  if (stubs[request]) return `__stub__:${request}`;
  return origResolve.call(this, request, ...args);
};
const origLoad = Module._load;
Module._load = function patchedLoad(request, ...args) {
  if (stubs[request]) return stubs[request]();
  return origLoad.call(this, request, ...args);
};

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

// Selector tests use a hand-built state shape directly (no zustand/MMKV).

function makeState(cards = [], gradedPerDay = {}) {
  const byId = {};
  for (const c of cards) byId[c.questionId] = c;
  return { byId, gradedPerDay };
}

function fakeCard(qid, dueAt, extra = {}) {
  return {
    questionId: qid,
    difficulty: 5,
    stability: 4,
    reps: 1,
    lapses: 0,
    state: 'review',
    lastReviewAt: '2026-05-15T10:00:00.000Z',
    dueAt,
    ...extra,
  };
}

test('dueCards: returns only cards whose dueAt <= now, sorted ascending', () => {
  const { dueCards } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-05-19T12:00:00.000Z';
  const list = dueCards(
    makeState([
      fakeCard('q1', '2026-05-19T08:00:00.000Z'),
      fakeCard('q2', '2026-05-20T08:00:00.000Z'), // future
      fakeCard('q3', '2026-05-15T08:00:00.000Z'),
    ]),
    { now },
  );
  assert.deepEqual(
    list.map((c) => c.questionId),
    ['q3', 'q1'],
  );
});

test('dueCards: respects limit', () => {
  const { dueCards } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-05-19T12:00:00.000Z';
  const cards = [];
  for (let i = 0; i < 10; i += 1) cards.push(fakeCard(`q${i}`, '2026-05-15T08:00:00.000Z'));
  const list = dueCards(makeState(cards), { now, limit: 3 });
  assert.equal(list.length, 3);
});

test('dueCards: applies questionIdAllowlist (e.g. mistakes only)', () => {
  const { dueCards } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-05-19T12:00:00.000Z';
  const cards = ['q1', 'q2', 'q3'].map((id) => fakeCard(id, '2026-05-15T08:00:00.000Z'));
  const allowlist = new Set(['q1', 'q3']);
  const list = dueCards(makeState(cards), { now, questionIdAllowlist: allowlist });
  assert.deepEqual(list.map((c) => c.questionId).sort(), ['q1', 'q3']);
});

test('dueCount: counts due cards', () => {
  const { dueCount } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-05-19T12:00:00.000Z';
  const cards = [
    fakeCard('q1', '2026-05-15T08:00:00.000Z'),
    fakeCard('q2', '2026-05-20T08:00:00.000Z'),
  ];
  assert.equal(dueCount(makeState(cards), now), 1);
});

test('remainingDailyReviews: Pro = unlimited', () => {
  const { remainingDailyReviews } = loadTs('lib/storage/reviewStore.ts');
  const state = makeState([], {});
  assert.equal(remainingDailyReviews(state, { isPro: true }), Number.POSITIVE_INFINITY);
});

test('remainingDailyReviews: Free starts at FREE_DAILY_REVIEW_CAP, drops as reviews used', () => {
  const { remainingDailyReviews, FREE_DAILY_REVIEW_CAP } = loadTs('lib/storage/reviewStore.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  // Note: the day key comes from local time, so we can't hardcode '2026-05-19'
  // — derive it the same way the implementation does.
  const { getLocalDateKey } = loadTs('lib/learning/streaks.ts');
  const dayKey = getLocalDateKey(now);
  assert.equal(
    remainingDailyReviews(makeState([], { [dayKey]: 0 }), { now }),
    FREE_DAILY_REVIEW_CAP,
  );
  assert.equal(
    remainingDailyReviews(makeState([], { [dayKey]: 2 }), { now }),
    FREE_DAILY_REVIEW_CAP - 2,
  );
  assert.equal(remainingDailyReviews(makeState([], { [dayKey]: 99 }), { now }), 0);
});

test('reviewStats: counts mastered (stability >= 21) and review days', () => {
  const { reviewStats } = loadTs('lib/storage/reviewStore.ts');
  const cards = [
    fakeCard('q1', '2026-05-19', { stability: 30, state: 'review' }), // mastered
    fakeCard('q2', '2026-05-19', { stability: 20, state: 'review' }), // not yet
    fakeCard('q3', '2026-05-19', { stability: 50, state: 'relearning' }), // wrong state
    fakeCard('q4', '2026-05-19', { stability: 60, state: 'review' }), // mastered
  ];
  const stats = reviewStats(
    makeState(cards, { '2026-05-15': 4, '2026-05-16': 2, '2026-05-17': 0 }),
  );
  assert.equal(stats.totalCards, 4);
  assert.equal(stats.masteredCards, 2);
  assert.equal(stats.reviewDaysCount, 2); // days with > 0
});
