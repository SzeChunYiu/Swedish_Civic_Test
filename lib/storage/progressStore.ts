import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { getNextReviewAt } from '../learning/spacedRepetition';
import { createInitialFreezeState, type StreakFreezeState } from '../learning/streakWithFreeze';
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
  streakFreezeState: StreakFreezeState;
};

const emptyProgress: PersistedProgress = {
  completedQuestionIds: [],
  questionProgress: {},
  totalXp: 0,
  answerDates: [],
  mockExamSessions: [],
  streakFreezeState: createInitialFreezeState(),
};

type MockExamProgressInput = {
  sessionId: string;
  score: number;
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
};

function normalizeNonNegativeInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeQuestionProgress(
  questionId: string,
  progress: Partial<QuestionProgress>,
): QuestionProgress {
  const seenCount = normalizeNonNegativeInteger(progress.seenCount);
  const correctCount = Math.min(normalizeNonNegativeInteger(progress.correctCount), seenCount);
  const wrongCount = Math.min(
    normalizeNonNegativeInteger(progress.wrongCount),
    Math.max(0, seenCount - correctCount),
  );
  const correctStreak = Math.min(normalizeNonNegativeInteger(progress.correctStreak), correctCount);

  return {
    questionId,
    seenCount,
    correctCount,
    wrongCount,
    correctStreak,
    lastAnsweredAt:
      typeof progress.lastAnsweredAt === 'string' ? progress.lastAnsweredAt : undefined,
    nextReviewAt: typeof progress.nextReviewAt === 'string' ? progress.nextReviewAt : undefined,
    bookmarked: typeof progress.bookmarked === 'boolean' ? progress.bookmarked : undefined,
  };
}

function normalizeMockExamProgress(session: Partial<MockExamProgress>): MockExamProgress | null {
  if (typeof session.sessionId !== 'string' || typeof session.completedAt !== 'string') return null;
  const totalCount = normalizeNonNegativeInteger(session.totalCount);
  const correctCount = Math.min(normalizeNonNegativeInteger(session.correctCount), totalCount);

  return {
    sessionId: session.sessionId,
    score: clampScore(session.score),
    completedAt: session.completedAt,
    correctCount,
    totalCount,
  };
}

function normalizeStreakFreezeState(value: unknown): StreakFreezeState {
  const fallback = createInitialFreezeState();
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<StreakFreezeState>;
  const rescuedDayKeys = Array.isArray(candidate.rescuedDayKeys)
    ? [...new Set(candidate.rescuedDayKeys.filter((day): day is string => typeof day === 'string'))]
    : [];
  const lifetimeEarned = normalizeNonNegativeInteger(
    candidate.lifetimeEarned ?? fallback.lifetimeEarned,
  );
  const lifetimeSpent = Math.min(
    normalizeNonNegativeInteger(candidate.lifetimeSpent ?? fallback.lifetimeSpent),
    lifetimeEarned,
  );

  return {
    available: normalizeNonNegativeInteger(candidate.available ?? fallback.available, 4),
    lastEarnedAt:
      typeof candidate.lastEarnedAt === 'string' ? candidate.lastEarnedAt : fallback.lastEarnedAt,
    lifetimeEarned,
    lifetimeSpent,
    rescuedDayKeys,
  };
}

function streakFreezeStatesEqual(a: StreakFreezeState, b: StreakFreezeState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
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
      questionProgress[questionId] = normalizeQuestionProgress(questionId, item);
    }
  }

  if (Array.isArray(candidate.mockExamSessions)) {
    for (const session of candidate.mockExamSessions) {
      if (!session || typeof session !== 'object') continue;
      const item = normalizeMockExamProgress(session as Partial<MockExamProgress>);
      if (item) mockExamSessions.push(item);
    }
  }

  return {
    completedQuestionIds,
    questionProgress,
    totalXp: normalizeNonNegativeInteger(candidate.totalXp),
    answerDates,
    mockExamSessions,
    streakFreezeState: normalizeStreakFreezeState(candidate.streakFreezeState),
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
  const normalizedProgress = normalizeProgress(progress);
  progressStorage?.set(progressStateKey, JSON.stringify(normalizedProgress));
}

type ProgressState = PersistedProgress & {
  markQuestionCompleted: (questionId: string) => void;
  recordAnswer: (questionId: string, isCorrect: boolean) => void;
  recordMockExamSession: (session: MockExamProgressInput) => void;
  setStreakFreezeState: (streakFreezeState: StreakFreezeState) => void;
  toggleBookmark: (questionId: string) => void;
  resetProgress: () => void;
};

const initialProgress = readProgress();

export const useProgressStore = create<ProgressState>((set) => ({
  ...initialProgress,
  markQuestionCompleted: (questionId) =>
    set((state) => {
      if (state.completedQuestionIds.includes(questionId)) return state;

      const nextProgress = normalizeProgress({
        completedQuestionIds: [...state.completedQuestionIds, questionId],
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      });
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
      const normalizedPrevious = normalizeQuestionProgress(questionId, previous);
      const correctStreak = isCorrect ? normalizedPrevious.correctStreak + 1 : 0;
      const nextQuestionProgress: QuestionProgress = {
        ...normalizedPrevious,
        seenCount: normalizedPrevious.seenCount + 1,
        correctCount: normalizedPrevious.correctCount + (isCorrect ? 1 : 0),
        wrongCount: normalizedPrevious.wrongCount + (isCorrect ? 0 : 1),
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
      const nextProgress = normalizeProgress({
        completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: nextQuestionProgress,
        },
        totalXp:
          normalizeNonNegativeInteger(state.totalXp) +
          calculateAnswerXp({ isCorrect, explanationRead: true }),
        answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      });
      writeProgress(nextProgress);

      return nextProgress;
    }),
  recordMockExamSession: (session) =>
    set((state) => {
      const completedAt = session.completedAt ?? new Date().toISOString();
      const nextSession = normalizeMockExamProgress({
        sessionId: session.sessionId,
        score: clampScore(session.score),
        completedAt,
        correctCount: session.correctCount,
        totalCount: session.totalCount,
      });
      if (!nextSession) return state;
      const otherSessions = state.mockExamSessions.filter(
        (item) => item.sessionId !== nextSession.sessionId,
      );
      const nextProgress = normalizeProgress({
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: [...otherSessions, nextSession],
        streakFreezeState: state.streakFreezeState,
      });
      writeProgress(nextProgress);

      return nextProgress;
    }),
  setStreakFreezeState: (streakFreezeState) =>
    set((state) => {
      const normalizedStreakFreezeState = normalizeStreakFreezeState(streakFreezeState);
      if (streakFreezeStatesEqual(state.streakFreezeState, normalizedStreakFreezeState)) {
        return state;
      }

      const nextProgress = normalizeProgress({
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: normalizedStreakFreezeState,
      });
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
      const normalizedPrevious = normalizeQuestionProgress(questionId, previous);
      const nextProgress = normalizeProgress({
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: { ...normalizedPrevious, bookmarked: !normalizedPrevious.bookmarked },
        },
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      });
      writeProgress(nextProgress);

      return nextProgress;
    }),
  resetProgress: () => {
    writeProgress(emptyProgress);
    set(emptyProgress);
  },
}));

export const __progressStoreTestHooks = {
  normalizeProgress,
  normalizeStreakFreezeState,
  normalizeNonNegativeInteger,
};
