// Readiness score (competitive-teardown.md rec #1, P0).
//
// "Are you ready to pass?" — a synthesized number on the home dashboard
// derived from rolling accuracy, chapter coverage, recency, and recent
// mock scores. Pure function over UserProgress + chapter index + mock
// history. No I/O.
//
// Verdict ladder maps to the existing exam-readiness band copy in
// `06_learning_and_gamification.md`:
//   0–49  not_ready_yet
//   50–69 getting_there
//   70–84 almost_ready
//   85–100 strong_preparation
//
// NEVER say "you will pass". Verdict strings are codes; UI maps them
// through i18n to user-facing copy.

import { perChapterProgress, mockHistory } from './dashboardStats';
import type { UserProgress, UserQuestionProgress } from '../../types/progress';
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
    accuracy: number;       // rolling accuracy 0..1
    coverage: number;       // share of chapters with >= 1 answer
    recency: number;        // 0..1 freshness weight
    mockAverage: number;    // average of best mock per session, 0..1; 0 when none
  };
  /** True when we don't yet have enough data (verdict still set, but UI should soften copy). */
  isSparse: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function recencyFromLastAnswer(progress: UserProgress, now: Date): number {
  let mostRecent: number | null = null;
  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const t = new Date(answer.answeredAt).getTime();
      if (Number.isNaN(t)) continue;
      if (mostRecent === null || t > mostRecent) mostRecent = t;
    }
  }
  if (mostRecent === null) return 0;
  const daysSince = (now.getTime() - mostRecent) / DAY_MS;
  // Full credit if studied today; linear falloff to 0 by 14 days idle.
  return clamp01(1 - daysSince / 14);
}

function rollingAccuracy(progress: UserProgress, now: Date, daysBack = 14): number {
  const cutoff = new Date(now.getTime() - daysBack * DAY_MS).toISOString();
  let total = 0;
  let correct = 0;
  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      if (answer.answeredAt < cutoff) continue;
      total += 1;
      if (answer.isCorrect) correct += 1;
    }
  }
  if (total === 0) return 0;
  return clamp01(correct / total);
}

function mockAverage(progress: UserProgress): number {
  const mocks = mockHistory(progress);
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
): number {
  if (chapters.length === 0) return 0;
  const bars = perChapterProgress(progress, chapters, questionChapterIndex);
  const touched = bars.filter((b) => b.answers > 0).length;
  return clamp01(touched / chapters.length);
}

function verdictForScore(score: number): ReadinessVerdict {
  if (score < 50) return 'not_ready_yet';
  if (score < 70) return 'getting_there';
  if (score < 85) return 'almost_ready';
  return 'strong_preparation';
}

export interface ReadinessInput {
  progress: UserProgress;
  chapters: ReadonlyArray<{ id: string; questionCount: number }>;
  questionChapterIndex: Record<string, string>;
  now?: Date;
}

function validAnsweredAt(value: unknown): string {
  if (typeof value !== 'string') return '1970-01-01T00:00:00.000Z';
  return Number.isNaN(new Date(value).getTime()) ? '1970-01-01T00:00:00.000Z' : value;
}

// Adapter: called by home.tsx with the flat store slices it already holds.
export function computeReadinessFromQuestionProgress(input: {
  questionProgress: Record<string, Partial<UserQuestionProgress>>;
  questions: readonly PracticeQuestion[];
  chapters: readonly { id: string; questionCount: number }[];
  mockExamSessions?: readonly Partial<MockExamProgress>[];
  now?: Date;
}): ReadinessScore {
  // Build a minimal UserProgress so computeReadinessScore can run unchanged.
  const questionChapterIndex: Record<string, string> = {};
  for (const q of input.questions) {
    questionChapterIndex[q.id] = q.chapterId;
  }

  const answers = Object.entries(input.questionProgress).flatMap(([questionId, progress]) => {
    const correctCount = Math.max(0, Math.round(progress.correctCount ?? 0));
    const wrongCount = Math.max(0, Math.round(progress.wrongCount ?? 0));
    const seenCount = Math.max(0, Math.round(progress.seenCount ?? correctCount + wrongCount));
    const total = Math.max(seenCount, correctCount + wrongCount);
    const answeredAt = validAnsweredAt(progress.lastAnsweredAt);

    return Array.from({ length: total }, (_, index) => ({
      questionId,
      selectedOptionIds: [],
      isCorrect: index < correctCount,
      answeredAt,
      timeSpentSeconds: 0,
    }));
  });

  const studySessions =
    answers.length > 0
      ? [
          {
            id: 'persisted-question-progress',
            mode: 'study' as const,
            questionIds: [...new Set(answers.map((answer) => answer.questionId))],
            answers,
            startedAt: answers[0].answeredAt,
          },
        ]
      : [];

  const mockSessions = (input.mockExamSessions ?? []).map((s, index) => ({
    id: typeof s.sessionId === 'string' && s.sessionId ? s.sessionId : `mock-${index + 1}`,
    mode: 'exam' as const,
    questionIds: [],
    answers: Array.from({ length: Math.max(0, Math.round(s.correctCount ?? 0)) }, () => ({
      questionId: '',
      selectedOptionIds: [],
      isCorrect: true,
      answeredAt: validAnsweredAt(s.completedAt),
      timeSpentSeconds: 0,
    })).concat(
      Array.from(
        { length: Math.max(0, Math.round((s.totalCount ?? 0) - (s.correctCount ?? 0))) },
        () => ({
          questionId: '',
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: validAnsweredAt(s.completedAt),
          timeSpentSeconds: 0,
        }),
      ),
    ),
    startedAt: validAnsweredAt(s.completedAt),
    completedAt: validAnsweredAt(s.completedAt),
    score: typeof s.score === 'number' ? s.score : undefined,
  }));

  const sessions: UserProgress['sessions'] = [...studySessions, ...mockSessions];
  const progress: UserProgress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: Object.fromEntries(
      Object.entries(input.questionProgress).map(([questionId, item]) => [
        questionId,
        {
          questionId,
          seenCount: Math.max(0, Math.round(item.seenCount ?? 0)),
          correctCount: Math.max(0, Math.round(item.correctCount ?? 0)),
          wrongCount: Math.max(0, Math.round(item.wrongCount ?? 0)),
          correctStreak: Math.max(0, Math.round(item.correctStreak ?? 0)),
          lastAnsweredAt: item.lastAnsweredAt,
          nextReviewAt: item.nextReviewAt,
          confidence: item.confidence,
          bookmarked: item.bookmarked,
        },
      ]),
    ),
    sessions,
  };
  return computeReadinessScore({
    progress,
    chapters: input.chapters,
    questionChapterIndex,
    now: input.now,
  });
}

export function computeReadinessScore(input: ReadinessInput): ReadinessScore {
  const now = input.now ?? new Date();

  const accuracy = rollingAccuracy(input.progress, now);
  const coverage = chapterCoverage(input.progress, input.chapters, input.questionChapterIndex);
  const recency = recencyFromLastAnswer(input.progress, now);
  const mockAvg = mockAverage(input.progress);

  // Weights: accuracy is the strongest signal, coverage second, recency third,
  // mocks substitute for accuracy once they exist (mocks ARE accuracy on the
  // exam format). When no mocks, weight redistributes to accuracy.
  const hasMocks = mockHistory(input.progress).length > 0;
  const weights = hasMocks
    ? { accuracy: 0.35, coverage: 0.25, recency: 0.1, mock: 0.3 }
    : { accuracy: 0.55, coverage: 0.3, recency: 0.15, mock: 0 };

  const blended =
    accuracy * weights.accuracy +
    coverage * weights.coverage +
    recency * weights.recency +
    mockAvg * weights.mock;

  const score = Math.round(clamp01(blended) * 100);

  // Sparse: too little data to be meaningful.
  const totalAnswers = (input.progress.sessions ?? []).reduce(
    (n, s) => n + s.answers.length,
    0,
  );
  const isSparse = totalAnswers < 30;

  return {
    score,
    verdict: verdictForScore(score),
    components: { accuracy, coverage, recency, mockAverage: mockAvg },
    isSparse,
  };
}
