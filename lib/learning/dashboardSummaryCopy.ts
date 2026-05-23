export type DashboardSummaryLanguage = 'sv' | 'en';

type DashboardSummaryCounts = {
  chapters: number;
  questions: number;
  unresolved: number;
};

function englishNoun(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function formatDashboardAnswerCount(language: DashboardSummaryLanguage, count: number) {
  return language === 'sv'
    ? `${count} svar`
    : `${count} ${englishNoun(count, 'answer', 'answers')}`;
}

export function formatDashboardActiveDayCount(language: DashboardSummaryLanguage, count: number) {
  return language === 'sv'
    ? `${count} ${count === 1 ? 'aktiv dag' : 'aktiva dagar'}`
    : `${count} active ${englishNoun(count, 'day', 'days')}`;
}

export function formatDashboardMockExamCount(language: DashboardSummaryLanguage, count: number) {
  return language === 'sv'
    ? `${count} övningsprov`
    : `${count} mock ${englishNoun(count, 'exam', 'exams')}`;
}

export function formatDashboardStreakCount(language: DashboardSummaryLanguage, count: number) {
  return language === 'sv'
    ? `${count} ${count === 1 ? 'dags svit' : 'dagars svit'}`
    : `${count}-day streak`;
}

function formatSwedishSummarySegments({ chapters, questions, unresolved }: DashboardSummaryCounts) {
  return {
    chapters: `${chapters} kapitel ${chapters === 1 ? 'provat' : 'provade'}`,
    questions: `${questions} svar den här veckan`,
    unresolved: `${unresolved} ${unresolved === 1 ? 'olöst misstag' : 'olösta misstag'}`,
  };
}

function formatEnglishSummarySegments({ chapters, questions, unresolved }: DashboardSummaryCounts) {
  return {
    chapters: `${chapters} ${englishNoun(chapters, 'chapter', 'chapters')} tried`,
    questions: `${questions} ${englishNoun(questions, 'answer', 'answers')} this week`,
    unresolved: `${unresolved} unresolved ${englishNoun(unresolved, 'mistake', 'mistakes')}`,
  };
}

function formatDashboardSummarySegments(
  language: DashboardSummaryLanguage,
  counts: DashboardSummaryCounts,
) {
  return language === 'sv'
    ? formatSwedishSummarySegments(counts)
    : formatEnglishSummarySegments(counts);
}

export function formatDashboardSummaryLine(
  language: DashboardSummaryLanguage,
  questions: number,
  chapters: number,
  unresolved: number,
) {
  const segments = formatDashboardSummarySegments(language, { chapters, questions, unresolved });

  return `${segments.questions} · ${segments.chapters} · ${segments.unresolved}`;
}

export function formatDashboardSummaryAccessibilityLabel(
  language: DashboardSummaryLanguage,
  questions: number,
  chapters: number,
  unresolved: number,
) {
  const segments = formatDashboardSummarySegments(language, { chapters, questions, unresolved });
  const prefix = language === 'sv' ? 'Framstegsöversikt' : 'Progress dashboard';

  return `${prefix}: ${segments.questions}, ${segments.chapters}, ${segments.unresolved}.`;
}
