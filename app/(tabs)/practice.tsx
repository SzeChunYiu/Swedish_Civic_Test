import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { Badge } from '../../components/ui/Badge';
import { PracticeInterstitialAd } from '../../components/monetization/PracticeInterstitialAd';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { PostAnswerRewardPanel } from '../../components/quiz/PostAnswerRewardPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { buildAnswerFeedbackSpeechText, buildQuestionSpeechText } from '../../lib/audio/speak';
import { filterQuestionsByProvenance } from '../../lib/content/provenance';
import {
  buildDailyChallenge,
  DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
  isDailyChallengeCompleted,
} from '../../lib/learning/dailyChallenge';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import {
  getCompletedQuestionIdsForQuestionBank,
  getPracticeQuestionForSession,
  getQuestionsForPracticeScope,
  type PracticeScope,
} from '../../lib/quiz/practiceFlow';
import {
  getPracticeInterstitialShowKey,
  usePracticeSessionStore,
} from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';

type PracticeHeaderControl = 'bookmark' | 'supplementary' | 'sources';

type ChapterPracticeSummary = {
  accuracy: number;
  answered: number;
  description: string;
  id: string;
  title: string;
  total: number;
};

type PracticeCopy = {
  badge: string;
  bookmark: string;
  bookmarked: string;
  bookmarkAccessibilityLabel: (isBookmarked: boolean) => string;
  allPracticeAccessibilityLabel: string;
  allPracticeBody: string;
  allPracticeCta: string;
  allPracticeTitle: string;
  chapterAccuracyLabel: (accuracy: number) => string;
  chapterCardAccessibilityLabel: (
    title: string,
    answered: number,
    total: number,
    accuracy: number,
  ) => string;
  chapterHubSubtitle: string;
  chapterHubTitle: string;
  chapterProgressLabel: (answered: number, total: number) => string;
  chapterStartCta: string;
  completedQuestions: (count: number) => string;
  challengeBadge: string;
  challengeCompletedTitle: string;
  challengeCompletedSubtitle: string;
  challengeHome: string;
  challengeHomeAccessibilityLabel: string;
  challengeProgress: (answeredCount: number, totalCount: number) => string;
  challengeQuestionTitle: (questionNumber: number, totalCount: number) => string;
  challengeResult: (correctCount: number, totalCount: number) => string;
  challengeRetry: string;
  challengeRetryAccessibilityLabel: string;
  challengeSubtitle: string;
  challengeTimer: (seconds: number) => string;
  emptyTitle: string;
  hubBadge: string;
  hubProgressSummary: (completed: number, total: number) => string;
  hubSubtitle: string;
  hubTitle: string;
  mockExamAccessibilityLabel: string;
  mockExamBody: string;
  mockExamCta: string;
  mockExamTitle: string;
  nextQuestion: string;
  nextQuestionAccessibilityLabel: string;
  questionTitle: (questionNumber: number) => string;
  quickRoundAccessibilityLabel: (count: number) => string;
  quickRoundBody: (count: number) => string;
  quickRoundCta: string;
  quickRoundTitle: string;
  scoreLabel: string;
  subtitle: string;
  tryAgain: string;
  tryAgainAccessibilityLabel: string;
  supplementaryToggleOn: string;
  supplementaryToggleOff: string;
  provenanceUhrLabel: string;
  provenanceSupplementaryLabel: string;
  provenanceEditorialLabel: string;
  aboutSourcesShow: string;
  aboutSourcesHide: string;
  aboutSourcesUhrTitle: string;
  aboutSourcesUhrBody: string;
  aboutSourcesSupplementaryTitle: string;
  aboutSourcesSupplementaryBody: string;
  aboutSourcesEditorialTitle: string;
  aboutSourcesEditorialBody: string;
};

const practiceCopy: Record<AppLanguage, PracticeCopy> = {
  sv: {
    badge: '5-minutersövning',
    bookmark: 'Bokmärk',
    bookmarked: 'Bokmärkt',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Ta bort bokmärket från den här frågan' : 'Bokmärk den här frågan',
    allPracticeAccessibilityLabel: 'Starta övning med alla synliga frågor',
    allPracticeBody: 'Fortsätt genom hela frågebanken i ordning med direkt återkoppling.',
    allPracticeCta: 'Starta alla frågor',
    allPracticeTitle: 'Alla frågor',
    chapterAccuracyLabel: (accuracy) => `Träffsäkerhet: ${accuracy} %`,
    chapterCardAccessibilityLabel: (title, answered, total, accuracy) =>
      `${title}: ${answered} av ${total} frågor besvarade, ${accuracy} % träffsäkerhet. Öva kapitlet.`,
    chapterHubSubtitle: 'Välj ett kapitel när du vill fokusera på ett område i taget.',
    chapterHubTitle: 'Öva per kapitel',
    chapterProgressLabel: (answered, total) => `${answered} av ${total} frågor besvarade`,
    chapterStartCta: 'Öva kapitlet',
    completedQuestions: (count) => `Besvarade frågor: ${count}`,
    challengeBadge: 'Dagens utmaning',
    challengeCompletedTitle: 'Dagens utmaning är klar',
    challengeCompletedSubtitle:
      'Resultatet sparas lokalt för dagens datum. Du kan göra om passet utan konto.',
    challengeHome: 'Till startsidan',
    challengeHomeAccessibilityLabel: 'Gå tillbaka till startsidan efter dagens utmaning',
    challengeProgress: (answeredCount, totalCount) =>
      `Dagens utmaning: ${answeredCount}/${totalCount} besvarade`,
    challengeQuestionTitle: (questionNumber, totalCount) =>
      `Dagens fråga ${questionNumber} av ${totalCount}`,
    challengeResult: (correctCount, totalCount) => `${correctCount}/${totalCount} rätt`,
    challengeRetry: 'Gör om utmaningen',
    challengeRetryAccessibilityLabel: 'Gör om dagens utmaning',
    challengeSubtitle:
      'Fem fasta frågor för dagens datum. Timern fortsätter tills passet är klart.',
    challengeTimer: (seconds) => `${seconds} sekunder kvar`,
    emptyTitle: 'Det finns inga övningsfrågor ännu.',
    hubBadge: 'Övningsnav',
    hubProgressSummary: (completed, total) =>
      `Du har besvarat ${completed} av ${total} synliga frågor.`,
    hubSubtitle: 'Starta blandad övning, ta en kort runda eller fokusera på ett kapitel.',
    hubTitle: 'Välj hur du vill öva',
    mockExamAccessibilityLabel: 'Gå till övningsprovet',
    mockExamBody: 'Byt till tidsatt provträning när du vill testa uthållighet och tempo.',
    mockExamCta: 'Gå till övningsprov',
    mockExamTitle: 'Övningsprov',
    nextQuestion: 'Nästa fråga',
    nextQuestionAccessibilityLabel: 'Gå till nästa övningsfråga',
    questionTitle: (questionNumber) => `Fråga ${questionNumber}`,
    quickRoundAccessibilityLabel: (count) => `Starta en snabb runda med ${count} frågor`,
    quickRoundBody: (count) =>
      `${count} frågor blandade mellan kapitel, med obesvarade frågor först.`,
    quickRoundCta: 'Starta snabb runda',
    quickRoundTitle: 'Snabb runda',
    scoreLabel: 'Poäng',
    subtitle: 'Besvara frågan, få direkt återkoppling och granska UHR-källan innan du går vidare.',
    tryAgain: 'Försök igen',
    tryAgainAccessibilityLabel: 'Försök igen med den här övningsfrågan',
    supplementaryToggleOn: 'Inkludera tilläggsfrågor',
    supplementaryToggleOff: 'Bara UHR-frågor',
    provenanceUhrLabel: 'UHR-källa',
    provenanceSupplementaryLabel: 'Tilläggsfråga',
    provenanceEditorialLabel: 'Redaktionell',
    aboutSourcesShow: 'Om källorna',
    aboutSourcesHide: 'Stäng om källorna',
    aboutSourcesUhrTitle: 'UHR-källa',
    aboutSourcesUhrBody:
      'Frågor som kommer direkt från UHR:s utbildningsmaterial Sverige i fokus. Allt innehåll i mock-provet är UHR.',
    aboutSourcesSupplementaryTitle: 'Tilläggsfråga',
    aboutSourcesSupplementaryBody:
      'Variant som genererats utifrån en UHR-fråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    aboutSourcesEditorialTitle: 'Redaktionell',
    aboutSourcesEditorialBody:
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av mock-provet.',
  },
  en: {
    badge: '5-minute practice',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question',
    allPracticeAccessibilityLabel: 'Start practice with all visible questions',
    allPracticeBody: 'Move through the full question bank in order with instant feedback.',
    allPracticeCta: 'Start all questions',
    allPracticeTitle: 'All questions',
    chapterAccuracyLabel: (accuracy) => `Accuracy: ${accuracy}%`,
    chapterCardAccessibilityLabel: (title, answered, total, accuracy) =>
      `${title}: ${answered} of ${total} questions answered, ${accuracy}% accuracy. Practise this chapter.`,
    chapterHubSubtitle: 'Choose a chapter when you want to focus on one area at a time.',
    chapterHubTitle: 'Practise by chapter',
    chapterProgressLabel: (answered, total) => `${answered} of ${total} questions answered`,
    chapterStartCta: 'Practise chapter',
    completedQuestions: (count) => `Completed questions: ${count}`,
    challengeBadge: 'Daily challenge',
    challengeCompletedTitle: "Today's challenge is complete",
    challengeCompletedSubtitle:
      'The result is saved locally for today. You can retry the set without an account.',
    challengeHome: 'Back to Home',
    challengeHomeAccessibilityLabel: "Go back to Home after today's challenge",
    challengeProgress: (answeredCount, totalCount) =>
      `Daily challenge: ${answeredCount}/${totalCount} answered`,
    challengeQuestionTitle: (questionNumber, totalCount) =>
      `Daily question ${questionNumber} of ${totalCount}`,
    challengeResult: (correctCount, totalCount) => `${correctCount}/${totalCount} correct`,
    challengeRetry: 'Retry challenge',
    challengeRetryAccessibilityLabel: "Retry today's challenge",
    challengeSubtitle:
      "Five fixed questions for today's date. The timer keeps running until the set is complete.",
    challengeTimer: (seconds) => `${seconds} seconds left`,
    emptyTitle: 'No practice questions are available yet.',
    hubBadge: 'Practice hub',
    hubProgressSummary: (completed, total) =>
      `You have answered ${completed} of ${total} visible questions.`,
    hubSubtitle: 'Start mixed practice, take a short round, or focus on one chapter.',
    hubTitle: 'Choose how to practise',
    mockExamAccessibilityLabel: 'Go to the mock exam',
    mockExamBody: 'Switch to timed exam practice when you want to test stamina and pace.',
    mockExamCta: 'Go to mock exam',
    mockExamTitle: 'Mock exam',
    nextQuestion: 'Next question',
    nextQuestionAccessibilityLabel: 'Move to the next practice question',
    questionTitle: (questionNumber) => `Question ${questionNumber}`,
    quickRoundAccessibilityLabel: (count) => `Start a quick round with ${count} questions`,
    quickRoundBody: (count) =>
      `${count} questions mixed across chapters, with unanswered questions first.`,
    quickRoundCta: 'Start quick round',
    quickRoundTitle: 'Quick round',
    scoreLabel: 'Score',
    subtitle: 'Answer, get instant feedback, then review the UHR source before moving on.',
    tryAgain: 'Try again',
    tryAgainAccessibilityLabel: 'Try this practice question again',
    supplementaryToggleOn: 'Include supplementary questions',
    supplementaryToggleOff: 'UHR questions only',
    provenanceUhrLabel: 'UHR source',
    provenanceSupplementaryLabel: 'Supplementary',
    provenanceEditorialLabel: 'Editorial',
    aboutSourcesShow: 'About the sources',
    aboutSourcesHide: 'Close source details',
    aboutSourcesUhrTitle: 'UHR source',
    aboutSourcesUhrBody:
      "Questions traced directly to UHR's study material Sverige i fokus. The mock exam is always UHR-only.",
    aboutSourcesSupplementaryTitle: 'Supplementary',
    aboutSourcesSupplementaryBody:
      'Variant generated from a UHR question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    aboutSourcesEditorialTitle: 'Editorial',
    aboutSourcesEditorialBody:
      'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
  },
};

const QUICK_ROUND_SIZE = 10;

type PracticeQuestionItem = (typeof questions)[number];

function buildChapterPracticeSummaries(
  sourceQuestions: PracticeQuestionItem[],
  completedQuestionIds: string[],
  questionProgress: ReturnType<typeof useProgressStore.getState>['questionProgress'],
  language: AppLanguage,
): ChapterPracticeSummary[] {
  const completedQuestionIdSet = new Set(completedQuestionIds);

  return chapters.map((chapter) => {
    const chapterQuestions = sourceQuestions.filter(
      (question) => question.chapterId === chapter.id,
    );
    let correctAnswerCount = 0;
    let totalAnswerCount = 0;

    chapterQuestions.forEach((question) => {
      const progress = questionProgress[question.id];
      correctAnswerCount += progress?.correctCount ?? 0;
      totalAnswerCount += progress?.seenCount ?? 0;
    });

    return {
      accuracy:
        totalAnswerCount > 0 ? Math.round((correctAnswerCount / totalAnswerCount) * 100) : 0,
      answered: chapterQuestions.filter((question) => completedQuestionIdSet.has(question.id))
        .length,
      description: language === 'sv' ? chapter.descriptionSv : chapter.descriptionEn,
      id: chapter.id,
      title: language === 'sv' ? chapter.nameSv : chapter.nameEn,
      total: chapterQuestions.length,
    };
  });
}

export default function Screen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isChallengeMode = mode === 'challenge';
  const activeQuestionId = usePracticeSessionStore((state) => state.activeQuestionId);
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const advanceQuestion = usePracticeSessionStore((state) => state.advanceQuestion);
  const shuffleSessionId = usePracticeSessionStore((state) => state.shuffleSessionId);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const dailyChallengeCompletions = useProgressStore((state) => state.dailyChallengeCompletions);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const recordDailyChallengeCompletion = useProgressStore(
    (state) => state.recordDailyChallengeCompletion,
  );
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const toggleBookmark = useProgressStore((state) => state.toggleBookmark);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const includeSupplementary = useSettingsStore((state) => state.includeSupplementaryQuestions);
  const setIncludeSupplementary = useSettingsStore(
    (state) => state.setIncludeSupplementaryQuestions,
  );
  const [aboutSourcesOpen, setAboutSourcesOpen] = useState(false);
  const [focusedHeaderControl, setFocusedHeaderControl] = useState<PracticeHeaderControl | null>(
    null,
  );
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, boolean>>({});
  const [challengeRetryActive, setChallengeRetryActive] = useState(false);
  const [challengeStartedAt, setChallengeStartedAt] = useState(() => Date.now());
  const [remainingChallengeSeconds, setRemainingChallengeSeconds] = useState(
    DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
  );
  const copy = practiceCopy[language];
  const dailyChallenge = useMemo(() => buildDailyChallenge({ bank: questions }), []);
  const challengeQuestions = useMemo(
    () =>
      dailyChallenge.questionIds
        .map((questionId) => questions.find((candidate) => candidate.id === questionId))
        .filter((candidate): candidate is (typeof questions)[number] => Boolean(candidate)),
    [dailyChallenge.questionIds],
  );
  const challengeCompletion = dailyChallengeCompletions[dailyChallenge.dayKey];
  const challengeCompletedToday = isDailyChallengeCompleted(Object.keys(dailyChallengeCompletions));
  const showChallengeCompletedSummary =
    isChallengeMode &&
    challengeCompletedToday &&
    Boolean(challengeCompletion) &&
    !challengeRetryActive;
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const challengeAnsweredQuestionIds = useMemo(
    () => Object.keys(challengeAnswers),
    [challengeAnswers],
  );
  const practiceQuestionBank = isChallengeMode ? challengeQuestions : filteredQuestions;
  const rawQuestion = getPracticeQuestionForSession(
    practiceQuestionBank,
    isChallengeMode ? challengeAnsweredQuestionIds : completedQuestionIds,
    activeQuestionId,
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId) : undefined,
    [rawQuestion, shuffleSessionId],
  );
  const completeDailyChallenge = useCallback(
    (answers: Record<string, boolean>) => {
      if (!isChallengeMode || challengeQuestions.length === 0) return;

      const answeredIds = Object.keys(answers);
      const correctCount = answeredIds.filter((questionId) => answers[questionId]).length;
      const totalCount = challengeQuestions.length;
      recordDailyChallengeCompletion({
        dayKey: dailyChallenge.dayKey,
        questionIds: challengeQuestions.map((challengeQuestion) => challengeQuestion.id),
        score: totalCount > 0 ? correctCount / totalCount : 0,
        correctCount,
        totalCount,
        timeSpentSeconds: Math.min(
          DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
          Math.max(0, Math.round((Date.now() - challengeStartedAt) / 1000)),
        ),
      });
      setChallengeRetryActive(false);
    },
    [
      challengeQuestions,
      challengeStartedAt,
      dailyChallenge.dayKey,
      isChallengeMode,
      recordDailyChallengeCompletion,
    ],
  );

  useEffect(() => {
    setChallengeAnswers({});
    setChallengeRetryActive(false);
    setChallengeStartedAt(Date.now());
    setRemainingChallengeSeconds(DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
    resetSelection();
  }, [dailyChallenge.dayKey, isChallengeMode, resetSelection]);

  useEffect(() => {
    if (!isChallengeMode || showChallengeCompletedSummary || challengeQuestions.length === 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingChallengeSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeQuestions.length, isChallengeMode, showChallengeCompletedSummary]);

  useEffect(() => {
    if (
      !isChallengeMode ||
      showChallengeCompletedSummary ||
      challengeQuestions.length === 0 ||
      remainingChallengeSeconds > 0
    ) {
      return;
    }

    completeDailyChallenge(challengeAnswers);
  }, [
    challengeAnswers,
    challengeQuestions.length,
    completeDailyChallenge,
    isChallengeMode,
    remainingChallengeSeconds,
    showChallengeCompletedSummary,
  ]);

  if (showChallengeCompletedSummary && challengeCompletion) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Badge tone="green">{copy.challengeBadge}</Badge>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.challengeCompletedTitle}
          </Text>
          <Text style={styles.subtitle}>{copy.challengeCompletedSubtitle}</Text>
          <Text style={styles.score}>
            {copy.challengeResult(challengeCompletion.correctCount, challengeCompletion.totalCount)}
          </Text>
          <View style={styles.feedbackActions}>
            <Button
              accessibilityLabel={copy.challengeRetryAccessibilityLabel}
              accessibilityRole="button"
              onPress={() => {
                setChallengeAnswers({});
                setChallengeRetryActive(true);
                setChallengeStartedAt(Date.now());
                setRemainingChallengeSeconds(DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
                resetSelection();
              }}
              style={styles.feedbackButton}
            >
              {copy.challengeRetry}
            </Button>
            <Link
              accessibilityLabel={copy.challengeHomeAccessibilityLabel}
              accessibilityRole="link"
              href="/home"
              style={styles.challengeHomeLink}
            >
              {copy.challengeHome}
            </Link>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!question) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{copy.emptyTitle}</Text>
      </View>
    );
  }

  const hasSelectedAnswer = Boolean(selectedOptionId && activeQuestionId === question.id);
  const selectedIsCorrect =
    hasSelectedAnswer && selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const isBookmarked = Boolean(questionProgress[question.id]?.bookmarked);
  const currentScore = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const questionIndex = practiceQuestionBank.findIndex((candidate) => candidate.id === question.id);
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress =
    practiceQuestionBank.length > 0 ? questionNumber / practiceQuestionBank.length : 0;
  const challengeAnsweredCount = challengeAnsweredQuestionIds.length;
  const metaText = isChallengeMode
    ? copy.challengeProgress(challengeAnsweredCount, challengeQuestions.length)
    : copy.completedQuestions(completedQuestionIds.length);
  const titleText = isChallengeMode
    ? copy.challengeQuestionTitle(questionNumber, challengeQuestions.length)
    : copy.questionTitle(questionNumber);
  const subtitleText = isChallengeMode ? copy.challengeSubtitle : copy.subtitle;
  const handleSelectOption = (optionId: string) => {
    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);

    selectOption(question.id, optionId);
    recordAnswer(question.id, optionIsCorrect);
    if (isChallengeMode) {
      const nextChallengeAnswers = { ...challengeAnswers, [question.id]: optionIsCorrect };
      setChallengeAnswers(nextChallengeAnswers);
      if (Object.keys(nextChallengeAnswers).length >= challengeQuestions.length) {
        completeDailyChallenge(nextChallengeAnswers);
      }
    }

    if (!optionIsCorrect && selectedOption) {
      recordWrongAnswerReview({
        questionId: question.id,
        selectedOptionTextEn: selectedOption.textEn,
        selectedOptionTextSv: selectedOption.textSv,
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{isChallengeMode ? copy.challengeBadge : copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {titleText}
        </Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
        <ProgressBar language={language} progress={bankProgress} />
        {isChallengeMode ? (
          <Text accessibilityLiveRegion="polite" style={styles.timer}>
            {copy.challengeTimer(remainingChallengeSeconds)}
          </Text>
        ) : null}
        <Text style={styles.meta}>{metaText}</Text>
        <View style={styles.headerControls}>
          <Pressable
            android_ripple={{ color: colors.focusSoft }}
            aria-selected={isBookmarked}
            accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}
            accessibilityRole="button"
            accessibilityState={{ selected: isBookmarked }}
            hitSlop={space[1]}
            onBlur={() => setFocusedHeaderControl(null)}
            onFocus={() => setFocusedHeaderControl('bookmark')}
            onPress={() => toggleBookmark(question.id)}
            style={({ pressed }) => [
              styles.bookmarkButton,
              isBookmarked ? styles.bookmarkButtonActive : null,
              focusedHeaderControl === 'bookmark' ? styles.headerControlFocused : null,
              pressed ? styles.headerControlPressed : null,
            ]}
          >
            <Text style={[styles.bookmarkText, isBookmarked ? styles.bookmarkTextActive : null]}>
              {isBookmarked ? copy.bookmarked : copy.bookmark}
            </Text>
          </Pressable>
          {!isChallengeMode ? (
            <Pressable
              android_ripple={{ color: colors.focusSoft }}
              accessibilityRole="switch"
              accessibilityState={{ checked: includeSupplementary }}
              accessibilityLabel={
                includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff
              }
              hitSlop={space[1]}
              onBlur={() => setFocusedHeaderControl(null)}
              onFocus={() => setFocusedHeaderControl('supplementary')}
              onPress={() => setIncludeSupplementary(!includeSupplementary)}
              style={({ pressed }) => [
                styles.bookmarkButton,
                includeSupplementary ? styles.bookmarkButtonActive : null,
                focusedHeaderControl === 'supplementary' ? styles.headerControlFocused : null,
                pressed ? styles.headerControlPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.bookmarkText,
                  includeSupplementary ? styles.bookmarkTextActive : null,
                ]}
              >
                {includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            android_ripple={{ color: colors.focusSoft }}
            aria-expanded={aboutSourcesOpen}
            accessibilityRole="button"
            accessibilityState={{ expanded: aboutSourcesOpen }}
            accessibilityLabel={aboutSourcesOpen ? copy.aboutSourcesHide : copy.aboutSourcesShow}
            hitSlop={space[1]}
            onBlur={() => setFocusedHeaderControl(null)}
            onFocus={() => setFocusedHeaderControl('sources')}
            onPress={() => setAboutSourcesOpen((value) => !value)}
            style={({ pressed }) => [
              styles.aboutSourcesTrigger,
              focusedHeaderControl === 'sources' ? styles.headerControlFocused : null,
              pressed ? styles.headerControlPressed : null,
            ]}
          >
            <Text style={styles.aboutSourcesTriggerText}>
              {aboutSourcesOpen ? copy.aboutSourcesHide : copy.aboutSourcesShow}
            </Text>
          </Pressable>
        </View>
        {aboutSourcesOpen ? (
          <View accessibilityRole="text" style={styles.aboutSourcesPanel}>
            <Text style={styles.aboutSourcesItemTitle}>{copy.aboutSourcesUhrTitle}</Text>
            <Text style={styles.aboutSourcesItemBody}>{copy.aboutSourcesUhrBody}</Text>
            <Text style={styles.aboutSourcesItemTitle}>{copy.aboutSourcesSupplementaryTitle}</Text>
            <Text style={styles.aboutSourcesItemBody}>{copy.aboutSourcesSupplementaryBody}</Text>
            <Text style={styles.aboutSourcesItemTitle}>{copy.aboutSourcesEditorialTitle}</Text>
            <Text style={styles.aboutSourcesItemBody}>{copy.aboutSourcesEditorialBody}</Text>
          </View>
        ) : null}
      </View>
      <QuestionDisclaimer />
      <QuestionCard question={question} language={language} />
      <AudioButton
        enabled={audioEnabled}
        language={language}
        text={buildQuestionSpeechText(question)}
      />

      <View style={styles.options}>
        {question.options.map((option) => {
          const feedback = getAnswerOptionFeedback(
            question,
            option.id,
            hasSelectedAnswer ? selectedOptionId : null,
            language,
          );

          return (
            <AnswerOption
              key={option.id}
              disabled={hasSelectedAnswer}
              language={language}
              option={option}
              onPress={() => handleSelectOption(option.id)}
              resultLabel={feedback.resultLabel}
              selected={hasSelectedAnswer && selectedOptionId === option.id}
              tone={feedback.tone}
            />
          );
        })}
      </View>

      {hasSelectedAnswer ? (
        <View style={styles.feedback}>
          <CelebrationBurst
            active={selectedIsCorrect}
            languageOverride={language}
            streak={celebrationStreak}
          />
          <PostAnswerRewardPanel
            answerXp={answerXp}
            correctStreak={correctStreak}
            isCorrect={selectedIsCorrect}
            language={language}
            level={level}
            question={question}
            streakDays={streakDays}
            totalXp={totalXp}
          />
          {currentScore ? (
            <Text style={styles.score}>
              {copy.scoreLabel}: {currentScore.correct}/{currentScore.total}
            </Text>
          ) : null}
          <ExplanationPanel
            explanationEn={question.explanationEn}
            explanationSv={question.explanationSv}
            language={language}
          />
          <FeedbackAudioButton
            enabled={audioEnabled}
            language={language}
            text={buildAnswerFeedbackSpeechText(question, selectedOptionId)}
          />
          <UHRReferenceCard language={language} reference={question.uhrReference} />
          <PracticeInterstitialAd showKey={practiceInterstitialShowKey} />
          <RemoveAdsPlacementCta placement="quiz_completed_interstitial" />
          <View style={styles.feedbackActions}>
            <Button
              accessibilityLabel={copy.nextQuestionAccessibilityLabel}
              accessibilityRole="button"
              onPress={advanceQuestion}
              style={styles.feedbackButton}
            >
              {copy.nextQuestion}
            </Button>
            <Button
              accessibilityLabel={copy.tryAgainAccessibilityLabel}
              accessibilityRole="button"
              onPress={resetSelection}
              style={styles.feedbackButton}
              variant="secondary"
            >
              {copy.tryAgain}
            </Button>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    gap: space[2],
    padding: space[3],
    paddingBottom: space[10],
  },
  hubContent: {
    gap: space[2],
    padding: space[3],
    paddingBottom: space[10],
  },
  emptyContainer: {
    flex: 1,
    padding: space[3],
  },
  hubHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
    padding: space[3],
  },
  hubTitle: {
    color: colors.text,
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    lineHeight: typography.sectionHeading.lineHeight,
  },
  hubActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  hubActionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    flexShrink: 1,
    gap: space[1],
    minWidth: 220,
    padding: space[2],
  },
  hubPanelTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyLarge.lineHeight,
  },
  hubPanelBody: {
    color: colors.textMuted,
    flexGrow: 1,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  hubActionButton: {
    alignSelf: 'flex-start',
  },
  examLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textDecorationLine: 'none',
  },
  chapterHub: {
    gap: space[1],
  },
  chapterHubTitle: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    lineHeight: typography.subHeading.lineHeight,
  },
  chapterHubSubtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  chapterCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    flexShrink: 1,
    gap: space[0.75],
    minHeight: space[12],
    minWidth: 240,
    padding: space[2],
  },
  chapterCardPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  chapterCardDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  chapterCardTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyLarge.lineHeight,
  },
  chapterCardDescription: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  chapterCardMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  chapterCardCta: {
    color: colors.accent,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    marginTop: space[0.5],
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.25],
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  timer: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  provenanceBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
    textTransform: 'uppercase',
  },
  provenanceUhr: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.badgeBlueText,
  },
  provenanceSupplementary: {
    backgroundColor: colors.surfaceWarm,
    color: colors.text,
  },
  provenanceEditorial: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  aboutSourcesTrigger: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  aboutSourcesTriggerText: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  aboutSourcesPanel: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[0.5],
    padding: space[1.5],
  },
  aboutSourcesItemTitle: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  aboutSourcesItemBody: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginBottom: space[0.5],
  },
  headerControls: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  headerControlFocused: {
    borderColor: colors.focus,
  },
  headerControlPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  bookmarkButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: space[6],
    minWidth: space[6],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.75],
  },
  bookmarkButtonActive: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
  },
  bookmarkText: {
    color: colors.textSecondary,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bookmarkTextActive: {
    color: colors.badgeBlueText,
  },
  options: {
    gap: space[1],
  },
  feedback: {
    gap: space[1.5],
  },
  feedbackActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  feedbackButton: {
    minHeight: space[5] + space[0.5],
  },
  challengeHomeLink: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
});
