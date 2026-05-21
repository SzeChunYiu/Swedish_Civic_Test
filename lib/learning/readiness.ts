// Local preparation signal (competitive-teardown.md rec #1, P0).
//
// Synthesized number on the home dashboard derived from rolling accuracy,
// chapter coverage, recency, and recent mock scores. Pure function over
// UserProgress + chapter index + mock history. No I/O.
//
// Verdict ladder maps to the local practice-preparation bands in
// `06_learning_and_gamification.md`:
//   0–49  not_ready_yet
//   50–69 getting_there
//   70–84 almost_ready
//   85–100 strong_preparation
//
// NEVER frame this as an official outcome forecast. Verdict strings are codes;
// UI maps them through i18n to user-facing copy.

import { validAnswerTimestampMs } from './answerDates';
import { perChapterProgress, mockHistory } from './dashboardStats';
import type { QuizSession, UserProgress, UserQuestionProgress } from '../../types/progress';
import type { PracticeQuestion } from '../../types/content';
import type { MockExamProgress } from '../storage/progressStore';

export type ReadinessVerdict =
  | 'not_ready_yet'
  | 'getting_there'
  | 'almost_ready'
  | 'strong_preparation';

export interface ReadinessScore {
  /** 0..100 integer. */
  score: number;
  verdict: ReadinessVerdict;
  /** Component contributions in 0..1, useful for "why?" tooltip. */
  components: {
    accuracy: number; // rolling accuracy 0..1
    coverage: number; // share of chapters with >= 1 answer
    recency: number; // 0..1 freshness weight
    mockAverage: number; // average of best mock per session, 0..1; 0 when none
  };
  /** True when we don't yet have enough data (verdict still set, but UI should soften copy). */
  isSparse: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PERSISTED_READINESS_STUDY_ANSWERS = 10000;
const MAX_PERSISTED_READINESS_MOCK_ANSWERS = 720;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function recencyFromProgressEvents(progress: UserProgress, now: Date): number {
  let mostRecent: number | null = null;
  const recordTimestamp = (timestampMs: number | null) => {
    if (timestampMs === null) return;
    if (mostRecent === null || timestampMs > mostRecent) mostRecent = timestampMs;
  };

  for (const session of progress.sessions ?? []) {
    if (session.mode === 'exam') {
      recordTimestamp(validAnswerTimestampMs(session.completedAt, now));
      continue;
    }

    for (const answer of session.answers) {
      const t = validAnswerTimestampMs(answer.answeredAt, now);
      if (t === null) continue;
      if (mostRecent === null || t > mostRecent) mostRecent = t;
    }
  }
  if (mostRecent === null) return 0;
  const daysSince = (now.getTime() - mostRecent) / DAY_MS;
  // Full credit if studied today; linear falloff to 0 by 14 days idle.
  return clamp01(1 - daysSince / 14);
}

function rollingAccuracy(progress: UserProgress, now: Date, daysBack = 14): number {
  const cutoff = now.getTime() - daysBack * DAY_MS;
  let total = 0;
  let correct = 0;
  for (const session of progress.sessions ?? []) {
    if (session.mode === 'exam') continue;
    for (const answer of session.answers) {
      const answeredAtMs = validAnswerTimestampMs(answer.answeredAt, now);
      if (answeredAtMs === null || answeredAtMs < cutoff) continue;
      total += 1;
      if (answer.isCorrect === true) correct += 1;
    }
  }
  if (total === 0) return 0;
  return clamp01(correct / total);
}

function mockAverage(progress: UserProgress, now: Date): number {
  const mocks = mockHistory(progress, { now });
  if (mocks.length === 0) return 0;
  // Use only the last 3 mocks — recent performance, not ancient scores.
  const recent = mocks.slice(-3);
  let sum = 0;
  let n = 0;
  for (const m of recent) {
    if (m.score === null) continue;
    sum += m.score;
    n += 1;
  }
  return n === 0 ? 0 : clamp01(sum / n);
}

function chapterCoverage(
  progress: UserProgress,
  chapters: ReadonlyArray<{ id: string; questionCount: number }>,
  questionChapterIndex: Record<string, string>,
  now: Date,
): number {
  if (chapters.length === 0) return 0;
  const bars = perChapterProgress(progress, chapters, questionChapterIndex, { now });
  const touched = bars.filter((b) => b.answers > 0).length;
  return clamp01(touched / chapters.length);
}

function verdictForScore(score: number): ReadinessVerdict {
  if (score < 50) return 'not_ready_yet';
  if (score < 70) return 'getting_there';
  if (score < 85) return 'almost_ready';
  return 'strong_preparation';
}

function nonNegativeInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }
  return value < 0 ? null : value;
}

function boundedNonNegativeInteger(value: unknown, max: number): number | null {
  const normalized = nonNegativeInteger(value);
  if (normalized === null || normalized > max) return null;
  return normalized;
}

function optionalNonNegativeInteger(value: unknown): number | null {
  return value === undefined ? 0 : nonNegativeInteger(value);
}

function scoreFromComponents(input: {
  accuracy: number;
  coverage: number;
  recency: number;
  mockAverage: number;
  hasMocks: boolean;
  totalAnswers: number;
}): ReadinessScore {
  const weights = input.hasMocks
    ? { accuracy: 0.35, coverage: 0.25, recency: 0.1, mock: 0.3 }
    : { accuracy: 0.55, coverage: 0.3, recency: 0.15, mock: 0 };

  const blended =
    input.accuracy * weights.accuracy +
    input.coverage * weights.coverage +
    input.recency * weights.recency +
    input.mockAverage * weights.mock;

  const score = Math.round(clamp01(blended) * 100);

  return {
    score,
    verdict: verdictForScore(score),
    components: {
      accuracy: input.accuracy,
      coverage: input.coverage,
      recency: input.recency,
      mockAverage: input.mockAverage,
    },
    isSparse: input.totalAnswers < 30,
  };
}

export interface ReadinessInput {
  progress: UserProgress;
  chapters: ReadonlyArray<{ id: string; questionCount: number }>;
  questionChapterIndex: Record<string, string>;
  now?: Date;
}

// Adapter: called by home.tsx with the flat store slices it already holds.
export function computeReadinessFromQuestionProgress(input: {
  questionProgress: Record<string, UserQuestionProgress>;
  questions: readonly PracticeQuestion[];
  chapters: readonly { id: string; questionCount: number }[];
  mockExamSessions?: readonly MockExamProgress[];
  now?: Date;
}): ReadinessScore {
  const now = input.now ?? new Date();
  const questionChapterIndex: Record<string, string> = {};
  for (const q of input.questions) {
    questionChapterIndex[q.id] = q.chapterId;
  }

  let recentStudyTotal = 0;
  let recentStudyCorrect = 0;
  let validStudyAnswers = 0;
  let mostRecent: number | null = null;
  const touchedChapterIds = new Set<string>();
  const rollingCutoff = now.getTime() - 14 * DAY_MS;

  for (const [questionId, progress] of Object.entries(input.questionProgress)) {
    const answeredAt = progress.lastAnsweredAt;
    const answeredAtMs = validAnswerTimestampMs(answeredAt, now);
    if (answeredAtMs === null) continue;

    const correctCount = optionalNonNegativeInteger(progress.correctCount);
    const wrongCount = optionalNonNegativeInteger(progress.wrongCount);
    if (correctCount === null || wrongCount === null) continue;

    const minimumSeenCount = correctCount + wrongCount;
    const storedSeenCount =
      progress.seenCount === undefined ? minimumSeenCount : nonNegativeInteger(progress.seenCount);
    if (storedSeenCount === null) continue;
    const seenCount = boundedNonNegativeInteger(
      Math.max(storedSeenCount, minimumSeenCount),
      MAX_PERSISTED_READINESS_STUDY_ANSWERS,
    );
    if (seenCount === null || seenCount === 0) continue;

    const remainingStudyAnswerBudget = MAX_PERSISTED_READINESS_STUDY_ANSWERS - validStudyAnswers;
    if (remainingStudyAnswerBudget <= 0) break;

    const countedSeen = Math.min(seenCount, remainingStudyAnswerBudget);
    const boundedCorrect = Math.min(correctCount, countedSeen);
    validStudyAnswers += countedSeen;
    if (answeredAtMs >= rollingCutoff) {
      recentStudyTotal += countedSeen;
      recentStudyCorrect += boundedCorrect;
    }
    if (mostRecent === null || answeredAtMs > mostRecent) mostRecent = answeredAtMs;

    const chapterId = questionChapterIndex[questionId];
    if (chapterId) touchedChapterIds.add(chapterId);
  }

  const mockScores: { score: number | null; completedAtMs: number }[] = [];
  let validMockAnswers = 0;
  for (const session of input.mockExamSessions ?? []) {
    const completedAtMs = validAnswerTimestampMs(session.completedAt, now);
    if (completedAtMs === null) continue;
    if (mostRecent === null || completedAtMs > mostRecent) mostRecent = completedAtMs;

    const totalCount = boundedNonNegativeInteger(
      session.totalCount ?? 0,
      MAX_PERSISTED_READINESS_MOCK_ANSWERS,
    );
    const correctCount = optionalNonNegativeInteger(session.correctCount);
    if (totalCount !== null && correctCount !== null && correctCount <= totalCount) {
      validMockAnswers += Math.min(
        totalCount,
        MAX_PERSISTED_READINESS_MOCK_ANSWERS - validMockAnswers,
      );
    }

    mockScores.push({
      completedAtMs,
      score:
        typeof session.score === 'number' && Number.isFinite(session.score) ? session.score : null,
    });
  }
  mockScores.sort((a, b) => a.completedAtMs - b.completedAtMs);

  const recentMockScores = mockScores.slice(-3);
  const mockScoreValues = recentMockScores.flatMap((mock) =>
    mock.score === null ? [] : [mock.score],
  );
  const mockAvg =
    mockScoreValues.length === 0
      ? 0
      : clamp01(mockScoreValues.reduce((sum, score) => sum + score, 0) / mockScoreValues.length);
  const daysSince = mostRecent === null ? null : (now.getTime() - mostRecent) / DAY_MS;

  return scoreFromComponents({
    accuracy: recentStudyTotal === 0 ? 0 : clamp01(recentStudyCorrect / recentStudyTotal),
    coverage:
      input.chapters.length === 0 ? 0 : clamp01(touchedChapterIds.size / input.chapters.length),
    recency: daysSince === null ? 0 : clamp01(1 - daysSince / 14),
    mockAverage: mockAvg,
    hasMocks: mockScores.length > 0,
    totalAnswers: validStudyAnswers + validMockAnswers,
  });
}

export function computeReadinessScore(input: ReadinessInput): ReadinessScore {
  const now = input.now ?? new Date();

  const accuracy = rollingAccuracy(input.progress, now);
  const coverage = chapterCoverage(input.progress, input.chapters, input.questionChapterIndex, now);
  const recency = recencyFromProgressEvents(input.progress, now);
  const mockAvg = mockAverage(input.progress, now);

  const hasMocks = mockHistory(input.progress, { now }).length > 0;

  // Sparse: too little data to be meaningful.
  const totalAnswers = (input.progress.sessions ?? []).reduce(
    (n, s) =>
      n +
      s.answers.filter((answer) => validAnswerTimestampMs(answer.answeredAt, now) !== null).length,
    0,
  );

  return scoreFromComponents({
    accuracy,
    coverage,
    recency,
    mockAverage: mockAvg,
    hasMocks,
    totalAnswers,
  });
}
