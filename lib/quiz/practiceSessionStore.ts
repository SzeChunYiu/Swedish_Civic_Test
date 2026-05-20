import { create } from 'zustand';

type PracticeSessionState = {
  activeQuestionId: string | null;
  selectedOptionId: string | null;
  shuffleSessionId: string;
  selectOption: (questionId: string, optionId: string) => void;
  resetSelection: () => void;
  advanceQuestion: () => void;
};

const PRACTICE_SHUFFLE_SESSION_PREFIX = 'practice-session';

function nextPracticeShuffleSessionId(currentSessionId: string): string {
  const match = new RegExp(`^${PRACTICE_SHUFFLE_SESSION_PREFIX}-(\\d+)$`).exec(currentSessionId);
  const currentIndex = match ? Number(match[1]) : 0;
  return `${PRACTICE_SHUFFLE_SESSION_PREFIX}-${currentIndex + 1}`;
}

export function getPracticeInterstitialShowKey(
  activeQuestionId: string | null | undefined,
  shuffleSessionId: string,
): string {
  return activeQuestionId ? `${activeQuestionId}:${shuffleSessionId}` : '';
}

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  activeQuestionId: null,
  selectedOptionId: null,
  shuffleSessionId: `${PRACTICE_SHUFFLE_SESSION_PREFIX}-0`,
  selectOption: (questionId, optionId) =>
    set({ activeQuestionId: questionId, selectedOptionId: optionId }),
  resetSelection: () => set({ selectedOptionId: null }),
  advanceQuestion: () =>
    set((state) => ({
      activeQuestionId: null,
      selectedOptionId: null,
      shuffleSessionId: nextPracticeShuffleSessionId(state.shuffleSessionId),
    })),
}));
