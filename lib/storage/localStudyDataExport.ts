import {
  LOCAL_STUDY_DATA_IMPORT_VERSION,
  type LocalStudyDataImportSummary,
  previewLocalStudyDataImport,
} from './localStudyDataImport';
import {
  getMistakeReviewSnapshot,
  normalizeImportedMistakeReview,
  type PersistedMistakeReview,
} from './mistakeReviewStore';
import {
  getProgressSnapshot,
  normalizeImportedProgress,
  type PersistedProgress,
} from './progressStore';
import {
  getReviewSnapshot,
  normalizeImportedReviewState,
  type PersistedReviews,
} from './reviewStore';
import {
  getImportableSettingsSnapshot,
  normalizeImportedSettings,
  type ImportableSettings,
} from './settingsStore';

export const LOCAL_STUDY_DATA_EXPORT_SOURCE = 'swedish-civic-test-local-study-data';
export const LOCAL_STUDY_DATA_EXPORT_VERSION = LOCAL_STUDY_DATA_IMPORT_VERSION;
export const LOCAL_STUDY_DATA_EXPORT_FORBIDDEN_KEY_FRAGMENTS = [
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
] as const;

export type LocalStudyDataExportSnapshot = {
  version: typeof LOCAL_STUDY_DATA_EXPORT_VERSION;
  exportedAt: string;
  exportedFrom: typeof LOCAL_STUDY_DATA_EXPORT_SOURCE;
  progress: PersistedProgress;
  mistakeReview: PersistedMistakeReview;
  reviews: PersistedReviews;
  settings: ImportableSettings;
};

export type LocalStudyDataExportInput = {
  exportedAt?: string;
  mistakeReview?: unknown;
  progress?: unknown;
  reviews?: unknown;
  settings?: unknown;
};

function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

function findForbiddenExportKey(value: unknown, path: string[] = []): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findForbiddenExportKey(value[index], [...path, String(index)]);
      if (nestedPath) return nestedPath;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (
      LOCAL_STUDY_DATA_EXPORT_FORBIDDEN_KEY_FRAGMENTS.some((fragment) =>
        normalizedKey.includes(fragment),
      )
    ) {
      return [...path, key].join('.');
    }

    const nestedPath = findForbiddenExportKey(nestedValue, [...path, key]);
    if (nestedPath) return nestedPath;
  }

  return null;
}

function assertExportHasNoPurchaseFields(snapshot: LocalStudyDataExportSnapshot): void {
  const forbiddenKey = findForbiddenExportKey(snapshot);
  if (forbiddenKey) {
    throw new Error(`Local study data export blocked forbidden field: ${forbiddenKey}`);
  }
}

function assertExportCanPreview(
  snapshot: LocalStudyDataExportSnapshot,
): LocalStudyDataImportSummary {
  const preview = previewLocalStudyDataImport(JSON.stringify(snapshot));
  if (!preview.ok) {
    throw new Error(`Local study data export did not pass import preview: ${preview.code}`);
  }
  return preview.preview.summary;
}

export function buildLocalStudyDataExportSnapshot(
  input: LocalStudyDataExportInput = {},
): LocalStudyDataExportSnapshot {
  const snapshot: LocalStudyDataExportSnapshot = {
    version: LOCAL_STUDY_DATA_EXPORT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    exportedFrom: LOCAL_STUDY_DATA_EXPORT_SOURCE,
    progress: normalizeImportedProgress(input.progress ?? getProgressSnapshot()),
    mistakeReview: normalizeImportedMistakeReview(
      input.mistakeReview ?? getMistakeReviewSnapshot(),
    ),
    reviews: normalizeImportedReviewState(input.reviews ?? getReviewSnapshot()),
    settings: normalizeImportedSettings(input.settings ?? getImportableSettingsSnapshot()),
  };

  assertExportHasNoPurchaseFields(snapshot);
  assertExportCanPreview(snapshot);
  return snapshot;
}

export function serializeLocalStudyDataExport(input: LocalStudyDataExportInput = {}): string {
  return `${JSON.stringify(buildLocalStudyDataExportSnapshot(input), null, 2)}\n`;
}

export function buildLocalStudyDataExportFilename(now = new Date()): string {
  return `swedish-civic-test-study-data-${now.toISOString().slice(0, 10)}.json`;
}
