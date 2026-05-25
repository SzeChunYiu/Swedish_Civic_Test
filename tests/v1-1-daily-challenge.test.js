// Tests for daily challenge selector (PR9, teardown rec #23 P1).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createMemoryMMKV,
  loadTsModule,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const progressStateKey = 'progressState';
function loadTs(rel) {
  return loadTsModule(repoRoot, rel);
}

function loadProgressStoreWithMemory(initialProgress = undefined) {
  const progressStorage = createMemoryMMKV(
    initialProgress ? { [progressStateKey]: JSON.stringify(initialProgress) } : {},
  );
  const { useProgressStore } = loadTsWithStorage(repoRoot, 'lib/storage/progressStore.ts', {
    progress: progressStorage,
  });

  return { progressStorage, useProgressStore };
}

function readPersistedProgress(progressStorage) {
  const serialized = progressStorage.getString(progressStateKey);
  assert.ok(serialized, 'expected progress state to be persisted');
  return JSON.parse(serialized);
}

function bigBank() {
  const out = [];
  for (let i = 0; i < 100; i += 1) {
    out.push({
      id: `q${i}`,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      chapterId: `c${i % 5}`,
    });
  }
  return out;
}

test('buildDailyChallenge: 5 questions + 60s time limit', () => {
  const { buildDailyChallenge, DAILY_CHALLENGE_QUESTIONS, DAILY_CHALLENGE_TIME_LIMIT_SECONDS } =
    loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({ bank: bigBank(), now: new Date('2026-05-19T12:00:00.000Z') });
  assert.equal(c.questionIds.length, DAILY_CHALLENGE_QUESTIONS);
  assert.equal(c.timeLimitSeconds, DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
});

test('buildDailyChallenge: same day + same bank → identical picks (deterministic)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const now = new Date('2026-05-19T12:00:00.000Z');
  const a = buildDailyChallenge({ bank, now });
  const b = buildDailyChallenge({ bank, now });
  assert.deepEqual(a.questionIds, b.questionIds);
});

test('buildDailyChallenge: different days → different picks (with high probability)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const a = buildDailyChallenge({ bank, now: new Date('2026-05-19T12:00:00.000Z') });
  const b = buildDailyChallenge({ bank, now: new Date('2026-05-20T12:00:00.000Z') });
  // Not strictly guaranteed to differ but with 100 questions + a 32-bit seed
  // the chance of identical 5-element picks is negligible.
  assert.notDeepEqual(a.questionIds, b.questionIds);
});

test('seedForDay: same input → same seed, distinct days → distinct seeds', () => {
  const { seedForDay } = loadTs('lib/learning/dailyChallenge.ts');
  assert.equal(seedForDay('2026-05-19'), seedForDay('2026-05-19'));
  assert.notEqual(seedForDay('2026-05-19'), seedForDay('2026-05-20'));
});

test('buildDailyChallenge: biases toward medium difficulty (first 3 mediums preferred)', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const bank = bigBank();
  const c = buildDailyChallenge({ bank, now: new Date('2026-05-19T12:00:00.000Z') });
  // Pull difficulty for each picked question.
  const diffs = c.questionIds.map((id) => bank.find((q) => q.id === id).difficulty);
  const mediumCount = diffs.filter((d) => d === 'medium').length;
  assert.ok(mediumCount >= 3, `expected >= 3 medium, got ${mediumCount} (${diffs.join(',')})`);
});

test('isDailyChallengeCompleted: matches today day key only', () => {
  const { isDailyChallengeCompleted } = loadTs('lib/learning/dailyChallenge.ts');
  const { getLocalDateKey } = loadTs('lib/learning/streaks.ts');
  const now = new Date('2026-05-19T12:00:00.000Z');
  const today = getLocalDateKey(now);
  assert.equal(isDailyChallengeCompleted([today], now), true);
  assert.equal(isDailyChallengeCompleted(['2026-01-01'], now), false);
  assert.equal(isDailyChallengeCompleted([], now), false);
  assert.equal(isDailyChallengeCompleted(['2026-05-19junk'], now), false);
  assert.equal(isDailyChallengeCompleted(['x2026-05-19'], now), false);
  assert.equal(isDailyChallengeCompleted(['2026-05-19T00:00:00.000Z'], now), false);
  assert.equal(
    isDailyChallengeCompleted(['2026-02-30'], new Date('2026-03-02T12:00:00.000Z')),
    false,
  );
  assert.equal(isDailyChallengeCompleted(['', '   '], now), false);
  assert.equal(isDailyChallengeCompleted([42, null, {}], now), false);
  assert.equal(isDailyChallengeCompleted(42, now), false);
});

test('dailyChallengeBannerCopy: bilingual + reflects completion state', () => {
  const { dailyChallengeBannerCopy } = loadTs('lib/learning/dailyChallenge.ts');
  assert.match(dailyChallengeBannerCopy(false, 'sv').title, /utmaning/i);
  assert.match(dailyChallengeBannerCopy(false, 'en').title, /challenge/i);
  assert.match(dailyChallengeBannerCopy(true, 'en').title, /done/i);
  assert.match(dailyChallengeBannerCopy(true, 'sv').title, /klar/i);
});

test('buildDailyChallenge: small bank still produces some output', () => {
  const { buildDailyChallenge } = loadTs('lib/learning/dailyChallenge.ts');
  const c = buildDailyChallenge({
    bank: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    now: new Date('2026-05-19T12:00:00.000Z'),
  });
  // Should not throw; output length capped at min(bank size, 5).
  assert.ok(c.questionIds.length <= 5);
  assert.ok(c.questionIds.length >= 1);
});

test('daily challenge is surfaced from Home', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(homeSource, /buildDailyChallenge\(\{ bank: questions, now: today \}\)/);
  assert.match(homeSource, /dailyChallengeBannerCopy\(dailyChallengeCompleted, language\)/);
  assert.match(homeSource, /const handleStartDailyChallenge = useCallback\(\(\) => \{/);
  assert.match(homeSource, /dailyChallengeLaunchNonceRef\.current \+= 1;/);
  assert.match(homeSource, /dailyChallengeCompleted \? 'retry' : 'start'/);
  assert.match(homeSource, /router\.push\(\{\s*pathname: '\/practice',\s*params: \{/);
  assert.match(homeSource, /launch: `\$\{todayKey\}-\$\{launchState\}-/);
  assert.match(homeSource, /mode: 'challenge'/);
  assert.match(homeSource, /dailyChallengeCompletions/);
});

test('Practice route keeps the current hub and source-backed practice flow', () => {
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');

  assert.match(practiceSource, /type PracticeScope =/);
  assert.match(practiceSource, /const \[practiceScope, setPracticeScope\]/);
  assert.match(practiceSource, /launch\?: string \| string\[\];/);
  assert.match(practiceSource, /normalizePracticeRouteLaunchToken\(launch\)/);
  assert.match(
    practiceSource,
    /key: `mode:\$\{routeLaunchMode\}:\$\{routeLaunchToken \?\? 'default'\}`/,
  );
  assert.match(practiceSource, /getQuestionsForPracticeScope\(filteredQuestions, practiceScope\)/);
  assert.match(practiceSource, /startPracticeScope\(\{ type: 'all' \}\)/);
  assert.match(practiceSource, /startPracticeScope\(\{ type: 'quick', limit: 10 \}\)/);
  assert.match(practiceSource, /handleStartChapter\(summary\.chapter\.id\)/);
  assert.match(practiceSource, /UHRReferenceCard/);
  assert.match(practiceSource, /QuestionReportLink/);
});

test('daily challenge completion is persisted by local day in the progress store', () => {
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );
  const progressTypes = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');

  assert.match(progressStore, /export type DailyChallengeProgress = \{/);
  assert.match(progressStore, /dailyChallengeCompletions: Record<string, DailyChallengeProgress>;/);
  assert.match(progressStore, /dailyChallengeCompletions: \{\},/);
  assert.match(progressStore, /recordDailyChallengeCompletion: \(completion\) =>/);
  assert.match(progressStore, /\[nextCompletion\.dayKey\]: nextCompletion/);
  assert.match(progressTypes, /export interface DailyChallengeCompletion/);
  assert.match(
    progressTypes,
    /dailyChallengeCompletions: Record<string, DailyChallengeCompletion>;/,
  );
});

test('DailyChallengeProgress hydration keeps valid local days and drops malformed records', () => {
  const { useProgressStore } = loadProgressStoreWithMemory({
    completedQuestionIds: [],
    questionProgress: {},
    totalXp: 0,
    answerDates: [],
    answerHistory: [],
    mockExamSessions: [],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    dailyChallengeCompletions: {
      valid: {
        dayKey: '2026-05-20',
        questionIds: [' q001 ', 'q002', 'q001', '', 17],
        correctCount: 4,
        totalCount: 2,
        score: 1.2,
        timeSpentSeconds: 999999999,
        completedAt: '2026-05-20T10:00:00.000Z',
      },
      duplicateSameDay: {
        dayKey: '2026-05-20',
        questionIds: ['q999'],
        correctCount: 0,
        totalCount: 1,
        score: 0,
        timeSpentSeconds: 10,
        completedAt: '2026-05-20T11:00:00.000Z',
      },
      clampedCounts: {
        dayKey: '2026-05-21',
        questionIds: ['q010', 'q011'],
        correctCount: 99,
        totalCount: 1,
        score: -3,
        timeSpentSeconds: -1,
        completedAt: '2026-05-21T10:00:00.000Z',
      },
      invalidDay: {
        dayKey: '2026-02-30',
        questionIds: ['q003'],
        correctCount: 1,
        totalCount: 1,
        score: 1,
        timeSpentSeconds: 5,
        completedAt: '2026-02-28T10:00:00.000Z',
      },
      invalidTimestamp: {
        dayKey: '2026-05-22',
        questionIds: ['q004'],
        correctCount: 1,
        totalCount: 1,
        score: 1,
        timeSpentSeconds: 5,
        completedAt: 'not-a-date',
      },
      invalidQuestionIds: {
        dayKey: '2026-05-23',
        questionIds: [],
        correctCount: 0,
        totalCount: 0,
        score: 0,
        timeSpentSeconds: 0,
        completedAt: '2026-05-23T10:00:00.000Z',
      },
    },
  });

  const completions = useProgressStore.getState().dailyChallengeCompletions;
  assert.deepEqual(Object.keys(completions), ['2026-05-20', '2026-05-21']);
  assert.deepEqual(completions['2026-05-20'], {
    dayKey: '2026-05-20',
    questionIds: ['q001', 'q002'],
    correctCount: 2,
    totalCount: 2,
    score: 1,
    timeSpentSeconds: 14400,
    completedAt: '2026-05-20T10:00:00.000Z',
  });
  assert.deepEqual(completions['2026-05-21'], {
    dayKey: '2026-05-21',
    questionIds: ['q010', 'q011'],
    correctCount: 2,
    totalCount: 2,
    score: 0,
    timeSpentSeconds: 0,
    completedAt: '2026-05-21T10:00:00.000Z',
  });
});

test('daily challenge duplicate day write cannot overwrite the first completion', () => {
  const { progressStorage, useProgressStore } = loadProgressStoreWithMemory();
  const firstCompletion = {
    dayKey: '2026-05-20',
    questionIds: ['q001', 'q002'],
    correctCount: 2,
    totalCount: 2,
    score: 1,
    timeSpentSeconds: 42,
    completedAt: '2026-05-20T10:00:00.000Z',
  };
  const duplicateCompletion = {
    dayKey: '2026-05-20',
    questionIds: ['q999'],
    correctCount: 0,
    totalCount: 1,
    score: 0,
    timeSpentSeconds: 3,
    completedAt: '2026-05-20T11:00:00.000Z',
  };

  useProgressStore.getState().recordDailyChallengeCompletion(firstCompletion);
  useProgressStore.getState().recordDailyChallengeCompletion(duplicateCompletion);

  assert.deepEqual(
    useProgressStore.getState().dailyChallengeCompletions['2026-05-20'],
    firstCompletion,
  );
  assert.deepEqual(
    readPersistedProgress(progressStorage).dailyChallengeCompletions['2026-05-20'],
    firstCompletion,
  );
});
