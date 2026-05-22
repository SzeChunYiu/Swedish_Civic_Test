import type { LocalStudyDataImportSummary } from './localStudyDataImport';

export type ImportSummaryCountLabels = {
  one: string;
  other: string;
};

export type LocalStudyDataImportSummaryCopy = {
  importSummaryAccessibility: (count: number) => string;
  importSummaryBookmarks: (count: number) => string;
  importSummaryCitizenshipRequirements: (count: number) => string;
  importSummaryCompanion: (count: number) => string;
  importSummaryCompletedQuestions: (count: number) => string;
  importSummaryFsrsCards: (count: number) => string;
  importSummaryFsrsDays: (count: number) => string;
  importSummaryHighlights: (count: number) => string;
  importSummaryMockExams: (count: number) => string;
  importSummarySettings: (count: number) => string;
  importSummaryStreakFreeze: string;
  importSummaryWrongAnswers: (count: number) => string;
};

export function formatImportSummaryCount(count: number, labels: ImportSummaryCountLabels): string {
  return `${count} ${count === 1 ? labels.one : labels.other}`;
}

function addPositiveImportSummaryLine(
  lines: string[],
  count: number,
  formatLine: (count: number) => string,
) {
  if (count > 0) lines.push(formatLine(count));
}

export function buildLocalStudyDataImportSummaryLines(
  copy: LocalStudyDataImportSummaryCopy,
  summary: LocalStudyDataImportSummary,
): string[] {
  const lines: string[] = [];

  addPositiveImportSummaryLine(
    lines,
    summary.completedQuestionCount,
    copy.importSummaryCompletedQuestions,
  );
  addPositiveImportSummaryLine(lines, summary.bookmarkedQuestionCount, copy.importSummaryBookmarks);
  addPositiveImportSummaryLine(
    lines,
    summary.wrongAnswerReviewCount,
    copy.importSummaryWrongAnswers,
  );
  addPositiveImportSummaryLine(lines, summary.mockExamSessionCount, copy.importSummaryMockExams);
  addPositiveImportSummaryLine(lines, summary.fsrsReviewCardCount, copy.importSummaryFsrsCards);
  addPositiveImportSummaryLine(lines, summary.gradedReviewDayCount, copy.importSummaryFsrsDays);
  addPositiveImportSummaryLine(lines, summary.highlightCount, copy.importSummaryHighlights);
  addPositiveImportSummaryLine(lines, summary.settingCount, copy.importSummarySettings);
  addPositiveImportSummaryLine(
    lines,
    summary.accessibilityPreferenceCount,
    copy.importSummaryAccessibility,
  );
  addPositiveImportSummaryLine(
    lines,
    summary.companionPreferenceCount,
    copy.importSummaryCompanion,
  );
  addPositiveImportSummaryLine(
    lines,
    summary.citizenshipRequirementChecklistCount,
    copy.importSummaryCitizenshipRequirements,
  );
  if (summary.streakFreezeStateIncluded) lines.push(copy.importSummaryStreakFreeze);

  return lines;
}
