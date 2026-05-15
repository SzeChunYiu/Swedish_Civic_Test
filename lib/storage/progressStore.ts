import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

const completedQuestionIdsKey = 'completedQuestionIds';

let progressStorage: MMKV | null = null;

try {
  progressStorage = createMMKV({ id: 'progress' });
} catch {
  progressStorage = null;
}

function readCompletedQuestionIds(): string[] {
  const rawIds = progressStorage?.getString(completedQuestionIdsKey);
  if (!rawIds) return [];

  try {
    const parsedIds = JSON.parse(rawIds);
    return Array.isArray(parsedIds)
      ? parsedIds.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeCompletedQuestionIds(questionIds: string[]): void {
  progressStorage?.set(completedQuestionIdsKey, JSON.stringify(questionIds));
}

type ProgressState = {
  completedQuestionIds: string[];
  markQuestionCompleted: (questionId: string) => void;
  resetProgress: () => void;
};

export const useProgressStore = create<ProgressState>((set) => ({
  completedQuestionIds: readCompletedQuestionIds(),
  markQuestionCompleted: (questionId) =>
    set((state) => {
      if (state.completedQuestionIds.includes(questionId)) return state;

      const completedQuestionIds = [...state.completedQuestionIds, questionId];
      writeCompletedQuestionIds(completedQuestionIds);

      return { completedQuestionIds };
    }),
  resetProgress: () => {
    writeCompletedQuestionIds([]);
    set({ completedQuestionIds: [] });
  },
}));
