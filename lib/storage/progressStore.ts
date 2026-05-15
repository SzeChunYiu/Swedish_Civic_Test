import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export type QuestionProgress = {
  questionId: string;
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastAnsweredAt?: string;
  bookmarked?: boolean;
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
};

const emptyProgress: PersistedProgress = {
  completedQuestionIds: [],
  questionProgress: {},
};

function normalizeProgress(value: unknown): PersistedProgress {
  if (!value || typeof value !== 'object') return emptyProgress;

  const candidate = value as Partial<PersistedProgress>;
  const completedQuestionIds = Array.isArray(candidate.completedQuestionIds)
    ? candidate.completedQuestionIds.filter((id): id is string => typeof id === 'string')
    : [];
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
        bookmarked: item.bookmarked,
      };
    }
  }

  return { completedQuestionIds, questionProgress };
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
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  recordAnswer: (questionId, isCorrect) =>
    set((state) => {
      const previous = state.questionProgress[questionId] ?? {
        questionId,
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
      };
      const nextQuestionProgress: QuestionProgress = {
        ...previous,
        seenCount: previous.seenCount + 1,
        correctCount: previous.correctCount + (isCorrect ? 1 : 0),
        wrongCount: previous.wrongCount + (isCorrect ? 0 : 1),
        correctStreak: isCorrect ? previous.correctStreak + 1 : 0,
        lastAnsweredAt: new Date().toISOString(),
      };
      const completedQuestionIds = state.completedQuestionIds.includes(questionId)
        ? state.completedQuestionIds
        : [...state.completedQuestionIds, questionId];
      const nextProgress = {
        completedQuestionIds,
        questionProgress: {
          ...state.questionProgress,
          [questionId]: nextQuestionProgress,
        },
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
      };
      writeProgress(nextProgress);

      return nextProgress;
    }),
  resetProgress: () => {
    writeProgress(emptyProgress);
    set(emptyProgress);
  },
}));
