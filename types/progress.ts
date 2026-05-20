export type QuizMode = 'study' | 'exam' | 'mistakes' | 'challenge';

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export interface UserQuestionProgress {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  nextReviewAt?: string;
  confidenceRating?: ConfidenceRating;
  bookmarked?: boolean;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  answeredAt: string;
  timeSpentSeconds: number;
  confidenceRating?: ConfidenceRating;
}

export interface QuizSession {
  id: string;
  mode: QuizMode;
  questionIds: string[];
  answers: QuizAnswer[];
  startedAt: string;
  completedAt?: string;
  score?: number;
}

export interface DailyChallengeCompletion {
  dayKey: string;
  questionIds: string[];
  correctCount: number;
  totalCount: number;
  score: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  dailyGoalAnswers: number;
  questionProgress: Record<string, UserQuestionProgress>;
  sessions: QuizSession[];
  dailyChallengeCompletions: Record<string, DailyChallengeCompletion>;
}
