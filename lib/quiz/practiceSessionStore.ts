import { create } from 'zustand';

type PracticeSessionState = {
  answerXpAwardedKey: string | null;
  activeQuestionId: string | null;
  answeredQuestionIds: string[];
  selectedOptionId: string | null;
  shuffleSessionId: string;
  struckOptionIdsByQuestionId: Record<string, string[]>;
  markAnswerXpAwarded: (awardKey: string) => void;
  selectOption: (questionId: string, optionId: string) => void;
  toggleStruckOption: (questionId: string, optionId: string) => void;
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

function withoutQuestionStrikeouts(
  struckOptionIdsByQuestionId: Record<string, string[]>,
  questionId: string | null,
): Record<string, string[]> {
  if (!questionId || !struckOptionIdsByQuestionId[questionId]) return struckOptionIdsByQuestionId;
  const { [questionId]: _removed, ...remainingStrikeouts } = struckOptionIdsByQuestionId;
  return remainingStrikeouts;
}

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  answerXpAwardedKey: null,
  activeQuestionId: null,
  answeredQuestionIds: [],
  selectedOptionId: null,
  shuffleSessionId: `${PRACTICE_SHUFFLE_SESSION_PREFIX}-0`,
  struckOptionIdsByQuestionId: {},
  markAnswerXpAwarded: (awardKey) => set({ answerXpAwardedKey: awardKey }),
  selectOption: (questionId, optionId) =>
    set((state) => {
      if (state.struckOptionIdsByQuestionId[questionId]?.includes(optionId)) {
        return {
          activeQuestionId: questionId,
          selectedOptionId: null,
        };
      }

      return { activeQuestionId: questionId, selectedOptionId: optionId };
    }),
  toggleStruckOption: (questionId, optionId) =>
    set((state) => {
      const currentStrikeouts = state.struckOptionIdsByQuestionId[questionId] ?? [];
      const nextQuestionStrikeouts = currentStrikeouts.includes(optionId)
        ? currentStrikeouts.filter((id) => id !== optionId)
        : [...currentStrikeouts, optionId];
      const struckOptionIdsByQuestionId =
        nextQuestionStrikeouts.length === 0
          ? withoutQuestionStrikeouts(state.struckOptionIdsByQuestionId, questionId)
          : {
              ...state.struckOptionIdsByQuestionId,
              [questionId]: nextQuestionStrikeouts,
            };

      return {
        activeQuestionId: questionId,
        selectedOptionId:
          state.activeQuestionId === questionId &&
          nextQuestionStrikeouts.includes(state.selectedOptionId ?? '')
            ? null
            : state.selectedOptionId,
        struckOptionIdsByQuestionId,
      };
    }),
  resetSelection: () =>
    set((state) => ({
      selectedOptionId: null,
      struckOptionIdsByQuestionId: withoutQuestionStrikeouts(
        state.struckOptionIdsByQuestionId,
        state.activeQuestionId,
      ),
    })),
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
        struckOptionIdsByQuestionId: withoutQuestionStrikeouts(
          state.struckOptionIdsByQuestionId,
          state.activeQuestionId,
        ),
      };
    }),
}));
