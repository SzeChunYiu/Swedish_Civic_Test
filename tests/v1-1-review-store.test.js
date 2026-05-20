// Tests for v1.1 review store (blueprint 14, PR6).
// Run with: node --test tests/v1-1-review-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingGetMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

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

test('review store: throwing MMKV writes keep graded card in memory and record warning', () => {
  const storage = createThrowingSetMMKV('review disk full');
  const { useReviewStore } = loadTsWithStorage(repoRoot, 'lib/storage/reviewStore.ts', {
    reviews: storage,
  });

  const reviewed = useReviewStore.getState().grade('q1', 3, '2026-05-19T12:00:00.000Z');
  const state = useReviewStore.getState();

  assert.equal(reviewed.questionId, 'q1');
  assert.equal(state.byId.q1.questionId, 'q1');
  assert.equal(
    Object.values(state.gradedPerDay).reduce((sum, count) => sum + count, 0),
    1,
  );
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'reviews');
  assert.equal(state.persistenceWarning.key, 'learning.reviews.cards.v1');
  assert.match(state.persistenceWarning.errorMessage, /disk full/);
});

test('review store: throwing MMKV reads fall back to empty state and record warning', () => {
  const storage = createThrowingGetMMKV('review read failed');
  const { useReviewStore } = loadTsWithStorage(repoRoot, 'lib/storage/reviewStore.ts', {
    reviews: storage,
  });
  const state = useReviewStore.getState();

  assert.deepEqual(state.byId, {});
  assert.deepEqual(state.gradedPerDay, {});
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'reviews');
  assert.equal(state.persistenceWarning.key, 'learning.reviews.cards.v1');
  assert.match(state.persistenceWarning.errorMessage, /read failed/);
});

test('review store: successful writes persist JSON and corrupt reads still fall back', () => {
  const storage = createMemoryMMKV();
  const { REVIEW_STORE_KEY, useReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: storage,
    },
  );

  useReviewStore.getState().ensureCard('q2', '2026-05-19T12:00:00.000Z');
  assert.equal(useReviewStore.getState().persistenceWarning, null);

  const persisted = JSON.parse(storage.values.get(REVIEW_STORE_KEY));
  assert.equal(persisted.byId.q2.questionId, 'q2');

  const corruptStorage = createMemoryMMKV({ [REVIEW_STORE_KEY]: '{not-json' });
  const { useReviewStore: useCorruptReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: corruptStorage,
    },
  );
  assert.deepEqual(useCorruptReviewStore.getState().byId, {});
  assert.deepEqual(useCorruptReviewStore.getState().gradedPerDay, {});
});

test('review store: import snapshot merges normalized FSRS cards and graded-day counters', () => {
  const existingCard = fakeCard('qExisting', '2026-05-18T08:00:00.000Z', {
    reps: 2,
  });
  const importedCard = fakeCard('qImported', '2026-05-19T08:00:00.000Z', {
    reps: 3,
  });
  const storage = createMemoryMMKV({
    'learning.reviews.cards.v1': JSON.stringify({
      byId: { qExisting: existingCard },
      gradedPerDay: { '2026-05-18': 1 },
    }),
  });
  const { REVIEW_STORE_KEY, importReviewSnapshot, useReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: storage,
    },
  );

  const imported = importReviewSnapshot({
    byId: {
      qImported: importedCard,
      qBadState: { ...importedCard, questionId: 'qBadState', state: 'bad' },
    },
    gradedPerDay: {
      '2026-05-18': 2,
      '2026-05-19': 1,
      'not-a-day': 1,
    },
  });

  assert.deepEqual(Object.keys(imported.byId).sort(), ['qExisting', 'qImported']);
  assert.equal(imported.gradedPerDay['2026-05-18'], 2);
  assert.equal(imported.gradedPerDay['2026-05-19'], 1);
  assert.deepEqual(useReviewStore.getState().byId.qImported, importedCard);
  assert.deepEqual(JSON.parse(storage.values.get(REVIEW_STORE_KEY)).byId.qImported, importedCard);
});

test('review store: corrupt persisted cards and graded days are dropped on hydration', () => {
  const validCard = fakeCard('qValid', '2026-05-19T08:00:00.000Z', {
    difficulty: 4.75,
    stability: 30.5,
    reps: 3,
    lapses: 1,
  });
  const persisted = {
    byId: {
      qValid: validCard,
      qMismatched: { ...validCard, questionId: 'other-id' },
      '': { ...validCard, questionId: '' },
      qBadState: { ...validCard, questionId: 'qBadState', state: 'banana' },
      qBadDifficulty: { ...validCard, questionId: 'qBadDifficulty', difficulty: 999 },
      qBadStability: { ...validCard, questionId: 'qBadStability', stability: -2 },
      qBadReps: { ...validCard, questionId: 'qBadReps', reps: 1.5 },
      qBadLapses: { ...validCard, questionId: 'qBadLapses', lapses: -1 },
      qBadLastReviewAt: {
        ...validCard,
        questionId: 'qBadLastReviewAt',
        lastReviewAt: 'not-a-date',
      },
      qBadDueAt: { ...validCard, questionId: 'qBadDueAt', dueAt: '2026-05-19' },
    },
    gradedPerDay: {
      '2026-05-19': 2,
      '2026-05-20': 0,
      'not-a-day': 2,
      '2026-02-29': 1,
      '2026-05-21': 1.5,
      '2026-05-22': -1,
      '2026-05-23': 10001,
    },
  };
  const storage = createMemoryMMKV({
    'learning.reviews.cards.v1': JSON.stringify(persisted),
  });
  const { dueCards, reviewStats, useReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: storage,
    },
  );
  const state = useReviewStore.getState();

  assert.deepEqual(Object.keys(state.byId), ['qValid']);
  assert.deepEqual(state.byId.qValid, validCard);
  assert.deepEqual(state.gradedPerDay, {
    '2026-05-19': 2,
    '2026-05-20': 0,
  });
  assert.deepEqual(
    dueCards(state, { now: '2026-05-20T00:00:00.000Z' }).map((card) => card.questionId),
    ['qValid'],
  );
  assert.deepEqual(reviewStats(state), {
    totalCards: 1,
    masteredCards: 1,
    reviewDaysCount: 1,
  });
});
