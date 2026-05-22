import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '../../components/monetization/AdBanner';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { PricingWedge } from '../../components/monetization/PricingWedge';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/ui/Card';
import { CountdownBanner } from '../../components/ui/CountdownBanner';
import { MetricCard } from '../../components/ui/MetricCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RouteLink } from '../../components/ui/RouteLink';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { SocialProofRow } from '../../components/ui/SocialProofRow';
import { StatCallout } from '../../components/ui/StatCallout';
import { SwedishFlagBand } from '../../components/ui/SwedishFlagBand';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { uxBenchmarks } from '../../data/uxBenchmarks';
import {
  buildDailyChallenge,
  dailyChallengeBannerCopy,
  isDailyChallengeCompleted,
} from '../../lib/learning/dailyChallenge';
import { findWeakChapterIds } from '../../lib/learning/mastery';
import {
  computeReadinessFromQuestionProgress,
  type ReadinessVerdict,
} from '../../lib/learning/readiness';
import { calculateStreakWithFreeze, freezeBannerCopy } from '../../lib/learning/streakWithFreeze';
import { countAnswersForLocalDate } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { showRewardedExtraExamAd } from '../../lib/monetization/rewardedAd';
import { useMockExamAccess } from '../../lib/monetization/useMockExamAccess';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

type StudyLoopItemCopy = {
  label: string;
  lesson: string;
};

type GuidedPathStageCopy = {
  accessibilityLabel: (
    title: string,
    chapterRange: string,
    progressLabel: string,
    status: string,
  ) => string;
  chapterRange: string;
  cta: (isCompleted: boolean) => string;
  ctaAccessibilityLabel: (title: string, isCompleted: boolean) => string;
  description: string;
  levelLabel: string;
  progressLabel: (completedChapters: number, totalChapters: number) => string;
  title: string;
};

type HomeCopy = {
  browseChapters: string;
  browseChaptersAccessibilityLabel: string;
  dailyGoalTitle: string;
  dashboardAccessibilityLabel: string;
  dashboardLink: string;
  dailyChallengeAccessibilityLabel: (title: string, subtitle: string, completed: boolean) => string;
  dailyChallengeCta: (completed: boolean) => string;
  dayStreakFreezeHelper: (count: number) => string;
  dayStreakHelper: string;
  dayStreakMetric: string;
  eyebrow: string;
  feedbackBadge: string;
  feedbackLink: string;
  feedbackLinkAccessibilityLabel: string;
  feedbackText: string;
  feedbackTitle: string;
  guidedPathDailyAccessibilityLabel: (completed: number, goal: number) => string;
  guidedPathDailyCta: string;
  guidedPathDailyText: (completed: number, goal: number) => string;
  guidedPathDailyTitle: string;
  guidedPathResumeAccessibilityLabel: (stageTitle: string) => string;
  guidedPathResumeCta: string;
  guidedPathStageStatuses: {
    active: string;
    completed: string;
    upcoming: string;
  };
  guidedPathStages: GuidedPathStageCopy[];
  guidedPathSubtitle: string;
  guidedPathTitle: string;
  freeBankBadge: string;
  freeBankText: string;
  levelMetric: string;
  questionsHelper: (count: number) => string;
  questionsMetric: string;
  readinessAccessibilityLabel: (score: number, verdict: string, details: string) => string;
  readinessCaveat: string;
  readinessCta: string;
  readinessCtaAccessibilityLabel: string;
  readinessQuickActionAccessibilityLabel: string;
  readinessDetails: (accuracyPercent: number, coveragePercent: number) => string;
  readinessMetricLabel: string;
  readinessSparseNote: string;
  readinessTitle: string;
  readinessVerdicts: Record<ReadinessVerdict, string>;
  rewardedExamBody: string;
  rewardedExamHeading: string;
  rewardedExamPreviewAccessibilityLabel: string;
  rewardedExamPreviewButton: string;
  rewardedExamUnlockAccessibilityLabel: string;
  rewardedExamUnlockButton: string;
  rewardedExamUnlockFailure: string;
  rewardedExamUnlockedCtaAccessibilityLabel: string;
  rewardedExamUnlockedCta: string;
  rewardedExamUnlockedStatus: string;
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
    dailyChallengeAccessibilityLabel: (title, subtitle, completed) =>
      `${title}. ${subtitle}. ${
        completed ? 'Dagens utmaning är redan klar.' : 'Starta dagens utmaning.'
      }`,
    dailyChallengeCta: (completed) => (completed ? 'Öva igen' : 'Starta utmaningen'),
    dayStreakFreezeHelper: (count) => `${count} svitskydd redo`,
    dashboardAccessibilityLabel: 'Öppna framstegsöversikten',
    dashboardLink: 'Visa framsteg',
    dayStreakHelper: 'daglig vana',
    dayStreakMetric: 'dagars svit',
    eyebrow: 'Studieöversikt',
    feedbackBadge: 'Fokuserad repetition',
    feedbackLink: 'Repetera sparade frågor',
    feedbackLinkAccessibilityLabel: 'Granska bokmärkta eller missade frågor',
    feedbackText:
      'Sparade och missade frågor samlas på ett ställe, med källstödda förklaringar och utan annonser i provläget.',
    feedbackTitle: 'Håll koll på det som behöver övas',
    guidedPathDailyAccessibilityLabel: (completed, goal) =>
      `Starta dagens övning. ${completed} av ${goal} svar klara idag.`,
    guidedPathDailyCta: 'Starta dagens övning',
    guidedPathDailyText: (completed, goal) => `${completed}/${goal} svar idag håller vanan synlig.`,
    guidedPathDailyTitle: 'Daglig övning',
    guidedPathResumeAccessibilityLabel: (stageTitle) => `Fortsätt på ${stageTitle}`,
    guidedPathResumeCta: 'Fortsätt på nästa kapitel',
    guidedPathStageStatuses: {
      active: 'Pågår',
      completed: 'Klar',
      upcoming: 'Nästa',
    },
    guidedPathStages: [
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Kapitel 1-4',
        cta: (isCompleted) => (isCompleted ? 'Gå till övningsprovet' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till övningsprovet när steget är klart.`
            : `${title}: öppna nästa kapitel i steget.`,
        description: 'Börja med landet, demokratin, styret och valen.',
        levelLabel: 'Nybörjare',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} kapitel provade`,
        title: 'Grunderna i Sverige och demokrati',
      },
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Kapitel 5-9',
        cta: (isCompleted) => (isCompleted ? 'Gå till övningsprovet' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till övningsprovet när steget är klart.`
            : `${title}: öppna nästa kapitel i steget.`,
        description: 'Bygg vidare med lag, medier, rättigheter, arbetsliv och välfärd.',
        levelLabel: 'Fortsättning',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} kapitel provade`,
        title: 'Rättigheter, medier och samhällsliv',
      },
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Kapitel 10-13',
        cta: (isCompleted) => (isCompleted ? 'Gå till övningsprovet' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till övningsprovet när steget är klart.`
            : `${title}: öppna nästa kapitel i steget.`,
        description:
          'Avsluta med moderna Sverige, internationella frågor, religionsfrihet och högtider.',
        levelLabel: 'Avancerad',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} kapitel provade`,
        title: 'Historia, omvärld, religion och traditioner',
      },
    ],
    guidedPathSubtitle:
      'Följ 13 samhällskapitel i tre steg, fortsätt där du var och håll igång dagens övning.',
    guidedPathTitle: 'Väg från grund till provträning',
    freeBankBadge: 'Hela banken gratis',
    freeBankText:
      'Alla 13 ämnen och hela frågebanken ingår gratis. Betala bara om du vill ta bort annonser från studieskärmar.',
    levelMetric: 'nivå',
    questionsHelper: (count) => `${count} kapitel`,
    questionsMetric: 'frågor',
    readinessAccessibilityLabel: (score, verdict, details) =>
      `Förberedelsesignal: ${score} procent. ${verdict}. ${details}. Bygger bara på dina svar och övningsprov i appen, inte en officiell prognos.`,
    readinessCaveat: 'Bygger bara på dina svar och övningsprov i appen, inte en officiell prognos.',
    readinessCta: 'Gör ett tidsatt övningsprov',
    readinessCtaAccessibilityLabel: 'Starta ett tidsatt övningsprov från kortet Förberedelsesignal',
    readinessQuickActionAccessibilityLabel: 'Starta ett tidsatt övningsprov från snabbåtgärderna',
    readinessDetails: (accuracyPercent, coveragePercent) =>
      `${accuracyPercent} % rätt i appen · ${coveragePercent} % av kapitlen provade`,
    readinessMetricLabel: 'lokalt',
    readinessSparseNote: 'Svara på fler frågor för en stabilare lokal signal.',
    readinessTitle: 'Förberedelsesignal',
    readinessVerdicts: {
      not_ready_yet: 'Bygg mer underlag',
      getting_there: 'Du gör framsteg',
      almost_ready: 'Stadig övning',
      strong_preparation: 'Stark övningsgrund',
    },
    rewardedExamBody:
      'När dagens kostnadsfria övningsprov är använt kan du låsa upp ett extra från startsidan. Krediten sparas först när den sponsrade förhandsvisningen är slutförd.',
    rewardedExamHeading: 'Lås upp ett extra övningsprov',
    rewardedExamPreviewAccessibilityLabel:
      'Slutför sponsrad förhandsvisning för ett extra övningsprov',
    rewardedExamPreviewButton: 'Slutför förhandsvisning',
    rewardedExamUnlockAccessibilityLabel: 'Lås upp ett extra övningsprov efter förhandsvisningen',
    rewardedExamUnlockButton: 'Lås upp extra övningsprov',
    rewardedExamUnlockFailure: 'Extra övningsprov kunde inte låsas upp just nu.',
    rewardedExamUnlockedCtaAccessibilityLabel: 'Starta det upplåsta extra övningsprovet',
    rewardedExamUnlockedCta: 'Starta upplåst övningsprov',
    rewardedExamUnlockedStatus: 'Extra övningsprov upplåst.',
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
        label: 'Tidsatt övning',
        lesson:
          'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
      },
    ],
    studyLoopSubtitle:
      'Välj ett tydligt nästa steg, få snabb återkoppling och följ framstegen utan att provläget störs.',
    studyLoopTitle: 'Smarta studievanor',
    subtitle:
      'En tydlig väg för svensk samhällskunskap: dagliga svar, realistiska prov, genomgång av frågor du missat och källstödda förklaringar.',
    title: 'Studera lugnt, ett samhällsbegrepp i taget',
    weakChaptersHelper: 'behöver repetition',
    weakChaptersMetric: 'svaga kapitel',
    xpBasedHelper: 'XP-baserad',
  },
  en: {
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Browse all civic chapters',
    dailyGoalTitle: "Today's goal",
    dailyChallengeAccessibilityLabel: (title, subtitle, completed) =>
      `${title}. ${subtitle}. ${
        completed ? "Today's challenge is already complete." : "Start today's challenge."
      }`,
    dailyChallengeCta: (completed) => (completed ? 'Practise again' : 'Start challenge'),
    dayStreakFreezeHelper: (count) => `${count} streak freeze ready`,
    dashboardAccessibilityLabel: 'Open progress dashboard',
    dashboardLink: 'View dashboard',
    dayStreakHelper: 'daily habit',
    dayStreakMetric: 'day streak',
    eyebrow: 'Study dashboard',
    feedbackBadge: 'Focused review',
    feedbackLink: 'Review saved questions',
    feedbackLinkAccessibilityLabel: 'Review bookmarked or missed questions',
    feedbackText:
      'Saved and missed questions stay in one place, with source-backed explanations and no ads in exam mode.',
    feedbackTitle: 'Keep track of what needs review',
    guidedPathDailyAccessibilityLabel: (completed, goal) =>
      `Start today's practice. ${completed} of ${goal} answers complete today.`,
    guidedPathDailyCta: "Start today's practice",
    guidedPathDailyText: (completed, goal) =>
      `${completed}/${goal} answers today keeps the habit visible.`,
    guidedPathDailyTitle: 'Daily practice',
    guidedPathResumeAccessibilityLabel: (stageTitle) => `Continue with ${stageTitle}`,
    guidedPathResumeCta: 'Continue the next chapter',
    guidedPathStageStatuses: {
      active: 'In progress',
      completed: 'Done',
      upcoming: 'Next',
    },
    guidedPathStages: [
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Chapters 1-4',
        cta: (isCompleted) => (isCompleted ? 'Go to mock exam' : 'Open next chapter'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: go to the mock exam after completing this stage.`
            : `${title}: open the next chapter in this stage.`,
        description: 'Start with Sweden, democracy, government, and elections.',
        levelLabel: 'Beginner',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} chapters tried`,
        title: 'Sweden and democracy basics',
      },
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Chapters 5-9',
        cta: (isCompleted) => (isCompleted ? 'Go to mock exam' : 'Open next chapter'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: go to the mock exam after completing this stage.`
            : `${title}: open the next chapter in this stage.`,
        description: 'Build through law, media, rights, working life, and welfare.',
        levelLabel: 'Builder',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} chapters tried`,
        title: 'Rights, media, and civic life',
      },
      {
        accessibilityLabel: (title, chapterRange, progressLabel, status) =>
          `${title}. ${chapterRange}. ${progressLabel}. ${status}.`,
        chapterRange: 'Chapters 10-13',
        cta: (isCompleted) => (isCompleted ? 'Go to mock exam' : 'Open next chapter'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: go to the mock exam after completing this stage.`
            : `${title}: open the next chapter in this stage.`,
        description:
          'Finish with modern Sweden, international topics, freedom of religion, and holidays.',
        levelLabel: 'Advanced',
        progressLabel: (completedChapters, totalChapters) =>
          `${completedChapters}/${totalChapters} chapters tried`,
        title: 'History, the wider world, religion, and traditions',
      },
    ],
    guidedPathSubtitle:
      "Follow 13 civic chapters in three stages, resume where you left off, and keep today's practice visible.",
    guidedPathTitle: 'Guided path from basics to exam practice',
    freeBankBadge: 'Full bank free',
    freeBankText:
      'All 13 topics and the full question bank are included for free. Pay only if you want to remove ads from study screens.',
    levelMetric: 'level',
    questionsHelper: (count) => `${count} chapters`,
    questionsMetric: 'questions',
    readinessAccessibilityLabel: (score, verdict, details) =>
      `Preparation signal: ${score} percent. ${verdict}. ${details}. Based only on your in-app answers and mock practice, not an official result forecast.`,
    readinessCaveat:
      'Based only on your in-app answers and mock practice, not an official result forecast.',
    readinessCta: 'Take a timed practice exam',
    readinessCtaAccessibilityLabel: 'Start a timed practice exam from the Preparation signal card',
    readinessQuickActionAccessibilityLabel: 'Start a timed practice exam from quick actions',
    readinessDetails: (accuracyPercent, coveragePercent) =>
      `${accuracyPercent}% in-app accuracy · ${coveragePercent}% chapters tried`,
    readinessMetricLabel: 'local',
    readinessSparseNote: 'Answer more questions for a steadier local signal.',
    readinessTitle: 'Preparation signal',
    readinessVerdicts: {
      not_ready_yet: 'Build more evidence',
      getting_there: 'Making progress',
      almost_ready: 'Steady practice',
      strong_preparation: 'Strong practice base',
    },
    rewardedExamBody:
      'When the daily free mock exam is used, unlock one extra from Home. The credit is stored only after the sponsored preview is completed.',
    rewardedExamHeading: 'Unlock an extra mock exam',
    rewardedExamPreviewAccessibilityLabel: 'Complete the sponsored preview for an extra mock exam',
    rewardedExamPreviewButton: 'Complete sponsor preview',
    rewardedExamUnlockAccessibilityLabel: 'Unlock an extra mock exam after the preview',
    rewardedExamUnlockButton: 'Unlock extra mock exam',
    rewardedExamUnlockFailure: 'Extra mock exam could not be unlocked right now.',
    rewardedExamUnlockedCtaAccessibilityLabel: 'Start the unlocked extra mock exam',
    rewardedExamUnlockedCta: 'Start unlocked mock exam',
    rewardedExamUnlockedStatus: 'Extra mock exam unlocked.',
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
        lesson: 'See which areas are solid, reviewed, or still weak.',
      },
      {
        label: 'Study rhythm',
        lesson:
          'Get one simple next action and gentle habit feedback without blocking serious study.',
      },
      {
        label: 'Timed practice',
        lesson:
          'Switch between timed practice exams, bookmarks, missed-question review, audio, and preparation signals.',
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
  const [rewardPreviewCompleted, setRewardPreviewCompleted] = useState(false);
  const [rewardUnlockInFlight, setRewardUnlockInFlight] = useState(false);
  const [rewardUnlockMessage, setRewardUnlockMessage] = useState<string | null>(null);
  const {
    accessDecision,
    accessReady,
    entitlements: monetizationEntitlements,
    entitlementsReady,
    grantRewardedExamCredit,
    purchaseRuntime,
    setEntitlements: setMonetizationEntitlements,
  } = useMockExamAccess();
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const mockExamSessions = useProgressStore((state) => state.mockExamSessions);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const streakFreezeState = useProgressStore((state) => state.streakFreezeState);
  const setStreakFreezeState = useProgressStore((state) => state.setStreakFreezeState);
  const dailyChallengeCompletions = useProgressStore((state) => state.dailyChallengeCompletions);
  const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);
  const language = useSettingsStore((state) => state.language);
  const copy = homeCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const dailyChallenge = buildDailyChallenge({ bank: questions });
  const dailyChallengeCompleted = isDailyChallengeCompleted(Object.keys(dailyChallengeCompletions));
  const dailyChallengeCopy = dailyChallengeBannerCopy(dailyChallengeCompleted, language);
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
  const showRemoveAdsOffer = entitlementsReady && !monetizationEntitlements.adsDisabled;
  const rewardedExamUnlocked = accessDecision.reason === 'rewarded_exam_credit';
  const showRewardedExamOffer =
    accessReady && entitlementsReady && (accessDecision.canOfferRewardedAd || rewardedExamUnlocked);

  const handleCompleteRewardPreview = useCallback(() => {
    setRewardPreviewCompleted(true);
    setRewardUnlockMessage(null);
  }, []);

  const handleUnlockRewardedExam = useCallback(async () => {
    if (
      !rewardPreviewCompleted ||
      rewardUnlockInFlight ||
      rewardedExamUnlocked ||
      !accessDecision.canOfferRewardedAd
    ) {
      return;
    }

    setRewardUnlockInFlight(true);
    setRewardUnlockMessage(null);

    try {
      const result = await showRewardedExtraExamAd({
        confirmReward: () => rewardPreviewCompleted,
        entitlements: monetizationEntitlements,
      });

      if (result.status !== 'earned_reward') {
        setRewardUnlockMessage(copy.rewardedExamUnlockFailure);
        return;
      }

      await grantRewardedExamCredit();
      setRewardUnlockMessage(copy.rewardedExamUnlockedStatus);
    } catch {
      setRewardUnlockMessage(copy.rewardedExamUnlockFailure);
    } finally {
      setRewardUnlockInFlight(false);
    }
  }, [
    accessDecision.canOfferRewardedAd,
    copy.rewardedExamUnlockFailure,
    copy.rewardedExamUnlockedStatus,
    grantRewardedExamCredit,
    monetizationEntitlements,
    rewardPreviewCompleted,
    rewardUnlockInFlight,
    rewardedExamUnlocked,
  ]);

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
      <CountdownBanner language={language} />
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
        <Text style={styles.readinessCaveat}>{copy.readinessCaveat}</Text>
        {readiness.isSparse ? (
          <Text style={styles.readinessSparseNote}>{copy.readinessSparseNote}</Text>
        ) : null}
        <Link
          aria-label={copy.readinessCtaAccessibilityLabel}
          accessibilityLabel={copy.readinessCtaAccessibilityLabel}
          accessibilityRole="link"
          href="/exam"
          style={styles.readinessLink}
        >
          {copy.readinessCta}
        </Link>
      </Card>
      <SocialProofRow language={language} />
      {showRewardedExamOffer ? (
        <Card style={styles.rewardedExamCard}>
          <Badge tone={rewardedExamUnlocked ? 'blue' : 'warm'}>
            {language === 'sv' ? 'Extra prov' : 'Extra exam'}
          </Badge>
          <Text accessibilityRole="header" style={styles.rewardedExamTitle}>
            {copy.rewardedExamHeading}
          </Text>
          <Text style={styles.rewardedExamText}>{copy.rewardedExamBody}</Text>
          {rewardUnlockMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              aria-live="polite"
              style={styles.rewardedExamStatus}
            >
              {rewardUnlockMessage}
            </Text>
          ) : null}
          {rewardedExamUnlocked ? (
            <Link
              accessibilityLabel={copy.rewardedExamUnlockedCtaAccessibilityLabel}
              accessibilityRole="link"
              href="/exam"
              style={styles.rewardedExamLink}
            >
              {copy.rewardedExamUnlockedCta}
            </Link>
          ) : (
            <View style={styles.rewardedExamActions}>
              <Button
                accessibilityLabel={copy.rewardedExamPreviewAccessibilityLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled: rewardPreviewCompleted }}
                disabled={rewardPreviewCompleted}
                onPress={handleCompleteRewardPreview}
                style={styles.rewardedExamButton}
                variant="secondary"
              >
                {copy.rewardedExamPreviewButton}
              </Button>
              <Button
                accessibilityLabel={copy.rewardedExamUnlockAccessibilityLabel}
                accessibilityRole="button"
                accessibilityState={{
                  busy: rewardUnlockInFlight,
                  disabled: !rewardPreviewCompleted || rewardUnlockInFlight,
                }}
                disabled={!rewardPreviewCompleted || rewardUnlockInFlight}
                onPress={handleUnlockRewardedExam}
                style={styles.rewardedExamButton}
              >
                {copy.rewardedExamUnlockButton}
              </Button>
            </View>
          )}
        </Card>
      ) : null}
      <Card style={styles.dailyChallengeCard}>
        <Badge tone={dailyChallengeCompleted ? 'blue' : 'warm'}>{dailyChallengeCopy.title}</Badge>
        <Text style={styles.dailyChallengeText}>{dailyChallengeCopy.subtitle}</Text>
        <Text style={styles.dailyChallengeMeta}>
          {dailyChallenge.questionIds.length}{' '}
          {language === 'sv' ? 'frågor valda för idag' : 'questions selected for today'}
        </Text>
        <Link
          accessibilityLabel={copy.dailyChallengeAccessibilityLabel(
            dailyChallengeCopy.title,
            dailyChallengeCopy.subtitle,
            dailyChallengeCompleted,
          )}
          accessibilityRole="link"
          href="/practice?mode=challenge"
          style={styles.dailyChallengeLink}
        >
          {copy.dailyChallengeCta(dailyChallengeCompleted)}
        </Link>
      </Card>
      {showRemoveAdsOffer ? (
        <PricingWedge
          questionCount={questions.length}
          chapterCount={chapters.length}
          language={language}
        />
      ) : null}
      <View style={styles.quickActions}>
        <RouteLink
          accessibilityLabel={copy.startPracticeAccessibilityLabel}
          href="/practice"
          style={styles.quickActionLink}
          variant="primary"
        >
          {copy.startPractice}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.browseChaptersAccessibilityLabel}
          href="/learn"
          style={styles.quickActionLink}
          variant="secondary"
        >
          {copy.browseChapters}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.readinessQuickActionAccessibilityLabel}
          href="/exam"
          style={styles.quickActionLink}
          variant="secondary"
        >
          {copy.readinessCta}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.feedbackLinkAccessibilityLabel}
          href="/mistakes"
          style={styles.quickActionLink}
          variant="secondary"
        >
          {copy.feedbackLink}
        </RouteLink>
        <RouteLink
          accessibilityLabel={copy.dashboardAccessibilityLabel}
          href="/dashboard"
          style={styles.quickActionLink}
          variant="secondary"
        >
          {copy.dashboardLink}
        </RouteLink>
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
            <Card key={item.product} style={styles.loopCard}>
              <Badge tone="warm">{itemCopy.label}</Badge>
              <Text style={styles.loopText}>{itemCopy.lesson}</Text>
            </Card>
          );
        })}
      </View>

      {entitlementsReady ? (
        <>
          <PremiumBanner
            entitlements={monetizationEntitlements}
            language={language}
            onEntitlementsChange={setMonetizationEntitlements}
            runtimeOptions={purchaseRuntime}
          />
          <AdBanner entitlements={monetizationEntitlements} placement="home_banner" />
        </>
      ) : null}
    </ScreenShell>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
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
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    readinessVerdict: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    readinessScorePill: {
      alignItems: 'center',
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.focusSoft,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      minWidth: space[9],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    readinessScore: {
      color: themeColors.text,
      fontSize: typography.subHeadingLarge.fontSize,
      fontWeight: typography.subHeadingLarge.fontWeight,
      lineHeight: typography.subHeadingLarge.lineHeight,
    },
    readinessMetric: {
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    readinessDetail: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    readinessCaveat: {
      color: themeColors.textDisclaimer,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    readinessSparseNote: {
      color: themeColors.textDisclaimer,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    readinessLink: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surfaceMuted,
      borderRadius: radius.micro,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      justifyContent: 'center',
      marginTop: space[0.5],
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
    goalCard: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[2],
    },
    goalLabel: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
    },
    goalMetric: {
      color: themeColors.text,
      fontSize: typography.subHeadingLarge.fontSize,
      fontWeight: typography.subHeadingLarge.fontWeight,
      lineHeight: typography.subHeadingLarge.lineHeight,
    },
    goalHint: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    rewardedExamCard: {
      gap: space[1],
    },
    rewardedExamTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    rewardedExamText: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    rewardedExamStatus: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    rewardedExamActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    rewardedExamButton: {
      flexBasis: 210,
      flexGrow: 1,
      maxWidth: '100%',
    },
    rewardedExamLink: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.accent,
      borderRadius: radius.micro,
      color: themeColors.surface,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      justifyContent: 'center',
      marginTop: space[0.5],
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
    dailyChallengeCard: {
      gap: space[1],
    },
    dailyChallengeText: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    dailyChallengeMeta: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    dailyChallengeLink: {
      alignSelf: 'flex-start',
      backgroundColor: themeColors.accent,
      borderRadius: radius.micro,
      color: themeColors.surface,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      marginTop: space[0.5],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1.5],
    },
    quickActionLink: {
      flexBasis: 180,
      flexGrow: 1,
    },
    statsRow: {
      flexDirection: 'row',
      gap: space[1.5],
    },
    streakFreezeCard: {
      gap: space[1],
    },
    streakFreezeText: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    feedbackCard: {
      gap: space[1],
    },
    feedbackTitle: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      letterSpacing: typography.cardTitle.letterSpacing,
      lineHeight: typography.cardTitle.lineHeight,
    },
    feedbackText: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    feedbackLink: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surfaceMuted,
      borderRadius: radius.micro,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      justifyContent: 'center',
      marginTop: space[0.5],
      minHeight: space[6],
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
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
