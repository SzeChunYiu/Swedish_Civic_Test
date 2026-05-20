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

export type PersistedMistakeReview = {
  wrongAnswerReviews: Record<string, MistakeAnswerReview>;
};

const emptyMistakeReview: PersistedMistakeReview = {
  wrongAnswerReviews: {},
};

const maxSelectedAnswerTextLength = 500;

function normalizeQuestionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const questionId = value.trim();
  return questionId.length > 0 ? questionId : null;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function normalizeSelectedAnswerText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > maxSelectedAnswerTextLength) return null;
  return text;
}

function normalizeMistakeReview(value: unknown): PersistedMistakeReview {
  if (!value || typeof value !== 'object') return emptyMistakeReview;

  const candidate = value as Partial<PersistedMistakeReview>;
  const wrongAnswerReviews: Record<string, MistakeAnswerReview> = {};

  if (candidate.wrongAnswerReviews && typeof candidate.wrongAnswerReviews === 'object') {
    for (const [questionId, review] of Object.entries(candidate.wrongAnswerReviews)) {
      if (!review || typeof review !== 'object') continue;

      const item = review as Partial<MistakeAnswerReview>;
      const safeQuestionId = normalizeQuestionId(questionId);
      const selectedOptionTextEn = normalizeSelectedAnswerText(item.selectedOptionTextEn);
      const selectedOptionTextSv = normalizeSelectedAnswerText(item.selectedOptionTextSv);
      if (!safeQuestionId || item.questionId !== safeQuestionId) continue;
      if (!isIsoTimestamp(item.answeredAt)) continue;
      if (!selectedOptionTextEn || !selectedOptionTextSv) continue;

      wrongAnswerReviews[safeQuestionId] = {
        answeredAt: item.answeredAt,
        questionId: safeQuestionId,
        selectedOptionTextEn,
        selectedOptionTextSv,
      };
    }
  }

  return { wrongAnswerReviews };
}

export function normalizeImportedMistakeReview(value: unknown): PersistedMistakeReview {
  return normalizeMistakeReview(value);
}

function readMistakeReview(): PersistedMistakeReview {
  let rawReview: string | undefined;
  try {
    rawReview = mistakeReviewStorage?.getString(mistakeReviewStateKey);
  } catch {
    return emptyMistakeReview;
  }

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

export function importMistakeReviewSnapshot(value: unknown): PersistedMistakeReview {
  const importedReview = normalizeImportedMistakeReview(value);
  const nextReview = mergeMistakeReview(useMistakeReviewStore.getState(), importedReview);
  writeMistakeReview(nextReview);
  useMistakeReviewStore.setState(nextReview);
  return nextReview;
}
