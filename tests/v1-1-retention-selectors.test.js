// Unit tests for v1.1 retention selectors:
//   - streakWithFreeze (Duolingo-style streak freeze, competitive-teardown rec #5)
//   - weakChapters (top-N weakest chapters for dashboard / readiness)
//   - mockExamLibrary (pre-built mocks, competitive-teardown rec #2)
//   - examDiagnostic (post-exam topic breakdown, competitive-teardown rec #3)
//
// Run with: node --test tests/v1-1-retention-selectors.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(relativePath) {
  return require(path.join(repoRoot, relativePath));
}

// ---------------------------------------------------------------- streak with freeze

test('streakWithFreeze: contiguous active days → streak counts them all, no freeze used', () => {
  const { calculateStreakWithFreeze, createInitialFreezeState } = loadTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z'); // Tuesday
  const result = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19'],
    freezeState: createInitialFreezeState(now),
    today: '2026-05-19',
    now,
  });
  assert.equal(result.streakDays, 5);
  assert.equal(result.rescuedThisRun.length, 0);
  assert.equal(result.freezeState.available, 1);
});

test('streakWithFreeze: single missed day in the middle → freeze auto-applies, streak survives', () => {
  const { calculateStreakWithFreeze, createInitialFreezeState } = loadTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const result = calculateStreakWithFreeze({
    // Missing 2026-05-17 — but bracketed by active days.
    activeDayKeys: ['2026-05-15', '2026-05-16', '2026-05-18', '2026-05-19'],
    freezeState: createInitialFreezeState(now),
    today: '2026-05-19',
    now,
  });
  assert.equal(result.streakDays, 5);
  assert.deepEqual(result.rescuedThisRun, ['2026-05-17']);
  assert.equal(result.freezeState.available, 0);
});

test('streakWithFreeze: two consecutive missing days → streak breaks even with freezes available', () => {
  const { calculateStreakWithFreeze, createInitialFreezeState } = loadTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const result = calculateStreakWithFreeze({
    // Missing 2026-05-16 and 2026-05-17 in a row — disappearing-for-a-week guard.
    activeDayKeys: ['2026-05-15', '2026-05-18', '2026-05-19'],
    freezeState: createInitialFreezeState(now),
    today: '2026-05-19',
    now,
  });
  assert.equal(result.streakDays, 2); // only 2026-05-19 + 2026-05-18
  assert.equal(result.rescuedThisRun.length, 0);
});

test('streakWithFreeze: refillFreezes adds a freeze after a week', () => {
  const { refillFreezes } = loadTs('lib/learning/streakWithFreeze.ts');
  const initial = {
    available: 0,
    lastEarnedAt: '2026-05-12', // a Monday
    lifetimeEarned: 1,
    lifetimeSpent: 1,
    rescuedDayKeys: [],
  };
  const refilled = refillFreezes(initial, new Date('2026-05-19T08:00:00.000Z')); // next Tuesday
  assert.equal(refilled.available, 1);
  assert.equal(refilled.lifetimeEarned, 2);
});

test('streakWithFreeze: malformed active days and today fall back without corrupting the streak', () => {
  const { calculateStreakWithFreeze, createInitialFreezeState } = loadTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const result = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-18T10:00:00.000Z', 7, null, 'not-a-date', '2026-02-30', '2026-05-19'],
    freezeState: {
      ...createInitialFreezeState(now),
      rescuedDayKeys: ['not-a-date', '2026-05-17'],
    },
    today: 'not-a-date',
    now,
  });

  assert.equal(result.streakDays, 3);
  assert.deepEqual(result.rescuedThisRun, []);
  assert.equal(result.freezeState.available, 1);
  assert.deepEqual(result.freezeState.rescuedDayKeys, ['2026-05-17']);
  assert.deepEqual(result.rescuedInCurrentStreak, ['2026-05-17']);
});

test('streakWithFreeze: refillFreezes repairs invalid lastEarnedAt and invalid now inputs', () => {
  const { refillFreezes } = loadTs('lib/learning/streakWithFreeze.ts');
  const invalidLastEarned = {
    available: 0,
    lastEarnedAt: 'not-a-date',
    lifetimeEarned: 1,
    lifetimeSpent: 1,
    rescuedDayKeys: [],
  };
  const refilled = refillFreezes(invalidLastEarned, new Date('2026-05-19T08:00:00.000Z'));
  assert.equal(refilled.available, 0);
  assert.equal(refilled.lifetimeEarned, 1);
  assert.equal(refilled.lastEarnedAt, '2026-05-18');

  const invalidNow = refillFreezes({ ...invalidLastEarned, available: 1 }, new Date('not-a-date'));
  assert.match(invalidNow.lastEarnedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.doesNotMatch(invalidNow.lastEarnedAt, /NaN/);
  assert.equal(invalidNow.available, 1);
});

test('streakWithFreeze: refillFreezes normalizes NaN negative fractional and string counters', () => {
  const { calculateStreakWithFreeze, refillFreezes } = loadTs('lib/learning/streakWithFreeze.ts');
  const now = new Date('2026-05-19T08:00:00.000Z');

  const malformedCurrentWeek = refillFreezes(
    {
      available: Number.NaN,
      lastEarnedAt: '2026-05-18',
      lifetimeEarned: '2',
      lifetimeSpent: -1,
      rescuedDayKeys: [],
    },
    now,
  );
  assert.deepEqual(
    {
      available: malformedCurrentWeek.available,
      lifetimeEarned: malformedCurrentWeek.lifetimeEarned,
      lifetimeSpent: malformedCurrentWeek.lifetimeSpent,
    },
    { available: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
  );

  const overstocked = refillFreezes(
    {
      available: 99,
      lastEarnedAt: '2026-05-11',
      lifetimeEarned: 3.5,
      lifetimeSpent: Infinity,
      rescuedDayKeys: [],
    },
    now,
  );
  assert.deepEqual(
    {
      available: overstocked.available,
      lifetimeEarned: overstocked.lifetimeEarned,
      lifetimeSpent: overstocked.lifetimeSpent,
    },
    { available: 4, lifetimeEarned: 0, lifetimeSpent: 0 },
  );

  const blockedStringAvailable = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-17', '2026-05-19'],
    freezeState: {
      available: '1',
      lastEarnedAt: '2026-05-18',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    today: '2026-05-19',
    now,
  });
  assert.equal(blockedStringAvailable.streakDays, 1);
  assert.equal(blockedStringAvailable.freezeState.available, 0);
  assert.equal(blockedStringAvailable.freezeState.lifetimeSpent, 0);
  assert.deepEqual(blockedStringAvailable.rescuedThisRun, []);

  const rescued = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-17', '2026-05-19'],
    freezeState: {
      available: 4,
      lastEarnedAt: '2026-05-18',
      lifetimeEarned: 4,
      lifetimeSpent: '2',
      rescuedDayKeys: [],
    },
    today: '2026-05-19',
    now,
  });
  assert.equal(rescued.streakDays, 3);
  assert.equal(rescued.freezeState.available, 3);
  assert.equal(rescued.freezeState.lifetimeSpent, 1);
  assert.deepEqual(rescued.rescuedThisRun, ['2026-05-18']);
});

test('streakWithFreeze: freezeBannerCopy emits Sv + En only when a freeze was used', () => {
  const { freezeBannerCopy } = loadTs('lib/learning/streakWithFreeze.ts');
  const withRescue = { rescuedThisRun: ['2026-05-17'], freezeState: { available: 1 } };
  const englishCopy = freezeBannerCopy(withRescue, 'en');
  const swedishCopy = freezeBannerCopy(withRescue, 'sv');

  assert.match(englishCopy, /Streak protected/i);
  assert.match(englishCopy, /1 freeze left/);
  assert.match(swedishCopy, /Sviten är räddad/i);
  assert.match(swedishCopy, /1 svitskydd kvar/);
  assert.doesNotMatch(swedishCopy, /streak|freeze|Strecket|fryser/i);
  const persistedRescue = {
    rescuedInCurrentStreak: ['2026-05-17'],
    rescuedThisRun: [],
    freezeState: { available: 1 },
  };
  assert.match(freezeBannerCopy(persistedRescue, 'en'), /1 freeze left/);
  assert.match(freezeBannerCopy(persistedRescue, 'sv'), /1 svitskydd kvar/);
  const noRescue = { rescuedThisRun: [], freezeState: { available: 1 } };
  assert.equal(freezeBannerCopy(noRescue, 'en'), null);
});

// ---------------------------------------------------------------- weak chapters

function progressWithSessions(sessions) {
  return {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions,
  };
}

test('chapterWeaknesses: chapter with 0 answers gets isSparse + neutral effective accuracy', () => {
  const { chapterWeaknesses } = loadTs('lib/learning/weakChapters.ts');
  const result = chapterWeaknesses({
    progress: progressWithSessions([]),
    chapters: [
      { id: 'a', questionCount: 10 },
      { id: 'b', questionCount: 10 },
    ],
    questionChapterIndex: {},
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.length, 2);
  for (const r of result) {
    assert.equal(r.answers, 0);
    assert.equal(r.accuracy, null);
    assert.equal(r.isSparse, true);
  }
});

test('topWeakChapters: ranks lower-accuracy chapter as weaker', () => {
  const { topWeakChapters } = loadTs('lib/learning/weakChapters.ts');
  const answers = [];
  // chapter 'strong' — 10 answers, all correct
  for (let i = 0; i < 10; i += 1) {
    answers.push({
      questionId: `s${i}`,
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
      timeSpentSeconds: 5,
    });
  }
  // chapter 'weak' — 10 answers, 3 correct
  for (let i = 0; i < 10; i += 1) {
    answers.push({
      questionId: `w${i}`,
      selectedOptionIds: [],
      isCorrect: i < 3,
      answeredAt: '2026-05-18T10:00:00.000Z',
      timeSpentSeconds: 5,
    });
  }
  const idx = {};
  for (let i = 0; i < 10; i += 1) {
    idx[`s${i}`] = 'strong';
    idx[`w${i}`] = 'weak';
  }
  const top = topWeakChapters(
    {
      progress: progressWithSessions([
        {
          id: 's1',
          mode: 'study',
          questionIds: [],
          answers,
          startedAt: '2026-05-18T00:00:00.000Z',
        },
      ]),
      chapters: [
        { id: 'strong', questionCount: 20 },
        { id: 'weak', questionCount: 20 },
      ],
      questionChapterIndex: idx,
      now: new Date('2026-05-19T12:00:00.000Z'),
    },
    1,
  );
  assert.equal(top.length, 1);
  assert.equal(top[0].chapterId, 'weak');
});

test('chapterWeaknesses: long-idle chapter gets staleness boost', () => {
  const { chapterWeaknesses } = loadTs('lib/learning/weakChapters.ts');
  const answers = [];
  for (let i = 0; i < 10; i += 1) {
    answers.push({
      questionId: `q${i}`,
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-01-01T10:00:00.000Z',
      timeSpentSeconds: 5,
    });
  }
  const idx = {};
  for (let i = 0; i < 10; i += 1) idx[`q${i}`] = 'stale';
  const result = chapterWeaknesses({
    progress: progressWithSessions([
      { id: 's1', mode: 'study', questionIds: [], answers, startedAt: '2026-01-01T00:00:00.000Z' },
    ]),
    chapters: [{ id: 'stale', questionCount: 20 }],
    questionChapterIndex: idx,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result[0].chapterId, 'stale');
  assert.ok(result[0].weaknessScore > 0); // staleness lifts from 0
});

test('chapterWeaknesses: invalid and future answer dates do not count toward weakness', () => {
  const { chapterWeaknesses } = loadTs('lib/learning/weakChapters.ts');
  const result = chapterWeaknesses({
    progress: progressWithSessions([
      {
        id: 's1',
        mode: 'study',
        questionIds: [],
        answers: [
          {
            questionId: 'bad-date',
            selectedOptionIds: [],
            isCorrect: false,
            answeredAt: 'not-a-date',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'future-date',
            selectedOptionIds: [],
            isCorrect: false,
            answeredAt: '2099-01-01T00:00:00.000Z',
            timeSpentSeconds: 5,
          },
          {
            questionId: 'valid',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-18T10:00:00.000Z',
            timeSpentSeconds: 5,
          },
        ],
        startedAt: '2026-05-18T00:00:00.000Z',
      },
    ]),
    chapters: [
      { id: 'invalid-only', questionCount: 10 },
      { id: 'valid-chapter', questionCount: 10 },
    ],
    questionChapterIndex: {
      'bad-date': 'invalid-only',
      'future-date': 'invalid-only',
      valid: 'valid-chapter',
    },
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  const invalidOnly = result.find((chapter) => chapter.chapterId === 'invalid-only');
  const validChapter = result.find((chapter) => chapter.chapterId === 'valid-chapter');
  assert.equal(invalidOnly.answers, 0);
  assert.equal(invalidOnly.accuracy, null);
  assert.equal(invalidOnly.coverage, 0);
  assert.equal(validChapter.answers, 1);
  assert.equal(validChapter.coverage, 0.1);
});

test('chapterWeaknesses: malformed counts and truthy correctness do not poison scores', () => {
  const { chapterWeaknesses, topWeakChapters } = loadTs('lib/learning/weakChapters.ts');
  const answers = [
    {
      questionId: 'nan-1',
      selectedOptionIds: [],
      isCorrect: 'yes',
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'negative-1',
      selectedOptionIds: [],
      isCorrect: 1,
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'fractional-1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'undersized-1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'undersized-2',
      selectedOptionIds: [],
      isCorrect: false,
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'strict-1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    {
      questionId: 'strict-2',
      selectedOptionIds: [],
      isCorrect: 'true',
      answeredAt: '2026-05-18T10:00:00.000Z',
    },
    null,
  ];
  const input = {
    progress: progressWithSessions([
      {
        id: 's1',
        mode: 'study',
        questionIds: [],
        answers,
        startedAt: '2026-05-18T00:00:00.000Z',
      },
    ]),
    chapters: [
      { id: 'nan-count', questionCount: Number.NaN },
      { id: 'negative-count', questionCount: -2 },
      { id: 'fractional-count', questionCount: 2.5 },
      { id: 'undersized-count', questionCount: 1 },
      { id: 'strict-boolean', questionCount: 10 },
    ],
    questionChapterIndex: {
      'nan-1': 'nan-count',
      'negative-1': 'negative-count',
      'fractional-1': 'fractional-count',
      'undersized-1': 'undersized-count',
      'undersized-2': 'undersized-count',
      'strict-1': 'strict-boolean',
      'strict-2': 'strict-boolean',
    },
    now: new Date('2026-05-19T12:00:00.000Z'),
  };

  const result = chapterWeaknesses(input);
  result.forEach((chapter) => {
    assert.ok(Number.isFinite(chapter.coverage));
    assert.ok(chapter.coverage >= 0 && chapter.coverage <= 1);
    assert.ok(Number.isFinite(chapter.weaknessScore));
    assert.ok(chapter.weaknessScore >= 0 && chapter.weaknessScore <= 1);
  });

  assert.equal(result.find((chapter) => chapter.chapterId === 'nan-count').accuracy, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'nan-count').coverage, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'negative-count').accuracy, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'negative-count').coverage, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'fractional-count').coverage, 0);
  assert.equal(result.find((chapter) => chapter.chapterId === 'undersized-count').coverage, 1);
  assert.equal(result.find((chapter) => chapter.chapterId === 'strict-boolean').accuracy, 0.5);

  assert.deepEqual(
    topWeakChapters(input, 3).map((chapter) => chapter.chapterId),
    ['fractional-count', 'nan-count', 'negative-count'],
  );
});

test('chapterWeaknesses: malformed runtime options fall back safely', () => {
  const { chapterWeaknesses } = loadTs('lib/learning/weakChapters.ts');

  assert.deepEqual(
    chapterWeaknesses({
      progress: null,
      chapters: null,
      questionChapterIndex: null,
      now: new Date('not-a-date'),
      minAnswers: Number.NaN,
      recencyDays: Infinity,
    }),
    [],
  );

  const result = chapterWeaknesses({
    progress: progressWithSessions([
      {
        id: 's1',
        mode: 'study',
        questionIds: [],
        answers: [
          {
            questionId: 'q1',
            selectedOptionIds: [],
            isCorrect: true,
            answeredAt: '2026-05-18T10:00:00.000Z',
          },
        ],
        startedAt: '2026-05-18T00:00:00.000Z',
      },
    ]),
    chapters: [{ id: 'ch01', questionCount: 2 }],
    questionChapterIndex: { q1: 'ch01' },
    now: new Date('not-a-date'),
    minAnswers: Number.NaN,
    recencyDays: -1,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].answers, 1);
  assert.equal(result[0].accuracy, 1);
  assert.equal(result[0].coverage, 0.5);
  assert.equal(result[0].isSparse, true);
  assert.ok(Number.isFinite(result[0].weaknessScore));
});

// ---------------------------------------------------------------- mock exam library

test('mockExamLibrary: library contains the canonical 7 mocks', () => {
  const { MOCK_EXAM_LIBRARY } = loadTs('lib/learning/mockExamLibrary.ts');
  assert.equal(MOCK_EXAM_LIBRARY.length, 7);
  assert.ok(MOCK_EXAM_LIBRARY.find((m) => m.id === 'mock-random'));
});

test('mockExamLibrary: Swedish labels use övningsprov copy, not provexamen', () => {
  const { MOCK_EXAM_LIBRARY } = loadTs('lib/learning/mockExamLibrary.ts');
  const labelsSv = MOCK_EXAM_LIBRARY.map((mock) => mock.labelSv);

  assert.deepEqual(labelsSv, [
    'Övningsprov 1 – Mjuk start',
    'Övningsprov 2 – Standard',
    'Övningsprov 3 – Standard',
    'Övningsprov 4 – Standard plus',
    'Övningsprov 5 – Utmaning',
    'Övningsprov 6 – Slutspurt',
    'Slumpmässigt övningsprov',
  ]);
  assert.doesNotMatch(labelsSv.join('\n'), /\bprovexamen\b|\bprovexamina\b/i);
});

test('mockExamLibrary: format constants avoid unsourced pass threshold claims', () => {
  const lib = loadTs('lib/learning/mockExamLibrary.ts');
  assert.equal(lib.MOCK_EXAM_QUESTION_COUNT, 25);
  assert.equal(lib.MOCK_EXAM_TIME_LIMIT_MINUTES, 30);
  assert.equal(Object.prototype.hasOwnProperty.call(lib, 'MOCK_EXAM_PASS_THRESHOLD'), false);
});

test('materializeMock: same mockId + same bank → deterministic question pick', () => {
  const { materializeMock } = loadTs('lib/learning/mockExamLibrary.ts');
  const bank = [];
  for (let i = 0; i < 100; i += 1) {
    bank.push({
      id: `q${i}`,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      chapterId: `c${i % 5}`,
    });
  }
  const a = materializeMock({ mockId: 'mock-2', bank });
  const b = materializeMock({ mockId: 'mock-2', bank });
  assert.deepEqual(
    a.questions.map((q) => q.questionId),
    b.questions.map((q) => q.questionId),
  );
  assert.equal(a.questions.length, 25);
});

test('materializeMock: small bank gets topped up from wider pool, isUnderfilled only when nothing left', () => {
  const { materializeMock } = loadTs('lib/learning/mockExamLibrary.ts');
  const bank = [];
  for (let i = 0; i < 30; i += 1) {
    bank.push({ id: `q${i}`, difficulty: 'easy', chapterId: 'c1' });
  }
  // mock-5 is 'hard' but the bank has only 'easy' questions
  const mat = materializeMock({ mockId: 'mock-5', bank });
  assert.equal(mat.questions.length, 25);
  assert.equal(mat.isUnderfilled, false);
});

test('materializeMock: chapter distribution ignores unsafe and malformed chapter ids', () => {
  const { materializeMock } = loadTs('lib/learning/mockExamLibrary.ts');
  const bank = [
    { id: 'q-valid-1', difficulty: 'medium', chapterId: 'ch01' },
    { id: 'q-valid-2', difficulty: 'medium', chapterId: ' ch02 ' },
    { id: 'q-valid-3', difficulty: 'medium', chapterId: 'ch02' },
    { id: 'q-proto', difficulty: 'medium', chapterId: '__proto__' },
    { id: 'q-constructor', difficulty: 'medium', chapterId: 'constructor' },
    { id: 'q-prototype', difficulty: 'medium', chapterId: 'prototype' },
    { id: 'q-blank', difficulty: 'medium', chapterId: '   ' },
    { id: 'q-missing', difficulty: 'medium' },
    { id: 'q-number', difficulty: 'medium', chapterId: 17 },
    { id: 'q-object', difficulty: 'medium', chapterId: { id: 'ch03' } },
  ];

  const mat = materializeMock({ mockId: 'mock-2', bank });

  assert.ok(mat);
  assert.equal(Object.getPrototypeOf(mat.chapterDistribution), null);
  assert.deepEqual(Object.entries(mat.chapterDistribution).sort(), [
    ['ch01', 1],
    ['ch02', 2],
  ]);
  for (const unsafeKey of ['__proto__', 'constructor', 'prototype']) {
    assert.equal(Object.prototype.hasOwnProperty.call(mat.chapterDistribution, unsafeKey), false);
    assert.equal(mat.chapterDistribution[unsafeKey], undefined);
  }
});

test('materializeMock: unknown mock id → null', () => {
  const { materializeMock } = loadTs('lib/learning/mockExamLibrary.ts');
  const result = materializeMock({ mockId: 'mock-nonexistent', bank: [] });
  assert.equal(result, null);
});

// ---------------------------------------------------------------- exam diagnostic

function fakeExamSession(answers) {
  return {
    id: 'exam-test',
    mode: 'exam',
    questionIds: answers.map((a) => a.questionId),
    answers,
    startedAt: '2026-05-19T09:00:00.000Z',
    completedAt: '2026-05-19T09:30:00.000Z',
  };
}

test('buildExamDiagnostic: overall accuracy + per-chapter sort without threshold verdict', () => {
  const { buildExamDiagnostic } = loadTs('lib/learning/examDiagnostic.ts');
  const answers = [
    // chapter c1: 4 of 6
    ...Array.from({ length: 6 }, (_, i) => ({
      questionId: `c1q${i}`,
      selectedOptionIds: [],
      isCorrect: i < 4,
      answeredAt: '2026-05-19T09:00:00.000Z',
      timeSpentSeconds: 10,
    })),
    // chapter c2: 2 of 8
    ...Array.from({ length: 8 }, (_, i) => ({
      questionId: `c2q${i}`,
      selectedOptionIds: [],
      isCorrect: i < 2,
      answeredAt: '2026-05-19T09:00:00.000Z',
      timeSpentSeconds: 10,
    })),
  ];
  const idx = {};
  answers.forEach((a) => {
    idx[a.questionId] = a.questionId.startsWith('c1') ? 'c1' : 'c2';
  });
  const diag = buildExamDiagnostic({
    session: fakeExamSession(answers),
    questionChapterIndex: idx,
  });
  assert.equal(diag.correctCount, 6);
  assert.equal(diag.totalCount, 14);
  assert.equal(Math.round(diag.overallAccuracy * 100), 43);
  assert.equal(diag.perChapter[0].chapterId, 'c2'); // weaker first
  assert.equal(diag.perChapter[1].chapterId, 'c1');
  assert.equal(Object.prototype.hasOwnProperty.call(diag, 'passed'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(diag, 'passThreshold'), false);
});

test('buildExamDiagnostic: high score remains neutral percent-correct evidence', () => {
  const { buildExamDiagnostic } = loadTs('lib/learning/examDiagnostic.ts');
  const answers = Array.from({ length: 25 }, (_, i) => ({
    questionId: `q${i}`,
    selectedOptionIds: [],
    isCorrect: i < 22,
    answeredAt: '2026-05-19T09:00:00.000Z',
    timeSpentSeconds: 10,
  }));
  const idx = {};
  answers.forEach((a) => {
    idx[a.questionId] = 'c1';
  });
  const diag = buildExamDiagnostic({
    session: fakeExamSession(answers),
    questionChapterIndex: idx,
  });
  assert.equal(diag.correctCount, 22);
  assert.equal(diag.totalCount, 25);
  assert.equal(diag.overallAccuracy, 22 / 25);
  assert.equal(Object.prototype.hasOwnProperty.call(diag, 'passed'), false);
});

test('buildExamDiagnostic: time-per-question + median populated', () => {
  const { buildExamDiagnostic } = loadTs('lib/learning/examDiagnostic.ts');
  const answers = [
    {
      questionId: 'q1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-19T09:00:00.000Z',
      timeSpentSeconds: 5,
    },
    {
      questionId: 'q2',
      selectedOptionIds: [],
      isCorrect: false,
      answeredAt: '2026-05-19T09:00:00.000Z',
      timeSpentSeconds: 15,
    },
    {
      questionId: 'q3',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-19T09:00:00.000Z',
      timeSpentSeconds: 30,
    },
  ];
  const idx = { q1: 'c1', q2: 'c1', q3: 'c1' };
  const diag = buildExamDiagnostic({
    session: fakeExamSession(answers),
    questionChapterIndex: idx,
  });
  assert.deepEqual(diag.perQuestionMs, [5000, 15000, 30000]);
  assert.equal(diag.medianMs, 15000);
});

test('exam diagnostic source rejects unsourced pass/fail threshold helpers', () => {
  const diagnosticSource = fs.readFileSync(
    path.join(repoRoot, 'lib/learning/examDiagnostic.ts'),
    'utf8',
  );
  const librarySource = fs.readFileSync(
    path.join(repoRoot, 'lib/learning/mockExamLibrary.ts'),
    'utf8',
  );

  assert.doesNotMatch(diagnosticSource, /\bformatPassLine\b/);
  assert.doesNotMatch(diagnosticSource, /\bpassThreshold\b/);
  assert.doesNotMatch(diagnosticSource, /\bpassed\b/);
  assert.doesNotMatch(librarySource, /\bMOCK_EXAM_PASS_THRESHOLD\b/);
  assert.doesNotMatch(librarySource, /Official pass threshold/i);
});
