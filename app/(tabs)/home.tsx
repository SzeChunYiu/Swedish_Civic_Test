import { Link } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  GuidedPracticePath,
  type GuidedPracticePathCopy,
  type GuidedPracticePathStage,
} from '../../components/learning/GuidedPracticePath';
import { AdBanner } from '../../components/monetization/AdBanner';
import { PremiumBanner } from '../../components/monetization/PremiumBanner';
import { PricingWedge } from '../../components/monetization/PricingWedge';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CountdownBanner } from '../../components/ui/CountdownBanner';
import { MetricCard } from '../../components/ui/MetricCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScreenShell, SectionHeader } from '../../components/ui/ScreenShell';
import { SocialProofRow } from '../../components/ui/SocialProofRow';
import { StatCallout } from '../../components/ui/StatCallout';
import { SwedishFlagBand } from '../../components/ui/SwedishFlagBand';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { uxBenchmarks } from '../../data/uxBenchmarks';
import { dashboardSummary } from '../../lib/learning/dashboardStats';
import { buildDashboardProgressSnapshot } from '../../lib/learning/dashboardProgressSnapshot';
import { findWeakChapterIds } from '../../lib/learning/mastery';
import {
  computeReadinessFromQuestionProgress,
  type ReadinessVerdict,
} from '../../lib/learning/readiness';
import { resumeBannerCopy, resumeWhereLeftOff } from '../../lib/learning/resumeWhereLeftOff';
import { calculateStreakWithFreeze, freezeBannerCopy } from '../../lib/learning/streakWithFreeze';
import { countAnswersForLocalDate } from '../../lib/learning/streaks';
import { calculateLevel } from '../../lib/learning/xp';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useProgressStore, type QuestionProgress } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { UserProgress } from '../../types/progress';

type StudyLoopItemCopy = {
  label: string;
  lesson: string;
};

type GuidedPathStageCopy = {
  accessibilityLabel: (
    title: string,
    chapterRange: string,
    progress: string,
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
  dashboardAccessibilityLabel: (summary: string) => string;
  dashboardCta: string;
  dashboardSummary: (count: number) => string;
  dashboardTitle: string;
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
  levelMetric: string;
  questionsHelper: (count: number) => string;
  questionsMetric: string;
  readinessAccessibilityLabel: (score: number, verdict: string, details: string) => string;
  readinessCta: string;
  readinessCtaAccessibilityLabel: string;
  readinessDetails: (accuracyPercent: number, coveragePercent: number) => string;
  readinessMetricLabel: string;
  readinessSparseNote: string;
  readinessTitle: string;
  readinessVerdicts: Record<ReadinessVerdict, string>;
  resumeAccessibilityLabel: (chapterTitle: string, subtitle: string) => string;
  resumeCta: (chapterTitle: string) => string;
  resumeKicker: string;
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

const guidedPathChapterGroups = [
  { id: 'beginner', chapterIds: ['ch01', 'ch02', 'ch03', 'ch04'] },
  { id: 'builder', chapterIds: ['ch05', 'ch06', 'ch07', 'ch08', 'ch09'] },
  { id: 'advanced', chapterIds: ['ch10', 'ch11', 'ch12', 'ch13'] },
] as const;

const questionChapterIndex: Record<string, string> = Object.fromEntries(
  questions.map((question) => [question.id, question.chapterId]),
);

function buildResumeProgress(questionProgress: Record<string, QuestionProgress>): UserProgress {
  const answers = Object.values(questionProgress)
    .filter((progress) => progress.lastAnsweredAt)
    .map((progress) => ({
      questionId: progress.questionId,
      selectedOptionIds: [],
      isCorrect: progress.correctCount > 0,
      answeredAt: progress.lastAnsweredAt ?? '',
      timeSpentSeconds: 0,
    }))
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));

  const startedAt = answers[0]?.answeredAt ?? new Date(0).toISOString();
  const completedAt = answers[answers.length - 1]?.answeredAt;

  return {
    currentStreak: 0,
    dailyGoalAnswers: 0,
    level: 1,
    questionProgress,
    sessions: answers.length
      ? [
          {
            id: 'persisted-question-progress',
            mode: 'study',
            questionIds: answers.map((answer) => answer.questionId),
            answers,
            startedAt,
            completedAt,
          },
        ]
      : [],
    totalXp: 0,
  };
}

function getAnsweredChapterIds(questionProgress: Record<string, QuestionProgress>) {
  const answeredChapterIds = new Set<string>();

  questions.forEach((question) => {
    const progress = questionProgress[question.id];
    const hasAnswered =
      (progress?.seenCount ?? 0) > 0 ||
      (progress?.correctCount ?? 0) > 0 ||
      (progress?.wrongCount ?? 0) > 0;

    if (hasAnswered) answeredChapterIds.add(question.chapterId);
  });

  return answeredChapterIds;
}

function buildGuidedPracticePathStages(
  copy: HomeCopy,
  questionProgress: Record<string, QuestionProgress>,
): GuidedPracticePathStage[] {
  const answeredChapterIds = getAnsweredChapterIds(questionProgress);
  const progressByGroup = guidedPathChapterGroups.map((group) => {
    const completedChapterCount = group.chapterIds.filter((chapterId) =>
      answeredChapterIds.has(chapterId),
    ).length;

    return {
      ...group,
      completedChapterCount,
      progress: completedChapterCount / group.chapterIds.length,
    };
  });
  const activeGroupId =
    progressByGroup.find((group) => group.completedChapterCount < group.chapterIds.length)?.id ??
    'advanced';

  return progressByGroup.map((group, index) => {
    const stageCopy = copy.guidedPathStages[index];
    const progressLabel = stageCopy.progressLabel(
      group.completedChapterCount,
      group.chapterIds.length,
    );
    const isCompleted = group.completedChapterCount === group.chapterIds.length;
    const isActive = group.id === activeGroupId;
    const statusLabel = isCompleted
      ? copy.guidedPathStageStatuses.completed
      : isActive
        ? copy.guidedPathStageStatuses.active
        : copy.guidedPathStageStatuses.upcoming;
    const nextChapterId = group.chapterIds.find((chapterId) => !answeredChapterIds.has(chapterId));
    const href = nextChapterId
      ? (`/chapter/${nextChapterId}` as GuidedPracticePathStage['href'])
      : '/exam';

    return {
      accessibilityLabel: stageCopy.accessibilityLabel(
        stageCopy.title,
        stageCopy.chapterRange,
        progressLabel,
        statusLabel,
      ),
      chapterRange: stageCopy.chapterRange,
      cta: stageCopy.cta(isCompleted),
      ctaAccessibilityLabel: stageCopy.ctaAccessibilityLabel(stageCopy.title, isCompleted),
      description: stageCopy.description,
      href,
      id: group.id,
      isActive,
      levelLabel: stageCopy.levelLabel,
      progress: group.progress,
      progressLabel,
      statusLabel,
      title: stageCopy.title,
    };
  });
}

const homeCopy: Record<AppLanguage, HomeCopy> = {
  sv: {
    browseChapters: 'Bläddra bland kapitel',
    browseChaptersAccessibilityLabel: 'Bläddra bland alla samhällskapitel',
    dailyGoalTitle: 'Dagens mål',
    dashboardAccessibilityLabel: (summary) => `Öppna framstegsöversikten. ${summary}`,
    dashboardCta: 'Visa översikt',
    dashboardSummary: (count) => `${count} svar den här veckan`,
    dashboardTitle: 'Framstegsöversikt',
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
        cta: (isCompleted) => (isCompleted ? 'Gå till mockprov' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till mockprov när steget är klart.`
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
        cta: (isCompleted) => (isCompleted ? 'Gå till mockprov' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till mockprov när steget är klart.`
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
        cta: (isCompleted) => (isCompleted ? 'Gå till mockprov' : 'Öppna nästa kapitel'),
        ctaAccessibilityLabel: (title, isCompleted) =>
          isCompleted
            ? `${title}: gå till mockprov när steget är klart.`
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
    levelMetric: 'nivå',
    questionsHelper: (count) => `${count} kapitel`,
    questionsMetric: 'frågor',
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
    resumeAccessibilityLabel: (chapterTitle, subtitle) =>
      `Fortsätt där du slutade i ${chapterTitle}. ${subtitle}`,
    resumeCta: (chapterTitle) => `Fortsätt ${chapterTitle}`,
    resumeKicker: 'Senaste övning',
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
        lesson: 'Växla mellan tidsatta prov, bokmärken, missade frågor, ljud och redoindikator.',
      },
    ],
    studyLoopSubtitle:
      'Välj ett tydligt nästa steg, få snabb återkoppling och följ framstegen utan att provläget störs.',
    studyLoopTitle: 'Smarta studievanor',
    subtitle:
      'En tydlig väg för svenska samhällskunskaper: dagliga svar, realistiska prov, genomgång av frågor du missat och källstödda förklaringar.',
    title: 'Studera lugnt, ett samhällsbegrepp i taget',
    weakChaptersHelper: 'behöver repetition',
    weakChaptersMetric: 'svaga kapitel',
    xpBasedHelper: 'XP-baserad',
  },
  en: {
    browseChapters: 'Browse chapters',
    browseChaptersAccessibilityLabel: 'Browse all civic chapters',
    dailyGoalTitle: "Today's goal",
    dashboardAccessibilityLabel: (summary) => `Open the progress dashboard. ${summary}`,
    dashboardCta: 'View dashboard',
    dashboardSummary: (count) => `${count} answers this week`,
    dashboardTitle: 'Progress dashboard',
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
    levelMetric: 'level',
    questionsHelper: (count) => `${count} chapters`,
    questionsMetric: 'questions',
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
    resumeAccessibilityLabel: (chapterTitle, subtitle) =>
      `Continue where you left off in ${chapterTitle}. ${subtitle}`,
    resumeCta: (chapterTitle) => `Resume ${chapterTitle}`,
    resumeKicker: 'Recent practice',
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
          'Switch between timed exams, bookmarks, mistake tracking, audio, and readiness signals.',
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
    entitlementsReady: monetizationEntitlementsReady,
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
  const dashboardProgress = useMemo(
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
  const dashboardQuestionChapterIndex = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, question.chapterId])),
    [],
  );
  const dashboard = useMemo(
    () => dashboardSummary(dashboardProgress, dashboardQuestionChapterIndex),
    [dashboardProgress, dashboardQuestionChapterIndex],
  );
  const dashboardSummaryLine = copy.dashboardSummary(dashboard.questionsAnsweredThisWeek);
  const resumeCandidate = useMemo(
    () =>
      resumeWhereLeftOff({
        progress: buildResumeProgress(questionProgress),
        questionChapterIndex,
      }),
    [questionProgress],
  );
  const resumeChapter = chapters.find((chapter) => chapter.id === resumeCandidate.chapterId);
  const resumeChapterTitle =
    resumeChapter && (language === 'sv' ? resumeChapter.nameSv : resumeChapter.nameEn);
  const resumeCopy = resumeBannerCopy(resumeCandidate, language);
  const resumeSubtitle = resumeCopy.subtitle;
  const resumeAccessibilityLabel =
    resumeChapterTitle && resumeSubtitle
      ? copy.resumeAccessibilityLabel(resumeChapterTitle, resumeSubtitle)
      : null;
  const guidedPathStages = useMemo(
    () => buildGuidedPracticePathStages(copy, questionProgress),
    [copy, questionProgress],
  );
  const guidedPathActiveStage =
    guidedPathStages.find((stage) => stage.isActive) ?? guidedPathStages[0];
  const guidedPathResumeHref = guidedPathActiveStage?.href ?? '/learn';
  const guidedPathCopy: GuidedPracticePathCopy = {
    dailyPracticeAccessibilityLabel: copy.guidedPathDailyAccessibilityLabel(
      completedToday,
      dailyGoalAnswers,
    ),
    dailyPracticeCta: copy.guidedPathDailyCta,
    dailyPracticeText: copy.guidedPathDailyText(completedToday, dailyGoalAnswers),
    dailyPracticeTitle: copy.guidedPathDailyTitle,
    resumeAccessibilityLabel: copy.guidedPathResumeAccessibilityLabel(
      guidedPathActiveStage?.title ?? copy.guidedPathStages[0].title,
    ),
    resumeCta: copy.guidedPathResumeCta,
  };

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
      <Link
        accessibilityLabel={copy.dashboardAccessibilityLabel(dashboardSummaryLine)}
        accessibilityRole="link"
        href="/dashboard"
        style={styles.dashboardLink}
      >
        <View style={styles.dashboardLinkContent}>
          <Text style={styles.dashboardTitle}>{copy.dashboardTitle}</Text>
          <Text style={styles.dashboardSummaryText}>{dashboardSummaryLine}</Text>
          <Text style={styles.dashboardCta}>{copy.dashboardCta}</Text>
        </View>
      </Link>
      {resumeChapter && resumeChapterTitle && resumeSubtitle && resumeAccessibilityLabel ? (
        <Card style={styles.resumeCard}>
          <Badge tone="warm">{copy.resumeKicker}</Badge>
          <Text accessibilityRole="header" style={styles.resumeTitle}>
            {resumeCopy.title}
          </Text>
          <Text style={styles.resumeChapter}>{resumeChapterTitle}</Text>
          <Text style={styles.resumeText}>{resumeSubtitle}</Text>
          <Link
            accessibilityLabel={resumeAccessibilityLabel}
            accessibilityRole="link"
            href={`/chapter/${resumeChapter.id}`}
            style={styles.resumeLink}
          >
            {copy.resumeCta(resumeChapterTitle)}
          </Link>
        </Card>
      ) : null}
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
      {monetizationEntitlementsReady && !monetizationEntitlements.adsDisabled ? (
        <PricingWedge
          questionCount={questions.length}
          chapterCount={chapters.length}
          language={language}
        />
      ) : null}
      <View style={styles.actions}>
        <Link
          accessibilityLabel={copy.startPracticeAccessibilityLabel}
          accessibilityRole="link"
          href="/practice"
          style={styles.primaryLink}
        >
          {copy.startPractice}
        </Link>
        <Link
          accessibilityLabel={copy.browseChaptersAccessibilityLabel}
          accessibilityRole="link"
          href="/learn"
          style={styles.secondaryLink}
        >
          {copy.browseChapters}
        </Link>
      </View>

      <SectionHeader title={copy.guidedPathTitle} subtitle={copy.guidedPathSubtitle} />
      <GuidedPracticePath
        copy={guidedPathCopy}
        dailyProgress={progress}
        language={language}
        resumeHref={guidedPathResumeHref}
        stages={guidedPathStages}
      />

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

      {monetizationEntitlementsReady ? (
        <PremiumBanner
          entitlements={monetizationEntitlements}
          language={language}
          onEntitlementsChange={setMonetizationEntitlements}
          runtimeOptions={purchaseRuntime}
        />
      ) : null}
      <AdBanner placement="home_banner" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  dashboardLink: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: space[6],
    padding: space[2],
    textDecorationLine: 'none',
  },
  dashboardLinkContent: {
    gap: space[0.5],
  },
  dashboardTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  dashboardSummaryText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  dashboardCta: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
  },
  resumeCard: {
    gap: space[1],
  },
  resumeTitle: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  resumeChapter: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    lineHeight: typography.subHeading.lineHeight,
  },
  resumeText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  resumeLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    marginTop: space[0.5],
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  primaryLink: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
  secondaryLink: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
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
