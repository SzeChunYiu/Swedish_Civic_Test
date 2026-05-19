import type { MockExamProgress, QuestionProgress } from '../storage/progressStore';
import type { QuizAnswer, QuizSession, UserProgress } from '../../types/progress';
import { calculateLevel } from './xp';

type DashboardProgressSnapshotInput = {
  answerDates: string[];
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

/**
 * Build the dashboard selector shape from the local progress store without
 * adding a new persisted session log. Repeated historical attempts are placed
 * on the latest known answer date because the current store does not retain
 * per-attempt timestamps.
 */
export function buildDashboardProgressSnapshot({
  answerDates,
  dailyGoalAnswers,
  mockExamSessions,
  questionProgress,
  totalXp,
}: DashboardProgressSnapshotInput): UserProgress {
  const practiceAnswers = Object.values(questionProgress).flatMap(answerAttemptsForProgress);
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

  const examSessions: QuizSession[] = mockExamSessions.map((session) => ({
    answers: [],
    completedAt: session.completedAt,
    id: session.sessionId,
    mode: 'exam',
    questionIds: [],
    score: session.score,
    startedAt: session.completedAt,
  }));

  return {
    currentStreak: answerDates.length,
    dailyGoalAnswers,
    level: calculateLevel(totalXp),
    questionProgress,
    sessions: practiceSession ? [practiceSession, ...examSessions] : examSessions,
    totalXp,
  };
}
