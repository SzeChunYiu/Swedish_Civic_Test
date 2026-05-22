// Tests for v1.1 review store (blueprint 14, PR6).
// Run with: node --test tests/v1-1-review-store.test.js

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingReadMMKV: createThrowingGetMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(rel) {
  return loadTsWithStorage(repoRoot, rel, {});
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

test('dueCards: normalizes malformed runtime limits without dropping due cards', () => {
  const { dueCards } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-05-19T12:00:00.000Z';
  const cards = [];
  for (let i = 0; i < 4; i += 1) cards.push(fakeCard(`q${i}`, '2026-05-15T08:00:00.000Z'));
  const state = makeState(cards);
  const allDueIds = ['q0', 'q1', 'q2', 'q3'];

  assert.deepEqual(
    dueCards(state, { now, limit: 0 }).map((card) => card.questionId),
    [],
  );
  assert.deepEqual(
    dueCards(state, { now, limit: 2 }).map((card) => card.questionId),
    ['q0', 'q1'],
  );
  assert.deepEqual(
    dueCards(state, { now, limit: Number.POSITIVE_INFINITY }).map((card) => card.questionId),
    allDueIds,
  );

  for (const malformedLimit of [-1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY, '2', null]) {
    assert.deepEqual(
      dueCards(state, { now, limit: malformedLimit }).map((card) => card.questionId),
      allDueIds,
      `malformed limit ${String(malformedLimit)} should fall back to unlimited`,
    );
  }
});

test('dueCards: focused validator covers valid and malformed runtime limits', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-review-store-due-limit'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused review-store due-limit validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.reviewStoreDueLimitCasesValidated, 12);
  assert.equal(summary.reviewStoreDueLimitParityValidated, true);
  assert.equal(Object.hasOwn(summary, 'questionSchemasValidated'), false);
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

test('dueCards: ignores malformed due timestamps even when imported state bypasses normalization', () => {
  const { dueCards, dueCount } = loadTs('lib/storage/reviewStore.ts');
  const now = '2026-03-02T12:00:00.000Z';
  const state = makeState([
    fakeCard('q-valid-past', '2026-03-01T00:00:00.000Z'),
    fakeCard('q-valid-future', '2026-03-03T00:00:00.000Z'),
    fakeCard('q-rollover', '2026-02-30T00:00:00.000Z'),
    fakeCard('q-date-only', '2026-03-02'),
    fakeCard('q-timezone-offset', '2026-03-02T12:00:00+00:00'),
  ]);

  assert.deepEqual(
    dueCards(state, { now }).map((card) => card.questionId),
    ['q-valid-past'],
  );
  assert.equal(dueCount(state, now), 1);
  assert.deepEqual(dueCards(state, { now: '2026-02-30T12:00:00.000Z' }), []);
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

test('remainingDailyReviews: strict Pro boolean and finite free caps', () => {
  const { remainingDailyReviews, FREE_DAILY_REVIEW_CAP } = loadTs('lib/storage/reviewStore.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const { getLocalDateKey } = loadTs('lib/learning/streaks.ts');
  const dayKey = getLocalDateKey(now);
  const state = makeState([], { [dayKey]: 1 });

  for (const malformedProFlag of ['yes', 1, {}, [], null]) {
    assert.equal(
      remainingDailyReviews(state, { now, isPro: malformedProFlag }),
      FREE_DAILY_REVIEW_CAP - 1,
    );
  }

  assert.equal(remainingDailyReviews(state, { now, isPro: true }), Number.POSITIVE_INFINITY);
  assert.equal(remainingDailyReviews(state, { now, freeCap: 2 }), 1);

  for (const invalidCap of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, '4', null]) {
    assert.equal(
      remainingDailyReviews(state, { now, freeCap: invalidCap }),
      FREE_DAILY_REVIEW_CAP - 1,
    );
  }

  for (const invalidUsedToday of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, '2']) {
    const remaining = remainingDailyReviews(makeState([], { [dayKey]: invalidUsedToday }), {
      now,
    });
    assert.equal(remaining, FREE_DAILY_REVIEW_CAP);
    assert.equal(Number.isFinite(remaining), true);
  }
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

test('review store: invalid grade inputs do not create cards or increment daily caps', () => {
  const storage = createMemoryMMKV();
  const { REVIEW_STORE_KEY, useReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: storage,
    },
  );
  const t0 = '2026-05-19T12:00:00.000Z';
  const t1 = '2026-05-20T12:00:00.000Z';

  assert.equal(useReviewStore.getState().grade('qBad', 5, t0), null);
  assert.deepEqual(useReviewStore.getState().byId, {});
  assert.deepEqual(useReviewStore.getState().gradedPerDay, {});
  assert.equal(storage.values.has(REVIEW_STORE_KEY), false);

  const valid = useReviewStore.getState().grade('q1', 3, t0);
  const afterValid = useReviewStore.getState();
  assert.equal(valid.questionId, 'q1');
  assert.equal(
    Object.values(afterValid.gradedPerDay).reduce((sum, count) => sum + count, 0),
    1,
  );

  assert.equal(useReviewStore.getState().grade('q1', 5, t1), afterValid.byId.q1);
  assert.equal(useReviewStore.getState().grade('q1', 3, 'not-a-date'), afterValid.byId.q1);
  const afterInvalid = useReviewStore.getState();
  assert.deepEqual(afterInvalid.byId, afterValid.byId);
  assert.deepEqual(afterInvalid.gradedPerDay, afterValid.gradedPerDay);
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
  assert.equal(useCorruptReviewStore.getState().persistenceWarning.recoverable, true);
  assert.equal(useCorruptReviewStore.getState().persistenceWarning.operation, 'read');
  assert.equal(useCorruptReviewStore.getState().persistenceWarning.storageId, 'reviews');
  assert.equal(useCorruptReviewStore.getState().persistenceWarning.key, REVIEW_STORE_KEY);
  assert.match(
    useCorruptReviewStore.getState().persistenceWarning.errorMessage,
    /JSON|Unexpected/i,
  );

  useCorruptReviewStore.getState().ensureCard('q3', '2026-05-19T12:00:00.000Z');
  assert.equal(useCorruptReviewStore.getState().persistenceWarning, null);
});

test('review store: rejects unsafe runtime question ids before creating or grading cards', () => {
  const storage = createMemoryMMKV();
  const { REVIEW_STORE_KEY, useReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/reviewStore.ts',
    {
      reviews: storage,
    },
  );
  const unsafeIds = ['', '   ', ' q001 ', '__proto__', 'constructor', 'prototype', null, 17];

  for (const unsafeId of unsafeIds) {
    assert.throws(
      () => useReviewStore.getState().ensureCard(unsafeId, '2026-05-19T12:00:00.000Z'),
      /Review questionId must be a non-empty safe string/,
    );
    assert.deepEqual(useReviewStore.getState().byId, {});
    assert.deepEqual(useReviewStore.getState().gradedPerDay, {});
    assert.equal(storage.values.has(REVIEW_STORE_KEY), false);

    assert.throws(
      () => useReviewStore.getState().grade(unsafeId, 3, '2026-05-19T12:00:00.000Z'),
      /Review questionId must be a non-empty safe string/,
    );
    assert.deepEqual(useReviewStore.getState().byId, {});
    assert.deepEqual(useReviewStore.getState().gradedPerDay, {});
    assert.equal(storage.values.has(REVIEW_STORE_KEY), false);
    assert.equal(
      Object.prototype.hasOwnProperty.call(useReviewStore.getState().byId, unsafeId),
      false,
    );
  }

  const card = useReviewStore.getState().ensureCard('qSafe', '2026-05-19T12:00:00.000Z');
  assert.equal(card.questionId, 'qSafe');
  const reviewed = useReviewStore.getState().grade('qSafe', 3, '2026-05-19T12:00:00.000Z');
  assert.equal(reviewed.questionId, 'qSafe');
  assert.equal(useReviewStore.getState().byId.qSafe.questionId, 'qSafe');
  assert.equal(
    Object.values(useReviewStore.getState().gradedPerDay).reduce((sum, count) => sum + count, 0),
    1,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(useReviewStore.getState().byId, '__proto__'),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(useReviewStore.getState().byId, 'constructor'),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(useReviewStore.getState().byId, 'prototype'),
    false,
  );
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
