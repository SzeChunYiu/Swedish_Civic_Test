import { Link } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '../../components/monetization/AdBanner';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { PricingWedge } from '../../components/monetization/PricingWedge';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { SocialProofRow } from '../../components/ui/SocialProofRow';
import { StatCallout } from '../../components/ui/StatCallout';
import { SwedishFlagBand } from '../../components/ui/SwedishFlagBand';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { uxBenchmarks } from '../../data/uxBenchmarks';
import { findWeakChapterIds } from '../../lib/learning/mastery';
import {
  computeReadinessFromQuestionProgress,
  type ReadinessVerdict,
} from '../../lib/learning/readiness';
import { calculateStreakWithFreeze, freezeBannerCopy } from '../../lib/learning/streakWithFreeze';
import { countAnswersForLocalDate } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

type StudyLoopItemCopy = {
  label: string;
  lesson: string;
};

type HomeCopy = {
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  dailyGoalTitle: string;
  dayStreakFreezeHelper: (count: number) => string;
  dayStreakHelper: string;
  dayStreakMetric: string;
  eyebrow: string;
  feedbackBadge: string;
  feedbackLink: string;
  feedbackLinkAccessibilityLabel: string;
  feedbackText: string;
  feedbackTitle: string;
  levelMetric: string;
  questionsHelper: (count: number) => string;
  questionsMetric: string;
  quickActionExamBody: string;
  quickActionLearnBody: string;
  quickActionPracticeBody: string;
  quickActionReviewBody: string;
  quickActionSearchAccessibilityLabel: string;
  quickActionSearchBody: string;
  quickActionSearchTitle: string;
  quickActionsSubtitle: string;
  quickActionsTitle: string;
  readinessAccessibilityLabel: (score: number, verdict: string, details: string) => string;
  readinessCta: string;
  readinessCtaAccessibilityLabel: string;
  readinessDetails: (accuracyPercent: number, coveragePercent: number) => string;
  readinessMetricLabel: string;
  readinessSparseNote: string;
  readinessTitle: string;
  readinessVerdicts: Record<ReadinessVerdict, string>;
  reviewWeakChapters: string;
  startPractice: string;
  startPracticeAccessibilityLabel: string;
  startPracticeSet: string;
  streakFreezeBadge: string;
  studyLoopItems: StudyLoopItemCopy[];
  studyLoopSubtitle: string;
  studyLoopTitle: string;
  subtitle: string;
  title: string;
  weakChaptersHelper: string;
  weakChaptersMetric: string;
  xpBasedHelper: string;
};

const homeCopy: Record<AppLanguage, HomeCopy> = {
  sv: {
    browseChapters: 'Bläddra bland kapitel',
    browseChaptersAccessibilityLabel: 'Bläddra bland alla samhällskapitel',
    dailyGoalTitle: 'Dagens mål',
    dayStreakFreezeHelper: (count) => `${count} svitskydd redo`,
    dayStreakHelper: 'daglig vana',
    dayStreakMetric: 'dagars svit',
    eyebrow: 'Studieöversikt',
    feedbackBadge: 'Fokuserad repetition',
    feedbackLink: 'Repetera sparade frågor',
    feedbackLinkAccessibilityLabel: 'Granska bokmärkta eller missade frågor',
    feedbackText:
      'Sparade och missade frågor samlas på ett ställe, med källstödda förklaringar och utan annonser i provläget.',
    feedbackTitle: 'Håll koll på det som behöver övas',
    levelMetric: 'nivå',
    questionsHelper: (count) => `${count} kapitel`,
    questionsMetric: 'frågor',
    quickActionExamBody: 'Träna med tid när du vill känna hur ett helt provpass flyter.',
    quickActionLearnBody: 'Öppna kapitelöversikten och välj området du vill stärka.',
    quickActionPracticeBody: 'Svara på några frågor direkt och få källstödd återkoppling.',
    quickActionReviewBody: 'Gå tillbaka till bokmärkta och missade frågor innan de glöms bort.',
    quickActionSearchAccessibilityLabel: 'Sök bland frågor, svar och förklaringar',
    quickActionSearchBody: 'Hitta ett begrepp, en fråga eller en förklaring utan att bläddra.',
    quickActionSearchTitle: 'Sök i frågorna',
    quickActionsSubtitle: 'Välj den väg som passar dagens energi.',
    quickActionsTitle: 'Snabbstart',
    readinessAccessibilityLabel: (score, verdict, details) =>
      `Redoindikator: ${score} procent. ${verdict}. ${details}`,
    readinessCta: 'Gör ett mockprov',
    readinessCtaAccessibilityLabel: 'Starta ett mockprov för att kontrollera din redoindikator',
    readinessDetails: (accuracyPercent, coveragePercent) =>
      `${accuracyPercent} % rätt · ${coveragePercent} % av kapitlen provade`,
    readinessMetricLabel: 'redo',
    readinessSparseNote:
      'Bygger på dina svar hittills. Svara på fler frågor för en säkrare signal.',
    readinessTitle: 'Redoindikator',
    readinessVerdicts: {
      not_ready_yet: 'Öva mer först',
      getting_there: 'På rätt väg',
      almost_ready: 'Nästan redo',
      strong_preparation: 'Stark förberedelse',
    },
    reviewWeakChapters: 'Repetera svaga kapitel',
    startPractice: 'Starta övning',
    startPracticeAccessibilityLabel: 'Starta den rekommenderade övningen',
    startPracticeSet: 'Starta en 5-minutersövning',
    streakFreezeBadge: 'Svitskydd',
    studyLoopItems: [
      {
        label: 'Korta pass',
        lesson: 'Börja med ett litet ämnespass, få direkt återkoppling och fortsätt utan krångel.',
      },
      {
        label: 'Tydlig behärskning',
        lesson: 'Se vilka områden som är klara, repeterade eller fortfarande svaga.',
      },
      {
        label: 'Vana i vardagen',
        lesson:
          'Få en enkel nästa handling och varsam vanefeedback utan att stoppa seriösa studier.',
      },
      {
        label: 'Provredo',
        lesson:
          'Växla mellan tidsatta prov, flashcards, bokmärken, felspårning, ljud och redoindikator.',
      },
    ],
    studyLoopSubtitle:
      'Välj ett tydligt nästa steg, få snabb återkoppling och följ framstegen utan att provläget störs.',
    studyLoopTitle: 'Smarta studievanor',
    subtitle:
      'En tydlig väg för svenska samhällskunskaper: dagliga svar, realistiska prov, repetition av misstag och källstödda förklaringar.',
    title: 'Studera lugnt, ett samhällsbegrepp i taget',
    weakChaptersHelper: 'behöver repetition',
    weakChaptersMetric: 'svaga kapitel',
    xpBasedHelper: 'XP-baserad',
  },
  en: {
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Browse all civic chapters',
    dailyGoalTitle: "Today's goal",
    dayStreakFreezeHelper: (count) => `${count} streak freeze ready`,
    dayStreakHelper: 'daily habit',
    dayStreakMetric: 'day streak',
    eyebrow: 'Study dashboard',
    feedbackBadge: 'Focused review',
    feedbackLink: 'Review saved questions',
    feedbackLinkAccessibilityLabel: 'Review bookmarked or missed questions',
    feedbackText:
      'Saved and missed questions stay in one place, with source-backed explanations and no ads in exam mode.',
    feedbackTitle: 'Keep track of what needs review',
    levelMetric: 'level',
    questionsHelper: (count) => `${count} chapters`,
    questionsMetric: 'questions',
    quickActionExamBody: 'Use a timed run when you want the shape of a full test session.',
    quickActionLearnBody: 'Open the chapter overview and choose the area you want to strengthen.',
    quickActionPracticeBody: 'Answer a few questions now and get source-backed feedback.',
    quickActionReviewBody: 'Return to bookmarked and missed questions before they fade.',
    quickActionSearchAccessibilityLabel: 'Search questions, answers, and explanations',
    quickActionSearchBody: 'Find a concept, question, or explanation without browsing.',
    quickActionSearchTitle: 'Search questions',
    quickActionsSubtitle: "Pick the route that fits today's energy.",
    quickActionsTitle: 'Quick start',
    readinessAccessibilityLabel: (score, verdict, details) =>
      `Readiness indicator: ${score} percent. ${verdict}. ${details}`,
    readinessCta: 'Take a mock exam',
    readinessCtaAccessibilityLabel: 'Start a mock exam to check your readiness indicator',
    readinessDetails: (accuracyPercent, coveragePercent) =>
      `${accuracyPercent}% accuracy · ${coveragePercent}% chapters tried`,
    readinessMetricLabel: 'ready',
    readinessSparseNote:
      'Based on your answers so far. Answer more questions for a steadier signal.',
    readinessTitle: 'Readiness indicator',
    readinessVerdicts: {
      not_ready_yet: 'Keep practicing first',
      getting_there: 'Getting there',
      almost_ready: 'Almost ready',
      strong_preparation: 'Strong preparation',
    },
    reviewWeakChapters: 'Review weak chapters',
    startPractice: 'Start practice',
    startPracticeAccessibilityLabel: 'Start the recommended practice session',
    startPracticeSet: 'Start a 5-minute practice set',
    streakFreezeBadge: 'Streak freeze',
    studyLoopItems: [
      {
        label: 'Bite-size practice',
        lesson: 'Start with a small topic set, get immediate feedback, and keep moving.',
      },
      {
        label: 'Clear mastery',
        lesson: 'See which areas are ready, reviewed, or still weak.',
      },
      {
        label: 'Study rhythm',
        lesson:
          'Get one simple next action and gentle habit feedback without blocking serious study.',
      },
      {
        label: 'Exam readiness',
        lesson:
          'Switch between timed exams, flashcards, bookmarks, mistake tracking, audio, and readiness signals.',
      },
    ],
    studyLoopSubtitle:
      'Choose one clear next step, get quick feedback, and follow progress without distractions in exam mode.',
    studyLoopTitle: 'Smart study habits',
    subtitle:
      'A focused path for Swedish civic knowledge: daily answers, realistic mock exams, mistake review, and source-backed explanations.',
    title: 'Prepare calmly, one civic concept at a time',
    weakChaptersHelper: 'needs review',
    weakChaptersMetric: 'weak chapters',
    xpBasedHelper: 'XP-based',
  },
};

export default function Screen() {
  const {
    entitlements: monetizationEntitlements,
    purchaseRuntime,
    setEntitlements: setMonetizationEntitlements,
  } = useRemoveAdsEntitlements();
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const setStreakFreezeState = useProgressStore((state) => state.setStreakFreezeState);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = homeCopy[language];
  const completedToday = Math.min(countAnswersForLocalDate(questionProgress), dailyGoalAnswers);
  const progress = dailyGoalAnswers > 0 ? completedToday / dailyGoalAnswers : 0;
  const streakWithFreeze = useMemo(
    () =>
      calculateStreakWithFreeze({
        activeDayKeys: answerDates,
        freezeState: streakFreezeState,
      }),
    [answerDates, streakFreezeState],
  );
  const currentStreak = streakWithFreeze.streakDays;
  const streakRescueMessage = freezeBannerCopy(streakWithFreeze, language);
  const dayStreakHelper =
    currentStreak > 0 && streakWithFreeze.freezeState.available > 0
      ? copy.dayStreakFreezeHelper(streakWithFreeze.freezeState.available)
      : copy.dayStreakHelper;
  const level = calculateLevel(totalXp);
  const weakChapterCount = findWeakChapterIds(questions, questionProgress, 0.6).length;
  const nextAction = weakChapterCount > 0 ? copy.reviewWeakChapters : copy.startPracticeSet;
  const readiness = computeReadinessFromQuestionProgress({
    questionProgress,
    questions,
    chapters,
    mockExamSessions,
  });
  const readinessVerdict = copy.readinessVerdicts[readiness.verdict];
  const readinessDetails = copy.readinessDetails(
    Math.round(readiness.components.accuracy * 100),
    Math.round(readiness.components.coverage * 100),
  );
  const readinessAccessibilityLabel = copy.readinessAccessibilityLabel(
    readiness.score,
    readinessVerdict,
    readinessDetails,
  );
  const quickActions = [
    {
      accessibilityLabel: copy.startPracticeAccessibilityLabel,
      body: copy.quickActionPracticeBody,
      href: '/practice',
      title: copy.startPractice,
    },
    {
      accessibilityLabel: copy.browseChaptersAccessibilityLabel,
      body: copy.quickActionLearnBody,
      href: '/learn',
      title: copy.browseChapters,
    },
    {
      accessibilityLabel: copy.feedbackLinkAccessibilityLabel,
      body: copy.quickActionReviewBody,
      href: '/mistakes',
      title: copy.feedbackLink,
    },
    {
      accessibilityLabel: copy.quickActionSearchAccessibilityLabel,
      body: copy.quickActionSearchBody,
      href: '/search',
      title: copy.quickActionSearchTitle,
    },
    {
      accessibilityLabel: copy.readinessCtaAccessibilityLabel,
      body: copy.quickActionExamBody,
      href: '/exam',
      title: copy.readinessCta,
    },
  ];

  useEffect(() => {
    setStreakFreezeState(streakWithFreeze.freezeState);
  }, [setStreakFreezeState, streakWithFreeze.freezeState]);

  return (
    <ScreenShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      rightSlot={
        <View style={styles.goalCard}>
          <Text accessibilityRole="header" style={styles.goalLabel}>
            {copy.dailyGoalTitle}
          </Text>
          <Text style={styles.goalMetric}>
            {completedToday}/{dailyGoalAnswers}
          </Text>
          <ProgressBar language={language} progress={progress} />
          <Text style={styles.goalHint}>{nextAction}</Text>
        </View>
      }
    >
      <SwedishFlagBand />
      <View style={styles.statRow}>
        <StatCallout value={questions.length} label={language === 'sv' ? 'frågor' : 'questions'} />
        <StatCallout
          value={chapters.length}
          label={language === 'sv' ? 'kapitel' : 'chapters'}
          tone="accent"
        />
      </View>
      <Card style={styles.readinessCard}>
        <View
          accessible
          accessibilityLabel={readinessAccessibilityLabel}
          aria-label={readinessAccessibilityLabel}
          style={styles.readinessHeader}
        >
          <View style={styles.readinessTitleBlock}>
            <Text accessibilityRole="header" style={styles.readinessTitle}>
              {copy.readinessTitle}
            </Text>
            <Text style={styles.readinessVerdict}>{readinessVerdict}</Text>
          </View>
          <View style={styles.readinessScorePill}>
            <Text style={styles.readinessScore}>{readiness.score}%</Text>
            <Text style={styles.readinessMetric}>{copy.readinessMetricLabel}</Text>
          </View>
        </View>
        <ProgressBar language={language} progress={readiness.score / 100} />
        <Text style={styles.readinessDetail}>{readinessDetails}</Text>
        {readiness.isSparse ? (
          <Text style={styles.readinessSparseNote}>{copy.readinessSparseNote}</Text>
        ) : null}
        <Link
          accessibilityLabel={copy.readinessCtaAccessibilityLabel}
          accessibilityRole="link"
          href="/exam"
          style={styles.readinessLink}
        >
          {copy.readinessCta}
        </Link>
      </Card>
      <SocialProofRow language={language} />
      {!monetizationEntitlements.adsDisabled ? (
        <PricingWedge
          questionCount={questions.length}
          chapterCount={chapters.length}
          language={language}
        />
      ) : null}
      <SectionHeader title={copy.quickActionsTitle} subtitle={copy.quickActionsSubtitle} />
      <View style={styles.quickActionGrid}>
        {quickActions.map((action, index) => (
          <Card key={action.href} style={styles.quickActionCard}>
            <Text accessibilityRole="header" style={styles.quickActionTitle}>
              {action.title}
            </Text>
            <Text style={styles.quickActionBody}>{action.body}</Text>
            <Link
              accessibilityLabel={action.accessibilityLabel}
              accessibilityRole="link"
              href={action.href}
              style={index === 0 ? styles.primaryLink : styles.secondaryLink}
            >
              {action.title}
            </Link>
          </Card>
        ))}
      </View>

      <View style={styles.statsRow}>
        <MetricCard
          label={copy.levelMetric}
          value={level}
          tone="blue"
          helper={copy.xpBasedHelper}
        />
        <MetricCard label={copy.dayStreakMetric} value={currentStreak} helper={dayStreakHelper} />
      </View>
      {streakRescueMessage ? (
        <Card accessible accessibilityLabel={streakRescueMessage} style={styles.streakFreezeCard}>
          <Badge tone="warm">{copy.streakFreezeBadge}</Badge>
          <Text style={styles.streakFreezeText}>{streakRescueMessage}</Text>
        </Card>
      ) : null}
      <View style={styles.statsRow}>
        <MetricCard
          label={copy.weakChaptersMetric}
          value={weakChapterCount}
          helper={copy.weakChaptersHelper}
        />
        <MetricCard
          label={copy.questionsMetric}
          value={questions.length}
          helper={copy.questionsHelper(chapters.length)}
        />
      </View>

      <Card style={styles.feedbackCard}>
        <Badge tone="blue">{copy.feedbackBadge}</Badge>
        <Text accessibilityRole="header" style={styles.feedbackTitle}>
          {copy.feedbackTitle}
        </Text>
        <Text style={styles.feedbackText}>{copy.feedbackText}</Text>
        <Link
          accessibilityLabel={copy.feedbackLinkAccessibilityLabel}
          accessibilityRole="link"
          href="/mistakes"
          style={styles.feedbackLink}
        >
          {copy.feedbackLink}
        </Link>
      </Card>

      <SectionHeader title={copy.studyLoopTitle} subtitle={copy.studyLoopSubtitle} />
      <View style={styles.loopGrid}>
        {uxBenchmarks.map((item, index) => {
          const itemCopy = copy.studyLoopItems[index];
          if (!itemCopy) return null;

          return (
            <Card key={item.source} style={styles.loopCard}>
              <Badge tone="warm">{itemCopy.label}</Badge>
              <Text style={styles.loopText}>{itemCopy.lesson}</Text>
            </Card>
          );
        })}
      </View>

      <PremiumBanner
        entitlements={monetizationEntitlements}
        language={language}
        onEntitlementsChange={setMonetizationEntitlements}
        runtimeOptions={purchaseRuntime}
      />
      <AdBanner entitlements={monetizationEntitlements} placement="home_banner" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  readinessCard: {
    gap: space[1.5],
  },
  readinessHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
    justifyContent: 'space-between',
  },
  readinessTitleBlock: {
    flex: 1,
    gap: space[0.5],
  },
  readinessTitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  readinessVerdict: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  readinessScorePill: {
    alignItems: 'center',
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: space[9],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  readinessScore: {
    color: colors.text,
    fontSize: typography.subHeadingLarge.fontSize,
    fontWeight: typography.subHeadingLarge.fontWeight,
    lineHeight: typography.subHeadingLarge.lineHeight,
  },
  readinessMetric: {
    color: colors.textSecondary,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  readinessDetail: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  readinessSparseNote: {
    color: colors.textDisclaimer,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  readinessLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  goalCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    padding: space[2],
  },
  goalLabel: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  goalMetric: {
    color: colors.text,
    fontSize: typography.subHeadingLarge.fontSize,
    fontWeight: typography.subHeadingLarge.fontWeight,
    lineHeight: typography.subHeadingLarge.lineHeight,
  },
  goalHint: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  quickActionGrid: {
    gap: space[1.5],
  },
  quickActionCard: {
    gap: space[1],
  },
  quickActionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  quickActionBody: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  primaryLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  statsRow: {
    flexDirection: 'row',
    gap: space[1.5],
  },
  streakFreezeCard: {
    gap: space[1],
  },
  streakFreezeText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  feedbackCard: {
    gap: space[1],
  },
  feedbackTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  feedbackLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  loopGrid: {
    gap: space[1.5],
  },
  loopCard: {
    gap: space[1],
  },
  loopText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
