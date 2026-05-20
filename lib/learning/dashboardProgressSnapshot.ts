import type {
  AnswerAttemptProgress,
  MockExamProgress,
  QuestionProgress,
} from '../storage/progressStore';
import type { QuizAnswer, QuizSession, UserProgress } from '../../types/progress';
import { calculateLevel } from './xp';

type DashboardProgressSnapshotInput = {
  answerDates: string[];
  answerAttempts?: AnswerAttemptProgress[];
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

function answerAttemptsForMockExam(session: MockExamProgress): QuizAnswer[] {
  return (session.answers ?? []).map((answer) => ({
    answeredAt: session.completedAt,
    isCorrect: answer.isCorrect,
    questionId: answer.questionId,
    selectedOptionIds: [],
    timeSpentSeconds: answer.timeSpentSeconds,
  }));
}

function answerAttemptToQuizAnswer(attempt: AnswerAttemptProgress): QuizAnswer {
  return {
    answeredAt: attempt.answeredAt,
    isCorrect: attempt.isCorrect,
    questionId: attempt.questionId,
    selectedOptionIds: [],
    timeSpentSeconds: 0,
  };
}

/**
 * Build the dashboard selector shape from the local progress store without
 * adding a full persisted session log. Older question rows fall back to
 * aggregate progress when they do not yet retain per-answer timestamps.
 */
export function buildDashboardProgressSnapshot({
  answerDates,
  answerAttempts = [],
  dailyGoalAnswers,
  mockExamSessions,
  questionProgress,
  totalXp,
}: DashboardProgressSnapshotInput): UserProgress {
  const persistedPracticeAnswers = answerAttempts.map(answerAttemptToQuizAnswer);
  const persistedQuestionIds = new Set(
    persistedPracticeAnswers.map((answer) => answer.questionId),
  );
  const aggregateFallbackAnswers = Object.values(questionProgress)
    .filter((progress) => !persistedQuestionIds.has(progress.questionId))
    .flatMap(answerAttemptsForProgress);
  const practiceAnswers = [...persistedPracticeAnswers, ...aggregateFallbackAnswers].sort((a, b) =>
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
    const answers = answerAttemptsForMockExam(session);

    return {
      answers,
      completedAt: session.completedAt,
      id: session.sessionId,
      mode: 'exam',
      questionIds: [...new Set(answers.map((answer) => answer.questionId))],
      score: session.score,
      startedAt: session.completedAt,
    };
  });

  return {
    currentStreak: answerDates.length,
    dailyGoalAnswers,
    level: calculateLevel(totalXp),
    questionProgress,
    sessions: practiceSession ? [practiceSession, ...examSessions] : examSessions,
    totalXp,
  };
}
