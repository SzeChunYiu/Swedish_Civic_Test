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

export type MockExamProgress = {
  sessionId: string;
  score: number;
  completedAt: string;
  correctCount: number;
  totalCount: number;
};

export type DailyChallengeProgress = {
  dayKey: string;
  questionIds: string[];
  score: number;
  completedAt: string;
  correctCount: number;
  totalCount: number;
  timeSpentSeconds: number;
};

const progressStateKey = 'progressState';
const maxHydratedQuestionAnswerCount = 10000;
const maxHydratedAnswerAttemptCount = 10000;
const maxHydratedTotalXp = 1000000;
const maxHydratedMockQuestionCount = 720;
const maxHydratedFreezeLifetimeCount = 10000;

let progressStorage: MMKV | null = null;

try {
  progressStorage = createMMKV({ id: 'progress' });
} catch {
  progressStorage = null;
}

export type PersistedProgress = {
  completedQuestionIds: string[];
  questionProgress: Record<string, QuestionProgress>;
  answerAttempts: AnswerAttemptProgress[];
  totalXp: number;
  answerDates: string[];
  mockExamSessions: MockExamProgress[];
  dailyChallengeCompletions: Record<string, DailyChallengeProgress>;
  streakFreezeState: StreakFreezeState;
};

const emptyProgress: PersistedProgress = {
  completedQuestionIds: [],
  questionProgress: {},
  answerAttempts: [],
  totalXp: 0,
  answerDates: [],
  mockExamSessions: [],
  dailyChallengeCompletions: {},
  streakFreezeState: createInitialFreezeState(),
};

type MockExamProgressInput = {
  sessionId: string;
  score: number;
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
};

type DailyChallengeProgressInput = {
  dayKey: string;
  questionIds: string[];
  score: number;
  completedAt?: string;
  correctCount?: number;
  totalCount?: number;
  timeSpentSeconds?: number;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeStreakFreezeState(value: unknown): StreakFreezeState {
  const fallback = createInitialFreezeState();
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<StreakFreezeState>;
  const rescuedDayKeys = Array.isArray(candidate.rescuedDayKeys)
    ? [...new Set(candidate.rescuedDayKeys.filter((day): day is string => typeof day === 'string'))]
    : [];

  return {
    available: normalizeNonNegativeInteger(candidate.available, fallback.available, 4),
    lastEarnedAt:
      typeof candidate.lastEarnedAt === 'string' ? candidate.lastEarnedAt : fallback.lastEarnedAt,
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
    ? [...new Set(candidate.answerDates.filter((day): day is string => typeof day === 'string'))]
    : [];
  const mockExamSessions: MockExamProgress[] = [];
  const dailyChallengeCompletions: Record<string, DailyChallengeProgress> = {};
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
      questionProgress[questionId] = {
        questionId,
        seenCount,
        correctCount,
        wrongCount,
        correctStreak,
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
      const totalCount = normalizeNonNegativeInteger(
        item.totalCount,
        0,
        maxHydratedMockQuestionCount,
      );
      const correctCount = Math.min(
        normalizeNonNegativeInteger(item.correctCount, 0, maxHydratedMockQuestionCount),
        totalCount,
      );
      mockExamSessions.push({
        sessionId: item.sessionId,
        score: clampScore(item.score ?? 0),
        completedAt: item.completedAt,
        correctCount,
        totalCount,
      });
    }
  }

  if (
    candidate.dailyChallengeCompletions &&
    typeof candidate.dailyChallengeCompletions === 'object'
  ) {
    for (const [dayKey, progress] of Object.entries(candidate.dailyChallengeCompletions)) {
      if (!progress || typeof progress !== 'object') continue;
      const item = progress as Partial<DailyChallengeProgress>;
      if (
        typeof dayKey !== 'string' ||
        typeof item.completedAt !== 'string' ||
        !Array.isArray(item.questionIds)
      ) {
        continue;
      }

      dailyChallengeCompletions[dayKey] = {
        dayKey,
        questionIds: item.questionIds.filter((id): id is string => typeof id === 'string'),
        score: clampScore(item.score ?? 0),
        completedAt: item.completedAt,
        correctCount: Math.max(0, item.correctCount ?? 0),
        totalCount: Math.max(0, item.totalCount ?? 0),
        timeSpentSeconds: Math.max(0, item.timeSpentSeconds ?? 0),
      };
    }
  }

  return {
    completedQuestionIds,
    questionProgress,
    answerAttempts: normalizeAnswerAttempts(candidate.answerAttempts),
    totalXp: normalizeNonNegativeInteger(candidate.totalXp, 0, maxHydratedTotalXp),
    answerDates,
    mockExamSessions,
    dailyChallengeCompletions,
    streakFreezeState: normalizeStreakFreezeState(candidate.streakFreezeState),
  };
}

export function normalizeImportedProgress(value: unknown): PersistedProgress {
  return normalizeProgress(value);
}

function readProgress(): PersistedProgress {
  try {
    const rawProgress = progressStorage?.getString(progressStateKey);
    if (!rawProgress) return emptyProgress;

    return normalizeProgress(JSON.parse(rawProgress));
  } catch {
    return emptyProgress;
  }
}

function writeProgress(progress: PersistedProgress): void {
  progressStorage?.set(progressStateKey, JSON.stringify(progress));
}

function latestString(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return b > a ? b : a;
}

function mergeQuestionProgress(
  current: QuestionProgress | undefined,
  imported: QuestionProgress,
): QuestionProgress {
  if (!current) return imported;

  const next: QuestionProgress = {
    questionId: imported.questionId,
    seenCount: Math.max(current.seenCount, imported.seenCount),
    correctCount: Math.max(current.correctCount, imported.correctCount),
    wrongCount: Math.max(current.wrongCount, imported.wrongCount),
    correctStreak: Math.max(current.correctStreak, imported.correctStreak),
  };
  const lastAnsweredAt = latestString(current.lastAnsweredAt, imported.lastAnsweredAt);
  const nextReviewAt = latestString(current.nextReviewAt, imported.nextReviewAt);
  if (lastAnsweredAt) next.lastAnsweredAt = lastAnsweredAt;
  if (nextReviewAt) next.nextReviewAt = nextReviewAt;
  if (current.bookmarked === true || imported.bookmarked === true) {
    next.bookmarked = true;
  } else if (current.bookmarked === false || imported.bookmarked === false) {
    next.bookmarked = false;
  }

  return next;
}

function mergeStreakFreezeState(
  current: StreakFreezeState,
  imported: StreakFreezeState,
): StreakFreezeState {
  return {
    available: Math.max(current.available, imported.available),
    lastEarnedAt: latestString(current.lastEarnedAt, imported.lastEarnedAt) ?? current.lastEarnedAt,
    lifetimeEarned: Math.max(current.lifetimeEarned, imported.lifetimeEarned),
    lifetimeSpent: Math.max(current.lifetimeSpent, imported.lifetimeSpent),
    rescuedDayKeys: [...new Set([...current.rescuedDayKeys, ...imported.rescuedDayKeys])].sort(),
  };
}

function mergeMockExamSessions(
  current: MockExamProgress[],
  imported: MockExamProgress[],
): MockExamProgress[] {
  const bySessionId = new Map(current.map((session) => [session.sessionId, session]));
  for (const importedSession of imported) {
    const currentSession = bySessionId.get(importedSession.sessionId);
    if (!currentSession || importedSession.completedAt >= currentSession.completedAt) {
      bySessionId.set(importedSession.sessionId, importedSession);
    }
  }

  return [...bySessionId.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function mergeProgress(current: PersistedProgress, imported: PersistedProgress): PersistedProgress {
  const questionProgress = { ...current.questionProgress };
  for (const [questionId, importedProgress] of Object.entries(imported.questionProgress)) {
    questionProgress[questionId] = mergeQuestionProgress(
      questionProgress[questionId],
      importedProgress,
    );
  }

  return normalizeProgress({
    completedQuestionIds: [
      ...new Set([...current.completedQuestionIds, ...imported.completedQuestionIds]),
    ],
    questionProgress,
    totalXp: Math.max(current.totalXp, imported.totalXp),
    answerDates: [...new Set([...current.answerDates, ...imported.answerDates])].sort(),
    mockExamSessions: mergeMockExamSessions(current.mockExamSessions, imported.mockExamSessions),
    streakFreezeState: mergeStreakFreezeState(
      current.streakFreezeState,
      imported.streakFreezeState,
    ),
  });
}

type ProgressState = PersistedProgress & {
  markQuestionCompleted: (questionId: string) => void;
  recordAnswer: (questionId: string, isCorrect: boolean) => void;
  recordMockExamSession: (session: MockExamProgressInput) => void;
  recordDailyChallengeCompletion: (completion: DailyChallengeProgressInput) => void;
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
        answerAttempts: state.answerAttempts,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        streakFreezeState: state.streakFreezeState,
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
      const answerAttempts: AnswerAttemptProgress[] = [
        ...state.answerAttempts,
        { questionId, isCorrect, answeredAt },
      ].slice(-maxHydratedAnswerAttemptCount);
      const nextProgress = {
        completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: nextQuestionProgress,
        },
        answerAttempts,
        totalXp: state.totalXp + calculateAnswerXp({ isCorrect, explanationRead: true }),
        answerDates,
        mockExamSessions: state.mockExamSessions,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        streakFreezeState: state.streakFreezeState,
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
        answerAttempts: state.answerAttempts,
        totalXp: state.totalXp + completionXp,
        answerDates: state.answerDates,
        mockExamSessions: [...otherSessions, nextSession],
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        streakFreezeState: state.streakFreezeState,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  recordDailyChallengeCompletion: (completion) =>
    set((state) => {
      const completedAt = completion.completedAt ?? new Date().toISOString();
      const totalCount = Math.max(0, completion.totalCount ?? completion.questionIds.length);
      const correctCount = Math.max(0, completion.correctCount ?? 0);
      const nextCompletion: DailyChallengeProgress = {
        dayKey: completion.dayKey,
        questionIds: completion.questionIds,
        score: clampScore(completion.score),
        completedAt,
        correctCount,
        totalCount,
        timeSpentSeconds: Math.max(0, completion.timeSpentSeconds ?? 0),
      };
      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        dailyChallengeCompletions: {
          ...state.dailyChallengeCompletions,
          [nextCompletion.dayKey]: nextCompletion,
        },
        streakFreezeState: state.streakFreezeState,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  setStreakFreezeState: (streakFreezeState) =>
    set((state) => {
      if (streakFreezeStatesEqual(state.streakFreezeState, streakFreezeState)) return state;

      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        answerAttempts: state.answerAttempts,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        streakFreezeState,
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
        answerAttempts: state.answerAttempts,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        mockExamSessions: state.mockExamSessions,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        streakFreezeState: state.streakFreezeState,
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  resetProgress: () => {
    writeProgress(emptyProgress);
    set(emptyProgress);
  },
}));

export function importProgressSnapshot(value: unknown): PersistedProgress {
  const importedProgress = normalizeImportedProgress(value);
  const currentProgress = normalizeProgress(useProgressStore.getState());
  const nextProgress = mergeProgress(currentProgress, importedProgress);
  const persistedProgress = writeProgress(nextProgress);
  useProgressStore.setState(persistedProgress);
  return persistedProgress;
}
