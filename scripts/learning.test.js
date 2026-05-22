const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createMemoryMMKV, loadTsWithStorage } = require('../tests/helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function createLearningStorage() {
  return {
    progress: createMemoryMMKV(),
  };
}

function loadAllTs(relativePath, exportName) {
  const moduleExports = loadTsWithStorage(repoRoot, relativePath, createLearningStorage());
  return exportName ? moduleExports[exportName] : moduleExports;
}

test('storageStoreHarness loads learning store modules without local MMKV/Zustand stubs', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const mmkvInlineStubPattern = new RegExp('request === ' + "'react-native-mmkv'");
  const zustandInlineStubPattern = new RegExp('request === ' + "'zustand'");

  assert.match(source, /storageStoreHarness\.cjs/);
  assert.match(source, /loadTsWithStorage/);
  assert.doesNotMatch(source, mmkvInlineStubPattern);
  assert.doesNotMatch(source, zustandInlineStubPattern);
});

test('XP rules follow the MVP gamification table', () => {
  const { calculateAnswerXp, calculateLevel, calculateQuizCompletionXp } =
    loadAllTs('lib/learning/xp.ts');

  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: true }), 12);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: true }), 4);
  assert.equal(calculateAnswerXp({ isCorrect: 'true', explanationRead: true }), 0);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: 'yes' }), 10);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }), 70);
  assert.equal(calculateQuizCompletionXp({ answeredCount: NaN, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: Infinity, correctCount: Infinity }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10.5, correctCount: 10 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: -1, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 11 }), 0);
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(NaN), 1);
  assert.equal(calculateLevel(Infinity), 1);
  assert.equal(calculateLevel(100), 2);
  assert.equal(calculateLevel(400), 3);
});

test('progress retries can record attempts without awarding repeat answer XP', () => {
  const { useProgressStore } = loadAllTs('lib/storage/progressStore.ts');

  useProgressStore.getState().resetProgress();
  useProgressStore.getState().recordAnswer('q-xp', true);
  useProgressStore.getState().recordAnswer('q-xp', true, undefined, { awardXp: false });

  const state = useProgressStore.getState();
  assert.equal(state.totalXp, 12);
  assert.equal(state.questionProgress['q-xp'].seenCount, 2);
  assert.equal(state.questionProgress['q-xp'].correctCount, 2);
  assert.equal(state.answerHistory.filter((entry) => entry.questionId === 'q-xp').length, 2);
});

test('practice session keeps the answer XP award key through Try Again only', () => {
  const { getPracticeAnswerXpAwardKey, usePracticeSessionStore } = loadAllTs(
    'lib/quiz/practiceSessionStore.ts',
  );
  const firstSessionId = usePracticeSessionStore.getState().shuffleSessionId;
  const firstAwardKey = getPracticeAnswerXpAwardKey('q-xp', firstSessionId);

  usePracticeSessionStore.getState().markAnswerXpAwarded(firstAwardKey);
  usePracticeSessionStore.getState().selectOption('q-xp', 'a');
  usePracticeSessionStore.getState().resetSelection();

  assert.equal(usePracticeSessionStore.getState().answerXpAwardedKey, firstAwardKey);

  usePracticeSessionStore.getState().advanceQuestion();
  const nextSessionId = usePracticeSessionStore.getState().shuffleSessionId;

  assert.equal(usePracticeSessionStore.getState().answerXpAwardedKey, null);
  assert.notEqual(getPracticeAnswerXpAwardKey('q-xp', nextSessionId), firstAwardKey);
});

test('streak logic counts consecutive unique answer dates through today', () => {
  const { calculateStreak, getLocalDateKey } = loadAllTs('lib/learning/streaks.ts');

  assert.equal(getLocalDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(getLocalDateKey(new Date(2026, 10, 9, 0, 1)), '2026-11-09');
  assert.match(getLocalDateKey(new Date(Number.NaN)), /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(getLocalDateKey(new Date(Number.NaN)), 'NaN-NaN-NaN');
  assert.equal(calculateStreak(['2026-05-13', '2026-05-14', '2026-05-15'], '2026-05-15'), 3);
  assert.equal(calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], '2026-05-15'), 1);
  assert.equal(calculateStreak(['2026-05-13', '2026-05-14'], '2026-05-15'), 2);
  assert.equal(calculateStreak(['2026-05-14', '2026-05-14', '2026-05-15'], '2026-05-15'), 2);
  assert.equal(calculateStreak(['2026-05-14', 42, 'not-a-date', '2026-05-15'], '2026-05-15'), 2);
  assert.equal(calculateStreak(['2026-05-14', '2026-05-15'], 'not-a-date'), 0);
});

test('streak freeze counters stay finite integers after malformed runtime input', () => {
  const { calculateStreakWithFreeze, refillFreezes } = loadAllTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T08:00:00.000Z');

  const refilled = refillFreezes(
    {
      available: Number.NaN,
      lastEarnedAt: '2026-05-18',
      lifetimeEarned: '2',
      lifetimeSpent: -1,
      rescuedDayKeys: [],
    },
    now,
  );

  assert.equal(refilled.available, 0);
  assert.equal(refilled.lifetimeEarned, 0);
  assert.equal(refilled.lifetimeSpent, 0);

  const rescued = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-17', '2026-05-19'],
    freezeState: {
      available: 4.5,
      lastEarnedAt: '2026-05-18',
      lifetimeEarned: 4,
      lifetimeSpent: '2',
      rescuedDayKeys: [],
    },
    today: '2026-05-19',
    now,
  });

  assert.equal(rescued.streakDays, 1);
  assert.equal(rescued.freezeState.available, 0);
  assert.equal(rescued.freezeState.lifetimeSpent, 0);
  assert.deepEqual(rescued.rescuedThisRun, []);
});

test('daily goal counts question answers for the requested local day only', () => {
  const { countAnswersForLocalDate } = loadAllTs('lib/learning/streaks.ts');

  const today = new Date(2026, 4, 17, 12);
  const yesterday = new Date(2026, 4, 16, 12);
  const tomorrow = new Date(2026, 4, 18, 12);
  const laterToday = new Date(2026, 4, 17, 23, 59);

  assert.equal(
    countAnswersForLocalDate(
      {
        q001: { lastAnsweredAt: today.toISOString() },
        q002: { lastAnsweredAt: yesterday.toISOString() },
        q003: { lastAnsweredAt: tomorrow.toISOString() },
        q004: { lastAnsweredAt: 'not-a-date' },
        q005: {},
        q006: { lastAnsweredAt: laterToday.toISOString() },
      },
      today,
    ),
    1,
  );
  assert.equal(countAnswersForLocalDate({}, today), 0);
});

test('daily goal ignores rollover, malformed, non-string, and future answer dates', () => {
  const { countAnswersForLocalDate } = loadAllTs('lib/learning/streaks.ts');

  const rolloverTarget = new Date(2026, 2, 2, 12);
  const farFutureTarget = new Date(2099, 0, 1, 12);

  assert.equal(
    countAnswersForLocalDate(
      {
        valid: { lastAnsweredAt: '2026-03-02T08:00:00.000Z' },
        lateValid: { lastAnsweredAt: '2026-03-02T20:00:00.000Z' },
        rolloverTimestamp: { lastAnsweredAt: '2026-02-30T08:00:00.000Z' },
        rolloverDateOnly: { lastAnsweredAt: '2026-02-30' },
        malformed: { lastAnsweredAt: 'not-a-date' },
        empty: { lastAnsweredAt: '' },
        nonString: { lastAnsweredAt: 42 },
      },
      rolloverTarget,
    ),
    2,
  );
  assert.equal(
    countAnswersForLocalDate(
      {
        future: { lastAnsweredAt: '2099-01-01T08:00:00.000Z' },
      },
      farFutureTarget,
    ),
    0,
  );
});

test('daily goal prefers per-answer attempts and falls back for older progress stores', () => {
  const { countAnswerAttemptsForLocalDate } = loadAllTs('lib/learning/streaks.ts');

  const today = new Date(2026, 4, 17, 12);
  const yesterday = new Date(2026, 4, 16, 12);
  const questionProgress = {
    q001: { lastAnsweredAt: today.toISOString() },
    q002: { lastAnsweredAt: yesterday.toISOString() },
  };

  assert.equal(
    countAnswerAttemptsForLocalDate({
      answerAttempts: [
        { questionId: 'q001', answeredAt: today.toISOString() },
        { questionId: 'q001', answeredAt: today.toISOString() },
        { questionId: 'q001', answeredAt: today.toISOString() },
        { questionId: 'q002', answeredAt: yesterday.toISOString() },
        { questionId: 'q003', answeredAt: new Date(2026, 4, 17, 23, 59).toISOString() },
        { questionId: 'q004', answeredAt: 'not-a-date' },
      ],
      questionProgress,
      date: today,
    }),
    3,
  );
  assert.equal(countAnswerAttemptsForLocalDate({ questionProgress, date: today }), 1);
  assert.equal(
    countAnswerAttemptsForLocalDate({ answerAttempts: [], questionProgress, date: today }),
    1,
  );
});

test('daily goal attempt counting keeps duplicate valid answers and rejects invalid timestamps', () => {
  const { countAnswerAttemptsForLocalDate } = loadAllTs('lib/learning/streaks.ts');

  const target = new Date(2026, 2, 2, 12);

  assert.equal(
    countAnswerAttemptsForLocalDate({
      answerAttempts: [
        { questionId: 'q001', answeredAt: '2026-03-02T08:00:00.000Z' },
        { questionId: 'q001', answeredAt: '2026-03-02T20:00:00.000Z' },
        { questionId: 'q-rollover', answeredAt: '2026-02-30T08:00:00.000Z' },
        { questionId: 'q-rollover-date', answeredAt: '2026-02-30' },
        { questionId: 'q-malformed', answeredAt: 'not-a-date' },
        { questionId: 'q-non-string', answeredAt: 42 },
      ],
      date: target,
    }),
    2,
  );
  assert.equal(
    countAnswerAttemptsForLocalDate({
      questionProgress: {
        valid: { lastAnsweredAt: '2026-03-02T08:00:00.000Z' },
        lateValid: { lastAnsweredAt: '2026-03-02T20:00:00.000Z' },
        rollover: { lastAnsweredAt: '2026-02-30T08:00:00.000Z' },
      },
      date: target,
    }),
    2,
  );
});

test('daily flashcard deck prioritizes unanswered, saved, wrong, and stale questions', () => {
  const { selectDailyFlashcardDeck } = loadAllTs('lib/learning/flashcardDeck.ts');
  const questions = Array.from({ length: 6 }, (_, index) => ({
    chapterId: 'ch01',
    correctOptionId: 'a',
    id: `q00${index + 1}`,
    options: [],
  }));

  const deck = selectDailyFlashcardDeck({
    date: new Date(2026, 4, 20, 12),
    limit: 5,
    questionProgress: {
      q001: {
        questionId: 'q001',
        seenCount: 4,
        correctCount: 4,
        wrongCount: 0,
        correctStreak: 4,
        lastAnsweredAt: '2026-05-20T08:00:00.000Z',
      },
      q002: {
        questionId: 'q002',
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        bookmarked: true,
      },
      q003: {
        questionId: 'q003',
        seenCount: 2,
        correctCount: 1,
        wrongCount: 1,
        correctStreak: 0,
      },
      q005: {
        questionId: 'q005',
        seenCount: 3,
        correctCount: 3,
        wrongCount: 0,
        correctStreak: 3,
        lastAnsweredAt: '2026-05-01T08:00:00.000Z',
      },
      q006: {
        questionId: 'q006',
        seenCount: 3,
        correctCount: 3,
        wrongCount: 0,
        correctStreak: 3,
        nextReviewAt: '2026-05-19T08:00:00.000Z',
      },
    },
    questions,
  });

  assert.deepEqual(
    deck.map((question) => question.id),
    ['q002', 'q003', 'q004', 'q006', 'q005'],
  );
});

test('daily flashcard deck rotates completed-only study cards by local date', () => {
  const { selectDailyFlashcardDeck } = loadAllTs('lib/learning/flashcardDeck.ts');
  const questions = Array.from({ length: 12 }, (_, index) => ({
    chapterId: 'ch01',
    correctOptionId: 'a',
    id: `q${String(index + 1).padStart(3, '0')}`,
    options: [],
  }));
  const questionProgress = Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        questionId: question.id,
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: '2026-05-20T08:00:00.000Z',
      },
    ]),
  );

  const today = selectDailyFlashcardDeck({
    date: new Date(2026, 4, 20, 12),
    questionProgress,
    questions,
  }).map((question) => question.id);
  const sameDay = selectDailyFlashcardDeck({
    date: new Date(2026, 4, 20, 20),
    questionProgress,
    questions,
  }).map((question) => question.id);
  const tomorrow = selectDailyFlashcardDeck({
    date: new Date(2026, 4, 21, 12),
    questionProgress,
    questions,
  }).map((question) => question.id);

  assert.deepEqual(sameDay, today);
  assert.notDeepEqual(tomorrow, today);
});

test('daily flashcard deck ignores noncanonical progress timestamps for stale and due priority', () => {
  const { selectDailyFlashcardDeck } = loadAllTs('lib/learning/flashcardDeck.ts');
  const questions = Array.from({ length: 10 }, (_, index) => ({
    chapterId: 'ch01',
    correctOptionId: 'a',
    id: `q${String(index + 1).padStart(3, '0')}`,
    options: [],
  }));

  const deck = selectDailyFlashcardDeck({
    date: new Date('2026-03-10T12:00:00.000Z'),
    limit: 3,
    questionProgress: {
      q001: {
        questionId: 'q001',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: '2026-02-30T08:00:00.000Z',
      },
      q002: {
        questionId: 'q002',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: '2026-02-20',
      },
      q003: {
        questionId: 'q003',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: 1773133200000,
      },
      q004: {
        questionId: 'q004',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        nextReviewAt: '2026-02-30T08:00:00.000Z',
      },
      q005: {
        questionId: 'q005',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        nextReviewAt: '2026-03-09T08:00:00.000Z',
      },
      q006: {
        questionId: 'q006',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: '2026-02-20T08:00:00.000Z',
      },
      q008: {
        questionId: 'q008',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: 'prefix-2026-02-20T08:00:00.000Z',
      },
      q009: {
        questionId: 'q009',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        nextReviewAt: '2099-01-01T00:00:00.000Z',
      },
      q010: {
        questionId: 'q010',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: '2026-03-10T08:00:00.000Z',
      },
    },
    questions,
  });

  assert.deepEqual(
    deck.map((question) => question.id),
    ['q007', 'q005', 'q006'],
  );
});

test('progress answer dates use the shared local calendar key', () => {
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );

  assert.match(progressStore, /import \{ getLocalDateKey \} from '\.\.\/learning\/streaks';/);
  assert.match(progressStore, /const answerDate = getLocalDateKey\(new Date\(answeredAt\)\);/);
  assert.doesNotMatch(progressStore, /answeredAt\.slice\(0,\s*10\)/);
});

test('mastery blends accuracy, coverage, and recency', () => {
  const { calculateMastery, findWeakChapterIds } = loadAllTs('lib/learning/mastery.ts');

  assert.equal(
    calculateMastery({ correctCount: 8, seenCount: 10, totalQuestions: 20, recent: true }),
    0.75,
  );
  assert.equal(
    calculateMastery({ correctCount: 0, seenCount: 0, totalQuestions: 20, recent: false }),
    0,
  );

  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };
  assert.deepEqual(findWeakChapterIds(questions, progress, 0.7), ['ch01']);
});

test('mastery ignores malformed runtime counters and unsafe thresholds', () => {
  const { calculateChapterMastery, calculateMastery, findWeakChapterIds } =
    loadAllTs('lib/learning/mastery.ts');
  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };

  [
    { correctCount: Number.NaN, seenCount: 10, totalQuestions: 20, recent: true },
    { correctCount: 8, seenCount: Infinity, totalQuestions: 20, recent: true },
    { correctCount: -1, seenCount: 10, totalQuestions: 20, recent: true },
    { correctCount: 5, seenCount: 10, totalQuestions: 20.5, recent: true },
    { correctCount: '5', seenCount: 10, totalQuestions: 20, recent: true },
  ].forEach((input) => {
    assert.equal(calculateMastery(input), 0);
  });
  assert.equal(
    calculateMastery({ correctCount: 8, seenCount: 10, totalQuestions: 20, recent: 'yes' }),
    0.55,
  );
  assert.equal(
    calculateChapterMastery('ch01', questions, {
      q1: { correctCount: Number.NaN, seenCount: 2, wrongCount: 0 },
      q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    }),
    0.85,
  );
  assert.deepEqual(
    findWeakChapterIds(
      questions,
      {
        q1: { correctCount: Number.NaN, seenCount: 2, wrongCount: 0 },
        q2: { correctCount: 1, seenCount: Infinity, wrongCount: 0 },
        q3: { correctCount: 0, seenCount: 0, wrongCount: Number.NaN },
      },
      0.7,
    ),
    [],
  );
  assert.deepEqual(findWeakChapterIds(questions, progress, Number.NaN), []);
  assert.deepEqual(findWeakChapterIds(questions, progress, -1), []);
});

test('weak chapter selector ignores malformed runtime progress and chapter metadata', () => {
  const { chapterWeaknesses, topWeakChapters } = loadAllTs('lib/learning/weakChapters.ts');
  const progress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions: [
      {
        id: 'session-1',
        mode: 'study',
        questionIds: [],
        answers: [
          { questionId: 'nan-1', isCorrect: 'yes', answeredAt: '2026-05-18T10:00:00.000Z' },
          { questionId: 'negative-1', isCorrect: 1, answeredAt: '2026-05-18T10:00:00.000Z' },
          { questionId: 'valid-1', isCorrect: true, answeredAt: '2026-05-18T10:00:00.000Z' },
          { questionId: 'valid-2', isCorrect: 'true', answeredAt: '2026-05-18T10:00:00.000Z' },
          { questionId: 'bad-date', isCorrect: true, answeredAt: 'not-a-date' },
        ],
      },
    ],
  };
  const input = {
    progress,
    chapters: [
      { id: 'nan-count', questionCount: Number.NaN },
      { id: 'negative-count', questionCount: -2 },
      { id: 'valid', questionCount: 4 },
    ],
    questionChapterIndex: {
      'nan-1': 'nan-count',
      'negative-1': 'negative-count',
      'valid-1': 'valid',
      'valid-2': 'valid',
      'bad-date': 'valid',
    },
    now: new Date('not-a-date'),
    minAnswers: Number.NaN,
    recencyDays: Infinity,
  };

  const result = chapterWeaknesses(input);
  result.forEach((chapter) => {
    assert.ok(Number.isFinite(chapter.coverage));
    assert.ok(chapter.coverage >= 0 && chapter.coverage <= 1);
    assert.ok(Number.isFinite(chapter.weaknessScore));
    assert.ok(chapter.weaknessScore >= 0 && chapter.weaknessScore <= 1);
  });
  assert.equal(result.find((chapter) => chapter.chapterId === 'nan-count').accuracy, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'negative-count').coverage, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'valid').accuracy, 0.5);
  assert.deepEqual(
    chapterWeaknesses({ progress: null, chapters: null, questionChapterIndex: null }),
    [],
  );
  assert.deepEqual(
    topWeakChapters(input, 2).map((chapter) => chapter.chapterId),
    ['nan-count', 'negative-count'],
  );
});

test('readiness score can be derived from the persisted question progress snapshot', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');

  const questions = Array.from({ length: 40 }, (_, index) => ({
    id: `q${index}`,
    chapterId: index < 20 ? 'ch01' : 'ch02',
  }));
  const questionProgress = Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-18T10:00:00.000Z',
      },
    ]),
  );

  const result = computeReadinessFromQuestionProgress({
    questionProgress,
    questions,
    chapters: [
      { id: 'ch01', questionCount: 20 },
      { id: 'ch02', questionCount: 20 },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.verdict, 'strong_preparation');
  assert.equal(result.isSparse, false);
  assert.ok(result.score >= 85);
  assert.equal(result.components.accuracy, 1);
  assert.equal(result.components.coverage, 1);
});

test('readiness adapter can reuse precomputed question-bank indexes', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');
  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch02' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const input = {
    questionProgress: {
      q1: {
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        lastAnsweredAt: '2026-05-18T10:00:00.000Z',
      },
      outsideBank: {
        seenCount: 99,
        correctCount: 99,
        wrongCount: 0,
        lastAnsweredAt: '2026-05-18T10:00:00.000Z',
      },
    },
    questions,
    chapters: [
      { id: 'ch01', questionCount: 1 },
      { id: 'ch02', questionCount: 2 },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
  };

  const derivedIndexes = computeReadinessFromQuestionProgress(input);
  const precomputedIndexes = computeReadinessFromQuestionProgress({
    ...input,
    questionChapterIndex: Object.fromEntries(
      questions.map((question) => [question.id, question.chapterId]),
    ),
    questionIdsInBank: new Set(questions.map((question) => question.id)),
  });

  assert.deepEqual(precomputedIndexes, derivedIndexes);
  assert.equal(precomputedIndexes.components.accuracy, 1);
  assert.equal(precomputedIndexes.components.coverage, 0.5);
});

test('weak chapter selector builds per-chapter totals without repeated full-bank filters', () => {
  const { calculateChapterMastery, findWeakChapterIds } = loadAllTs('lib/learning/mastery.ts');
  const source = fs.readFileSync(path.join(repoRoot, 'lib/learning/mastery.ts'), 'utf8');
  const questions = [
    { id: 'strong-1', chapterId: 'strong' },
    { id: 'weak-1', chapterId: 'weak' },
    { id: 'weak-2', chapterId: 'weak' },
    { id: 'unseen-1', chapterId: 'unseen' },
  ];
  const progress = {
    'strong-1': { seenCount: 1, correctCount: 1, wrongCount: 0 },
    'weak-1': { seenCount: 1, correctCount: 0, wrongCount: 1 },
    'weak-2': { seenCount: 1, correctCount: 1, wrongCount: 0 },
  };

  assert.equal(calculateChapterMastery('strong', questions, progress), 1);
  assert.equal(calculateChapterMastery('missing', questions, progress), 0);
  assert.deepEqual(findWeakChapterIds(questions, progress, 0.8), ['weak']);
  assert.match(source, /function chapterMasteryTotalsById\(/);
  assert.match(
    source,
    /for \(const \[chapterId, totals\] of chapterMasteryTotalsById\(questions, progress\)\)/,
  );
  assert.doesNotMatch(source, /export function findWeakChapterIds[\s\S]*questions\.filter\(/);
  assert.doesNotMatch(
    source,
    /export function findWeakChapterIds[\s\S]*calculateChapterMastery\(chapterId, questions, progress\)/,
  );
});

test('readiness score softens copy when there are too few stored answers', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');
  const result = computeReadinessFromQuestionProgress({
    questionProgress: {
      q1: {
        seenCount: 1,
        correctCount: 0,
        lastAnsweredAt: '2026-05-18T10:00:00.000Z',
      },
    },
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.isSparse, true);
  assert.equal(result.verdict, 'not_ready_yet');
});

test('readiness score includes recent persisted mock exam results', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');

  const base = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  const withMocks = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      { sessionId: 'old', score: 0.1, completedAt: '2026-05-01T10:00:00.000Z' },
      { sessionId: 'm1', score: 0.8, completedAt: '2026-05-17T10:00:00.000Z' },
      { sessionId: 'm2', score: 0.7, completedAt: '2026-05-18T10:00:00.000Z' },
      { sessionId: 'm3', score: 0.9, completedAt: '2026-05-19T10:00:00.000Z' },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(base.components.mockAverage, 0);
  assert.ok(Math.abs(withMocks.components.mockAverage - 0.8) < 0.0001);
  assert.ok(withMocks.components.recency > 0.99);
  assert.equal(withMocks.score, 34);
  assert.ok(withMocks.score > base.score);
});

test('readiness mock totals do not inflate rolling practice accuracy', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');

  const result = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      {
        sessionId: 'mock-with-counts',
        score: 0.8,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 32,
        totalCount: 40,
      },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.components.accuracy, 0);
  assert.equal(result.components.mockAverage, 0.8);
  assert.ok(result.score > 0);
});

test('readiness adapter ignores malformed counters and bounds synthetic answers', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const questions = Array.from({ length: 5 }, (_, index) => ({
    id: `q${index + 1}`,
    chapterId: 'ch01',
  }));
  const chapters = [{ id: 'ch01', questionCount: 5 }];

  const malformedStudy = computeReadinessFromQuestionProgress({
    questionProgress: {
      q1: {
        seenCount: '5',
        correctCount: Number.POSITIVE_INFINITY,
        wrongCount: Number.NaN,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
      },
    },
    questions,
    chapters,
    now,
  });
  assert.equal(malformedStudy.components.accuracy, 0);
  assert.equal(malformedStudy.components.coverage, 0);
  assert.equal(malformedStudy.score, 0);

  const oversizedStudy = computeReadinessFromQuestionProgress({
    questionProgress: {
      q1: {
        seenCount: 999,
        correctCount: 999,
        wrongCount: 999,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
      },
    },
    questions,
    chapters,
    now,
  });
  assert.equal(oversizedStudy.components.accuracy, 1);
  assert.equal(oversizedStudy.components.coverage, 1);
  assert.equal(oversizedStudy.isSparse, true);

  const oversizedMock = computeReadinessFromQuestionProgress({
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    mockExamSessions: [
      {
        sessionId: 'oversized-mock-counts',
        score: 0.9,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 999,
        totalCount: 999,
      },
    ],
    now,
  });
  assert.equal(oversizedMock.components.accuracy, 0);
  assert.equal(oversizedMock.components.mockAverage, 0.9);
  assert.equal(oversizedMock.isSparse, true);
});

test('readiness mock recency uses completion metadata without depending on synthetic answers', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');
  const commonInput = {
    questionProgress: {},
    questions: [{ id: 'q1', chapterId: 'ch01' }],
    chapters: [{ id: 'ch01', questionCount: 10 }],
    now: new Date('2026-05-19T12:00:00.000Z'),
  };

  const scoreOnlyMock = computeReadinessFromQuestionProgress({
    ...commonInput,
    mockExamSessions: [
      { sessionId: 'score-only', score: 0.8, completedAt: '2026-05-19T10:00:00.000Z' },
    ],
  });
  const countedMock = computeReadinessFromQuestionProgress({
    ...commonInput,
    mockExamSessions: [
      {
        sessionId: 'counted',
        score: 0.8,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 32,
        totalCount: 40,
      },
    ],
  });

  assert.equal(scoreOnlyMock.components.recency, countedMock.components.recency);
  assert.ok(scoreOnlyMock.components.recency > 0.99);
  assert.equal(scoreOnlyMock.components.accuracy, 0);
  assert.equal(countedMock.components.accuracy, 0);
});

test('dashboard mock history ignores invalid completions and nulls invalid duration math', () => {
  const { bestMockScore, mockHistory } = loadAllTs('lib/learning/dashboardStats.ts');
  const progress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions: [
      {
        id: 'valid',
        mode: 'exam',
        questionIds: [],
        answers: [],
        startedAt: '2026-05-20T10:00:00.000Z',
        completedAt: '2026-05-20T10:45:00.000Z',
        score: 0.72,
      },
      {
        id: 'backwards',
        mode: 'exam',
        questionIds: [],
        answers: [],
        startedAt: '2026-05-20T12:00:00.000Z',
        completedAt: '2026-05-20T11:00:00.000Z',
        score: 0.81,
      },
      {
        id: 'invalid-completed',
        mode: 'exam',
        questionIds: [],
        answers: [],
        startedAt: '2026-05-20T12:00:00.000Z',
        completedAt: 'not-a-date',
        score: 0.99,
      },
    ],
  };

  assert.deepEqual(
    mockHistory(progress).map((entry) => ({
      durationMs: entry.durationMs,
      sessionId: entry.sessionId,
    })),
    [
      { durationMs: 45 * 60 * 1000, sessionId: 'valid' },
      { durationMs: null, sessionId: 'backwards' },
    ],
  );
  assert.equal(bestMockScore(progress), 0.81);
});

test('dashboard selectors clamp bad day-window options before rendering bins', () => {
  const { MAX_DASHBOARD_DAYS_BACK, dailyActivityHistogram, mistakeConvergence, xpSparkline } =
    loadAllTs('lib/learning/dashboardStats.ts');
  const progress = { sessions: [] };
  const now = new Date('2026-05-19T12:00:00.000Z');

  assert.equal(dailyActivityHistogram(progress, { daysBack: Infinity, now }).length, 53 * 7);
  assert.equal(
    dailyActivityHistogram(progress, { daysBack: MAX_DASHBOARD_DAYS_BACK + 1, now }).length,
    MAX_DASHBOARD_DAYS_BACK,
  );
  assert.equal(mistakeConvergence(progress, { daysBack: 0, now }).length, 1);
  assert.equal(xpSparkline(progress, { daysBack: 4.6, now }).length, 4);
  assert.equal(xpSparkline(progress, { daysBack: Number.NaN, now }).length, 30);
});

test('weekly recap runtime guards reject malformed imported progress', () => {
  const { generateWeeklyRecap } = loadAllTs('lib/learning/weeklyRecap.ts');
  const recap = generateWeeklyRecap({
    progress: {
      totalXp: 0,
      level: 1,
      currentStreak: '7',
      dailyGoalAnswers: 10,
      questionProgress: {
        valid: {
          questionId: 'valid',
          correctStreak: 1,
          wrongCount: 1,
          lastAnsweredAt: '2026-05-20T10:03:00.000Z',
        },
        stringCounters: {
          questionId: 'stringCounters',
          correctStreak: '1',
          wrongCount: '2',
          lastAnsweredAt: '2026-05-20T10:04:00.000Z',
        },
        rolloverDate: {
          questionId: 'rolloverDate',
          correctStreak: 1,
          wrongCount: 1,
          lastAnsweredAt: '2026-02-30T10:05:00.000Z',
        },
        localTimeDate: {
          questionId: 'localTimeDate',
          correctStreak: 1,
          wrongCount: 1,
          lastAnsweredAt: '2026-05-20T10:06:00',
        },
        futureDate: {
          questionId: 'futureDate',
          correctStreak: 1,
          wrongCount: 1,
          lastAnsweredAt: '2026-05-20T12:10:01.000Z',
        },
      },
      sessions: [
        {
          id: 'weekly-bad',
          mode: 'exam',
          questionIds: ['q1', 'q2', 'q3'],
          startedAt: '2026-05-20T10:00:00.000Z',
          completedAt: '2026-05-20T10:30:00.000Z',
          score: Infinity,
          answers: [
            {
              questionId: 'q1',
              selectedOptionIds: ['a'],
              isCorrect: 'true',
              answeredAt: '2026-05-20T10:00:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q2',
              selectedOptionIds: ['a'],
              isCorrect: 1,
              answeredAt: '2026-05-20T10:01:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q3',
              selectedOptionIds: ['a'],
              isCorrect: false,
              answeredAt: '2026-05-20T10:02:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q-rollover',
              selectedOptionIds: ['a'],
              isCorrect: true,
              answeredAt: '2026-02-30T10:03:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q-local-time',
              selectedOptionIds: ['a'],
              isCorrect: true,
              answeredAt: '2026-05-20T10:04:00',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'q-future',
              selectedOptionIds: ['a'],
              isCorrect: true,
              answeredAt: '2026-05-20T12:10:01.000Z',
              timeSpentSeconds: 5,
            },
          ],
        },
        {
          id: 'weekly-high',
          mode: 'exam',
          questionIds: [],
          answers: [],
          startedAt: '2026-05-20T11:00:00.000Z',
          completedAt: '2026-05-20T11:20:00.000Z',
          score: 1.2,
        },
        {
          id: 'weekly-rollover-completed-at',
          mode: 'exam',
          questionIds: [],
          answers: [],
          startedAt: '2026-02-30T11:00:00.000Z',
          completedAt: '2026-02-30T11:20:00.000Z',
          score: 1,
        },
        {
          id: 'weekly-local-time-completed-at',
          mode: 'exam',
          questionIds: [],
          answers: [],
          startedAt: '2026-05-20T11:30:00',
          completedAt: '2026-05-20T11:40:00',
          score: 1,
        },
        {
          id: 'weekly-future-completed-at',
          mode: 'exam',
          questionIds: [],
          answers: [],
          startedAt: '2026-05-20T12:06:00.000Z',
          completedAt: '2026-05-20T12:10:01.000Z',
          score: 1,
        },
      ],
    },
    chapterMasteryAtWeekStart: { ch01: 0.1, ch02: '0.1' },
    chapterMasteryNow: { ch01: Infinity, ch02: 0.9 },
    masteryThreshold: '0.8',
    now: new Date('2026-05-20T12:00:00.000Z'),
  });

  assert.equal(recap.questionsAnswered, 3);
  assert.equal(recap.accuracy, 0);
  assert.equal(recap.mistakesResolved, 1);
  assert.equal(recap.streakDays, 0);
  assert.equal(recap.mockExamsTaken, 2);
  assert.equal(recap.bestMockScore, 1);
  assert.equal(recap.chapterNowMastered, null);
});

test('mock exam completion XP is awarded once per stored session', () => {
  const { useProgressStore } = loadAllTs('lib/storage/progressStore.ts');
  const store = useProgressStore;

  store.getState().resetProgress();
  store.getState().recordMockExamSession({
    sessionId: 'empty-submission',
    score: 0,
    correctCount: 0,
    totalCount: 0,
    completedAt: '2026-05-19T10:00:00.000Z',
  });
  assert.equal(store.getState().totalXp, 0);

  store.getState().recordMockExamSession({
    sessionId: 'mock-perfect',
    score: 1,
    correctCount: 10,
    totalCount: 10,
    completedAt: '2026-05-19T10:05:00.000Z',
  });
  assert.equal(store.getState().totalXp, 70);

  store.getState().recordMockExamSession({
    sessionId: 'mock-perfect',
    score: 0.9,
    correctCount: 9,
    totalCount: 10,
    completedAt: '2026-05-19T10:06:00.000Z',
  });
  assert.equal(store.getState().totalXp, 70);
  assert.equal(store.getState().mockExamSessions.length, 2);
  assert.equal(
    store.getState().mockExamSessions.find((session) => session.sessionId === 'mock-perfect')
      .correctCount,
    9,
  );

  store.getState().recordMockExamSession({
    sessionId: 'mock-complete',
    score: 0.6,
    correctCount: 6,
    totalCount: 10,
    completedAt: '2026-05-19T10:10:00.000Z',
  });
  assert.equal(store.getState().totalXp, 90);
});

test('readiness and dashboard selectors ignore invalid or future answer dates', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');
  const { dashboardSummary } = loadAllTs('lib/learning/dashboardStats.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const questionProgress = {
    valid: {
      seenCount: 1,
      correctCount: 1,
      wrongCount: 0,
      lastAnsweredAt: '2026-05-18T10:00:00.000Z',
    },
    invalid: {
      seenCount: 20,
      correctCount: 20,
      wrongCount: 0,
      lastAnsweredAt: 'not-a-date',
    },
    future: {
      seenCount: 20,
      correctCount: 0,
      wrongCount: 20,
      lastAnsweredAt: '2099-01-01T00:00:00.000Z',
    },
  };

  const readiness = computeReadinessFromQuestionProgress({
    questionProgress,
    questions: [
      { id: 'valid', chapterId: 'ch01' },
      { id: 'invalid', chapterId: 'ch02' },
      { id: 'future', chapterId: 'ch02' },
    ],
    chapters: [
      { id: 'ch01', questionCount: 10 },
      { id: 'ch02', questionCount: 10 },
    ],
    now,
  });

  assert.equal(readiness.components.accuracy, 1);
  assert.equal(readiness.components.coverage, 0.5);
  assert.equal(readiness.isSparse, true);

  const summary = dashboardSummary(
    {
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      dailyGoalAnswers: 10,
      questionProgress: {},
      sessions: [
        {
          id: 's1',
          mode: 'study',
          questionIds: [],
          startedAt: '2026-05-18T00:00:00.000Z',
          answers: [
            {
              questionId: 'valid',
              selectedOptionIds: [],
              isCorrect: true,
              answeredAt: '2026-05-18T10:00:00.000Z',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'invalid',
              selectedOptionIds: [],
              isCorrect: false,
              answeredAt: 'not-a-date',
              timeSpentSeconds: 5,
            },
            {
              questionId: 'future',
              selectedOptionIds: [],
              isCorrect: false,
              answeredAt: '2099-01-01T00:00:00.000Z',
              timeSpentSeconds: 5,
            },
          ],
        },
      ],
    },
    { valid: 'ch01', invalid: 'ch02', future: 'ch02' },
    { now },
  );

  assert.equal(summary.questionsAnsweredThisWeek, 1);
  assert.equal(summary.unresolvedMistakes, 0);
  assert.equal(summary.chaptersWithAnyAnswer, 1);
});

test('adaptive practice treats malformed correctness and accuracy overrides as neutral runtime input', () => {
  const { explainAdaptivePick, pickAdaptiveSession } = loadAllTs(
    'lib/learning/adaptivePractice.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const progress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions: [
      {
        id: 'adaptive-malformed',
        mode: 'study',
        questionIds: [],
        startedAt: '2026-05-19T09:00:00.000Z',
        answers: [
          {
            questionId: 'q-hard-old',
            selectedOptionIds: [],
            isCorrect: 'yes',
            answeredAt: '2026-05-19T10:00:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'q-truthy-one',
            selectedOptionIds: [],
            isCorrect: 1,
            answeredAt: '2026-05-19T10:01:00.000Z',
            timeSpentSeconds: 5,
          },
        ],
      },
    ],
  };
  const bank = [
    { id: 'q-hard-old', difficulty: 'hard', chapterId: 'ch01' },
    { id: 'q-easy-new', difficulty: 'easy', chapterId: 'ch01' },
    { id: 'q-medium-new', difficulty: 'medium', chapterId: 'ch01' },
  ];

  assert.deepEqual(pickAdaptiveSession({ progress, bank, size: 2, now }), [
    'q-hard-old',
    'q-easy-new',
  ]);
  assert.deepEqual(explainAdaptivePick({ progress, bank, size: 2, now }), {
    'recently-wrong': 1,
    unseen: 1,
    mastered: 0,
    stale: 0,
  });
  assert.deepEqual(
    pickAdaptiveSession({
      progress: { ...progress, sessions: [] },
      bank,
      size: 1,
      now,
      recentAccuracyOverride: Number.POSITIVE_INFINITY,
    }),
    ['q-medium-new'],
  );
});

test('spaced repetition schedules wrong answers soon and known answers later', () => {
  const { getNextReviewAt } = loadAllTs('lib/learning/spacedRepetition.ts');

  assert.equal(
    getNextReviewAt({ isCorrect: false, correctStreak: 0, answeredAt: '2026-05-15T10:00:00.000Z' }),
    '2026-05-16T10:00:00.000Z',
  );
  assert.equal(
    getNextReviewAt({ isCorrect: true, correctStreak: 3, answeredAt: '2026-05-15T10:00:00.000Z' }),
    '2026-05-30T10:00:00.000Z',
  );
  assert.equal(
    getNextReviewAt({
      isCorrect: 'true',
      correctStreak: 3,
      answeredAt: '2026-05-15T10:00:00.000Z',
    }),
    '2026-05-16T10:00:00.000Z',
  );
  assert.equal(
    getNextReviewAt({
      isCorrect: true,
      correctStreak: Number.NaN,
      answeredAt: '2026-05-15T10:00:00.000Z',
    }),
    '2026-05-16T10:00:00.000Z',
  );

  const beforeInvalidAnsweredAt = Date.now();
  const invalidAnsweredAtNext = getNextReviewAt({
    isCorrect: true,
    correctStreak: 4,
    answeredAt: 'not-a-date',
  });
  const afterInvalidAnsweredAt = Date.now();
  const invalidAnsweredAtNextMs = Date.parse(invalidAnsweredAtNext);
  const dayMs = 24 * 60 * 60 * 1000;
  assert.ok(Number.isFinite(invalidAnsweredAtNextMs));
  assert.ok(invalidAnsweredAtNextMs >= beforeInvalidAnsweredAt + dayMs);
  assert.ok(invalidAnsweredAtNextMs <= afterInvalidAnsweredAt + dayMs + 1000);
});

test('badges unlock from progress milestones', () => {
  const { deriveBadges, getAllBadges, getBadgeProgressHint, getBadgeTitle } =
    loadAllTs('lib/learning/badges.ts');

  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id),
    ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'],
  );
  assert.deepEqual(
    getAllBadges().map((badge) => getBadgeTitle(badge, 'sv')),
    ['Första övningen', 'Tre dagars svit', 'Nivå 2', 'Misstagsrepetition'],
  );
  assert.equal(
    getBadgeProgressHint(
      getAllBadges()[1],
      { completedQuestionCount: 0, currentStreak: 2, level: 1, wrongAnswerCount: 0 },
      'en',
    ),
    '2/3 streak days',
  );
});
