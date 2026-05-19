import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { getNextReviewAt } from '../learning/spacedRepetition';
import { getLocalDateKey } from '../learning/streaks';
import { calculateAnswerXp } from '../learning/xp';

export type QuestionProgress = {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  nextReviewAt?: string;
  bookmarked?: boolean;
};

export type MockExamProgress = {
  sessionId: string;
  score: number;
  completedAt: string;
  correctCount: number;
  totalCount: number;
};

const progressStateKey = 'progressState';

let progressStorage: MMKV | null = null;

try {
  progressStorage = createMMKV({ id: 'progress' });
} catch {
  progressStorage = null;
}

type PersistedProgress = {
  completedQuestionIds: string[];
  questionProgress: Record<string, QuestionProgress>;
  totalXp: number;
  answerDates: string[];
  mockExamSessions: MockExamProgress[];
};

const emptyProgress: PersistedProgress = {
  completedQuestionIds: [],
  questionProgress: {},
  totalXp: 0,
  answerDates: [],
  mockExamSessions: [],
};

type MockExamProgressInput = {
  sessionId: string;
  score: number;
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeProgress(value: unknown): PersistedProgress {
  if (!value || typeof value !== 'object') return emptyProgress;

  const candidate = value as Partial<PersistedProgress>;
  const completedQuestionIds = Array.isArray(candidate.completedQuestionIds)
    ? candidate.completedQuestionIds.filter((id): id is string => typeof id === 'string')
    : [];
  const answerDates = Array.isArray(candidate.answerDates)
    ? [...new Set(candidate.answerDates.filter((day): day is string => typeof day === 'string'))]
    : [];
  const mockExamSessions: MockExamProgress[] = [];
  const questionProgress: Record<string, QuestionProgress> = {};

  if (candidate.questionProgress && typeof candidate.questionProgress === 'object') {
    for (const [questionId, progress] of Object.entries(candidate.questionProgress)) {
      if (!progress || typeof progress !== 'object') continue;
      const item = progress as Partial<QuestionProgress>;
      questionProgress[questionId] = {
        questionId,
        seenCount: Math.max(0, item.seenCount ?? 0),
        correctCount: Math.max(0, item.correctCount ?? 0),
        wrongCount: Math.max(0, item.wrongCount ?? 0),
        correctStreak: Math.max(0, item.correctStreak ?? 0),
        lastAnsweredAt: item.lastAnsweredAt,
        nextReviewAt: item.nextReviewAt,
        bookmarked: item.bookmarked,
      };
    }
  }

  if (Array.isArray(candidate.mockExamSessions)) {
    for (const session of candidate.mockExamSessions) {
      if (!session || typeof session !== 'object') continue;
      const item = session as Partial<MockExamProgress>;
      if (typeof item.sessionId !== 'string' || typeof item.completedAt !== 'string') continue;
      mockExamSessions.push({
        sessionId: item.sessionId,
        score: clampScore(item.score ?? 0),
        completedAt: item.completedAt,
        correctCount: Math.max(0, item.correctCount ?? 0),
        totalCount: Math.max(0, item.totalCount ?? 0),
      });
    }
  }

  return {
    completedQuestionIds,
    questionProgress,
    totalXp: Math.max(0, candidate.totalXp ?? 0),
    answerDates,
    mockExamSessions,
  };
}

function readProgress(): PersistedProgress {
  const rawProgress = progressStorage?.getString(progressStateKey);
  if (!rawProgress) return emptyProgress;

  try {
    return normalizeProgress(JSON.parse(rawProgress));
  } catch {
    return emptyProgress;
  }
}

function writeProgress(progress: PersistedProgress): void {
  progressStorage?.set(progressStateKey, JSON.stringify(progress));
}

type ProgressState = PersistedProgress & {
  markQuestionCompleted: (questionId: string) => void;
  recordAnswer: (questionId: string, isCorrect: boolean) => void;
  recordMockExamSession: (session: MockExamProgressInput) => void;
  toggleBookmark: (questionId: string) => void;
  resetProgress: () => void;
};

const initialProgress = readProgress();

export const useProgressStore = create<ProgressState>((set) => ({
  ...initialProgress,
  markQuestionCompleted: (questionId) =>
    set((state) => {
      if (state.completedQuestionIds.includes(questionId)) return state;

      const nextProgress = {
        completedQuestionIds: [...state.completedQuestionIds, questionId],
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  recordAnswer: (questionId, isCorrect) =>
    set((state) => {
      const answeredAt = new Date().toISOString();
      const answerDate = getLocalDateKey(new Date(answeredAt));
      const previous = state.questionProgress[questionId] ?? {
        questionId,
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
      };
      const correctStreak = isCorrect ? previous.correctStreak + 1 : 0;
      const nextQuestionProgress: QuestionProgress = {
        ...previous,
        seenCount: previous.seenCount + 1,
        correctCount: previous.correctCount + (isCorrect ? 1 : 0),
        wrongCount: previous.wrongCount + (isCorrect ? 0 : 1),
        correctStreak,
        lastAnsweredAt: answeredAt,
        nextReviewAt: getNextReviewAt({ isCorrect, correctStreak, answeredAt }),
      };
      const completedQuestionIds = state.completedQuestionIds.includes(questionId)
        ? state.completedQuestionIds
        : [...state.completedQuestionIds, questionId];
      const answerDates = state.answerDates.includes(answerDate)
        ? state.answerDates
        : [...state.answerDates, answerDate];
      const nextProgress = {
        completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: nextQuestionProgress,
        },
        totalXp: state.totalXp + calculateAnswerXp({ isCorrect, explanationRead: true }),
        answerDates,
        mockExamSessions: state.mockExamSessions,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  recordMockExamSession: (session) =>
    set((state) => {
      const completedAt = session.completedAt ?? new Date().toISOString();
      const nextSession: MockExamProgress = {
        sessionId: session.sessionId,
        score: clampScore(session.score),
        completedAt,
        correctCount: Math.max(0, session.correctCount ?? 0),
        totalCount: Math.max(0, session.totalCount ?? 0),
      };
      const otherSessions = state.mockExamSessions.filter(
        (item) => item.sessionId !== nextSession.sessionId,
      );
      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: [...otherSessions, nextSession],
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  toggleBookmark: (questionId) =>
    set((state) => {
      const previous = state.questionProgress[questionId] ?? {
        questionId,
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
      };
      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: { ...previous, bookmarked: !previous.bookmarked },
        },
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  resetProgress: () => {
    writeProgress(emptyProgress);
    set(emptyProgress);
  },
}));
