// Unit tests for v1.1 Pro-tier foundational primitives shipped in batch15/16:
//   - FSRS-lite engine in lib/learning/spacedRepetition.ts
//   - generateStudyPlan in lib/learning/examDate.ts
//   - generateWeeklyRecap in lib/learning/weeklyRecap.ts
//   - tier comparison data in lib/monetization/tierComparison.ts
//
// Run with: node --test tests/v1-1-pro-foundations.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

// Register a .ts loader so subsequent `require()` calls (including relative
// imports inside the .ts modules under test) transparently transpile via
// TypeScript and execute in the original source location — which keeps
// relative imports like './streaks' resolving correctly.
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

// ---------------------------------------------------------------- FSRS engine

test('FSRS-lite: new card created with default difficulty + immediate due date', () => {
  const { createNewCard } = loadTs('lib/learning/spacedRepetition.ts');
  const now = '2026-05-19T10:00:00.000Z';
  const card = createNewCard('q1', now);
  assert.equal(card.questionId, 'q1');
  assert.equal(card.state, 'new');
  assert.equal(card.lastReviewAt, null);
  assert.equal(card.dueAt, now);
  assert.equal(card.reps, 0);
  assert.equal(card.lapses, 0);
  assert.ok(card.difficulty >= 1 && card.difficulty <= 10);
  assert.ok(card.stability > 0);
});

test('FSRS-lite: again (grade 1) resets state to relearning and bumps lapses', () => {
  const { createNewCard, gradeCard } = loadTs('lib/learning/spacedRepetition.ts');
  const t0 = '2026-05-19T10:00:00.000Z';
  const t1 = '2026-05-22T10:00:00.000Z';
  let card = gradeCard(createNewCard('q1', t0), 3, t0);
  assert.equal(card.state, 'review');
  card = gradeCard(card, 1, t1);
  assert.equal(card.state, 'relearning');
  assert.equal(card.lapses, 1);
});

test('FSRS-lite: good grade grows interval, easy grade grows it more', () => {
  const { createNewCard, gradeCard } = loadTs('lib/learning/spacedRepetition.ts');
  const t0 = '2026-05-19T10:00:00.000Z';
  const t1 = '2026-05-23T10:00:00.000Z';
  const cardGood = gradeCard(gradeCard(createNewCard('q1', t0), 3, t0), 3, t1);
  const cardEasy = gradeCard(gradeCard(createNewCard('q2', t0), 3, t0), 4, t1);
  const intervalGood = new Date(cardGood.dueAt).getTime() - new Date(t1).getTime();
  const intervalEasy = new Date(cardEasy.dueAt).getTime() - new Date(t1).getTime();
  assert.ok(intervalEasy > intervalGood);
});

test('FSRS-lite: stability clamped between 1 day and 5 years', () => {
  const { createNewCard, gradeCard } = loadTs('lib/learning/spacedRepetition.ts');
  let card = createNewCard('q1', '2026-01-01T00:00:00.000Z');
  for (let i = 0; i < 50; i += 1) {
    card = gradeCard(card, 4, new Date(card.dueAt).toISOString());
  }
  assert.ok(card.stability <= 365 * 5);
  assert.ok(card.stability >= 1);
});

test('FSRS-lite: retrievability decays from 1 to 0 over time', () => {
  const { retrievability } = loadTs('lib/learning/spacedRepetition.ts');
  assert.equal(retrievability(10, 0), 1);
  const r10 = retrievability(10, 10);
  assert.ok(r10 > 0.3 && r10 < 0.4);
  assert.ok(retrievability(10, 100) < 0.001);
});

test('FSRS-lite: isDue compares dueAt against now', () => {
  const { isDue } = loadTs('lib/learning/spacedRepetition.ts');
  const now = '2026-05-19T12:00:00.000Z';
  assert.equal(isDue({ dueAt: '2026-05-18T00:00:00.000Z' }, now), true);
  assert.equal(isDue({ dueAt: '2026-05-25T00:00:00.000Z' }, now), false);
});

// ----------------------------------------------------------- Study plan algo

test('generateStudyPlan: 27 days out, regular intensity → reasonable target', () => {
  const { generateStudyPlan } = loadTs('lib/learning/examDate.ts');
  const plan = generateStudyPlan({
    testDate: new Date('2026-06-15T00:00:00.000Z'),
    now: new Date('2026-05-19T00:00:00.000Z'),
    totalQuestions: 200,
    masteredQuestions: 0,
    mocksTaken: 0,
    intensity: 'regular',
  });
  assert.equal(plan.hasTestDate, true);
  assert.equal(plan.daysRemaining, 27);
  assert.ok(plan.dailyQuestionTarget >= 5 && plan.dailyQuestionTarget <= 80);
  assert.ok(plan.weeklyMockTarget >= 1 && plan.weeklyMockTarget <= 2);
  assert.equal(plan.mocksRemaining, 6);
  assert.equal(plan.isCrunch, false);
});

test('generateStudyPlan: 3 days out with full bank to learn → crunch flag set', () => {
  const { generateStudyPlan } = loadTs('lib/learning/examDate.ts');
  const plan = generateStudyPlan({
    testDate: new Date('2026-05-22T00:00:00.000Z'),
    now: new Date('2026-05-19T00:00:00.000Z'),
    totalQuestions: 200,
    masteredQuestions: 0,
    mocksTaken: 0,
    intensity: 'serious',
  });
  assert.equal(plan.isCrunch, true);
  assert.ok(plan.dailyQuestionTarget <= 80);
});

test('generateStudyPlan: clamps daily target to >= MIN even when nothing left to learn', () => {
  const { generateStudyPlan } = loadTs('lib/learning/examDate.ts');
  const plan = generateStudyPlan({
    testDate: new Date('2026-07-01T00:00:00.000Z'),
    now: new Date('2026-05-19T00:00:00.000Z'),
    totalQuestions: 200,
    masteredQuestions: 200,
    mocksTaken: 6,
    intensity: 'casual',
  });
  assert.ok(plan.dailyQuestionTarget >= 5);
  assert.equal(plan.mocksRemaining, 0);
});

test('generateStudyPlan: serious intensity raises floor above casual', () => {
  const { generateStudyPlan } = loadTs('lib/learning/examDate.ts');
  const base = {
    testDate: new Date('2026-08-01T00:00:00.000Z'),
    now: new Date('2026-05-19T00:00:00.000Z'),
    totalQuestions: 200,
    masteredQuestions: 195,
    mocksTaken: 5,
  };
  const casual = generateStudyPlan({ ...base, intensity: 'casual' });
  const serious = generateStudyPlan({ ...base, intensity: 'serious' });
  assert.ok(serious.dailyQuestionTarget > casual.dailyQuestionTarget);
});

// -------------------------------------------------------- Weekly recap

function makeProgress(sessions = []) {
  return {
    totalXp: 0,
    level: 1,
    currentStreak: 3,
    dailyGoalAnswers: 10,
    questionProgress: {},
    sessions,
  };
}

test('generateWeeklyRecap: counts answers within Mon-Sun local window only', () => {
  const { generateWeeklyRecap } = loadTs('lib/learning/weeklyRecap.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: ['q1', 'q2', 'q3'],
      startedAt: '2026-05-19T10:00:00.000Z',
      answers: [
        {
          questionId: 'q1',
          selectedOptionIds: ['a'],
          isCorrect: true,
          answeredAt: '2026-05-19T10:00:00.000Z',
          timeSpentSeconds: 10,
        },
        {
          questionId: 'q2',
          selectedOptionIds: ['a'],
          isCorrect: false,
          answeredAt: '2026-05-19T10:01:00.000Z',
          timeSpentSeconds: 10,
        },
        {
          questionId: 'q3',
          selectedOptionIds: ['a'],
          isCorrect: true,
          answeredAt: '2026-05-14T10:00:00.000Z',
          timeSpentSeconds: 10,
        },
      ],
    },
  ];
  const recap = generateWeeklyRecap({ progress: makeProgress(sessions), now });
  assert.equal(recap.questionsAnswered, 2);
  assert.equal(recap.accuracy, 0.5);
});

test('generateWeeklyRecap: zero-activity week returns null accuracy and zero counts', () => {
  const { generateWeeklyRecap } = loadTs('lib/learning/weeklyRecap.ts');
  const recap = generateWeeklyRecap({
    progress: makeProgress([]),
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(recap.questionsAnswered, 0);
  assert.equal(recap.accuracy, null);
  assert.equal(recap.mockExamsTaken, 0);
  assert.equal(recap.bestMockScore, null);
});

test('generateWeeklyRecap: detects newly-mastered chapter', () => {
  const { generateWeeklyRecap } = loadTs('lib/learning/weeklyRecap.ts');
  const recap = generateWeeklyRecap({
    progress: makeProgress([]),
    chapterMasteryAtWeekStart: { democracy: 0.5, history: 0.9, geography: 0.2 },
    chapterMasteryNow: { democracy: 0.85, history: 0.9, geography: 0.5 },
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(recap.chapterNowMastered, 'democracy');
});

test('generateWeeklyRecap: counts mock exams completed this week with best score', () => {
  const { generateWeeklyRecap } = loadTs('lib/learning/weeklyRecap.ts');
  const sessions = [
    {
      id: 'e1',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-19T09:00:00.000Z',
      completedAt: '2026-05-19T10:00:00.000Z',
      score: 0.72,
    },
    {
      id: 'e2',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-21T09:00:00.000Z',
      completedAt: '2026-05-21T10:00:00.000Z',
      score: 0.85,
    },
    {
      id: 'e3',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-10T09:00:00.000Z',
      completedAt: '2026-05-10T10:00:00.000Z',
      score: 0.99,
    },
  ];
  const recap = generateWeeklyRecap({
    progress: makeProgress(sessions),
    now: new Date('2026-05-22T12:00:00.000Z'),
  });
  assert.equal(recap.mockExamsTaken, 2);
  assert.equal(recap.bestMockScore, 0.85);
});

// -------------------------------------------------------- Tier comparison

test('tierComparison: every flag referenced in TIER_ROWS exists on PRO_LIFETIME_ENTITLEMENTS as true', () => {
  const tier = loadTs('lib/monetization/tierComparison.ts');
  const premium = loadTs('lib/monetization/premium.ts');
  const proLifetime = premium.PRO_LIFETIME_ENTITLEMENTS;
  for (const row of tier.TIER_ROWS) {
    if (!row.flag) continue;
    assert.equal(
      proLifetime[row.flag],
      true,
      `row ${row.id} references flag ${row.flag} which is not true on PRO_LIFETIME_ENTITLEMENTS`,
    );
  }
});

test('tierComparison: Pro does not grant the v1.0 Remove Ads entitlement', () => {
  const tier = loadTs('lib/monetization/tierComparison.ts');
  const premium = loadTs('lib/monetization/premium.ts');
  const adsRow = tier.TIER_ROWS.find((row) => row.id === 'ads');

  assert.equal(premium.REMOVE_ADS_ENTITLEMENTS.adsDisabled, true);
  assert.equal(premium.PRO_LIFETIME_ENTITLEMENTS.adsDisabled, false);
  assert.equal(adsRow.flag, undefined);
  assert.deepEqual(adsRow.adFree, { kind: 'text', sv: 'inga', en: 'none' });
  assert.deepEqual(adsRow.pro, {
    kind: 'text',
    sv: 'vid sessionsskifte',
    en: 'at session boundaries',
  });
});

test('tierComparison: three columns in canonical order', () => {
  const { TIER_COLUMNS } = loadTs('lib/monetization/tierComparison.ts');
  assert.deepEqual(
    TIER_COLUMNS.map((c) => c.id),
    ['free', 'adFree', 'pro'],
  );
});

test('tierComparison: every row has all three cells present', () => {
  const { TIER_ROWS } = loadTs('lib/monetization/tierComparison.ts');
  for (const row of TIER_ROWS) {
    assert.ok(row.free && row.adFree && row.pro, `row ${row.id} missing a cell`);
  }
});

test('paywallCtaLabels: secondary CTA flips for users who already own Ad-Free', () => {
  const { paywallCtaLabels } = loadTs('lib/monetization/tierComparison.ts');
  const fresh = paywallCtaLabels({ alreadyAdFree: false });
  const upgrader = paywallCtaLabels({ alreadyAdFree: true });
  assert.match(fresh.secondaryEn, /remove ads/i);
  assert.match(upgrader.secondaryEn, /upgrade/i);
});

// -------------------------------------------------------- Dashboard stats

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

test('dashboard progress snapshot adapts local store progress for free dashboard selectors', () => {
  const { buildDashboardProgressSnapshot } = loadTs('lib/learning/dashboardProgressSnapshot.ts');
  const { dailyActivityHistogram, perChapterProgress, xpSparkline, dashboardSummary } = loadTs(
    'lib/learning/dashboardStats.ts',
  );
  const questionProgress = {
    q1: {
      questionId: 'q1',
      seenCount: 3,
      correctCount: 2,
      wrongCount: 1,
      correctStreak: 1,
      lastAnsweredAt: '2026-05-19T10:00:00.000Z',
    },
    q2: {
      questionId: 'q2',
      seenCount: 1,
      correctCount: 0,
      wrongCount: 1,
      correctStreak: 0,
      lastAnsweredAt: '2026-05-18T10:00:00.000Z',
    },
  };
  const progress = buildDashboardProgressSnapshot({
    answerDates: ['2026-05-18', '2026-05-19'],
    dailyGoalAnswers: 10,
    mockExamSessions: [
      {
        sessionId: 'mock-1',
        score: 0.8,
        completedAt: '2026-05-19T12:00:00.000Z',
        correctCount: 16,
        totalCount: 20,
      },
    ],
    questionProgress,
    totalXp: 120,
  });
  const questionChapterIndex = { q1: 'ch01', q2: 'ch02' };

  assert.equal(progress.sessions.length, 2);
  assert.equal(progress.sessions[0].answers.length, 4);
  assert.equal(progress.level, 2);
  assert.equal(
    dailyActivityHistogram(progress, { daysBack: 2, now: new Date('2026-05-19T12:00:00.000Z') }).at(
      -1,
    ).count,
    3,
  );
  assert.equal(
    perChapterProgress(
      progress,
      [
        { id: 'ch01', questionCount: 10 },
        { id: 'ch02', questionCount: 5 },
      ],
      questionChapterIndex,
    )[0].answers,
    3,
  );
  assert.equal(
    xpSparkline(progress, { daysBack: 1, now: new Date('2026-05-19T12:00:00.000Z') })[0].xp,
    20,
  );
  assert.equal(
    dashboardSummary(progress, questionChapterIndex, {
      now: new Date('2026-05-19T12:00:00.000Z'),
    }).bestMockScore,
    0.8,
  );
});

test('dailyActivityHistogram: returns contiguous bins ending today', () => {
  const { dailyActivityHistogram } = loadTs('lib/learning/dashboardStats.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: [],
      startedAt: '2026-05-19T10:00:00.000Z',
      answers: [
        {
          questionId: 'q1',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-19T10:00:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'q2',
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: '2026-05-19T11:00:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'q3',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-17T10:00:00.000Z',
          timeSpentSeconds: 5,
        },
      ],
    },
  ];
  const bins = dailyActivityHistogram(progressWithSessions(sessions), { daysBack: 5, now });
  assert.equal(bins.length, 5);
  assert.equal(bins[bins.length - 1].count, 2); // today
  assert.equal(bins[bins.length - 3].count, 1); // two days ago
  assert.equal(bins[0].count, 0);
});

test('perChapterProgress: accuracy + coverage computed per chapter', () => {
  const { perChapterProgress } = loadTs('lib/learning/dashboardStats.ts');
  const chapters = [
    { id: 'democracy', questionCount: 4 },
    { id: 'history', questionCount: 2 },
  ];
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: [],
      startedAt: '2026-05-19T00:00:00.000Z',
      answers: [
        {
          questionId: 'd1',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-19T10:00:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'd2',
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: '2026-05-19T10:01:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'd1',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-19T10:02:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'h1',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-19T10:03:00.000Z',
          timeSpentSeconds: 5,
        },
      ],
    },
  ];
  const result = perChapterProgress(progressWithSessions(sessions), chapters, {
    d1: 'democracy',
    d2: 'democracy',
    h1: 'history',
  });
  const democracy = result.find((r) => r.chapterId === 'democracy');
  assert.equal(democracy.answers, 3);
  assert.equal(democracy.accuracy, 2 / 3);
  assert.equal(democracy.coverage, 2 / 4);
  const history = result.find((r) => r.chapterId === 'history');
  assert.equal(history.answers, 1);
  assert.equal(history.accuracy, 1);
});

test('mockHistory + bestMockScore: returns only exam-mode completed sessions', () => {
  const { mockHistory, bestMockScore } = loadTs('lib/learning/dashboardStats.ts');
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-01T00:00:00.000Z',
      completedAt: '2026-05-01T00:30:00.000Z',
      score: 1,
    },
    {
      id: 'e1',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-10T00:00:00.000Z',
      completedAt: '2026-05-10T01:00:00.000Z',
      score: 0.7,
    },
    {
      id: 'e2',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-17T00:00:00.000Z',
      completedAt: '2026-05-17T01:00:00.000Z',
      score: 0.85,
    },
    {
      id: 'e3',
      mode: 'exam',
      questionIds: [],
      answers: [],
      startedAt: '2026-05-19T00:00:00.000Z' /* no completedAt */,
    },
  ];
  const history = mockHistory(progressWithSessions(sessions));
  assert.equal(history.length, 2);
  assert.equal(bestMockScore(progressWithSessions(sessions)), 0.85);
});

test('timeOfDayPattern: 24 hourly bins, accuracy per hour', () => {
  const { timeOfDayPattern } = loadTs('lib/learning/dashboardStats.ts');
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: [],
      startedAt: '2026-05-19T00:00:00.000Z',
      answers: [
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
          answeredAt: '2026-05-19T09:30:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'q3',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-19T20:00:00.000Z',
          timeSpentSeconds: 5,
        },
      ],
    },
  ];
  const bins = timeOfDayPattern(progressWithSessions(sessions));
  assert.equal(bins.length, 24);
  const totalAnswers = bins.reduce((n, b) => n + b.answers, 0);
  assert.equal(totalAnswers, 3);
  const oneHour = bins.find((b) => b.answers === 2);
  assert.ok(oneHour);
  assert.equal(oneHour.accuracy, 0.5);
});

test('mistakeConvergence: decreases as wrongs are resolved', () => {
  const { mistakeConvergence } = loadTs('lib/learning/dashboardStats.ts');
  const sessions = [
    {
      id: 's1',
      mode: 'study',
      questionIds: [],
      startedAt: '2026-05-15T00:00:00.000Z',
      answers: [
        {
          questionId: 'q1',
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: '2026-05-15T10:00:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'q2',
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: '2026-05-15T10:01:00.000Z',
          timeSpentSeconds: 5,
        },
        {
          questionId: 'q1',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: '2026-05-17T10:00:00.000Z',
          timeSpentSeconds: 5,
        },
      ],
    },
  ];
  const points = mistakeConvergence(progressWithSessions(sessions), {
    daysBack: 7,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(points.length, 7);
  const finalCount = points[points.length - 1].unresolvedMistakes;
  assert.equal(finalCount, 1); // only q2 remains unresolved
});

// -------------------------------------------------------- Readiness

test('computeReadinessScore: sparse users get isSparse=true', () => {
  const { computeReadinessScore } = loadTs('lib/learning/readiness.ts');
  const result = computeReadinessScore({
    progress: progressWithSessions([]),
    chapters: [{ id: 'a', questionCount: 10 }],
    questionChapterIndex: {},
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.isSparse, true);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('computeReadinessScore: high accuracy + coverage + recency → strong_preparation', () => {
  const { computeReadinessScore } = loadTs('lib/learning/readiness.ts');
  // 40 correct answers across 2 chapters in last week
  const answers = [];
  for (let i = 0; i < 40; i += 1) {
    answers.push({
      questionId: `q${i}`,
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-05-18T10:00:00.000Z',
      timeSpentSeconds: 5,
    });
  }
  const questionChapterIndex = {};
  for (let i = 0; i < 40; i += 1) questionChapterIndex[`q${i}`] = i < 20 ? 'a' : 'b';
  const result = computeReadinessScore({
    progress: progressWithSessions([
      { id: 's1', mode: 'study', questionIds: [], startedAt: '2026-05-18T00:00:00.000Z', answers },
    ]),
    chapters: [
      { id: 'a', questionCount: 20 },
      { id: 'b', questionCount: 20 },
    ],
    questionChapterIndex,
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.verdict, 'strong_preparation');
  assert.ok(result.score >= 85);
});

test('computeReadinessScore: idle 30 days drags recency to 0', () => {
  const { computeReadinessScore } = loadTs('lib/learning/readiness.ts');
  const answers = [
    {
      questionId: 'q1',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: '2026-04-01T10:00:00.000Z',
      timeSpentSeconds: 5,
    },
  ];
  const result = computeReadinessScore({
    progress: progressWithSessions([
      { id: 's1', mode: 'study', questionIds: [], startedAt: '2026-04-01T00:00:00.000Z', answers },
    ]),
    chapters: [{ id: 'a', questionCount: 10 }],
    questionChapterIndex: { q1: 'a' },
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  assert.equal(result.components.recency, 0);
});

test('computeReadinessScore: exam answers feed mock average, not practice accuracy', () => {
  const { computeReadinessScore } = loadTs('lib/learning/readiness.ts');
  const examAnswers = [
    ...Array.from({ length: 32 }, () => true),
    ...Array.from({ length: 8 }, () => false),
  ].map((isCorrect, index) => ({
    questionId: `exam-${index}`,
    selectedOptionIds: [],
    isCorrect,
    answeredAt: '2026-05-19T10:00:00.000Z',
    timeSpentSeconds: 5,
  }));

  const result = computeReadinessScore({
    progress: progressWithSessions([
      {
        id: 'mock-with-answers',
        mode: 'exam',
        questionIds: [],
        startedAt: '2026-05-19T09:00:00.000Z',
        completedAt: '2026-05-19T10:00:00.000Z',
        score: 0.8,
        answers: examAnswers,
      },
    ]),
    chapters: [{ id: 'a', questionCount: 10 }],
    questionChapterIndex: {},
    now: new Date('2026-05-19T12:00:00.000Z'),
  });

  assert.equal(result.components.accuracy, 0);
  assert.equal(result.components.mockAverage, 0.8);
});

// -------------------------------------------------------- Calibration

test('generateCalibration: empty input → insufficient verdict', () => {
  const { generateCalibration } = loadTs('lib/learning/calibration.ts');
  const result = generateCalibration([]);
  assert.equal(result.totalRatedAnswers, 0);
  assert.equal(result.isSparse, true);
  assert.equal(result.verdict, 'insufficient');
  assert.equal(result.buckets.length, 5);
});

test('generateCalibration: well-calibrated user → well_calibrated verdict', () => {
  const { generateCalibration } = loadTs('lib/learning/calibration.ts');
  const events = [];
  // rating 1: 20% correct (4 of 20 = expected 20%)
  for (let i = 0; i < 20; i += 1) {
    events.push({
      questionId: `q${i}`,
      isCorrect: i < 4,
      answeredAt: '2026-05-19',
      confidenceRating: 1,
    });
  }
  // rating 5: ~100% correct
  for (let i = 0; i < 20; i += 1) {
    events.push({
      questionId: `q${20 + i}`,
      isCorrect: true,
      answeredAt: '2026-05-19',
      confidenceRating: 5,
    });
  }
  const result = generateCalibration(events);
  assert.equal(result.verdict, 'well_calibrated');
  const r1 = result.buckets[0];
  assert.equal(r1.count, 20);
  assert.equal(r1.actualAccuracy, 0.2);
  assert.equal(r1.deltaPoints, 0);
});

test('generateCalibration: overconfident user → over_confident verdict', () => {
  const { generateCalibration } = loadTs('lib/learning/calibration.ts');
  const events = [];
  // rating 5: only 50% correct (claimed 100%)
  for (let i = 0; i < 30; i += 1) {
    events.push({
      questionId: `q${i}`,
      isCorrect: i < 15,
      answeredAt: '2026-05-19',
      confidenceRating: 5,
    });
  }
  const result = generateCalibration(events);
  assert.equal(result.verdict, 'over_confident');
});

test('gradeFromConfidence + lapsePenaltyForWrong: map to FSRS grades', () => {
  const { gradeFromConfidence, lapsePenaltyForWrong } = loadTs('lib/learning/calibration.ts');
  assert.equal(gradeFromConfidence(false, 1), 1);
  assert.equal(gradeFromConfidence(false, 5), 1);
  assert.equal(gradeFromConfidence(true, 1), 3);
  assert.equal(gradeFromConfidence(true, 3), 3);
  assert.equal(gradeFromConfidence(true, 4), 4);
  assert.equal(gradeFromConfidence(true, 5), 4);
  assert.equal(lapsePenaltyForWrong(1), 0);
  assert.equal(lapsePenaltyForWrong(3), 1);
  assert.equal(lapsePenaltyForWrong(5), 2);
});
