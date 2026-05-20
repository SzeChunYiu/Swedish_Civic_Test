import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { getNextReviewAt } from '../learning/spacedRepetition';
import { createInitialFreezeState, type StreakFreezeState } from '../learning/streakWithFreeze';
import { getLocalDateKey } from '../learning/streaks';
import { calculateAnswerXp, calculateQuizCompletionXp } from '../learning/xp';

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

export type MockExamAnswerProgress = {
  questionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
};

export type MockExamProgress = {
  sessionId: string;
  score: number;
  completedAt: string;
  correctCount: number;
  totalCount: number;
  answers: MockExamAnswerProgress[];
};

const progressStateKey = 'progressState';
const maxHydratedQuestionAnswerCount = 10000;
const maxHydratedTotalXp = 1000000;
const maxHydratedMockQuestionCount = 720;
const maxHydratedMockQuestionTimeSeconds = 12 * 60 * 60;
const maxHydratedFreezeLifetimeCount = 10000;
const maxHydratedFutureDateMs = 10 * 366 * 24 * 60 * 60 * 1000;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const localDateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

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
  answers?: MockExamAnswerProgress[];
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
};

function normalizeNonNegativeInteger(value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, value));
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeMockExamAnswers(value: unknown): MockExamAnswerProgress[] {
  if (!Array.isArray(value)) return [];

  const answers: MockExamAnswerProgress[] = [];
  for (const answer of value) {
    if (answers.length >= maxHydratedMockQuestionCount) break;
    if (!answer || typeof answer !== 'object') continue;

    const item = answer as Partial<MockExamAnswerProgress>;
    if (typeof item.questionId !== 'string' || item.questionId.trim().length === 0) continue;
    if (typeof item.isCorrect !== 'boolean') continue;

    answers.push({
      questionId: item.questionId,
      isCorrect: item.isCorrect,
      timeSpentSeconds: normalizeNonNegativeInteger(
        item.timeSpentSeconds,
        0,
        maxHydratedMockQuestionTimeSeconds,
      ),
    });
  }

  return answers;
}

function isHydratableDateTime(timeMs: number): boolean {
  return Number.isFinite(timeMs) && timeMs <= Date.now() + maxHydratedFutureDateMs;
}

function normalizeIsoTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!isoTimestampPattern.test(trimmed)) return undefined;

  const timeMs = Date.parse(trimmed);
  if (!isHydratableDateTime(timeMs)) return undefined;

  const normalized = new Date(timeMs).toISOString();
  return normalized === trimmed ? trimmed : undefined;
}

function normalizeLocalDateKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!localDateKeyPattern.test(trimmed)) return undefined;

  const [year, month, day] = trimmed.split('-').map(Number);
  const timeMs = Date.UTC(year, month - 1, day);
  if (!isHydratableDateTime(timeMs)) return undefined;

  const normalized = new Date(timeMs).toISOString().slice(0, 10);
  return normalized === trimmed ? trimmed : undefined;
}

function normalizeStreakFreezeState(value: unknown): StreakFreezeState {
  const fallback = createInitialFreezeState();
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<StreakFreezeState>;
  const rescuedDayKeys = Array.isArray(candidate.rescuedDayKeys)
    ? [
        ...new Set(
          candidate.rescuedDayKeys.map(normalizeLocalDateKey).filter((day): day is string => !!day),
        ),
      ]
    : [];

  return {
    available: normalizeNonNegativeInteger(candidate.available, fallback.available, 4),
    lastEarnedAt: normalizeLocalDateKey(candidate.lastEarnedAt) ?? fallback.lastEarnedAt,
    lifetimeEarned: normalizeNonNegativeInteger(
      candidate.lifetimeEarned,
      fallback.lifetimeEarned,
      maxHydratedFreezeLifetimeCount,
    ),
    lifetimeSpent: normalizeNonNegativeInteger(
      candidate.lifetimeSpent,
      fallback.lifetimeSpent,
      maxHydratedFreezeLifetimeCount,
    ),
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
    ? [
        ...new Set(
          candidate.answerDates.map(normalizeLocalDateKey).filter((day): day is string => !!day),
        ),
      ]
    : [];
  const mockExamSessions: MockExamProgress[] = [];
  const questionProgress: Record<string, QuestionProgress> = {};

  if (candidate.questionProgress && typeof candidate.questionProgress === 'object') {
    for (const [questionId, progress] of Object.entries(candidate.questionProgress)) {
      if (!progress || typeof progress !== 'object') continue;
      const item = progress as Partial<QuestionProgress>;
      const rawCorrectCount = normalizeNonNegativeInteger(
        item.correctCount,
        0,
        maxHydratedQuestionAnswerCount,
      );
      const rawWrongCount = normalizeNonNegativeInteger(
        item.wrongCount,
        0,
        maxHydratedQuestionAnswerCount,
      );
      const seenCount = normalizeNonNegativeInteger(
        item.seenCount,
        rawCorrectCount + rawWrongCount,
        maxHydratedQuestionAnswerCount,
      );
      const correctCount = Math.min(rawCorrectCount, seenCount);
      const wrongCount = Math.min(rawWrongCount, Math.max(0, seenCount - correctCount));
      const correctStreak = Math.min(
        normalizeNonNegativeInteger(item.correctStreak, 0, maxHydratedQuestionAnswerCount),
        correctCount,
      );
      const normalizedQuestionProgress: QuestionProgress = {
        questionId,
        seenCount,
        correctCount,
        wrongCount,
        correctStreak,
      };
      const lastAnsweredAt = normalizeIsoTimestamp(item.lastAnsweredAt);
      const nextReviewAt = normalizeIsoTimestamp(item.nextReviewAt);
      if (lastAnsweredAt) normalizedQuestionProgress.lastAnsweredAt = lastAnsweredAt;
      if (nextReviewAt) normalizedQuestionProgress.nextReviewAt = nextReviewAt;
      if (typeof item.bookmarked === 'boolean') {
        normalizedQuestionProgress.bookmarked = item.bookmarked;
      }
      questionProgress[questionId] = normalizedQuestionProgress;
    }
  }

  if (Array.isArray(candidate.mockExamSessions)) {
    for (const session of candidate.mockExamSessions) {
      if (!session || typeof session !== 'object') continue;
      const item = session as Partial<MockExamProgress>;
      const completedAt = normalizeIsoTimestamp(item.completedAt);
      if (typeof item.sessionId !== 'string' || !completedAt) continue;
      const normalizedAnswers = normalizeMockExamAnswers(item.answers);
      const totalCount = normalizeNonNegativeInteger(
        item.totalCount,
        normalizedAnswers.length,
        maxHydratedMockQuestionCount,
      );
      const answers = normalizedAnswers.slice(0, totalCount);
      const correctCount = Math.min(
        normalizeNonNegativeInteger(
          item.correctCount,
          answers.filter((answer) => answer.isCorrect).length,
          maxHydratedMockQuestionCount,
        ),
        totalCount,
      );
      mockExamSessions.push({
        answers,
        sessionId: item.sessionId,
        score: clampScore(item.score ?? 0),
        completedAt,
        correctCount,
        totalCount,
      });
    }
  }

  return {
    completedQuestionIds,
    questionProgress,
    totalXp: normalizeNonNegativeInteger(candidate.totalXp, 0, maxHydratedTotalXp),
    answerDates,
    mockExamSessions,
    streakFreezeState: normalizeStreakFreezeState(candidate.streakFreezeState),
  };
}

function readProgress(): PersistedProgress {
  let rawProgress: string | undefined;
  try {
    rawProgress = progressStorage?.getString(progressStateKey);
  } catch {
    return emptyProgress;
  }

  if (!rawProgress) return emptyProgress;

  try {
    return normalizeProgress(JSON.parse(rawProgress));
  } catch {
    return emptyProgress;
  }
}

function writeProgress(progress: PersistedProgress): PersistedProgress {
  const serializedProgress = JSON.stringify(progress);
  progressStorage?.set(progressStateKey, serializedProgress);
  return normalizeProgress(JSON.parse(serializedProgress));
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

      const nextProgress = {
        completedQuestionIds: [...state.completedQuestionIds, questionId],
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
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
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  recordMockExamSession: (session) =>
    set((state) => {
      const completedAt = session.completedAt ?? new Date().toISOString();
      const normalizedAnswers = normalizeMockExamAnswers(session.answers);
      const totalCount = normalizeNonNegativeInteger(
        session.totalCount,
        normalizedAnswers.length,
        maxHydratedMockQuestionCount,
      );
      const answers = normalizedAnswers.slice(0, totalCount);
      const nextSession: MockExamProgress = {
        answers,
        sessionId: session.sessionId,
        score: clampScore(session.score),
        completedAt,
        correctCount: Math.min(
          normalizeNonNegativeInteger(
            session.correctCount,
            answers.filter((answer) => answer.isCorrect).length,
            maxHydratedMockQuestionCount,
          ),
          totalCount,
        ),
        totalCount,
      };
      const existingSession = state.mockExamSessions.find(
        (item) => item.sessionId === nextSession.sessionId,
      );
      const completionXp = existingSession
        ? 0
        : calculateQuizCompletionXp({
            answeredCount: nextSession.totalCount,
            correctCount: nextSession.correctCount,
          });
      const otherSessions = state.mockExamSessions.filter(
        (item) => item.sessionId !== nextSession.sessionId,
      );
      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp + completionXp,
        answerDates: state.answerDates,
        mockExamSessions: [...otherSessions, nextSession],
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  setStreakFreezeState: (streakFreezeState) =>
    set((state) => {
      if (streakFreezeStatesEqual(state.streakFreezeState, streakFreezeState)) return state;

      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
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
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  resetProgress: () => {
    const persistedProgress = writeProgress(emptyProgress);
    set(persistedProgress);
  },
}));
