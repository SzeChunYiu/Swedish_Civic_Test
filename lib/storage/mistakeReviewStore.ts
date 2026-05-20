import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { writeRecoverably } from './persistenceWarning';

export type MistakeAnswerReview = {
  answeredAt: string;
  questionId: string;
  selectedOptionTextEn: string;
  selectedOptionTextSv: string;
};

const mistakeReviewStateKey = 'mistakeReviewState';
const mistakeReviewStorageId = 'mistake-review';

let mistakeReviewStorage: MMKV | null = null;

try {
  mistakeReviewStorage = createMMKV({ id: mistakeReviewStorageId });
} catch {
  mistakeReviewStorage = null;
}

export type PersistedMistakeReview = {
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

export function normalizeImportedMistakeReview(value: unknown): PersistedMistakeReview {
  return normalizeMistakeReview(value);
}

function readMistakeReview(): PersistedMistakeReview {
  try {
    const rawReview = mistakeReviewStorage?.getString(mistakeReviewStateKey);
    if (!rawReview) return emptyMistakeReview;

    return normalizeMistakeReview(JSON.parse(rawReview));
  } catch {
    return emptyMistakeReview;
  }
}

function writeMistakeReview(review: PersistedMistakeReview): RecoverablePersistenceWarning | null {
  return writeRecoverably(
    mistakeReviewStorage,
    mistakeReviewStorageId,
    mistakeReviewStateKey,
    JSON.stringify(review),
  );
}

function mergeMistakeReview(
  current: PersistedMistakeReview,
  imported: PersistedMistakeReview,
): PersistedMistakeReview {
  const wrongAnswerReviews = { ...current.wrongAnswerReviews };
  for (const [questionId, importedReview] of Object.entries(imported.wrongAnswerReviews)) {
    const currentReview = wrongAnswerReviews[questionId];
    if (!currentReview || importedReview.answeredAt >= currentReview.answeredAt) {
      wrongAnswerReviews[questionId] = importedReview;
    }
  }

  return { wrongAnswerReviews };
}

type MistakeReviewState = PersistedMistakeReview & {
  persistenceWarning: RecoverablePersistenceWarning | null;
  clearWrongAnswerReviews: () => void;
  recordWrongAnswerReview: (review: {
    questionId: string;
    selectedOptionTextEn: string;
    selectedOptionTextSv: string;
  }) => void;
  clearPersistenceWarning: () => void;
};

const initialMistakeReview = readMistakeReview();

export const useMistakeReviewStore = create<MistakeReviewState>((set) => ({
  ...initialMistakeReview,
  persistenceWarning: null,
  clearWrongAnswerReviews: () => {
    const persistenceWarning = writeMistakeReview(emptyMistakeReview);
    set({ ...emptyMistakeReview, persistenceWarning });
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
      const persistenceWarning = writeMistakeReview(nextReview);

      return { ...nextReview, persistenceWarning };
    }),
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

export function importMistakeReviewSnapshot(value: unknown): PersistedMistakeReview {
  const importedReview = normalizeImportedMistakeReview(value);
  const nextReview = mergeMistakeReview(useMistakeReviewStore.getState(), importedReview);
  writeMistakeReview(nextReview);
  useMistakeReviewStore.setState(nextReview);
  return nextReview;
}
