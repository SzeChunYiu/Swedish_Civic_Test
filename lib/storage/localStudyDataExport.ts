import {
  type PersistedCitizenshipRequirementsChecklist,
  normalizeImportedCitizenshipRequirementsChecklist,
  useCitizenshipRequirementsStore,
} from './citizenshipRequirementsStore';
import {
  type PersistedMistakeReview,
  normalizeImportedMistakeReview,
  useMistakeReviewStore,
} from './mistakeReviewStore';
import {
  type PersistedProgress,
  normalizeImportedProgress,
  useProgressStore,
} from './progressStore';
import { type PersistedReviews, normalizeImportedReviewState, useReviewStore } from './reviewStore';
import {
  type ImportableSettings,
  normalizeImportedSettings,
  useSettingsStore,
} from './settingsStore';
import { LOCAL_STUDY_DATA_IMPORT_VERSION } from './localStudyDataImport';

export type LocalStudyDataExportSnapshot = {
  version: typeof LOCAL_STUDY_DATA_IMPORT_VERSION;
  exportedAt: string;
  source: 'almost-swedish-local-study-data';
  progress: PersistedProgress;
  mistakeReview: PersistedMistakeReview;
  reviews: PersistedReviews;
  settings: ImportableSettings;
  citizenshipRequirements: PersistedCitizenshipRequirementsChecklist;
};

function progressSnapshot(): PersistedProgress {
  const state = useProgressStore.getState();
  return normalizeImportedProgress({
    completedQuestionIds: state.completedQuestionIds,
    questionProgress: state.questionProgress,
    totalXp: state.totalXp,
    answerDates: state.answerDates,
    answerHistory: state.answerHistory,
    dailyChallengeCompletions: state.dailyChallengeCompletions,
    mockExamSessions: state.mockExamSessions,
    streakFreezeState: state.streakFreezeState,
  });
}

function mistakeReviewSnapshot(): PersistedMistakeReview {
  return normalizeImportedMistakeReview({
    wrongAnswerReviews: useMistakeReviewStore.getState().wrongAnswerReviews,
  });
}

function reviewsSnapshot(): PersistedReviews {
  const state = useReviewStore.getState();
  return normalizeImportedReviewState({
    byId: state.byId,
    gradedPerDay: state.gradedPerDay,
  });
}

function settingsSnapshot(): ImportableSettings {
  const state = useSettingsStore.getState();
  return normalizeImportedSettings({
    language: state.language,
    audioEnabled: state.audioEnabled,
    dailyGoalAnswers: state.dailyGoalAnswers,
    includeSupplementaryQuestions: state.includeSupplementaryQuestions,
    hasSeenAboutTheTest: state.hasSeenAboutTheTest,
  });
}

function citizenshipRequirementsSnapshot(): PersistedCitizenshipRequirementsChecklist {
  return normalizeImportedCitizenshipRequirementsChecklist({
    checkedAreaIds: useCitizenshipRequirementsStore.getState().checkedAreaIds,
  });
}

export function buildLocalStudyDataExportSnapshot(
  exportedAt = new Date().toISOString(),
): LocalStudyDataExportSnapshot {
  return {
    version: LOCAL_STUDY_DATA_IMPORT_VERSION,
    exportedAt,
    source: 'almost-swedish-local-study-data',
    progress: progressSnapshot(),
    mistakeReview: mistakeReviewSnapshot(),
    reviews: reviewsSnapshot(),
    settings: settingsSnapshot(),
    citizenshipRequirements: citizenshipRequirementsSnapshot(),
  };
}

export function serializeLocalStudyDataExport(exportedAt?: string): string {
  return JSON.stringify(buildLocalStudyDataExportSnapshot(exportedAt), null, 2);
}
