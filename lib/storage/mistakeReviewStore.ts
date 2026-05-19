import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export type MistakeAnswerReview = {
  answeredAt: string;
  questionId: string;
  selectedOptionTextEn: string;
  selectedOptionTextSv: string;
};

const mistakeReviewStateKey = 'mistakeReviewState';

let mistakeReviewStorage: MMKV | null = null;

try {
  mistakeReviewStorage = createMMKV({ id: 'mistake-review' });
} catch {
  mistakeReviewStorage = null;
}

type PersistedMistakeReview = {
  wrongAnswerReviews: Record<string, MistakeAnswerReview>;
};

const emptyMistakeReview: PersistedMistakeReview = {
  wrongAnswerReviews: {},
};

function normalizeMistakeReview(value: unknown): PersistedMistakeReview {
  if (!value || typeof value !== 'object') return emptyMistakeReview;

  const candidate = value as Partial<PersistedMistakeReview>;
  const wrongAnswerReviews: Record<string, MistakeAnswerReview> = {};

  if (candidate.wrongAnswerReviews && typeof candidate.wrongAnswerReviews === 'object') {
    for (const [questionId, review] of Object.entries(candidate.wrongAnswerReviews)) {
      if (!review || typeof review !== 'object') continue;

      const item = review as Partial<MistakeAnswerReview>;
      if (
        typeof item.answeredAt !== 'string' ||
        typeof item.selectedOptionTextEn !== 'string' ||
        typeof item.selectedOptionTextSv !== 'string'
      ) {
        continue;
      }

      wrongAnswerReviews[questionId] = {
        answeredAt: item.answeredAt,
        questionId,
        selectedOptionTextEn: item.selectedOptionTextEn,
        selectedOptionTextSv: item.selectedOptionTextSv,
      };
    }
  }

  return { wrongAnswerReviews };
}

function readMistakeReview(): PersistedMistakeReview {
  const rawReview = mistakeReviewStorage?.getString(mistakeReviewStateKey);
  if (!rawReview) return emptyMistakeReview;

  try {
    return normalizeMistakeReview(JSON.parse(rawReview));
  } catch {
    return emptyMistakeReview;
  }
}

function writeMistakeReview(review: PersistedMistakeReview): void {
  mistakeReviewStorage?.set(mistakeReviewStateKey, JSON.stringify(review));
}

type MistakeReviewState = PersistedMistakeReview & {
  clearWrongAnswerReviews: () => void;
  recordWrongAnswerReview: (review: {
    questionId: string;
    selectedOptionTextEn: string;
    selectedOptionTextSv: string;
  }) => void;
};

const initialMistakeReview = readMistakeReview();

export const useMistakeReviewStore = create<MistakeReviewState>((set) => ({
  ...initialMistakeReview,
  clearWrongAnswerReviews: () => {
    writeMistakeReview(emptyMistakeReview);
    set(emptyMistakeReview);
  },
  recordWrongAnswerReview: ({ questionId, selectedOptionTextEn, selectedOptionTextSv }) =>
    set((state) => {
      const nextReview = {
        wrongAnswerReviews: {
          ...state.wrongAnswerReviews,
          [questionId]: {
            answeredAt: new Date().toISOString(),
            questionId,
            selectedOptionTextEn,
            selectedOptionTextSv,
          },
        },
      };
      writeMistakeReview(nextReview);

      return nextReview;
    }),
}));
