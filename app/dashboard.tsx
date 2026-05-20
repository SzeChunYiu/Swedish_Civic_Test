import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { PerChapterProgressBars } from '../components/dashboard/PerChapterProgressBars';
import { StreakXpSparkline } from '../components/dashboard/StreakXpSparkline';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ScreenShell } from '../components/ui/ScreenShell';
import { chapters } from '../data/chapters';
import { questions } from '../data/questions';
import {
  dailyActivityHistogram,
  dashboardSummary,
  perChapterProgress,
  xpSparkline,
} from '../lib/learning/dashboardStats';
import { buildDashboardProgressSnapshot } from '../lib/learning/dashboardProgressSnapshot';
import { calculateStreakWithFreeze } from '../lib/learning/streakWithFreeze';
import { hasProEntitlement } from '../lib/monetization/premium';
import { useProgressStore } from '../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../lib/theme';
import type { ProTierEntitlements } from '../types/monetization';

const ACTIVITY_DAYS = 53 * 7;
const XP_DAYS = 30;

type DashboardCopy = {
  activity: {
    emptyState: string;
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
    subtitle: string;
    title: string;
    weakestFirst: string;
  };
  eyebrow: string;
  homeLink: string;
  homeLinkAccessibilityLabel: string;
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
  title: string;
};

const dashboardCopy: Record<AppLanguage, DashboardCopy> = {
  sv: {
    activity: {
      emptyState: 'Svara på några frågor så byggs din aktivitetskarta här.',
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
      subtitle: 'Rätt och täckning visas sida vid sida per kapitel.',
      title: 'Kapitelframsteg',
      weakestFirst: 'Svagast först',
    },
    eyebrow: 'Lokal data',
    homeLink: 'Till startsidan',
    homeLinkAccessibilityLabel: 'Gå tillbaka till startsidan',
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
      `Framstegsöversikt: ${questionsAnswered} svar den här veckan, ${touchedChapters} kapitel provade, ${unresolved} olösta misstag.`,
    summaryLine: (questionsAnswered, touchedChapters, unresolved) =>
      `${questionsAnswered} svar den här veckan · ${touchedChapters} kapitel provade · ${unresolved} olösta misstag`,
    title: 'Framstegsöversikt',
  },
  en: {
    activity: {
      emptyState: 'Answer a few questions and your activity map will build here.',
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
      subtitle: 'Accuracy and coverage sit side by side for each chapter.',
      title: 'Chapter progress',
      weakestFirst: 'Weakest first',
    },
    eyebrow: 'Local data',
    homeLink: 'Back to Home',
    homeLinkAccessibilityLabel: 'Go back to Home',
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
      `Progress dashboard: ${questionsAnswered} answers this week, ${touchedChapters} chapters tried, ${unresolved} unresolved mistakes.`,
    summaryLine: (questionsAnswered, touchedChapters, unresolved) =>
      `${questionsAnswered} answers this week · ${touchedChapters} chapters tried · ${unresolved} unresolved mistakes`,
    title: 'Progress dashboard',
  },
};

function createQuestionChapterIndex() {
  return Object.fromEntries(questions.map((question) => [question.id, question.chapterId]));
}

function createDashboardProEntitlements(): ProTierEntitlements {
  return {
    adsDisabled: false,
    confidenceSlider: false,
    customStudyPlan: false,
    fullMistakeReview: false,
    multiColorHighlights: false,
    nativeLangExplanations: false,
    notesExport: false,
    predictedPassProbability: false,
    spacedRepetition: false,
    unlimitedMockExams: false,
  };
}

export default function DashboardScreen() {
  const answerDates = useProgressStore((state) => state.answerDates);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const totalXp = useProgressStore((state) => state.totalXp);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = dashboardCopy[language];
  const progress = useMemo(
    () =>
      buildDashboardProgressSnapshot({
        answerDates,
        dailyGoalAnswers,
        mockExamSessions,
        questionProgress,
        totalXp,
      }),
    [answerDates, dailyGoalAnswers, mockExamSessions, questionProgress, totalXp],
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
  const proEntitlements = useMemo(createDashboardProEntitlements, []);
  const advancedAnalyticsUnlocked =
    hasProEntitlement(proEntitlements) && proEntitlements.predictedPassProbability;
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
      {advancedAnalyticsUnlocked ? <View style={styles.proAnalyticsPlaceholder} /> : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  homeLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  proAnalyticsPlaceholder: {
    display: 'none',
  },
});
