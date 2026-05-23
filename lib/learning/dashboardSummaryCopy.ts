export type DashboardSummaryLanguage = 'sv' | 'en';

type DashboardSummaryCounts = {
  chapters: number;
  questions: number;
  unresolved: number;
};

function englishNoun(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function swedishActiveDay(count: number) {
  return count === 1 ? 'aktiv dag' : 'aktiva dagar';
}

function swedishStreakDay(count: number) {
  return count === 1 ? 'dags svit' : 'dagars svit';
}

function englishCount(count: number, singular: string, plural: string) {
  return `${count} ${englishNoun(count, singular, plural)}`;
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

export function formatDashboardActivityDayLabel(
  language: DashboardSummaryLanguage,
  date: string,
  answers: number,
) {
  const answerText =
    language === 'sv' ? `${answers} svar` : englishCount(answers, 'answer', 'answers');
  return `${date}: ${answerText}`;
}

export function formatDashboardActivitySummary(
  language: DashboardSummaryLanguage,
  totalAnswers: number,
  activeDays: number,
  maxDayCount: number,
) {
  if (language === 'sv') {
    return `${totalAnswers} svar under perioden. ${activeDays} ${swedishActiveDay(activeDays)}. Högsta dag: ${maxDayCount} svar.`;
  }

  return `${englishCount(totalAnswers, 'answer', 'answers')} in this period. ${englishCount(
    activeDays,
    'active day',
    'active days',
  )}. Highest day: ${englishCount(maxDayCount, 'answer', 'answers')}.`;
}

export function formatDashboardStreakMetricLabel(
  language: DashboardSummaryLanguage,
  currentStreak: number,
) {
  return language === 'sv' ? swedishStreakDay(currentStreak) : 'day streak';
}

export function formatDashboardStreakXpSummary(
  language: DashboardSummaryLanguage,
  totalXp: number,
  activeDays: number,
  currentStreak: number,
  level: number,
) {
  if (language === 'sv') {
    return `${totalXp} XP de senaste 30 dagarna. ${activeDays} ${swedishActiveDay(
      activeDays,
    )}. ${currentStreak} ${swedishStreakDay(currentStreak)}. Nivå ${level}.`;
  }

  return `${totalXp} XP in the last 30 days. ${englishCount(
    activeDays,
    'active day',
    'active days',
  )}. ${currentStreak} day streak. Level ${level}.`;
}

export function formatDashboardMockHistoryAttemptCount(
  language: DashboardSummaryLanguage,
  count: number,
) {
  return language === 'sv'
    ? `${count} övningsprov`
    : englishCount(count, 'mock exam', 'mock exams');
}

export function formatDashboardMockHistorySummary(
  language: DashboardSummaryLanguage,
  attemptCount: number,
  latestScore: number,
  bestScore: number,
  averageScore: number,
  lowestScore: number,
) {
  const attempts = formatDashboardMockHistoryAttemptCount(language, attemptCount);

  if (language === 'sv') {
    return `${attempts}. Senast ${latestScore}%. Bäst ${bestScore}%. Snitt ${averageScore}%. Lägst ${lowestScore}%.`;
  }

  return `${attempts}. Latest ${latestScore}%. Best ${bestScore}%. Average ${averageScore}%. Lowest ${lowestScore}%.`;
}

export function formatDashboardMockHistoryTrendSummary(
  language: DashboardSummaryLanguage,
  pointCount: number,
  firstScore: number,
  latestScore: number,
) {
  const delta = latestScore - firstScore;

  if (language === 'sv') {
    const trendWindow = pointCount === 1 ? '1 bedömt prov' : `${pointCount} senaste bedömda prov`;
    const unchanged =
      delta === 0
        ? 'oförändrat från äldsta som visas'
        : `${Math.abs(delta)} procentenheter ${delta > 0 ? 'högre' : 'lägre'} än äldsta som visas`;
    return `Resultattrend för ${trendWindow}: senast ${latestScore}%, ${unchanged}.`;
  }

  const attempts = englishNoun(pointCount, 'exam', 'exams');
  if (delta === 0) {
    return `Score trend across ${pointCount} recent scored ${attempts}: latest ${latestScore}%, unchanged from the oldest shown.`;
  }

  return `Score trend across ${pointCount} recent scored ${attempts}: latest ${latestScore}%, ${Math.abs(
    delta,
  )} points ${delta > 0 ? 'higher' : 'lower'} than the oldest shown.`;
}
