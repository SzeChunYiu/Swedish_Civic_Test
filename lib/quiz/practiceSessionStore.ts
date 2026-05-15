import { create } from 'zustand';

type PracticeSessionState = {
  selectedOptionId: string | null;
  selectOption: (optionId: string) => void;
  resetSelection: () => void;
};

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  selectedOptionId: null,
  selectOption: (optionId) => set({ selectedOptionId: optionId }),
  resetSelection: () => set({ selectedOptionId: null }),
}));
