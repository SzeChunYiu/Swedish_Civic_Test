import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { MockExamHistoryCard } from '../components/dashboard/MockExamHistoryCard';
import { PerChapterProgressBars } from '../components/dashboard/PerChapterProgressBars';
import { StreakXpSparkline } from '../components/dashboard/StreakXpSparkline';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { RouteLink } from '../components/ui/RouteLink';
import { ScreenShell } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import {
  dailyActivityHistogram,
  dashboardSummary,
  mockHistory,
  perChapterProgress,
  xpSparkline,
} from '../lib/learning/dashboardStats';
import {
  formatDashboardSummaryAccessibilityLabel,
  formatDashboardSummaryLine,
} from '../lib/learning/dashboardSummaryCopy';
import { formatDashboardCompletedDate } from '../lib/learning/dashboardDateFormat';
import { buildDashboardProgressSnapshot } from '../lib/learning/dashboardProgressSnapshot';
import { daysUntil, formatExamDate, isStudyPlanTestDateExpired } from '../lib/learning/examDate';
import { calculateStreakWithFreeze } from '../lib/learning/streakWithFreeze';
import { useProgressStore } from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

const ACTIVITY_DAYS = 53 * 7;
const XP_DAYS = 30;

type DashboardCopy = {
  activity: {
    dayLabel: (date: string, answers: number) => string;
    emptyState: string;
    legend: {
      high: string;
      low: string;
      medium: string;
      none: string;
      title: string;
    };
    summary: (totalAnswers: number, activeDays: number, maxDayCount: number) => string;
    subtitle: string;
    title: string;
  };
  chapterProgress: {
    accuracyLabel: string;
    chapterOrder: string;
    coverageLabel: string;
    emptyState: string;
    linkLabel: (chapterName: string) => string;
    sortAccessibilityLabel: (mode: string) => string;
    sortGroupAccessibilityLabel: string;
    subtitle: string;
    title: string;
    weakestFirst: string;
  };
  eyebrow: string;
  homeLink: string;
  homeLinkAccessibilityLabel: string;
  mockHistory: {
    attemptCount: (count: number) => string;
    averageLabel: string;
    bestLabel: string;
    emptyState: string;
    examLink: string;
    examLinkAccessibilityLabel: string;
    formatCompletedDate: (completedAt: string) => string;
    latestLabel: string;
    lowestLabel: string;
    recentLabel: string;
    scoreLabel: (scorePercent: number, completedDate: string, duration: string | null) => string;
    subtitle: string;
    summary: (
      attemptCount: number,
      latestScore: number,
      bestScore: number,
      averageScore: number,
      lowestScore: number,
    ) => string;
    timeUsedLabel: (duration: string) => string;
    title: string;
    trendLabel: string;
    trendPointAccessibilityLabel: (
      pointIndex: number,
      pointCount: number,
      scorePercent: number,
      completedDate: string,
    ) => string;
    trendSummary: (pointCount: number, firstScore: number, latestScore: number) => string;
  };
  streakXp: {
    emptyState: string;
    levelLabel: string;
    streakLabel: string;
    subtitle: string;
    summary: (totalXp: number, activeDays: number, currentStreak: number, level: number) => string;
    title: string;
  };
  studyPlan: {
    accessibilityLabel: (summary: string) => string;
    badge: string;
    cta: string;
    dateSummary: (daysRemaining: number, dateLabel: string) => string;
    expiredSummary: (dateLabel: string) => string;
    noDateSummary: string;
    title: string;
  };
  subtitle: string;
  summaryAccessibilityLabel: (questions: number, chapters: number, unresolved: number) => string;
  summaryLine: (questions: number, chapters: number, unresolved: number) => string;
  title: string;
};

const dashboardCopy: Record<AppLanguage, DashboardCopy> = {
  sv: {
    activity: {
      dayLabel: (date, answers) => `${date}: ${answers} svar`,
      emptyState: 'Svara på några frågor så byggs din aktivitetskarta här.',
      legend: {
        high: 'Hög aktivitet',
        low: 'Låg aktivitet',
        medium: 'Medelaktivitet',
        none: 'Inga svar',
        title: 'Aktivitetsskala',
      },
      summary: (totalAnswers, activeDays, maxDayCount) =>
        `${totalAnswers} svar under perioden. ${activeDays} aktiva dagar. Högsta dag: ${maxDayCount} svar.`,
      subtitle: 'Varje ruta visar svar under en dag.',
      title: 'Aktiva dagar',
    },
    chapterProgress: {
      accuracyLabel: 'Rätt',
      chapterOrder: 'Kapitelordning',
      coverageLabel: 'Täckning',
      emptyState: 'När du har svarat på frågor visas dina kapitelframsteg här.',
      linkLabel: (chapterName) => `Öppna ${chapterName}`,
      sortAccessibilityLabel: (mode) => `Sortera kapitel: ${mode}`,
      sortGroupAccessibilityLabel: 'Sortera kapitelframsteg',
      subtitle: 'Rätt och täckning visas sida vid sida per kapitel.',
      title: 'Kapitelframsteg',
      weakestFirst: 'Svagast först',
    },
    eyebrow: 'Lokal data',
    homeLink: 'Till startsidan',
    homeLinkAccessibilityLabel: 'Gå tillbaka till startsidan',
    mockHistory: {
      attemptCount: (count) => `${count} övningsprov`,
      averageLabel: 'Snitt',
      bestLabel: 'Bäst',
      emptyState:
        'Genomför ett övningsprov så visas tidigare resultat, tempo och bästa försök här.',
      examLink: 'Gå till övningsprov',
      examLinkAccessibilityLabel: 'Öppna övningsprovet',
      formatCompletedDate: (completedAt) => formatDashboardCompletedDate(completedAt, 'sv'),
      latestLabel: 'Senast',
      lowestLabel: 'Lägst',
      recentLabel: 'Senaste övningsprov',
      scoreLabel: (scorePercent, completedDate, duration) =>
        duration
          ? `${scorePercent}% den ${completedDate}, ${duration}`
          : `${scorePercent}% den ${completedDate}`,
      subtitle: 'Följ de senaste resultaten utan att blanda in någon server.',
      summary: (attemptCount, latestScore, bestScore, averageScore, lowestScore) =>
        `${attemptCount} övningsprov. Senast ${latestScore}%. Bäst ${bestScore}%. Snitt ${averageScore}%. Lägst ${lowestScore}%.`,
      timeUsedLabel: (duration) => `Tid: ${duration}`,
      title: 'Övningsprov över tid',
      trendLabel: 'Resultattrend',
      trendPointAccessibilityLabel: (pointIndex, pointCount, scorePercent, completedDate) =>
        `Trendpunkt ${pointIndex} av ${pointCount}: ${scorePercent}% den ${completedDate}.`,
      trendSummary: (pointCount, firstScore, latestScore) => {
        const delta = latestScore - firstScore;
        const attempts = pointCount === 1 ? 'prov' : 'prov';
        if (delta === 0) {
          return `Resultattrend för ${pointCount} senaste bedömda ${attempts}: senast ${latestScore}%, oförändrat från äldsta som visas.`;
        }

        return `Resultattrend för ${pointCount} senaste bedömda ${attempts}: senast ${latestScore}%, ${Math.abs(delta)} procentenheter ${
          delta > 0 ? 'högre' : 'lägre'
        } än äldsta som visas.`;
      },
    },
    streakXp: {
      emptyState: 'XP-kurvan visas när du börjar få rätt svar.',
      levelLabel: 'nivå',
      streakLabel: 'dagars svit',
      subtitle: 'Senaste 30 dagarna med nivå och dagsvana.',
      summary: (totalXp, activeDays, currentStreak, level) =>
        `${totalXp} XP de senaste 30 dagarna. ${activeDays} aktiva dagar. ${currentStreak} dagars svit. Nivå ${level}.`,
      title: 'Svit och XP',
    },
    studyPlan: {
      accessibilityLabel: (summary) => `Öppna studieplanen. ${summary}`,
      badge: 'Plan',
      cta: 'Öppna studieplan',
      dateSummary: (daysRemaining, dateLabel) =>
        `${daysRemaining} dagar till ${dateLabel}. Pro visar veckomål på detaljsidan.`,
      expiredSummary: (dateLabel) =>
        `Provdatumet ${dateLabel} har passerat. Uppdatera datumet för en ny aktiv plan.`,
      noDateSummary: 'Lägg till ett provdatum för nedräkning och lokala veckomål på detaljsidan.',
      title: 'Studieplan',
    },
    subtitle: 'Se var du har varit aktiv, vilka kapitel du täcker och hur din svit växer.',
    summaryAccessibilityLabel: (questionsAnswered, touchedChapters, unresolved) =>
      formatDashboardSummaryAccessibilityLabel(
        'sv',
        questionsAnswered,
        touchedChapters,
        unresolved,
      ),
    summaryLine: (questionsAnswered, touchedChapters, unresolved) =>
      formatDashboardSummaryLine('sv', questionsAnswered, touchedChapters, unresolved),
    title: 'Framstegsöversikt',
  },
  en: {
    activity: {
      dayLabel: (date, answers) => `${date}: ${answers} answers`,
      emptyState: 'Answer a few questions and your activity map will build here.',
      legend: {
        high: 'High activity',
        low: 'Low activity',
        medium: 'Medium activity',
        none: 'No answers',
        title: 'Activity scale',
      },
      summary: (totalAnswers, activeDays, maxDayCount) =>
        `${totalAnswers} answers in this period. ${activeDays} active days. Highest day: ${maxDayCount} answers.`,
      subtitle: 'Each square shows answers from one day.',
      title: 'Active days',
    },
    chapterProgress: {
      accuracyLabel: 'Accuracy',
      chapterOrder: 'Chapter order',
      coverageLabel: 'Coverage',
      emptyState: 'Chapter progress appears here after you answer questions.',
      linkLabel: (chapterName) => `Open ${chapterName}`,
      sortAccessibilityLabel: (mode) => `Sort chapters: ${mode}`,
      sortGroupAccessibilityLabel: 'Sort chapter progress',
      subtitle: 'Accuracy and coverage sit side by side for each chapter.',
      title: 'Chapter progress',
      weakestFirst: 'Weakest first',
    },
    eyebrow: 'Local data',
    homeLink: 'Back to Home',
    homeLinkAccessibilityLabel: 'Go back to Home',
    mockHistory: {
      attemptCount: (count) => `${count} mock exams`,
      averageLabel: 'Average',
      bestLabel: 'Best',
      emptyState:
        'Finish a mock exam and your past scores, pacing, and best attempt will appear here.',
      examLink: 'Go to mock exam',
      examLinkAccessibilityLabel: 'Open the mock exam',
      formatCompletedDate: (completedAt) => formatDashboardCompletedDate(completedAt, 'en'),
      latestLabel: 'Latest',
      lowestLabel: 'Lowest',
      recentLabel: 'Recent mock exams',
      scoreLabel: (scorePercent, completedDate, duration) =>
        duration
          ? `${scorePercent}% on ${completedDate}, ${duration}`
          : `${scorePercent}% on ${completedDate}`,
      subtitle: 'Track recent results without sending anything to a server.',
      summary: (attemptCount, latestScore, bestScore, averageScore, lowestScore) =>
        `${attemptCount} mock exams. Latest ${latestScore}%. Best ${bestScore}%. Average ${averageScore}%. Lowest ${lowestScore}%.`,
      timeUsedLabel: (duration) => `Time: ${duration}`,
      title: 'Mock exam history',
      trendLabel: 'Score trend',
      trendPointAccessibilityLabel: (pointIndex, pointCount, scorePercent, completedDate) =>
        `Trend point ${pointIndex} of ${pointCount}: ${scorePercent}% on ${completedDate}.`,
      trendSummary: (pointCount, firstScore, latestScore) => {
        const delta = latestScore - firstScore;
        const attempts = pointCount === 1 ? 'exam' : 'exams';
        if (delta === 0) {
          return `Score trend across ${pointCount} recent scored ${attempts}: latest ${latestScore}%, unchanged from the oldest shown.`;
        }

        return `Score trend across ${pointCount} recent scored ${attempts}: latest ${latestScore}%, ${Math.abs(delta)} points ${
          delta > 0 ? 'higher' : 'lower'
        } than the oldest shown.`;
      },
    },
    streakXp: {
      emptyState: 'The XP line appears once you start getting answers right.',
      levelLabel: 'level',
      streakLabel: 'day streak',
      subtitle: 'The last 30 days with level and daily rhythm.',
      summary: (totalXp, activeDays, currentStreak, level) =>
        `${totalXp} XP in the last 30 days. ${activeDays} active days. ${currentStreak} day streak. Level ${level}.`,
      title: 'Streak and XP',
    },
    studyPlan: {
      accessibilityLabel: (summary) => `Open study plan. ${summary}`,
      badge: 'Plan',
      cta: 'Open study plan',
      dateSummary: (daysRemaining, dateLabel) =>
        `${daysRemaining} days until ${dateLabel}. Pro shows weekly targets on the detail screen.`,
      expiredSummary: (dateLabel) =>
        `The test date ${dateLabel} has passed. Update it for a new active plan.`,
      noDateSummary: 'Add a test date for countdown and local weekly targets on the detail screen.',
      title: 'Study plan',
    },
    subtitle:
      'See where you have been active, which chapters you cover, and how your streak grows.',
    summaryAccessibilityLabel: (questionsAnswered, touchedChapters, unresolved) =>
      formatDashboardSummaryAccessibilityLabel(
        'en',
        questionsAnswered,
        touchedChapters,
        unresolved,
      ),
    summaryLine: (questionsAnswered, touchedChapters, unresolved) =>
      formatDashboardSummaryLine('en', questionsAnswered, touchedChapters, unresolved),
    title: 'Progress dashboard',
  },
};

function createQuestionChapterIndex() {
  return Object.fromEntries(questions.map((question) => [question.id, question.chapterId]));
}

export default function DashboardScreen() {
  const answerDates = useProgressStore((state) => state.answerDates);
  const answerHistory = useProgressStore((state) => state.answerHistory);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const totalXp = useProgressStore((state) => state.totalXp);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const studyPlanTestDateIso = useSettingsStore((state) => state.studyPlanTestDateIso);
  const copy = dashboardCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const today = useMemo(() => new Date(), []);
  const studyPlanDate = useMemo(() => {
    if (!studyPlanTestDateIso) return null;
    const date = new Date(studyPlanTestDateIso);
    return Number.isFinite(date.getTime()) ? date : null;
  }, [studyPlanTestDateIso]);
  const studyPlanDateExpired = studyPlanDate
    ? isStudyPlanTestDateExpired(studyPlanDate, today)
    : false;
  const studyPlanSummary = studyPlanDate
    ? studyPlanDateExpired
      ? copy.studyPlan.expiredSummary(formatExamDate(studyPlanDate, language))
      : copy.studyPlan.dateSummary(
          daysUntil(studyPlanDate, today),
          formatExamDate(studyPlanDate, language),
        )
    : copy.studyPlan.noDateSummary;
  const progress = useMemo(
    () =>
      buildDashboardProgressSnapshot({
        answerDates,
        answerHistory,
        dailyGoalAnswers,
        mockExamSessions,
        questionProgress,
        totalXp,
      }),
    [answerDates, answerHistory, dailyGoalAnswers, mockExamSessions, questionProgress, totalXp],
  );
  const questionChapterIndex = useMemo(createQuestionChapterIndex, []);
  const activityBins = useMemo(
    () => dailyActivityHistogram(progress, { daysBack: ACTIVITY_DAYS }),
    [progress],
  );
  const chapterBars = useMemo(
    () => perChapterProgress(progress, chapters, questionChapterIndex),
    [progress, questionChapterIndex],
  );
  const xpPoints = useMemo(() => xpSparkline(progress, { daysBack: XP_DAYS }), [progress]);
  const mockHistoryEntries = useMemo(() => mockHistory(progress), [progress]);
  const summary = useMemo(
    () => dashboardSummary(progress, questionChapterIndex),
    [progress, questionChapterIndex],
  );
  const streakWithFreeze = useMemo(
    () =>
      calculateStreakWithFreeze({
        activeDayKeys: answerDates,
        freezeState: streakFreezeState,
      }),
    [answerDates, streakFreezeState],
  );
  const summaryAccessibilityLabel = copy.summaryAccessibilityLabel(
    summary.questionsAnsweredThisWeek,
    summary.chaptersWithAnyAnswer,
    summary.unresolvedMistakes,
  );

  return (
    <ScreenShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <Text accessibilityRole="summary" style={styles.accessibilitySummary}>
        {summaryAccessibilityLabel}
      </Text>
      <Card style={styles.summaryCard}>
        <Badge tone="blue">{copy.eyebrow}</Badge>
        <Text style={styles.summaryText}>
          {copy.summaryLine(
            summary.questionsAnsweredThisWeek,
            summary.chaptersWithAnyAnswer,
            summary.unresolvedMistakes,
          )}
        </Text>
        <Link
          accessibilityLabel={copy.homeLinkAccessibilityLabel}
          accessibilityRole="link"
          href="/home"
          style={styles.homeLink}
        >
          {copy.homeLink}
        </Link>
      </Card>
      <Card style={styles.studyPlanCard}>
        <Badge tone="blue">{copy.studyPlan.badge}</Badge>
        <Text accessibilityRole="header" style={styles.studyPlanTitle}>
          {copy.studyPlan.title}
        </Text>
        <Text style={styles.studyPlanText}>{studyPlanSummary}</Text>
        <RouteLink
          accessibilityLabel={copy.studyPlan.accessibilityLabel(studyPlanSummary)}
          href="/study-plan"
          style={styles.studyPlanLink}
          variant="secondary"
        >
          {copy.studyPlan.cta}
        </RouteLink>
      </Card>

      <ActivityHeatmap bins={activityBins} copy={copy.activity} />
      <PerChapterProgressBars
        bars={chapterBars}
        chapters={chapters}
        copy={copy.chapterProgress}
        language={language}
      />
      <StreakXpSparkline
        copy={copy.streakXp}
        currentStreak={streakWithFreeze.streakDays}
        level={progress.level}
        points={xpPoints}
      />
      <MockExamHistoryCard
        bestScore={summary.bestMockScore}
        copy={copy.mockHistory}
        entries={mockHistoryEntries}
      />
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    accessibilitySummary: {
      height: 1,
      left: -10000,
      overflow: 'hidden',
      position: 'absolute',
      width: 1,
    },
    summaryCard: {
      gap: space[1],
    },
    summaryText: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    studyPlanCard: {
      gap: space[1],
    },
    studyPlanTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    studyPlanText: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    studyPlanLink: {
      alignSelf: 'flex-start',
    },
    homeLink: {
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surfaceMuted,
      borderRadius: radius.micro,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
  });
}
