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
import { defaultMockExamConfig } from '../../data/mockExamConfig';
import type {
  QuizAnswer,
  QuizSession,
  UserProgress,
  UserQuestionProgress,
} from '../../types/progress';
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

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function validTimestampMs(value: string | undefined): number | null {
  if (!value) return null;
  const timestampMs = new Date(value).getTime();
  return Number.isFinite(timestampMs) ? timestampMs : null;
}

function recencyFromProgressEvents(progress: UserProgress, now: Date): number {
  let mostRecent: number | null = null;
  const recordTimestamp = (timestampMs: number | null) => {
    if (timestampMs === null) return;
    if (mostRecent === null || timestampMs > mostRecent) mostRecent = timestampMs;
  };

  for (const session of progress.sessions ?? []) {
    if (session.mode === 'exam') {
      recordTimestamp(validTimestampMs(session.completedAt));
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

function finiteNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function boundedSyntheticCount(value: number, availableCount: number): number {
  const limit = Math.max(0, Math.floor(availableCount));
  return Math.min(value, limit);
}

function syntheticStudyCounts(
  progress: UserQuestionProgress,
  availableCount: number,
): { correctCount: number; wrongCount: number; residualCount: number } {
  const correctInput = finiteNonNegativeInteger(progress.correctCount) ?? 0;
  const wrongInput = finiteNonNegativeInteger(progress.wrongCount) ?? 0;
  const seenInput = finiteNonNegativeInteger(progress.seenCount);
  const derivedSeenCount = correctInput + wrongInput;
  const seenCount = boundedSyntheticCount(
    seenInput === null ? derivedSeenCount : Math.max(seenInput, derivedSeenCount),
    availableCount,
  );
  const correctCount = Math.min(correctInput, seenCount);
  const wrongCount = Math.min(wrongInput, Math.max(0, seenCount - correctCount));
  const residualCount = Math.max(0, seenCount - correctCount - wrongCount);

  return { correctCount, wrongCount, residualCount };
}

function buildQuestionChapterIndex(questions: readonly PracticeQuestion[]): Record<string, string> {
  const questionChapterIndex: Record<string, string> = {};
  for (const q of questions) {
    questionChapterIndex[q.id] = q.chapterId;
  }
  return questionChapterIndex;
}

export interface ReadinessInput {
  progress: UserProgress;
  chapters: ReadonlyArray<{ id: string; questionCount: number }>;
  questionChapterIndex: Record<string, string>;
  now?: Date;
}

export interface ReadinessQuestionBankIndex {
  questionChapterIndex: Record<string, string>;
  questionIdsInBank: ReadonlySet<string>;
}

export function buildReadinessQuestionBankIndex(
  questions: readonly Pick<PracticeQuestion, 'id' | 'chapterId'>[],
): ReadinessQuestionBankIndex {
  const questionChapterIndex: Record<string, string> = {};
  const questionIdsInBank = new Set<string>();

  for (const q of questions) {
    questionChapterIndex[q.id] = q.chapterId;
    questionIdsInBank.add(q.id);
  }

  return { questionChapterIndex, questionIdsInBank };
}

// Adapter: called by home.tsx with the flat store slices it already holds.
export function computeReadinessFromQuestionProgress(input: {
  questionProgress: Record<string, UserQuestionProgress>;
  questions: readonly PracticeQuestion[];
  chapters: readonly { id: string; questionCount: number }[];
  questionChapterIndex?: Record<string, string>;
  questionIdsInBank?: ReadonlySet<string>;
  mockExamSessions?: readonly MockExamProgress[];
  questionBankIndex?: ReadinessQuestionBankIndex;
  now?: Date;
}): ReadinessScore {
  // Build a minimal UserProgress so computeReadinessScore can run unchanged.
  const now = input.now ?? new Date();
  const questionBankIndex = input.questionBankIndex ?? {
    questionChapterIndex: input.questionChapterIndex ?? buildQuestionChapterIndex(input.questions),
    questionIdsInBank: input.questionIdsInBank ?? new Set(input.questions.map((q) => q.id)),
  };
  const { questionChapterIndex, questionIdsInBank } = questionBankIndex;
  const studyAnswers: QuizAnswer[] = [];
  for (const [questionId, progress] of Object.entries(input.questionProgress)) {
    if (!questionIdsInBank.has(questionId)) continue;

    const answeredAt = progress.lastAnsweredAt;
    if (typeof answeredAt !== 'string' || validAnswerTimestampMs(answeredAt, now) === null) {
      continue;
    }

    const { correctCount, wrongCount, residualCount } = syntheticStudyCounts(
      progress,
      input.questions.length - studyAnswers.length,
    );

    studyAnswers.push(
      ...Array.from({ length: correctCount }, () => ({
        questionId,
        selectedOptionIds: [],
        isCorrect: true,
        answeredAt,
        timeSpentSeconds: 0,
      })),
      ...Array.from({ length: wrongCount + residualCount }, () => ({
        questionId,
        selectedOptionIds: [],
        isCorrect: false,
        answeredAt,
        timeSpentSeconds: 0,
      })),
    );
  }

  const studySessions: QuizSession[] =
    studyAnswers.length > 0
      ? [
          {
            id: 'persisted-question-progress',
            mode: 'study' as const,
            questionIds: [...new Set(studyAnswers.map((answer) => answer.questionId))],
            answers: studyAnswers,
            startedAt: studyAnswers
              .map((answer) => answer.answeredAt)
              .sort((a, b) => a.localeCompare(b))[0],
          },
        ]
      : [];

  const mockSessions: QuizSession[] = (input.mockExamSessions ?? []).flatMap((s) => {
    if (validAnswerTimestampMs(s.completedAt, now) === null) return [];
    const totalCount = boundedSyntheticCount(
      finiteNonNegativeInteger(s.totalCount) ?? 0,
      defaultMockExamConfig.questionCount,
    );
    const correctCount = Math.min(finiteNonNegativeInteger(s.correctCount) ?? 0, totalCount);

    return [
      {
        id: s.sessionId,
        mode: 'exam' as const,
        questionIds: [],
        answers: Array.from({ length: correctCount }, () => ({
          questionId: '',
          selectedOptionIds: [],
          isCorrect: true,
          answeredAt: s.completedAt,
          timeSpentSeconds: 0,
        })).concat(
          Array.from({ length: totalCount - correctCount }, () => ({
            questionId: '',
            selectedOptionIds: [],
            isCorrect: false,
            answeredAt: s.completedAt,
            timeSpentSeconds: 0,
          })),
        ),
        startedAt: s.completedAt,
        completedAt: s.completedAt,
        score: s.score,
      },
    ];
  });

  const sessions: QuizSession[] = studySessions.concat(mockSessions);
  const progress: UserProgress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyGoalAnswers: 10,
    questionProgress: input.questionProgress,
    sessions,
    dailyChallengeCompletions: {},
  };
  return computeReadinessScore({
    progress,
    chapters: input.chapters,
    questionChapterIndex,
    now,
  });
}

export function computeReadinessScore(input: ReadinessInput): ReadinessScore {
  const now = input.now ?? new Date();

  const accuracy = rollingAccuracy(input.progress, now);
  const coverage = chapterCoverage(input.progress, input.chapters, input.questionChapterIndex, now);
  const recency = recencyFromProgressEvents(input.progress, now);
  const mockAvg = mockAverage(input.progress, now);

  // Weights: accuracy is the strongest signal, coverage second, recency third,
  // mocks substitute for accuracy once they exist (mocks ARE accuracy on the
  // exam format). When no mocks, weight redistributes to accuracy.
  const hasMocks = mockHistory(input.progress, { now }).length > 0;
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
    (n, s) =>
      n +
      s.answers.filter((answer) => validAnswerTimestampMs(answer.answeredAt, now) !== null).length,
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
