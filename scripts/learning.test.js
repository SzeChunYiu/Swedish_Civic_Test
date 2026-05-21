const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  function localRequire(request) {
    if (request.startsWith('.')) {
      const resolved = path.join(path.dirname(path.join(repoRoot, relativePath)), request);
      const normalized = path.relative(repoRoot, resolved).replace(/\.ts$/, '') + '.ts';
      return loadAllTs(normalized);
    }
    if (request === 'react-native-mmkv') {
      const memory = new Map();
      return {
        createMMKV: () => ({
          getString: (key) => memory.get(key),
          set: (key, value) => memory.set(key, value),
        }),
      };
    }
    if (request === 'zustand') {
      return {
        create: (initializer) => {
          let state;
          const set = (updater) => {
            const next = typeof updater === 'function' ? updater(state) : updater;
            if (next === state) return;
            state = { ...state, ...next };
          };
          const get = () => state;
          const store = (selector) => (selector ? selector(state) : state);
          store.getState = get;
          store.setState = set;
          state = initializer(set, get);
          return store;
        },
      };
    }
    return require(request);
  }
  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function loadAllTs(relativePath) {
  return loadTs(relativePath);
}

test('XP rules follow the MVP gamification table', () => {
  const { calculateAnswerXp, calculateLevel, calculateQuizCompletionXp } =
    loadAllTs('lib/learning/xp.ts');

  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: true }), 12);
  assert.equal(calculateAnswerXp({ isCorrect: false, explanationRead: true }), 4);
  assert.equal(calculateAnswerXp({ isCorrect: 'true', explanationRead: true }), 0);
  assert.equal(calculateAnswerXp({ isCorrect: 'false', explanationRead: 'yes' }), 0);
  assert.equal(calculateAnswerXp({ isCorrect: true, explanationRead: 'yes' }), 10);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }), 70);
  assert.equal(calculateQuizCompletionXp({ answeredCount: '10', correctCount: '10' }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: NaN, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: Infinity, correctCount: Infinity }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10.5, correctCount: 10 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: -1, correctCount: 0 }), 0);
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 11 }), 0);
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel('10000'), 1);
  assert.equal(calculateLevel(NaN), 1);
  assert.equal(calculateLevel(Infinity), 1);
  assert.equal(calculateLevel(100), 2);
  assert.equal(calculateLevel(400), 3);
});

test('streak logic counts consecutive unique answer dates through today', () => {
  const { calculateStreak, getLocalDateKey } = loadAllTs('lib/learning/streaks.ts');

  assert.equal(getLocalDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(getLocalDateKey(new Date(2026, 10, 9, 0, 1)), '2026-11-09');
  assert.equal(calculateStreak(['2026-05-13', '2026-05-14', '2026-05-15'], '2026-05-15'), 3);
  assert.equal(calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], '2026-05-15'), 1);
  assert.equal(calculateStreak(['2026-05-13', '2026-05-14'], '2026-05-15'), 2);
  assert.equal(calculateStreak(['2026-05-14', '2026-05-14', '2026-05-15'], '2026-05-15'), 2);
});

test('streakWithFreeze ignores malformed date inputs without corrupting freeze state', () => {
  const { calculateStreakWithFreeze, refillFreezes } = loadAllTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const freezeState = {
    available: 1,
    lastEarnedAt: 'not-a-date',
    lifetimeEarned: 1,
    lifetimeSpent: 0,
    rescuedDayKeys: ['bad-key', '2026-05-17'],
  };

  const repaired = refillFreezes(freezeState, now);
  assert.equal(repaired.lastEarnedAt, '2026-05-18');
  assert.equal(repaired.available, 1);

  const result = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-19', '2026-05-18T08:00:00.000Z', 7, '2026-02-30'],
    freezeState,
    today: 'not-a-date',
    now,
  });

  assert.equal(result.streakDays, 3);
  assert.deepEqual(result.rescuedThisRun, []);
  assert.deepEqual(result.freezeState.rescuedDayKeys, ['2026-05-17']);
  assert.doesNotMatch(
    refillFreezes(freezeState, new Date('not-a-date')).lastEarnedAt,
    /NaN|not-a-date/,
  );
});

test('answer date parser rejects calendar rollovers and preserves canonical dates', () => {
  const { validAnswerDate, validAnswerTimestampMs } = loadAllTs('lib/learning/answerDates.ts');
  const now = new Date('2026-05-21T12:00:00.000Z');

  assert.equal(
    validAnswerTimestampMs('2026-05-19T10:00:00.000Z', now),
    Date.parse('2026-05-19T10:00:00.000Z'),
  );
  assert.equal(
    validAnswerTimestampMs('2026-05-19T10:00:00+02:00', now),
    Date.parse('2026-05-19T10:00:00+02:00'),
  );
  assert.equal(validAnswerDate('2026-05-19', now)?.toISOString(), '2026-05-19T00:00:00.000Z');
  assert.equal(
    validAnswerTimestampMs('2026-05-21T12:04:59.000Z', now),
    Date.parse('2026-05-21T12:04:59.000Z'),
  );
  assert.equal(validAnswerTimestampMs('2026-02-30', now), null);
  assert.equal(validAnswerTimestampMs('2026-02-30T00:00:00.000Z', now), null);
  assert.equal(validAnswerTimestampMs('2026-13-01', now), null);
  assert.equal(validAnswerTimestampMs('2026-05-19 10:00:00', now), null);
  assert.equal(validAnswerTimestampMs('2026-05-21T12:05:01.000Z', now), null);
});

test('answer date learning consumers use the shared parser instead of direct Date.parse', () => {
  const consumerPaths = [
    'lib/learning/adaptivePractice.ts',
    'lib/learning/dashboardStats.ts',
    'lib/learning/readiness.ts',
    'lib/learning/resumeWhereLeftOff.ts',
  ];

  for (const relativePath of consumerPaths) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /validAnswer(?:TimestampMs|Date)/, `${relativePath} must use answerDates`);
    assert.doesNotMatch(source, /Date\.parse\(/, `${relativePath} must not parse answers directly`);
  }
});

test('daily goal counts question answers for the requested local day only', () => {
  const { countAnswersForLocalDate } = loadAllTs('lib/learning/streaks.ts');

  const today = new Date(2026, 4, 17, 12);
  const yesterday = new Date(2026, 4, 16, 12);
  const tomorrow = new Date(2026, 4, 18, 12);

  assert.equal(
    countAnswersForLocalDate(
      {
        q001: { lastAnsweredAt: today.toISOString() },
        q002: { lastAnsweredAt: yesterday.toISOString() },
        q003: { lastAnsweredAt: tomorrow.toISOString() },
        q004: { lastAnsweredAt: 'not-a-date' },
        q005: {},
      },
      today,
    ),
    1,
  );
  assert.equal(countAnswersForLocalDate({}, today), 0);
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
      ],
      questionProgress,
      date: today,
    }),
    3,
  );
  assert.equal(countAnswerAttemptsForLocalDate({ questionProgress, date: today }), 1);
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

test('readiness adapter aggregates counters without synthetic answer rows', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/learning/readiness.ts'), 'utf8');
  const start = source.indexOf('export function computeReadinessFromQuestionProgress');
  const end = source.indexOf('\nexport function computeReadinessScore', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const adapterSource = source.slice(start, end);
  assert.doesNotMatch(adapterSource, /Array\.from\s*\(/);
  assert.match(adapterSource, /scoreFromComponents\(/);
});

test('readiness adapter ignores malformed aggregate counters', () => {
  const { computeReadinessFromQuestionProgress } = loadAllTs('lib/learning/readiness.ts');

  const result = computeReadinessFromQuestionProgress({
    questionProgress: {
      infinite: {
        seenCount: Infinity,
        correctCount: Infinity,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
      },
      stringy: {
        seenCount: '3',
        correctCount: '2',
        wrongCount: '1',
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:01:00.000Z',
      },
      fractional: {
        seenCount: 1.5,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:02:00.000Z',
      },
      oversized: {
        seenCount: 10001,
        correctCount: 10001,
        wrongCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-19T10:03:00.000Z',
      },
      valid: {
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-19T10:04:00.000Z',
      },
    },
    questions: [
      { id: 'infinite', chapterId: 'ch01' },
      { id: 'stringy', chapterId: 'ch01' },
      { id: 'fractional', chapterId: 'ch01' },
      { id: 'oversized', chapterId: 'ch01' },
      { id: 'valid', chapterId: 'ch02' },
    ],
    chapters: [
      { id: 'ch01', questionCount: 4 },
      { id: 'ch02', questionCount: 1 },
    ],
    mockExamSessions: [
      {
        sessionId: 'score-only-invalid-total',
        score: 0.8,
        completedAt: '2026-05-19T10:05:00.000Z',
        totalCount: Infinity,
        correctCount: 32,
      },
    ],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.components.accuracy, 1);
  assert.equal(result.components.coverage, 0.5);
  assert.equal(result.components.mockAverage, 0.8);
  assert.equal(result.isSparse, true);
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
        validResolved: {
          questionId: 'validResolved',
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
      ],
    },
    chapterMasteryAtWeekStart: { ch01: 0.1, ch02: '0.1', ch03: 0.2 },
    chapterMasteryNow: { ch01: Infinity, ch02: 0.9, ch03: 1.1 },
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
    deriveBadges({
      completedQuestionCount: '1',
      currentStreak: '3',
      level: '2',
      wrongAnswerCount: '1',
    }).map((badge) => badge.id),
    [],
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: Infinity,
      currentStreak: Infinity,
      level: Infinity,
      wrongAnswerCount: Infinity,
    }).map((badge) => badge.id),
    [],
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1.5,
      currentStreak: 3.5,
      level: 2.5,
      wrongAnswerCount: 1.5,
    }).map((badge) => badge.id),
    [],
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
