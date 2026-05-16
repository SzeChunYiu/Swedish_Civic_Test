import { create } from 'zustand';

type PracticeSessionState = {
  activeQuestionId: string | null;
  selectedOptionId: string | null;
  selectOption: (questionId: string, optionId: string) => void;
  resetSelection: () => void;
  advanceQuestion: () => void;
};

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  activeQuestionId: null,
  selectedOptionId: null,
  selectOption: (questionId, optionId) =>
    set({ activeQuestionId: questionId, selectedOptionId: optionId }),
  resetSelection: () => set({ selectedOptionId: null }),
  advanceQuestion: () => set({ activeQuestionId: null, selectedOptionId: null }),
}));
