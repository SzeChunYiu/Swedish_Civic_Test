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
  assert.equal(calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }), 70);
  assert.equal(calculateLevel(0), 1);
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
  const { deriveBadges } = loadAllTs('lib/learning/badges.ts');

  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id),
    ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'],
  );
});
