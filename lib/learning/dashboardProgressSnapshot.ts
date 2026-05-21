import type {
  AnswerHistoryEntry,
  MockExamProgress,
  QuestionProgress,
} from '../storage/progressStore';
import type { QuizAnswer, QuizSession, UserProgress } from '../../types/progress';
import { calculateLevel } from './xp';

type DashboardProgressSnapshotInput = {
  answerDates: string[];
  answerAttempts?: AnswerHistoryEntry[];
  answerHistory?: AnswerHistoryEntry[];
  dailyGoalAnswers: number;
  mockExamSessions: MockExamProgress[];
  questionProgress: Record<string, QuestionProgress>;
  totalXp: number;
};

function answerAttemptsForProgress(progress: QuestionProgress): QuizAnswer[] {
  if (!progress.lastAnsweredAt) return [];

  const nonNegativeInteger = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const seenCount = Math.max(
    0,
    nonNegativeInteger(progress.seenCount),
    nonNegativeInteger(progress.correctCount) + nonNegativeInteger(progress.wrongCount),
  );
  if (seenCount === 0) return [];

  const correctCount = Math.min(nonNegativeInteger(progress.correctCount), seenCount);
  const wrongCount = Math.min(nonNegativeInteger(progress.wrongCount), seenCount);
  const unspecifiedCount = Math.max(0, seenCount - correctCount - wrongCount);
  const correctness: boolean[] = [
    ...Array.from({ length: correctCount }, () => true),
    ...Array.from({ length: wrongCount }, () => false),
    ...Array.from({ length: unspecifiedCount }, () => progress.correctStreak > 0),
  ];

  return correctness.map((isCorrect) => ({
    answeredAt: progress.lastAnsweredAt!,
    isCorrect,
    questionId: progress.questionId,
    selectedOptionIds: [],
    timeSpentSeconds: 0,
  }));
}

function answerAttemptForHistoryEntry(entry: AnswerHistoryEntry): QuizAnswer {
  return {
    answeredAt: entry.answeredAt,
    isCorrect: entry.isCorrect,
    questionId: entry.questionId,
    selectedOptionIds: [],
    timeSpentSeconds: entry.timeSpentSeconds ?? 0,
    confidenceRating: entry.confidenceRating,
  };
}

export function buildDashboardProgressSnapshot({
  answerAttempts = [],
  answerDates,
  answerHistory,
  dailyGoalAnswers,
  mockExamSessions,
  questionProgress,
  totalXp,
}: DashboardProgressSnapshotInput): UserProgress {
  const historicalProgressAnswers = answerHistory ?? answerAttempts;
  const historicalQuestionIds = new Set(historicalProgressAnswers.map((entry) => entry.questionId));
  const historicalAnswers = historicalProgressAnswers.map(answerAttemptForHistoryEntry);
  const fallbackAnswers = Object.values(questionProgress)
    .filter((progress) => !historicalQuestionIds.has(progress.questionId))
    .flatMap(answerAttemptsForProgress);
  const practiceAnswers = [...historicalAnswers, ...fallbackAnswers].sort((a, b) =>
    a.answeredAt.localeCompare(b.answeredAt),
  );
  const practiceQuestionIds = [...new Set(practiceAnswers.map((answer) => answer.questionId))];
  const practiceSession: QuizSession | null =
    practiceAnswers.length > 0
      ? {
          answers: practiceAnswers,
          completedAt: practiceAnswers[practiceAnswers.length - 1].answeredAt,
          id: 'local-question-progress',
          mode: 'study',
          questionIds: practiceQuestionIds,
          startedAt: practiceAnswers[0].answeredAt,
        }
      : null;

  const examSessions: QuizSession[] = mockExamSessions.map((session) => {
    const totalTimingSeconds = session.questionTimings.reduce(
      (sum, timing) => sum + timing.timeSpentSeconds,
      0,
    );
    const completedAtMs = Date.parse(session.completedAt);
    const startedAt =
      Number.isFinite(completedAtMs) && totalTimingSeconds > 0
        ? new Date(completedAtMs - totalTimingSeconds * 1000).toISOString()
        : session.completedAt;

    return {
      answers: [],
      completedAt: session.completedAt,
      id: session.sessionId,
      mode: 'exam',
      questionIds: session.questionTimings.map((timing) => timing.questionId),
      score: session.score,
      startedAt,
    };
  });

  return {
    currentStreak: answerDates.length,
    dailyChallengeCompletions: {},
    dailyGoalAnswers,
    level: calculateLevel(totalXp),
    questionProgress,
    sessions: practiceSession ? [practiceSession, ...examSessions] : examSessions,
    totalXp,
  };
}
