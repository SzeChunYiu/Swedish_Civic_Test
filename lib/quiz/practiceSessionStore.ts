import { create } from 'zustand';

type PracticeSessionState = {
  answerXpAwardedKey: string | null;
  activeQuestionId: string | null;
  answeredQuestionIds: string[];
  selectedOptionId: string | null;
  shuffleSessionId: string;
  markAnswerXpAwarded: (awardKey: string) => void;
  selectOption: (questionId: string, optionId: string) => void;
  startSession: (questionId?: string | null) => void;
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

export function getPracticeAnswerXpAwardKey(questionId: string, shuffleSessionId: string): string {
  return `${questionId}:${shuffleSessionId}:answer-xp`;
}

function nextPracticeShuffleSessionId(currentSessionId: string): string {
  const match = new RegExp(`^${PRACTICE_SHUFFLE_SESSION_PREFIX}-(\\d+)$`).exec(currentSessionId);
  const currentIndex = match ? Number(match[1]) : 0;
  return `${PRACTICE_SHUFFLE_SESSION_PREFIX}-${currentIndex + 1}`;
}

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  answerXpAwardedKey: null,
  activeQuestionId: null,
  answeredQuestionIds: [],
  selectedOptionId: null,
  shuffleSessionId: `${PRACTICE_SHUFFLE_SESSION_PREFIX}-0`,
  markAnswerXpAwarded: (awardKey) => set({ answerXpAwardedKey: awardKey }),
  selectOption: (questionId, optionId) =>
    set({ activeQuestionId: questionId, selectedOptionId: optionId }),
  startSession: (questionId = null) =>
    set((state) => ({
      answerXpAwardedKey: null,
      activeQuestionId: questionId,
      answeredQuestionIds: [],
      selectedOptionId: null,
      shuffleSessionId: nextPracticeShuffleSessionId(state.shuffleSessionId),
    })),
  resetSelection: () => set({ selectedOptionId: null }),
  advanceQuestion: () =>
    set((state) => {
      const answeredQuestionIds =
        state.activeQuestionId && !state.answeredQuestionIds.includes(state.activeQuestionId)
          ? [...state.answeredQuestionIds, state.activeQuestionId]
          : state.answeredQuestionIds;

      return {
        answerXpAwardedKey: null,
        activeQuestionId: null,
        answeredQuestionIds,
        selectedOptionId: null,
        shuffleSessionId: nextPracticeShuffleSessionId(state.shuffleSessionId),
      };
    }),
}));
