import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { MistakeConvergence } from '../components/dashboard/MistakeConvergence';
import { MockExamHistoryCard } from '../components/dashboard/MockExamHistoryCard';
import { PerChapterProgressBars } from '../components/dashboard/PerChapterProgressBars';
import { StreakXpSparkline } from '../components/dashboard/StreakXpSparkline';
import { TimeOfDayPattern } from '../components/dashboard/TimeOfDayPattern';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import {
  dailyActivityHistogram,
  dashboardSummary,
  mistakeConvergence,
  mockHistory,
  perChapterProgress,
  timeOfDayPattern,
  xpSparkline,
} from '../lib/learning/dashboardStats';
import {
  formatDashboardSummaryAccessibilityLabel,
  formatDashboardSummaryLine,
} from '../lib/learning/dashboardSummaryCopy';
import { formatDashboardCompletedDate } from '../lib/learning/dashboardDateFormat';
import { buildDashboardProgressSnapshot } from '../lib/learning/dashboardProgressSnapshot';
import { calculateStreakWithFreeze } from '../lib/learning/streakWithFreeze';
import { hasProEntitlement } from '../lib/monetization/premium';
import { isProRuntimeScopeEnabled } from '../lib/monetization/releasePolicy';
import { useProLifetimeEntitlements } from '../lib/monetization/useProLifetimeEntitlements';
import { useProgressStore } from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

const ACTIVITY_DAYS = 53 * 7;
const XP_DAYS = 30;
const ADVANCED_ANALYTICS_DAYS = 30;

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
  advancedAnalytics: {
    lockedBody: string;
    lockedSubtitle: string;
    lockedTitle: string;
    upgradeAccessibilityLabel: string;
    upgradeLink: string;
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
  mistakeConvergence: {
    emptyState: string;
    pointAccessibilityLabel: (date: string, unresolvedMistakes: number) => string;
    resolvedLabel: (resolvedCount: number) => string;
    subtitle: string;
    summary: (latestUnresolved: number, resolvedCount: number, days: number) => string;
    title: string;
    unresolvedLabel: (unresolvedCount: number) => string;
  };
  streakXp: {
    emptyState: string;
    levelLabel: string;
    streakLabel: string;
    subtitle: string;
    summary: (totalXp: number, activeDays: number, currentStreak: number, level: number) => string;
    title: string;
  };
  subtitle: string;
  summaryAccessibilityLabel: (questions: number, chapters: number, unresolved: number) => string;
  summaryLine: (questions: number, chapters: number, unresolved: number) => string;
  timeOfDay: {
    binAccessibilityLabel: (hourLabel: string, answers: number, accuracy: number | null) => string;
    emptyState: string;
    hourLabel: (hour: number) => string;
    summary: (totalAnswers: number, bestHourLabel: string, bestAccuracy: number) => string;
    subtitle: string;
    title: string;
  };
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
    advancedAnalytics: {
      lockedBody:
        'Mockprovstrend, bästa studietid och misstagskurva låses upp med Pro när Pro-funktionerna är aktiva.',
      lockedSubtitle: 'Gratis och Annonsfri behåller aktivitetskarta, kapitelframsteg och XP.',
      lockedTitle: 'Avancerad Pro-analys',
      upgradeAccessibilityLabel: 'Öppna Profil för att jämföra Pro',
      upgradeLink: 'Jämför Pro i Profil',
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
    mistakeConvergence: {
      emptyState: 'När du har rättat tidigare fel visas misstagskurvan här.',
      pointAccessibilityLabel: (date, unresolvedMistakes) =>
        `${formatDashboardCompletedDate(`${date}T12:00:00.000Z`, 'sv')}: ${unresolvedMistakes} olösta misstag`,
      resolvedLabel: (resolvedCount) => (resolvedCount === 1 ? 'misstag löst' : 'misstag lösta'),
      subtitle: 'Se om gamla fel blir färre över tid.',
      summary: (latestUnresolved, resolvedCount, days) =>
        `${latestUnresolved} olösta misstag nu. ${resolvedCount} lösta under ${days} dagar.`,
      title: 'Misstagskurva',
      unresolvedLabel: (unresolvedCount) =>
        unresolvedCount === 1 ? 'olöst misstag' : 'olösta misstag',
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
    timeOfDay: {
      binAccessibilityLabel: (hourLabel, answers, accuracy) =>
        accuracy === null
          ? `${hourLabel}: ${answers} svar, ingen träffsäkerhet ännu`
          : `${hourLabel}: ${answers} svar, ${Math.round(accuracy * 100)}% rätt`,
      emptyState: 'Svara vid olika tider så visas ditt tydligaste studiemönster här.',
      hourLabel: (hour) => `${String(hour).padStart(2, '0')}:00`,
      summary: (totalAnswers, bestHourLabel, bestAccuracy) =>
        `${totalAnswers} svar analyserade. Bäst träffsäkerhet runt ${bestHourLabel}: ${bestAccuracy}% rätt.`,
      subtitle: 'Jämför träffsäkerhet per timme utan att skicka data till någon server.',
      title: 'Tid på dygnet',
    },
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
    advancedAnalytics: {
      lockedBody:
        'Mock exam trends, best study hours, and mistake convergence unlock with Pro when Pro features are active.',
      lockedSubtitle: 'Free and Ad-Free keep the activity map, chapter progress, and XP timeline.',
      lockedTitle: 'Advanced Pro analytics',
      upgradeAccessibilityLabel: 'Open Profile to compare Pro',
      upgradeLink: 'Compare Pro in Profile',
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
    mistakeConvergence: {
      emptyState: 'Resolve earlier mistakes and the convergence curve will appear here.',
      pointAccessibilityLabel: (date, unresolvedMistakes) =>
        `${formatDashboardCompletedDate(`${date}T12:00:00.000Z`, 'en')}: ${unresolvedMistakes} unresolved mistakes`,
      resolvedLabel: (resolvedCount) =>
        resolvedCount === 1 ? 'mistake resolved' : 'mistakes resolved',
      subtitle: 'Watch old mistakes shrink as you correct them.',
      summary: (latestUnresolved, resolvedCount, days) =>
        `${latestUnresolved} unresolved mistakes now. ${resolvedCount} resolved across ${days} days.`,
      title: 'Mistake convergence',
      unresolvedLabel: (unresolvedCount) =>
        unresolvedCount === 1 ? 'unresolved mistake' : 'unresolved mistakes',
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
    timeOfDay: {
      binAccessibilityLabel: (hourLabel, answers, accuracy) =>
        accuracy === null
          ? `${hourLabel}: ${answers} answers, no accuracy yet`
          : `${hourLabel}: ${answers} answers, ${Math.round(accuracy * 100)}% correct`,
      emptyState: 'Answer at different times and your clearest study pattern will appear here.',
      hourLabel: (hour) => `${String(hour).padStart(2, '0')}:00`,
      summary: (totalAnswers, bestHourLabel, bestAccuracy) =>
        `${totalAnswers} answers analyzed. Best accuracy around ${bestHourLabel}: ${bestAccuracy}% correct.`,
      subtitle: 'Compare accuracy by hour without sending data to a server.',
      title: 'Time-of-day pattern',
    },
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
  const { entitlements: proEntitlements, entitlementsReady } = useProLifetimeEntitlements();
  const copy = dashboardCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const proRuntimeScopeEnabled = isProRuntimeScopeEnabled();
  const advancedAnalyticsUnlocked =
    proRuntimeScopeEnabled &&
    entitlementsReady &&
    hasProEntitlement(proEntitlements) &&
    proEntitlements.predictedPassProbability === true;
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
  const timeOfDayBins = useMemo(() => timeOfDayPattern(progress), [progress]);
  const mistakeConvergencePoints = useMemo(
    () => mistakeConvergence(progress, { daysBack: ADVANCED_ANALYTICS_DAYS }),
    [progress],
  );
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
      {advancedAnalyticsUnlocked ? (
        <>
          <MockExamHistoryCard
            bestScore={summary.bestMockScore}
            copy={copy.mockHistory}
            entries={mockHistoryEntries}
          />
          <TimeOfDayPattern bins={timeOfDayBins} copy={copy.timeOfDay} />
          <MistakeConvergence copy={copy.mistakeConvergence} points={mistakeConvergencePoints} />
        </>
      ) : (
        <Card style={styles.advancedLockedCard}>
          <View style={styles.advancedLockedHeader}>
            <Badge tone="warm">Pro</Badge>
            <Text accessibilityRole="header" style={styles.advancedLockedTitle}>
              {copy.advancedAnalytics.lockedTitle}
            </Text>
            <Text style={styles.advancedLockedSubtitle}>
              {copy.advancedAnalytics.lockedSubtitle}
            </Text>
          </View>
          <Text style={styles.advancedLockedBody}>{copy.advancedAnalytics.lockedBody}</Text>
          <Link
            accessibilityLabel={copy.advancedAnalytics.upgradeAccessibilityLabel}
            accessibilityRole="link"
            href="/profile"
            style={styles.advancedLockedLink}
          >
            {copy.advancedAnalytics.upgradeLink}
          </Link>
        </Card>
      )}
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
    advancedLockedCard: {
      gap: space[1.5],
    },
    advancedLockedHeader: {
      alignItems: 'flex-start',
      gap: space[0.5],
    },
    advancedLockedTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    advancedLockedSubtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    advancedLockedBody: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    advancedLockedLink: {
      alignSelf: 'flex-start',
      backgroundColor: themeColors.badgeBlueBg,
      borderRadius: radius.micro,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
    summaryText: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
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
