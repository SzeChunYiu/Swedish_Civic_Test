import {
  importProgressSnapshot,
  normalizeImportedProgress,
  type PersistedProgress,
} from './progressStore';
import {
  importMistakeReviewSnapshot,
  normalizeImportedMistakeReview,
  type PersistedMistakeReview,
} from './mistakeReviewStore';
import {
  importReviewSnapshot,
  normalizeImportedReviewState,
  type PersistedReviews,
} from './reviewStore';
import {
  importSettingsSnapshot,
  normalizeImportedSettings,
  type ImportableSettings,
} from './settingsStore';

export const LOCAL_STUDY_DATA_IMPORT_VERSION = 1;
export const LOCAL_STUDY_DATA_IMPORT_MAX_BYTES = 1024 * 1024;

export type LocalStudyDataImportErrorCode =
  | 'empty_input'
  | 'input_too_large'
  | 'invalid_json'
  | 'invalid_schema'
  | 'unsupported_version'
  | 'purchase_fields_rejected'
  | 'empty_import';

export type LocalStudyDataImportSummary = {
  completedQuestionCount: number;
  bookmarkedQuestionCount: number;
  wrongAnswerReviewCount: number;
  mockExamSessionCount: number;
  streakFreezeStateIncluded: boolean;
  fsrsReviewCardCount: number;
  gradedReviewDayCount: number;
  settingCount: number;
};

export type LocalStudyDataImportPreview = {
  progress: PersistedProgress;
  mistakeReview: PersistedMistakeReview;
  reviews: PersistedReviews;
  settings: ImportableSettings;
  sections: {
    progress: boolean;
    mistakeReview: boolean;
    reviews: boolean;
    settings: boolean;
    streakFreezeState: boolean;
  };
  summary: LocalStudyDataImportSummary;
};

export type LocalStudyDataImportResult =
  | { ok: true; preview: LocalStudyDataImportPreview }
  | {
      ok: false;
      code: LocalStudyDataImportErrorCode;
      detail?: string;
    };

const allowedTopLevelKeys = new Set([
  'appVersion',
  'exportedAt',
  'exportedFrom',
  'fsrsReviews',
  'gradedPerDay',
  'mistakeReview',
  'mistakeReviews',
  'progress',
  'reviewCards',
  'reviews',
  'schemaVersion',
  'settings',
  'source',
  'version',
  'wrongAnswerReviews',
]);
const forbiddenPurchaseKeyFragments = [
  'adsdisabled',
  'adfree',
  'entitlement',
  'iap',
  'productid',
  'purchase',
  'receipt',
  'removeads',
  'subscription',
  'transaction',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

function findForbiddenPurchaseField(value: unknown, path: string[] = []): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findForbiddenPurchaseField(value[index], [...path, String(index)]);
      if (nestedPath) return nestedPath;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (forbiddenPurchaseKeyFragments.some((fragment) => normalizedKey.includes(fragment))) {
      return [...path, key].join('.');
    }

    const nestedPath = findForbiddenPurchaseField(nestedValue, [...path, key]);
    if (nestedPath) return nestedPath;
  }

  return null;
}

function hasOnlyAllowedTopLevelKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedTopLevelKeys.has(key));
}

function readVersion(value: Record<string, unknown>): unknown {
  return value.version ?? value.schemaVersion;
}

function readProgressSection(value: Record<string, unknown>): unknown {
  return value.progress;
}

function readMistakeReviewSection(value: Record<string, unknown>): unknown {
  if (value.mistakeReview !== undefined) return normalizeWrongAnswerReviewIds(value.mistakeReview);
  if (value.mistakeReviews !== undefined)
    return normalizeWrongAnswerReviewIds(value.mistakeReviews);
  if (value.wrongAnswerReviews !== undefined) {
    return normalizeWrongAnswerReviewIds({ wrongAnswerReviews: value.wrongAnswerReviews });
  }
  return undefined;
}

function normalizeWrongAnswerReviewIds(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.wrongAnswerReviews)) return value;

  const wrongAnswerReviews = Object.fromEntries(
    Object.entries(value.wrongAnswerReviews).map(([questionId, review]) => [
      questionId,
      isRecord(review) ? { ...review, questionId } : review,
    ]),
  );
  return { ...value, wrongAnswerReviews };
}

function readReviewSection(value: Record<string, unknown>): unknown {
  if (value.reviews !== undefined) return value.reviews;
  if (value.fsrsReviews !== undefined) return value.fsrsReviews;
  if (value.reviewCards !== undefined) {
    return { byId: value.reviewCards, gradedPerDay: value.gradedPerDay };
  }
  return undefined;
}

function readSettingsSection(value: Record<string, unknown>): unknown {
  return value.settings;
}

function hasOwnKey(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function countImportedSettings(settings: ImportableSettings): number {
  return Object.values(settings).filter((value) => value !== undefined).length;
}

function buildSummary(
  progress: PersistedProgress,
  mistakeReview: PersistedMistakeReview,
  reviews: PersistedReviews,
  settings: ImportableSettings,
  sections: LocalStudyDataImportPreview['sections'],
): LocalStudyDataImportSummary {
  return {
    completedQuestionCount: sections.progress ? progress.completedQuestionIds.length : 0,
    bookmarkedQuestionCount: sections.progress
      ? Object.values(progress.questionProgress).filter((item) => item.bookmarked === true).length
      : 0,
    wrongAnswerReviewCount: sections.mistakeReview
      ? Object.keys(mistakeReview.wrongAnswerReviews).length
      : 0,
    mockExamSessionCount: sections.progress ? progress.mockExamSessions.length : 0,
    streakFreezeStateIncluded: sections.streakFreezeState,
    fsrsReviewCardCount: sections.reviews ? Object.keys(reviews.byId).length : 0,
    gradedReviewDayCount: sections.reviews ? Object.keys(reviews.gradedPerDay).length : 0,
    settingCount: sections.settings ? countImportedSettings(settings) : 0,
  };
}

function hasImportableData(summary: LocalStudyDataImportSummary): boolean {
  return (
    summary.completedQuestionCount > 0 ||
    summary.bookmarkedQuestionCount > 0 ||
    summary.wrongAnswerReviewCount > 0 ||
    summary.mockExamSessionCount > 0 ||
    summary.streakFreezeStateIncluded ||
    summary.fsrsReviewCardCount > 0 ||
    summary.gradedReviewDayCount > 0 ||
    summary.settingCount > 0
  );
}

function isWithinImportPayloadSizeLimit(value: string): boolean {
  if (value.length > LOCAL_STUDY_DATA_IMPORT_MAX_BYTES) return false;

  let byteCount = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code <= 0x7f) {
      byteCount += 1;
    } else if (code <= 0x7ff) {
      byteCount += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const nextCode = value.charCodeAt(index + 1);
      byteCount += nextCode >= 0xdc00 && nextCode <= 0xdfff ? 4 : 3;
      if (nextCode >= 0xdc00 && nextCode <= 0xdfff) index += 1;
    } else {
      byteCount += 3;
    }

    if (byteCount > LOCAL_STUDY_DATA_IMPORT_MAX_BYTES) return false;
  }

  return true;
}

export function previewLocalStudyDataImport(rawText: string): LocalStudyDataImportResult {
  if (!isWithinImportPayloadSizeLimit(rawText)) return { ok: false, code: 'input_too_large' };

  const trimmedText = rawText.trim();
  if (!trimmedText) return { ok: false, code: 'empty_input' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedText);
  } catch {
    return { ok: false, code: 'invalid_json' };
  }

  if (!isRecord(parsed)) return { ok: false, code: 'invalid_schema' };

  const forbiddenField = findForbiddenPurchaseField(parsed);
  if (forbiddenField) {
    return { ok: false, code: 'purchase_fields_rejected', detail: forbiddenField };
  }
  if (!hasOnlyAllowedTopLevelKeys(parsed)) return { ok: false, code: 'invalid_schema' };
  if (readVersion(parsed) !== LOCAL_STUDY_DATA_IMPORT_VERSION) {
    return { ok: false, code: 'unsupported_version' };
  }

  const progressInput = readProgressSection(parsed);
  const mistakeReviewInput = readMistakeReviewSection(parsed);
  const reviewInput = readReviewSection(parsed);
  const settingsInput = readSettingsSection(parsed);
  const sections = {
    progress: progressInput !== undefined,
    mistakeReview: mistakeReviewInput !== undefined,
    reviews: reviewInput !== undefined,
    settings: settingsInput !== undefined,
    streakFreezeState: isRecord(progressInput) && hasOwnKey(progressInput, 'streakFreezeState'),
  };

  const preview: LocalStudyDataImportPreview = {
    progress: normalizeImportedProgress(progressInput),
    mistakeReview: normalizeImportedMistakeReview(mistakeReviewInput),
    reviews: normalizeImportedReviewState(reviewInput),
    settings: normalizeImportedSettings(settingsInput),
    sections,
    summary: {
      completedQuestionCount: 0,
      bookmarkedQuestionCount: 0,
      wrongAnswerReviewCount: 0,
      mockExamSessionCount: 0,
      streakFreezeStateIncluded: false,
      fsrsReviewCardCount: 0,
      gradedReviewDayCount: 0,
      settingCount: 0,
    },
  };
  preview.summary = buildSummary(
    preview.progress,
    preview.mistakeReview,
    preview.reviews,
    preview.settings,
    preview.sections,
  );

  if (!hasImportableData(preview.summary)) return { ok: false, code: 'empty_import' };

  return { ok: true, preview };
}

export function applyLocalStudyDataImport(
  preview: LocalStudyDataImportPreview,
): LocalStudyDataImportSummary {
  if (preview.sections.progress) importProgressSnapshot(preview.progress);
  if (preview.sections.mistakeReview) importMistakeReviewSnapshot(preview.mistakeReview);
  if (preview.sections.reviews) importReviewSnapshot(preview.reviews);
  if (preview.sections.settings) importSettingsSnapshot(preview.settings);

  return preview.summary;
}
