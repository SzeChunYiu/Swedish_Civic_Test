import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { isSafeImportedMapKey } from './importKeySafety';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

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
      if (!safeQuestionId || !isSafeImportedMapKey(safeQuestionId)) continue;
      if (item.questionId !== safeQuestionId) continue;
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

function parseMistakeReview(rawReview: string): PersistedMistakeReview {
  return normalizeMistakeReview(JSON.parse(rawReview));
}

function readMistakeReview(): PersistedMistakeReview & {
  persistenceWarning: RecoverablePersistenceWarning | null;
} {
  const readResult = readRecoverably(
    mistakeReviewStorage,
    mistakeReviewStorageId,
    mistakeReviewStateKey,
    () => mistakeReviewStorage?.getString(mistakeReviewStateKey),
  );
  if (!readResult.value) {
    return { ...emptyMistakeReview, persistenceWarning: readResult.warning };
  }

  const parseResult = parseJsonRecoverably(
    readResult.value,
    mistakeReviewStorageId,
    mistakeReviewStateKey,
    parseMistakeReview,
    emptyMistakeReview,
  );
  return { ...parseResult.value, persistenceWarning: parseResult.warning ?? readResult.warning };
}

function writeMistakeReview(review: PersistedMistakeReview): RecoverablePersistenceWarning | null {
  return writeRecoverably(
    mistakeReviewStorage,
    mistakeReviewStorageId,
    mistakeReviewStateKey,
    JSON.stringify(review),
  );
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
  persistenceWarning: initialMistakeReview.persistenceWarning,
  clearWrongAnswerReviews: () => {
    const persistenceWarning = writeMistakeReview(emptyMistakeReview);
    set({ ...emptyMistakeReview, persistenceWarning });
  },
  recordWrongAnswerReview: ({ questionId, selectedOptionTextEn, selectedOptionTextSv }) =>
    set((state) => {
      const safeQuestionId = normalizeQuestionId(questionId);
      const safeSelectedOptionTextEn = normalizeSelectedAnswerText(selectedOptionTextEn);
      const safeSelectedOptionTextSv = normalizeSelectedAnswerText(selectedOptionTextSv);
      if (
        !safeQuestionId ||
        !isSafeImportedMapKey(safeQuestionId) ||
        !safeSelectedOptionTextEn ||
        !safeSelectedOptionTextSv
      ) {
        return state;
      }

      const nextReview = {
        wrongAnswerReviews: {
          ...state.wrongAnswerReviews,
          [safeQuestionId]: {
            answeredAt: new Date().toISOString(),
            questionId: safeQuestionId,
            selectedOptionTextEn: safeSelectedOptionTextEn,
            selectedOptionTextSv: safeSelectedOptionTextSv,
          },
        },
      };
      const persistenceWarning = writeMistakeReview(nextReview);

      return { ...nextReview, persistenceWarning };
    }),
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

export function importMistakeReviewSnapshot(
  review: PersistedMistakeReview,
): RecoverablePersistenceWarning | null {
  const normalizedReview = normalizeImportedMistakeReview(review);
  const persistenceWarning = writeMistakeReview(normalizedReview);
  useMistakeReviewStore.setState({ ...normalizedReview, persistenceWarning });
  return persistenceWarning;
}
