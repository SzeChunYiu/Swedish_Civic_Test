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
  importHighlightsSnapshot,
  normalizeHighlightsState,
  type PersistedHighlights,
} from './highlightsStore';
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
import {
  importCitizenshipRequirementsChecklistSnapshot,
  normalizeImportedCitizenshipRequirementsChecklist,
  type PersistedCitizenshipRequirementsChecklist,
} from './citizenshipRequirementsStore';

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
  citizenshipRequirementChecklistCount: number;
  highlightCount: number;
};

export type LocalStudyDataImportPreview = {
  progress: PersistedProgress;
  mistakeReview: PersistedMistakeReview;
  reviews: PersistedReviews;
  settings: ImportableSettings;
  citizenshipRequirements: PersistedCitizenshipRequirementsChecklist;
  highlights: PersistedHighlights;
  sections: {
    progress: boolean;
    mistakeReview: boolean;
    reviews: boolean;
    settings: boolean;
    streakFreezeState: boolean;
    citizenshipRequirements: boolean;
    highlights: boolean;
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
  'citizenshipRequirements',
  'citizenshipRequirementsChecklist',
  'exportedAt',
  'exportedFrom',
  'fsrsReviews',
  'gradedPerDay',
  'highlights',
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
const localStudyDataImportDetailHeadSegments = 3;
const localStudyDataImportDetailTailSegments = 2;
const localStudyDataImportDetailMaxSegmentChars = 48;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

function appendImportPathSegment(path: string, segment: string): string {
  return path ? `${path}.${segment}` : segment;
}

function formatImportDetailSegment(segment: string): string {
  if (segment.length <= localStudyDataImportDetailMaxSegmentChars) return segment;

  return `${segment.slice(0, 28)}...${segment.slice(-12)}`;
}

export function formatLocalStudyDataImportErrorDetail(detail?: string): string | null {
  const segments = String(detail ?? '')
    .split('.')
    .filter(Boolean)
    .map(formatImportDetailSegment);

  if (segments.length === 0) return null;

  const maxVisibleSegments =
    localStudyDataImportDetailHeadSegments + localStudyDataImportDetailTailSegments + 1;
  if (segments.length <= maxVisibleSegments) return segments.join('.');

  return [
    ...segments.slice(0, localStudyDataImportDetailHeadSegments),
    '[...]',
    ...segments.slice(-localStudyDataImportDetailTailSegments),
  ].join('.');
}

function findForbiddenPurchaseField(value: unknown): string | null {
  const stack: Array<{ value: unknown; path: string }> = [{ value, path: '' }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: current.value[index],
          path: appendImportPathSegment(current.path, String(index)),
        });
      }
      continue;
    }

    if (!isRecord(current.value)) continue;

    const entries = Object.entries(current.value);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, nestedValue] = entries[index];
      const nestedPath = appendImportPathSegment(current.path, key);
      const normalizedKey = normalizeKey(key);
      if (forbiddenPurchaseKeyFragments.some((fragment) => normalizedKey.includes(fragment))) {
        return nestedPath;
      }

      stack.push({ value: nestedValue, path: nestedPath });
    }
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

function readCitizenshipRequirementsSection(value: Record<string, unknown>): unknown {
  if (value.citizenshipRequirements !== undefined) return value.citizenshipRequirements;
  if (value.citizenshipRequirementsChecklist !== undefined) {
    return value.citizenshipRequirementsChecklist;
  }
  return undefined;
}

function readHighlightsSection(value: Record<string, unknown>): unknown {
  return value.highlights;
}

function hasOwnKey(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function countImportedSettings(settings: ImportableSettings): number {
  return Object.values(settings).filter((value) => value !== undefined).length;
}

function countImportedHighlights(highlights: PersistedHighlights): number {
  return Object.values(highlights.byChapter).reduce((count, list) => count + list.length, 0);
}

function buildSummary(
  progress: PersistedProgress,
  mistakeReview: PersistedMistakeReview,
  reviews: PersistedReviews,
  settings: ImportableSettings,
  citizenshipRequirements: PersistedCitizenshipRequirementsChecklist,
  highlights: PersistedHighlights,
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
    citizenshipRequirementChecklistCount: sections.citizenshipRequirements
      ? citizenshipRequirements.checkedAreaIds.length
      : 0,
    highlightCount: sections.highlights ? countImportedHighlights(highlights) : 0,
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
    summary.settingCount > 0 ||
    summary.citizenshipRequirementChecklistCount > 0 ||
    summary.highlightCount > 0
  );
}

export function getLocalStudyDataImportPayloadByteCount(value: string): number {
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
  }

  return byteCount;
}

function isWithinImportPayloadSizeLimit(value: string): boolean {
  if (value.length > LOCAL_STUDY_DATA_IMPORT_MAX_BYTES) return false;

  return getLocalStudyDataImportPayloadByteCount(value) <= LOCAL_STUDY_DATA_IMPORT_MAX_BYTES;
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
  const citizenshipRequirementsInput = readCitizenshipRequirementsSection(parsed);
  const highlightsInput = readHighlightsSection(parsed);
  const sections = {
    progress: progressInput !== undefined,
    mistakeReview: mistakeReviewInput !== undefined,
    reviews: reviewInput !== undefined,
    settings: settingsInput !== undefined,
    streakFreezeState: isRecord(progressInput) && hasOwnKey(progressInput, 'streakFreezeState'),
    citizenshipRequirements: citizenshipRequirementsInput !== undefined,
    highlights: highlightsInput !== undefined,
  };

  const preview: LocalStudyDataImportPreview = {
    progress: normalizeImportedProgress(progressInput),
    mistakeReview: normalizeImportedMistakeReview(mistakeReviewInput),
    reviews: normalizeImportedReviewState(reviewInput),
    settings: normalizeImportedSettings(settingsInput),
    citizenshipRequirements: normalizeImportedCitizenshipRequirementsChecklist(
      citizenshipRequirementsInput,
    ),
    highlights: normalizeHighlightsState(highlightsInput),
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
      citizenshipRequirementChecklistCount: 0,
      highlightCount: 0,
    },
  };
  preview.summary = buildSummary(
    preview.progress,
    preview.mistakeReview,
    preview.reviews,
    preview.settings,
    preview.citizenshipRequirements,
    preview.highlights,
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
  if (preview.sections.citizenshipRequirements) {
    importCitizenshipRequirementsChecklistSnapshot(preview.citizenshipRequirements);
  }
  if (preview.sections.highlights) importHighlightsSnapshot(preview.highlights);

  return preview.summary;
}
