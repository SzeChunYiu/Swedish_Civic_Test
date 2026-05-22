import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import type { ConfidenceRating, DailyChallengeCompletion } from '../../types/progress';
import { gradeFromConfidence, lapsePenaltyForWrong } from '../learning/calibration';
import { getNextReviewAt } from '../learning/spacedRepetition';
import {
  createInitialFreezeState,
  normalizeStreakFreezeState as normalizeStoredStreakFreezeState,
  type StreakFreezeState,
} from '../learning/streakWithFreeze';
import { getLocalDateKey } from '../learning/streaks';
import { calculateAnswerXp, calculateQuizCompletionXp } from '../learning/xp';
import { isSafeImportedMapKey } from './importKeySafety';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

export type QuestionProgress = {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  nextReviewAt?: string;
  confidenceRating?: ConfidenceRating;
  bookmarked?: boolean;
};

export type MockExamProgress = {
  sessionId: string;
  score: number;
  completedAt: string;
  correctCount: number;
  totalCount: number;
  questionTimings: MockExamQuestionTiming[];
};

export type MockExamQuestionTiming = {
  questionId: string;
  timeSpentSeconds: number;
};

export type AnswerHistoryEntry = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
  timeSpentSeconds?: number;
  confidenceRating?: ConfidenceRating;
};

export type DailyChallengeProgress = {
  dayKey: string;
  questionIds: string[];
  correctCount: number;
  totalCount: number;
  score: number;
  timeSpentSeconds: number;
  completedAt: string;
};

const progressStateKey = 'progressState';
const progressStorageId = 'progress';
const maxHydratedQuestionAnswerCount = 10000;
const maxHydratedAnswerHistoryCount = 10000;
const maxHydratedAnswerTimeSeconds = 24 * 60 * 60;
const maxHydratedTotalXp = 1000000;
const maxHydratedMockQuestionCount = 720;
const maxHydratedMockQuestionTimeSeconds = 4 * 60 * 60;
const maxHydratedDailyChallengeQuestionCount = 720;
const maxHydratedFutureDateMs = 10 * 366 * 24 * 60 * 60 * 1000;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const localDateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

let progressStorage: MMKV | null = null;

try {
  progressStorage = createMMKV({ id: progressStorageId });
} catch {
  progressStorage = null;
}

export type PersistedProgress = {
  completedQuestionIds: string[];
  questionProgress: Record<string, QuestionProgress>;
  totalXp: number;
  answerDates: string[];
  answerHistory: AnswerHistoryEntry[];
  dailyChallengeCompletions: Record<string, DailyChallengeProgress>;
  mockExamSessions: MockExamProgress[];
  streakFreezeState: StreakFreezeState;
};

const emptyProgress: PersistedProgress = {
  completedQuestionIds: [],
  questionProgress: {},
  totalXp: 0,
  answerDates: [],
  answerHistory: [],
  dailyChallengeCompletions: {},
  mockExamSessions: [],
  streakFreezeState: createInitialFreezeState(),
};

type MockExamProgressInput = {
  sessionId: string;
  score: number;
  completedAt?: string;
  correctCount?: number;
  questionTimings?: MockExamQuestionTiming[];
  totalCount?: number;
};

function normalizeNonNegativeInteger(value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, value));
}

function normalizeConfidenceRating(value: unknown): ConfidenceRating | undefined {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }

  return undefined;
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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

function normalizeHydratedQuestionId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const questionId = value.trim();
  if (!questionId || !isSafeImportedMapKey(questionId)) return undefined;
  return questionId;
}

function normalizeMockExamQuestionTimings(value: unknown): MockExamQuestionTiming[] {
  if (!Array.isArray(value)) return [];

  const timings: MockExamQuestionTiming[] = [];
  const seenQuestionIds = new Set<string>();

  for (const timing of value) {
    if (!timing || typeof timing !== 'object') continue;
    const item = timing as Partial<MockExamQuestionTiming>;
    const questionId = normalizeHydratedQuestionId(item.questionId);
    if (!questionId || seenQuestionIds.has(questionId)) continue;
    const timeSpentSeconds = normalizeNonNegativeInteger(
      item.timeSpentSeconds,
      0,
      maxHydratedMockQuestionTimeSeconds,
    );
    if (timeSpentSeconds <= 0) continue;

    seenQuestionIds.add(questionId);
    timings.push({ questionId, timeSpentSeconds });
  }

  return timings;
}

function normalizeAnswerHistoryEntry(value: unknown): AnswerHistoryEntry | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<AnswerHistoryEntry>;
  const questionId = normalizeHydratedQuestionId(candidate.questionId);
  const answeredAt = normalizeIsoTimestamp(candidate.answeredAt);
  if (!questionId || typeof candidate.isCorrect !== 'boolean' || !answeredAt) return null;

  const entry: AnswerHistoryEntry = {
    questionId,
    isCorrect: candidate.isCorrect,
    answeredAt,
  };
  const timeSpentSeconds = normalizeNonNegativeInteger(
    candidate.timeSpentSeconds,
    -1,
    maxHydratedAnswerTimeSeconds,
  );
  const confidenceRating = normalizeConfidenceRating(candidate.confidenceRating);
  if (timeSpentSeconds >= 0) entry.timeSpentSeconds = timeSpentSeconds;
  if (confidenceRating) entry.confidenceRating = confidenceRating;
  return entry;
}

function hasOwnRecordKey<T extends object>(record: T, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeDailyChallengeQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const questionIds: string[] = [];
  const seenQuestionIds = new Set<string>();
  for (const item of value) {
    const questionId = typeof item === 'string' ? item.trim() : '';
    if (!questionId || seenQuestionIds.has(questionId)) continue;
    seenQuestionIds.add(questionId);
    questionIds.push(questionId);
    if (questionIds.length >= maxHydratedDailyChallengeQuestionCount) break;
  }

  return questionIds;
}

function normalizeCompletedQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const questionIds: string[] = [];
  const seenQuestionIds = new Set<string>();
  for (const item of value) {
    const questionId = normalizeHydratedQuestionId(item);
    if (!questionId || seenQuestionIds.has(questionId)) continue;
    seenQuestionIds.add(questionId);
    questionIds.push(questionId);
    if (questionIds.length >= maxHydratedQuestionAnswerCount) break;
  }

  return questionIds;
}

function normalizeDailyChallengeProgress(value: unknown): DailyChallengeProgress | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<DailyChallengeCompletion>;
  const dayKey = normalizeLocalDateKey(candidate.dayKey);
  const questionIds = normalizeDailyChallengeQuestionIds(candidate.questionIds);
  const completedAt = normalizeIsoTimestamp(candidate.completedAt);
  if (!dayKey || questionIds.length === 0 || !completedAt) return null;

  const totalCount = Math.max(
    questionIds.length,
    normalizeNonNegativeInteger(
      candidate.totalCount,
      questionIds.length,
      maxHydratedDailyChallengeQuestionCount,
    ),
  );

  return {
    dayKey,
    questionIds,
    correctCount: Math.min(
      normalizeNonNegativeInteger(
        candidate.correctCount,
        0,
        maxHydratedDailyChallengeQuestionCount,
      ),
      totalCount,
    ),
    totalCount,
    score: clampScore(candidate.score),
    timeSpentSeconds: normalizeNonNegativeInteger(
      candidate.timeSpentSeconds,
      0,
      maxHydratedMockQuestionTimeSeconds,
    ),
    completedAt,
  };
}

function streakFreezeStatesEqual(a: StreakFreezeState, b: StreakFreezeState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeProgress(value: unknown): PersistedProgress {
  if (!value || typeof value !== 'object') return emptyProgress;

  const candidate = value as Partial<PersistedProgress>;
  const completedQuestionIds = normalizeCompletedQuestionIds(candidate.completedQuestionIds);
  const answerDates = Array.isArray(candidate.answerDates)
    ? [
        ...new Set(
          candidate.answerDates.map(normalizeLocalDateKey).filter((day): day is string => !!day),
        ),
      ]
    : [];
  const answerHistory = Array.isArray(candidate.answerHistory)
    ? candidate.answerHistory
        .map(normalizeAnswerHistoryEntry)
        .filter((entry): entry is AnswerHistoryEntry => entry !== null)
        .slice(-maxHydratedAnswerHistoryCount)
    : [];
  const mockExamSessions: MockExamProgress[] = [];
  const dailyChallengeCompletions: Record<string, DailyChallengeProgress> = {};
  const questionProgress: Record<string, QuestionProgress> = {};

  if (candidate.questionProgress && typeof candidate.questionProgress === 'object') {
    for (const [questionId, progress] of Object.entries(candidate.questionProgress)) {
      if (!isSafeImportedMapKey(questionId)) continue;
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
      const confidenceRating = normalizeConfidenceRating(item.confidenceRating);
      if (lastAnsweredAt) normalizedQuestionProgress.lastAnsweredAt = lastAnsweredAt;
      if (nextReviewAt) normalizedQuestionProgress.nextReviewAt = nextReviewAt;
      if (confidenceRating) normalizedQuestionProgress.confidenceRating = confidenceRating;
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
        completedAt,
        correctCount,
        questionTimings: normalizeMockExamQuestionTimings(item.questionTimings),
        totalCount,
      });
    }
  }

  if (
    candidate.dailyChallengeCompletions &&
    typeof candidate.dailyChallengeCompletions === 'object' &&
    !Array.isArray(candidate.dailyChallengeCompletions)
  ) {
    for (const completion of Object.values(candidate.dailyChallengeCompletions)) {
      const normalizedCompletion = normalizeDailyChallengeProgress(completion);
      if (
        normalizedCompletion &&
        !hasOwnRecordKey(dailyChallengeCompletions, normalizedCompletion.dayKey)
      ) {
        dailyChallengeCompletions[normalizedCompletion.dayKey] = normalizedCompletion;
      }
    }
  }

  return {
    completedQuestionIds,
    questionProgress,
    totalXp: normalizeNonNegativeInteger(candidate.totalXp, 0, maxHydratedTotalXp),
    answerDates,
    answerHistory,
    dailyChallengeCompletions,
    mockExamSessions,
    streakFreezeState: normalizeStoredStreakFreezeState(candidate.streakFreezeState),
  };
}

export function normalizeImportedProgress(value: unknown): PersistedProgress {
  return normalizeProgress(value);
}

function readProgress(): PersistedProgress & {
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const readResult = readRecoverably(progressStorage, progressStorageId, progressStateKey, () =>
    progressStorage?.getString(progressStateKey),
  );
  if (readResult.warning) return { ...emptyProgress, persistenceWarning: readResult.warning };
  if (!readResult.value) return { ...emptyProgress, persistenceWarning: null };

  const parseResult = parseJsonRecoverably(
    readResult.value,
    progressStorageId,
    progressStateKey,
    (rawValue) => normalizeProgress(JSON.parse(rawValue)),
    emptyProgress,
  );
  return { ...parseResult.value, persistenceWarning: parseResult.warning };
}

function writeProgress(
  progress: PersistedProgress,
): PersistedProgress & { persistenceWarning: RecoverablePersistenceWarning | null } {
  const serializedProgress = JSON.stringify(progress);
  const persistenceWarning = writeRecoverably(
    progressStorage,
    progressStorageId,
    progressStateKey,
    serializedProgress,
  );
  return { ...normalizeProgress(JSON.parse(serializedProgress)), persistenceWarning };
}

type ProgressState = PersistedProgress & {
  persistenceWarning: RecoverablePersistenceWarning | null;
  markQuestionCompleted: (questionId: string) => void;
  recordAnswer(
    questionId: string,
    isCorrect: boolean,
    confidenceRating?: ConfidenceRating,
    options?: { awardXp?: boolean },
  ): void;
  recordMockExamSession: (session: MockExamProgressInput) => void;
  recordDailyChallengeCompletion: (completion: DailyChallengeCompletion) => void;
  setStreakFreezeState: (streakFreezeState: StreakFreezeState) => void;
  toggleBookmark: (questionId: string) => void;
  resetProgress: () => void;
  clearPersistenceWarning: () => void;
};

const initialProgress = readProgress();

export const useProgressStore = create<ProgressState>((set) => ({
  ...initialProgress,
  persistenceWarning: initialProgress.persistenceWarning,
  markQuestionCompleted: (questionId) =>
    set((state) => {
      if (state.completedQuestionIds.includes(questionId)) return state;

      const nextProgress = {
        completedQuestionIds: [...state.completedQuestionIds, questionId],
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        answerHistory: state.answerHistory,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  recordAnswer: (questionId, isCorrect, confidenceRating, options) =>
    set((state) => {
      if (typeof isCorrect !== 'boolean') return state;

      const answeredAt = new Date().toISOString();
      const answerDate = getLocalDateKey(new Date(answeredAt));
      const normalizedConfidenceRating = normalizeConfidenceRating(confidenceRating);
      const confidenceReviewGrade = normalizedConfidenceRating
        ? gradeFromConfidence(isCorrect, normalizedConfidenceRating)
        : null;
      const confidenceLapsePenalty =
        normalizedConfidenceRating && !isCorrect
          ? lapsePenaltyForWrong(normalizedConfidenceRating)
          : 0;
      const previous = state.questionProgress[questionId] ?? {
        questionId,
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
      };
      const correctStreak = isCorrect ? previous.correctStreak + 1 : 0;
      const scheduledCorrectStreak =
        confidenceReviewGrade === 4 ? correctStreak + 1 : correctStreak;
      const baseNextReviewAt = getNextReviewAt({
        isCorrect,
        correctStreak: scheduledCorrectStreak,
        answeredAt,
      });
      const nextReviewAt =
        confidenceLapsePenalty > 0
          ? new Date(
              Math.max(
                Date.parse(answeredAt),
                Date.parse(baseNextReviewAt) - confidenceLapsePenalty * 12 * 60 * 60 * 1000,
              ),
            ).toISOString()
          : baseNextReviewAt;
      const nextQuestionProgress: QuestionProgress = {
        ...previous,
        seenCount: previous.seenCount + 1,
        correctCount: previous.correctCount + (isCorrect ? 1 : 0),
        wrongCount: previous.wrongCount + (isCorrect ? 0 : 1),
        correctStreak,
        lastAnsweredAt: answeredAt,
        nextReviewAt,
      };
      if (normalizedConfidenceRating) {
        nextQuestionProgress.confidenceRating = normalizedConfidenceRating;
      } else {
        delete nextQuestionProgress.confidenceRating;
      }
      const completedQuestionIds = state.completedQuestionIds.includes(questionId)
        ? state.completedQuestionIds
        : [...state.completedQuestionIds, questionId];
      const answerDates = state.answerDates.includes(answerDate)
        ? state.answerDates
        : [...state.answerDates, answerDate];
      const nextAnswerHistoryEntry: AnswerHistoryEntry = {
        questionId,
        isCorrect,
        answeredAt,
      };
      if (normalizedConfidenceRating) {
        nextAnswerHistoryEntry.confidenceRating = normalizedConfidenceRating;
      }
      const nextProgress = {
        completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: nextQuestionProgress,
        },
        totalXp:
          state.totalXp +
          (options?.awardXp === false
            ? 0
            : calculateAnswerXp({ isCorrect, explanationRead: true })),
        answerDates,
        answerHistory: [...state.answerHistory, nextAnswerHistoryEntry].slice(
          -maxHydratedAnswerHistoryCount,
        ),
        dailyChallengeCompletions: state.dailyChallengeCompletions,
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  recordDailyChallengeCompletion: (completion) =>
    set((state) => {
      const nextCompletion = normalizeDailyChallengeProgress({
        ...completion,
        completedAt: completion.completedAt ?? new Date().toISOString(),
      });
      if (!nextCompletion) return state;
      if (hasOwnRecordKey(state.dailyChallengeCompletions, nextCompletion.dayKey)) return state;

      const nextProgress = {
        completedQuestionIds: state.completedQuestionIds,
        questionProgress: state.questionProgress,
        totalXp: state.totalXp,
        answerDates: state.answerDates,
        answerHistory: state.answerHistory,
        dailyChallengeCompletions: {
          ...state.dailyChallengeCompletions,
          [nextCompletion.dayKey]: nextCompletion,
        },
        mockExamSessions: state.mockExamSessions,
        streakFreezeState: state.streakFreezeState,
      };
      const persistedProgress = writeProgress(nextProgress);
      return persistedProgress;
    }),
  recordMockExamSession: (session) =>
    set((state) => {
      const completedAt = session.completedAt ?? new Date().toISOString();
      const totalCount = normalizeNonNegativeInteger(
        session.totalCount,
        0,
        maxHydratedMockQuestionCount,
      );
      const correctCount = Math.min(
        normalizeNonNegativeInteger(session.correctCount, 0, maxHydratedMockQuestionCount),
        totalCount,
      );
      const nextSession: MockExamProgress = {
        sessionId: session.sessionId,
        score: clampScore(session.score),
        completedAt,
        correctCount,
        questionTimings: normalizeMockExamQuestionTimings(session.questionTimings),
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
        answerHistory: state.answerHistory,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
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
        answerHistory: state.answerHistory,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
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
        answerHistory: state.answerHistory,
        dailyChallengeCompletions: state.dailyChallengeCompletions,
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
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

export function importProgressSnapshot(
  progress: PersistedProgress,
): RecoverablePersistenceWarning | null {
  const normalizedProgress = normalizeImportedProgress(progress);
  const persistedProgress = writeProgress(normalizedProgress);
  useProgressStore.setState(persistedProgress);
  return persistedProgress.persistenceWarning;
}
