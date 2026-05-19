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

test('streakWithFreeze: freezeBannerCopy emits Sv + En only when a freeze was used', () => {
  const { freezeBannerCopy } = loadTs('lib/learning/streakWithFreeze.ts');
  const withRescue = { rescuedThisRun: ['2026-05-17'], freezeState: { available: 0 } };
  assert.match(freezeBannerCopy(withRescue, 'en'), /protected/i);
  assert.match(freezeBannerCopy(withRescue, 'sv'), /räddad/i);
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

// ---------------------------------------------------------------- mock exam library

test('mockExamLibrary: library contains the canonical 7 mocks', () => {
  const { MOCK_EXAM_LIBRARY } = loadTs('lib/learning/mockExamLibrary.ts');
  assert.equal(MOCK_EXAM_LIBRARY.length, 7);
  assert.ok(MOCK_EXAM_LIBRARY.find((m) => m.id === 'mock-random'));
});

test('mockExamLibrary: format constants match Sverige-i-fokus paraphrase', () => {
  const lib = loadTs('lib/learning/mockExamLibrary.ts');
  assert.equal(lib.MOCK_EXAM_QUESTION_COUNT, 25);
  assert.equal(lib.MOCK_EXAM_TIME_LIMIT_MINUTES, 30);
  assert.ok(lib.MOCK_EXAM_PASS_THRESHOLD >= 0.6 && lib.MOCK_EXAM_PASS_THRESHOLD <= 0.8);
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

test('buildExamDiagnostic: overall accuracy + pass flag + per-chapter sort', () => {
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
  assert.equal(diag.perChapter[0].chapterId, 'c2'); // weaker first
  assert.equal(diag.perChapter[1].chapterId, 'c1');
  assert.equal(diag.passed, false); // 6/14 < 70%
});

test('buildExamDiagnostic: high score → passed=true', () => {
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
  assert.equal(diag.passed, true);
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

test('formatPassLine: passing message in Sv + En', () => {
  const { buildExamDiagnostic, formatPassLine } = loadTs('lib/learning/examDiagnostic.ts');
  const answers = Array.from({ length: 25 }, (_, i) => ({
    questionId: `q${i}`,
    selectedOptionIds: [],
    isCorrect: i < 22,
    answeredAt: '2026-05-19T09:00:00.000Z',
    timeSpentSeconds: 5,
  }));
  const idx = {};
  answers.forEach((a) => {
    idx[a.questionId] = 'c1';
  });
  const diag = buildExamDiagnostic({
    session: fakeExamSession(answers),
    questionChapterIndex: idx,
  });
  const sv = formatPassLine(diag, 'sv');
  const en = formatPassLine(diag, 'en');
  assert.match(sv, /klarade/i);
  assert.match(en, /threshold/i);
});

test('formatPassLine: failing message names the shortfall', () => {
  const { buildExamDiagnostic, formatPassLine } = loadTs('lib/learning/examDiagnostic.ts');
  const answers = Array.from({ length: 25 }, (_, i) => ({
    questionId: `q${i}`,
    selectedOptionIds: [],
    isCorrect: i < 10,
    answeredAt: '2026-05-19T09:00:00.000Z',
    timeSpentSeconds: 5,
  }));
  const idx = {};
  answers.forEach((a) => {
    idx[a.questionId] = 'c1';
  });
  const diag = buildExamDiagnostic({
    session: fakeExamSession(answers),
    questionChapterIndex: idx,
  });
  const en = formatPassLine(diag, 'en');
  assert.match(en, /needed/i);
  assert.match(en, /to go/i);
});
