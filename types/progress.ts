export type QuizMode = 'study' | 'exam' | 'mistakes' | 'challenge';

export type Confidence = 'low' | 'medium' | 'high';

export interface UserQuestionProgress {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  nextReviewAt?: string;
  confidence?: Confidence;
  bookmarked?: boolean;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  answeredAt: string;
  timeSpentSeconds: number;
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

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  dailyGoalAnswers: number;
  questionProgress: Record<string, UserQuestionProgress>;
  sessions: QuizSession[];
}
