import { create } from 'zustand';

type PracticeSessionState = {
  activeQuestionId: string | null;
  dueReviewQuestionIds: string[] | null;
  dueReviewQuestionIndex: number;
  selectedOptionId: string | null;
  shuffleSessionId: string;
  clearDueReviewSession: () => void;
  startDueReviewSession: (questionIds: string[]) => void;
  selectOption: (questionId: string, optionId: string) => void;
  resetSelection: () => void;
  advanceQuestion: () => void;
};

const PRACTICE_SHUFFLE_SESSION_PREFIX = 'practice-session';

export function getPracticeInterstitialShowKey(
  questionId: string,
  shuffleSessionId: string,
): string {
  return `${questionId}:${shuffleSessionId}`;
}

function nextPracticeShuffleSessionId(currentSessionId: string): string {
  const match = new RegExp(`^${PRACTICE_SHUFFLE_SESSION_PREFIX}-(\\d+)$`).exec(currentSessionId);
  const currentIndex = match ? Number(match[1]) : 0;
  return `${PRACTICE_SHUFFLE_SESSION_PREFIX}-${currentIndex + 1}`;
}

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  activeQuestionId: null,
  dueReviewQuestionIds: null,
  dueReviewQuestionIndex: 0,
  selectedOptionId: null,
  shuffleSessionId: `${PRACTICE_SHUFFLE_SESSION_PREFIX}-0`,
  clearDueReviewSession: () =>
    set({
      activeQuestionId: null,
      dueReviewQuestionIds: null,
      dueReviewQuestionIndex: 0,
      selectedOptionId: null,
    }),
  startDueReviewSession: (questionIds) => {
    const uniqueQuestionIds = [...new Set(questionIds.filter(Boolean))];
    set((state) => ({
      activeQuestionId: uniqueQuestionIds[0] ?? null,
      dueReviewQuestionIds: uniqueQuestionIds.length > 0 ? uniqueQuestionIds : null,
      dueReviewQuestionIndex: 0,
      selectedOptionId: null,
      shuffleSessionId: nextPracticeShuffleSessionId(state.shuffleSessionId),
    }));
  },
  selectOption: (questionId, optionId) =>
    set({ activeQuestionId: questionId, selectedOptionId: optionId }),
  resetSelection: () => set({ selectedOptionId: null }),
  advanceQuestion: () =>
    set((state) => {
      const dueReviewQuestionIds = state.dueReviewQuestionIds;
      const nextReviewIndex =
        dueReviewQuestionIds && dueReviewQuestionIds.length > 0
          ? (state.dueReviewQuestionIndex + 1) % dueReviewQuestionIds.length
          : 0;

      return {
        activeQuestionId: dueReviewQuestionIds?.[nextReviewIndex] ?? null,
        dueReviewQuestionIds,
        dueReviewQuestionIndex: nextReviewIndex,
        selectedOptionId: null,
        shuffleSessionId: nextPracticeShuffleSessionId(state.shuffleSessionId),
      };
    }),
}));
