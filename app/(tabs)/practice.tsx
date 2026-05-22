import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { Badge } from '../../components/ui/Badge';
import { PracticeInterstitialAd } from '../../components/monetization/PracticeInterstitialAd';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ConfidenceRatingPicker } from '../../components/quiz/ConfidenceRatingPicker';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { PostAnswerRewardPanel } from '../../components/quiz/PostAnswerRewardPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionReportLink } from '../../components/quiz/QuestionReportLink';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { PersistenceWarningNotice } from '../../components/storage/PersistenceWarningNotice';
import { StudyCompanionCard } from '../../components/mascot/StudyCompanionCard';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { useQuestionAudioAutoplay } from '../../lib/audio/questionAudioAutoplay';
import {
  buildAnswerFeedbackSpeechText,
  buildQuestionSpeechText,
  stopSpeech,
} from '../../lib/audio/speak';
import { filterQuestionsByProvenance } from '../../lib/content/provenance';
import { buildDailyChallenge } from '../../lib/learning/dailyChallenge';
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateAnswerXp, calculateLevel } from '../../lib/learning/xp';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import {
  getCompletedQuestionIdsForQuestionBank,
  getPracticeQuestionForSession,
} from '../../lib/quiz/practiceFlow';
import { useProLifetimeEntitlements } from '../../lib/monetization/useProLifetimeEntitlements';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import {
  getPracticeAnswerXpAwardKey,
  getPracticeInterstitialShowKey,
  usePracticeSessionStore,
} from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useAccessibilityStore } from '../../lib/storage/accessibilityStore';
import { useCompanionStore } from '../../lib/storage/companionStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { Chapter, PracticeQuestion } from '../../types/content';
import type { ConfidenceRating } from '../../types/progress';

type PracticeHeaderControl = 'bookmark' | 'supplementary' | 'sources';

type PracticeScope =
  | { type: 'all' }
  | { type: 'quick'; limit: number }
  | { type: 'chapter'; chapterId: string }
  | { type: 'challenge'; questionIds: string[] };

type PracticeRouteLaunchMode = 'challenge' | 'quick';

type PracticeCopy = {
  badge: string;
  bookmark: string;
  bookmarked: string;
  bookmarkAccessibilityLabel: (isBookmarked: boolean) => string;
  chapterAccuracy: (accuracy: number) => string;
  chapterCardAccessibilityLabel: (
    chapterName: string,
    answered: number,
    total: number,
    accuracy: number,
  ) => string;
  chapterPracticeLabel: string;
  chapterProgress: (answered: number, total: number) => string;
  completedQuestions: (count: number) => string;
  emptyTitle: string;
  allPractice: string;
  hubBadge: string;
  hubProgress: (answered: number, total: number) => string;
  hubSubtitle: string;
  hubTitle: string;
  mockExam: string;
  nextQuestion: string;
  nextQuestionAccessibilityLabel: string;
  questionTitle: (questionNumber: number) => string;
  quickRound: string;
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
    chapterAccuracy: (accuracy) => `${accuracy}% rätt`,
    chapterCardAccessibilityLabel: (chapterName, answered, total, accuracy) =>
      `${chapterName}: ${answered} av ${total} frågor besvarade, ${accuracy}% rätt. Öva det här kapitlet.`,
    chapterPracticeLabel: 'Öva det här kapitlet',
    chapterProgress: (answered, total) => `${answered} av ${total} frågor besvarade`,
    completedQuestions: (count) => `Besvarade frågor: ${count}`,
    emptyTitle: 'Det finns inga övningsfrågor ännu.',
    allPractice: 'Starta övning med alla synliga frågor',
    hubBadge: 'Övningshub',
    hubProgress: (answered, total) => `Du har svarat på ${answered} av ${total} synliga frågor.`,
    hubSubtitle: 'Starta med hela frågebanken, ta en snabb runda eller öva ett kapitel i taget.',
    hubTitle: 'Välj hur du vill öva',
    mockExam: 'Gå till övningsprovet',
    nextQuestion: 'Nästa fråga',
    nextQuestionAccessibilityLabel: 'Gå till nästa övningsfråga',
    questionTitle: (questionNumber) => `Fråga ${questionNumber}`,
    quickRound: 'Starta en snabb runda med 10 frågor',
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
      'Frågor skrivna utifrån UHR:s studiematerial Sverige i fokus. Övningsprovet använder bara UHR-hänvisade frågor.',
    aboutSourcesSupplementaryTitle: 'Tilläggsfråga',
    aboutSourcesSupplementaryBody:
      'Variant av en appskriven, UHR-hänvisad övningsfråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    aboutSourcesEditorialTitle: 'Redaktionell',
    aboutSourcesEditorialBody:
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av övningsprovet.',
  },
  en: {
    badge: '5-minute practice',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question',
    chapterAccuracy: (accuracy) => `${accuracy}% accuracy`,
    chapterCardAccessibilityLabel: (chapterName, answered, total, accuracy) =>
      `${chapterName}: ${answered} of ${total} questions answered, ${accuracy}% accuracy. Practise this chapter.`,
    chapterPracticeLabel: 'Practise this chapter',
    chapterProgress: (answered, total) => `${answered} of ${total} questions answered`,
    completedQuestions: (count) => `Completed questions: ${count}`,
    emptyTitle: 'No practice questions are available yet.',
    allPractice: 'Start practice with all visible questions',
    hubBadge: 'Practice hub',
    hubProgress: (answered, total) =>
      `You have answered ${answered} of ${total} visible questions.`,
    hubSubtitle: 'Start with the full bank, take a quick round, or focus on one chapter at a time.',
    hubTitle: 'Choose how to practise',
    mockExam: 'Go to the mock exam',
    nextQuestion: 'Next question',
    nextQuestionAccessibilityLabel: 'Move to the next practice question',
    questionTitle: (questionNumber) => `Question ${questionNumber}`,
    quickRound: 'Start a quick round with 10 questions',
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
      "Questions written from UHR's study material Sverige i fokus. The mock exam uses only UHR-referenced questions.",
    aboutSourcesSupplementaryTitle: 'Supplementary',
    aboutSourcesSupplementaryBody:
      'Variant of an app-authored, UHR-referenced practice question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    aboutSourcesEditorialTitle: 'Editorial',
    aboutSourcesEditorialBody:
      'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
  },
};

function getQuestionsForPracticeScope(
  questionBank: PracticeQuestion[],
  practiceScope: PracticeScope | null,
): PracticeQuestion[] {
  if (!practiceScope || practiceScope.type === 'all') return questionBank;
  if (practiceScope.type === 'quick') return questionBank.slice(0, practiceScope.limit);
  if (practiceScope.type === 'challenge') {
    const questionsById = new Map(questionBank.map((question) => [question.id, question]));
    return practiceScope.questionIds.flatMap((questionId) => {
      const question = questionsById.get(questionId);
      return question ? [question] : [];
    });
  }

  return questionBank.filter((question) => question.chapterId === practiceScope.chapterId);
}

function normalizePracticeRouteLaunchMode(
  value: string | string[] | undefined,
): PracticeRouteLaunchMode | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'challenge' || rawValue === 'quick' ? rawValue : null;
}

function getLocalizedChapterName(chapter: Chapter, language: AppLanguage): string {
  return chapter.nameText?.[language] ?? (language === 'sv' ? chapter.nameSv : chapter.nameEn);
}

function getChapterAccuracy(questionBank: PracticeQuestion[], questionProgress: unknown): number {
  if (!questionProgress || typeof questionProgress !== 'object') return 0;
  const progressByQuestionId = questionProgress as Record<
    string,
    { correctCount?: number; wrongCount?: number }
  >;
  let correctCount = 0;
  let totalCount = 0;

  for (const question of questionBank) {
    const progress = progressByQuestionId[question.id];
    if (!progress) continue;
    const questionCorrectCount =
      typeof progress.correctCount === 'number' ? Math.max(0, progress.correctCount) : 0;
    const questionWrongCount =
      typeof progress.wrongCount === 'number' ? Math.max(0, progress.wrongCount) : 0;
    correctCount += questionCorrectCount;
    totalCount += questionCorrectCount + questionWrongCount;
  }

  return totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
}

export default function Screen() {
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const consumedRouteLaunchModeRef = useRef<PracticeRouteLaunchMode | null>(null);
  const answerXpAwardedKey = usePracticeSessionStore((state) => state.answerXpAwardedKey);
  const activeQuestionId = usePracticeSessionStore((state) => state.activeQuestionId);
  const markAnswerXpAwarded = usePracticeSessionStore((state) => state.markAnswerXpAwarded);
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const struckOptionIdsByQuestionId = usePracticeSessionStore(
    (state) => state.struckOptionIdsByQuestionId,
  );
  const toggleStruckOption = usePracticeSessionStore((state) => state.toggleStruckOption);
  const startSession = usePracticeSessionStore((state) => state.startSession);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const advanceQuestion = usePracticeSessionStore((state) => state.advanceQuestion);
  const shuffleSessionId = usePracticeSessionStore((state) => state.shuffleSessionId);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const progressPersistenceWarning = useProgressStore((state) => state.persistenceWarning);
  const clearProgressPersistenceWarning = useProgressStore(
    (state) => state.clearPersistenceWarning,
  );
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const mistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.persistenceWarning,
  );
  const clearMistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.clearPersistenceWarning,
  );
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const selectedCompanionId = useCompanionStore((state) => state.selectedId);
  const toggleBookmark = useProgressStore((state) => state.toggleBookmark);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const audioPlaybackRate = useAccessibilityStore((state) => state.audioPlaybackRate);
  const listenFirstAudioEnabled = useAccessibilityStore((state) => state.listenFirstAudioEnabled);
  const includeSupplementary = useSettingsStore((state) => state.includeSupplementaryQuestions);
  const setIncludeSupplementary = useSettingsStore(
    (state) => state.setIncludeSupplementaryQuestions,
  );
  const reduceMotion = useReducedMotion();
  const [practiceScope, setPracticeScope] = useState<PracticeScope | null>(null);
  const [aboutSourcesOpen, setAboutSourcesOpen] = useState(false);
  const [focusedHeaderControl, setFocusedHeaderControl] = useState<PracticeHeaderControl | null>(
    null,
  );
  const [selectedConfidenceRating, setSelectedConfidenceRating] = useState<ConfidenceRating | null>(
    null,
  );
  const [answerXpAwardedForSelection, setAnswerXpAwardedForSelection] = useState(0);
  const { entitlements: proEntitlements, entitlementsReady: proEntitlementsReady } =
    useProLifetimeEntitlements();
  const copy = practiceCopy[language];
  const level = calculateLevel(totalXp);
  const streakDays = useMemo(() => calculateStreak(answerDates), [answerDates]);
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const dailyChallenge = useMemo(
    () => buildDailyChallenge({ bank: filteredQuestions }),
    [filteredQuestions],
  );
  const routeLaunchMode = normalizePracticeRouteLaunchMode(mode);
  const practiceQuestionBank = useMemo(
    () => getQuestionsForPracticeScope(filteredQuestions, practiceScope),
    [filteredQuestions, practiceScope],
  );
  const visibleCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(filteredQuestions, completedQuestionIds),
    [completedQuestionIds, filteredQuestions],
  );
  const sessionCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(practiceQuestionBank, completedQuestionIds),
    [completedQuestionIds, practiceQuestionBank],
  );
  const rawQuestion = practiceScope
    ? getPracticeQuestionForSession(
        practiceQuestionBank,
        sessionCompletedQuestionIds,
        activeQuestionId,
      )
    : undefined;
  const chapterSummaries = useMemo(
    () =>
      chapters
        .map((chapter) => {
          const chapterQuestions = filteredQuestions.filter(
            (candidate) => candidate.chapterId === chapter.id,
          );
          const chapterCompletedQuestionIds = getCompletedQuestionIdsForQuestionBank(
            chapterQuestions,
            completedQuestionIds,
          );

          return {
            accuracy: getChapterAccuracy(chapterQuestions, questionProgress),
            chapter,
            completedCount: chapterCompletedQuestionIds.length,
            name: getLocalizedChapterName(chapter, language),
            totalCount: chapterQuestions.length,
          };
        })
        .filter((summary) => summary.totalCount > 0),
    [completedQuestionIds, filteredQuestions, language, questionProgress],
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId) : undefined,
    [rawQuestion, shuffleSessionId],
  );
  const struckOptionIds = question ? (struckOptionIdsByQuestionId[question.id] ?? []) : [];
  const confidenceRatingEnabled = proEntitlementsReady && proEntitlements.confidenceSlider === true;
  const hasSelectedAnswer = Boolean(
    question && selectedOptionId && activeQuestionId === question.id,
  );
  const questionSpeechText = useMemo(
    () => (question ? buildQuestionSpeechText(question) : ''),
    [question],
  );

  useQuestionAudioAutoplay({
    audioEnabled,
    listenFirstAudioEnabled,
    questionKey: question ? `practice:${question.id}:${shuffleSessionId}` : null,
    rate: audioPlaybackRate,
    speechText: questionSpeechText,
    stopSignal: hasSelectedAnswer,
  });

  useEffect(() => {
    setSelectedConfidenceRating(null);
  }, [question?.id]);

  useEffect(() => {
    setAnswerXpAwardedForSelection(0);
  }, [question?.id, shuffleSessionId]);

  useEffect(() => {
    if (!routeLaunchMode || consumedRouteLaunchModeRef.current === routeLaunchMode) return;

    const nextScope: PracticeScope =
      routeLaunchMode === 'challenge'
        ? { type: 'challenge', questionIds: dailyChallenge.questionIds }
        : { type: 'quick', limit: 10 };
    const nextQuestionBank = getQuestionsForPracticeScope(filteredQuestions, nextScope);
    if (nextQuestionBank.length === 0) return;

    consumedRouteLaunchModeRef.current = routeLaunchMode;
    startSession(nextQuestionBank[0]?.id ?? null);
    setAboutSourcesOpen(false);
    setSelectedConfidenceRating(null);
    setPracticeScope(nextScope);
  }, [dailyChallenge.questionIds, filteredQuestions, routeLaunchMode, startSession]);

  const startPracticeScope = (nextScope: PracticeScope) => {
    const nextQuestionBank = getQuestionsForPracticeScope(filteredQuestions, nextScope);
    const nextQuestion = getPracticeQuestionForSession(
      nextQuestionBank,
      completedQuestionIds,
      null,
    );
    startSession(nextQuestion?.id ?? null);
    setAboutSourcesOpen(false);
    setSelectedConfidenceRating(null);
    setPracticeScope(nextScope);
  };
  const handleSupplementaryToggle = () => {
    const nextIncludeSupplementary = !includeSupplementary;
    setIncludeSupplementary(nextIncludeSupplementary);

    if (!practiceScope) return;

    const nextFilteredQuestions = filterQuestionsByProvenance(questions, {
      includeSupplementary: nextIncludeSupplementary,
    });
    const nextQuestionBank = getQuestionsForPracticeScope(nextFilteredQuestions, practiceScope);
    const nextQuestion = getPracticeQuestionForSession(
      nextQuestionBank,
      completedQuestionIds,
      null,
    );
    startSession(nextQuestion?.id ?? null);
    setAboutSourcesOpen(false);
    setSelectedConfidenceRating(null);
  };
  const handleStartChapter = (chapterId: string) => {
    const chapterQuestions = filteredQuestions.filter(
      (question) => question.chapterId === chapterId,
    );
    const firstUnansweredQuestion = getPracticeQuestionForSession(
      chapterQuestions,
      completedQuestionIds,
      null,
    );
    startSession(firstUnansweredQuestion?.id ?? null);
    setAboutSourcesOpen(false);
    setSelectedConfidenceRating(null);
    setPracticeScope({ type: 'chapter', chapterId });
  };

  if (!practiceScope) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Badge>{copy.hubBadge}</Badge>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.hubTitle}
          </Text>
          <Text style={styles.subtitle}>{copy.hubSubtitle}</Text>
          <Text style={styles.meta}>
            {copy.hubProgress(visibleCompletedQuestionIds.length, filteredQuestions.length)}
          </Text>
          <View style={styles.hubActions}>
            <Button
              accessibilityLabel={copy.allPractice}
              accessibilityRole="button"
              onPress={() => startPracticeScope({ type: 'all' })}
              style={styles.hubActionButton}
            >
              {copy.allPractice}
            </Button>
            <Button
              accessibilityLabel={copy.quickRound}
              accessibilityRole="button"
              onPress={() => startPracticeScope({ type: 'quick', limit: 10 })}
              style={styles.hubActionButton}
              variant="secondary"
            >
              {copy.quickRound}
            </Button>
            <Link accessibilityLabel={copy.mockExam} accessibilityRole="link" asChild href="/exam">
              <Button
                accessibilityLabel={copy.mockExam}
                accessibilityRole="link"
                style={styles.hubActionButton}
                variant="secondary"
              >
                {copy.mockExam}
              </Button>
            </Link>
          </View>
        </View>
        <View style={styles.chapterGrid}>
          {chapterSummaries.map((summary) => (
            <Pressable
              key={summary.chapter.id}
              android_ripple={{ color: colors.focusSoft }}
              accessibilityLabel={copy.chapterCardAccessibilityLabel(
                summary.name,
                summary.completedCount,
                summary.totalCount,
                summary.accuracy,
              )}
              accessibilityRole="button"
              onPress={() => handleStartChapter(summary.chapter.id)}
              style={({ pressed }) => [
                styles.chapterCard,
                pressed
                  ? reduceMotion
                    ? styles.chapterCardPressedReducedMotion
                    : styles.chapterCardPressed
                  : null,
              ]}
            >
              <Text style={styles.chapterTitle}>{summary.name}</Text>
              <Text style={styles.chapterMeta}>
                {copy.chapterProgress(summary.completedCount, summary.totalCount)}
              </Text>
              <Text style={styles.chapterMeta}>{copy.chapterAccuracy(summary.accuracy)}</Text>
              <Text style={styles.chapterAction}>{copy.chapterPracticeLabel}</Text>
            </Pressable>
          ))}
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

  const selectedIsCorrect =
    hasSelectedAnswer && selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const isBookmarked = Boolean(questionProgress[question.id]?.bookmarked);
  const bookmarkAccessibilityState = Platform.OS === 'web' ? undefined : { selected: isBookmarked };
  const currentScore = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const companionFeedbackState = hasSelectedAnswer
    ? selectedIsCorrect
      ? 'correct'
      : 'incorrect'
    : 'neutral';
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;
  const questionIndex = practiceQuestionBank.findIndex((candidate) => candidate.id === question.id);
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress =
    practiceQuestionBank.length > 0 ? questionNumber / practiceQuestionBank.length : 0;
  const handleSelectOption = (optionId: string) => {
    if (struckOptionIds.includes(optionId)) return;

    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);
    const answerConfidenceRating = confidenceRatingEnabled
      ? (selectedConfidenceRating ?? undefined)
      : undefined;

    stopSpeech();
    selectOption(question.id, optionId);
    const answerXpAwardKey = getPracticeAnswerXpAwardKey(question.id, shuffleSessionId);
    const shouldAwardXp = answerXpAwardedKey !== answerXpAwardKey;
    const answerXp = shouldAwardXp
      ? calculateAnswerXp({ isCorrect: optionIsCorrect, explanationRead: true })
      : 0;

    recordAnswer(question.id, optionIsCorrect, answerConfidenceRating, {
      awardXp: shouldAwardXp,
    });
    if (shouldAwardXp) markAnswerXpAwarded(answerXpAwardKey);
    setAnswerXpAwardedForSelection(answerXp);

    if (!optionIsCorrect && selectedOption) {
      recordWrongAnswerReview({
        questionId: question.id,
        selectedOptionTextEn: selectedOption.textEn,
        selectedOptionTextSv: selectedOption.textSv,
      });
    }
  };
  const handleAdvanceQuestion = () => {
    setSelectedConfidenceRating(null);
    advanceQuestion();
  };
  const handleTryAgain = () => {
    setSelectedConfidenceRating(null);
    setAnswerXpAwardedForSelection(0);
    resetSelection();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.questionTitle(questionNumber)}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <ProgressBar language={language} progress={bankProgress} />
        <Text style={styles.meta}>
          {copy.completedQuestions(visibleCompletedQuestionIds.length)}
        </Text>
        <View style={styles.headerControls}>
          <Pressable
            android_ripple={{ color: colors.focusSoft }}
            aria-pressed={isBookmarked}
            accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}
            accessibilityRole="button"
            accessibilityState={bookmarkAccessibilityState}
            hitSlop={space[1]}
            onBlur={() => setFocusedHeaderControl(null)}
            onFocus={() => setFocusedHeaderControl('bookmark')}
            onPress={() => toggleBookmark(question.id)}
            style={({ pressed }) => [
              styles.bookmarkButton,
              isBookmarked ? styles.bookmarkButtonActive : null,
              focusedHeaderControl === 'bookmark' ? styles.headerControlFocused : null,
              pressed
                ? reduceMotion
                  ? styles.headerControlPressedReducedMotion
                  : styles.headerControlPressed
                : null,
            ]}
          >
            <Text style={[styles.bookmarkText, isBookmarked ? styles.bookmarkTextActive : null]}>
              {isBookmarked ? copy.bookmarked : copy.bookmark}
            </Text>
          </Pressable>
          <Pressable
            android_ripple={{ color: colors.focusSoft }}
            aria-checked={includeSupplementary}
            accessibilityRole="switch"
            accessibilityState={{ checked: includeSupplementary }}
            accessibilityLabel={
              includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff
            }
            hitSlop={space[1]}
            onBlur={() => setFocusedHeaderControl(null)}
            onFocus={() => setFocusedHeaderControl('supplementary')}
            onPress={handleSupplementaryToggle}
            style={({ pressed }) => [
              styles.bookmarkButton,
              includeSupplementary ? styles.bookmarkButtonActive : null,
              focusedHeaderControl === 'supplementary' ? styles.headerControlFocused : null,
              pressed
                ? reduceMotion
                  ? styles.headerControlPressedReducedMotion
                  : styles.headerControlPressed
                : null,
            ]}
          >
            <Text
              style={[styles.bookmarkText, includeSupplementary ? styles.bookmarkTextActive : null]}
            >
              {includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff}
            </Text>
          </Pressable>
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
              pressed
                ? reduceMotion
                  ? styles.headerControlPressedReducedMotion
                  : styles.headerControlPressed
                : null,
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
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearProgressPersistenceWarning}
        warning={progressPersistenceWarning}
      />
      <PersistenceWarningNotice
        language={language}
        onDismiss={clearMistakeReviewPersistenceWarning}
        warning={mistakeReviewPersistenceWarning}
      />
      <StudyCompanionCard
        feedbackState={companionFeedbackState}
        language={language}
        mascotId={selectedCompanionId}
      />
      <QuestionCard question={question} language={language} />
      <AudioButton
        enabled={audioEnabled}
        language={language}
        rate={audioPlaybackRate}
        text={questionSpeechText}
      />
      {confidenceRatingEnabled ? (
        <ConfidenceRatingPicker
          disabled={hasSelectedAnswer}
          language={language}
          onChange={setSelectedConfidenceRating}
          value={selectedConfidenceRating}
        />
      ) : null}

      <View style={styles.options}>
        {question.options.map((option) => {
          const isStruck = !hasSelectedAnswer && struckOptionIds.includes(option.id);
          const feedback = getAnswerOptionFeedback(
            question,
            option.id,
            hasSelectedAnswer ? selectedOptionId : null,
            language,
          );

          return (
            <AnswerOption
              key={option.id}
              disabled={hasSelectedAnswer || isStruck}
              language={language}
              onToggleStrikeout={() => toggleStruckOption(question.id, option.id)}
              option={option}
              onPress={isStruck ? undefined : () => handleSelectOption(option.id)}
              resultLabel={feedback.resultLabel}
              selected={hasSelectedAnswer && selectedOptionId === option.id}
              showStrikeoutControl={!hasSelectedAnswer}
              struck={isStruck}
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
          {currentScore ? (
            <Text style={styles.score}>
              {copy.scoreLabel}: {currentScore.correct}/{currentScore.total}
            </Text>
          ) : null}
          <PostAnswerRewardPanel
            answerXp={answerXpAwardedForSelection}
            correctStreak={celebrationStreak}
            isCorrect={selectedIsCorrect}
            language={language}
            level={level}
            question={question}
            streakDays={streakDays}
            totalXp={totalXp}
          />
          <ExplanationPanel
            explanationEn={question.explanationEn}
            explanationSv={question.explanationSv}
            language={language}
          />
          <FeedbackAudioButton
            enabled={audioEnabled}
            language={language}
            rate={audioPlaybackRate}
            text={buildAnswerFeedbackSpeechText(question, selectedOptionId)}
          />
          <UHRReferenceCard language={language} reference={question.uhrReference} />
          <QuestionReportLink
            language={language}
            question={question}
            screen="practice"
            selectedOptionId={selectedOptionId}
          />
          <PracticeInterstitialAd
            showKey={getPracticeInterstitialShowKey(question.id, shuffleSessionId)}
          />
          <RemoveAdsPlacementCta placement="quiz_completed_interstitial" />
          <View style={styles.feedbackActions}>
            <Button
              accessibilityLabel={copy.nextQuestionAccessibilityLabel}
              accessibilityRole="button"
              onPress={handleAdvanceQuestion}
              style={styles.feedbackButton}
            >
              {copy.nextQuestion}
            </Button>
            <Button
              accessibilityLabel={copy.tryAgainAccessibilityLabel}
              accessibilityRole="button"
              onPress={handleTryAgain}
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
  emptyContainer: {
    flex: 1,
    padding: space[3],
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: space.hairline,
    gap: space[1.25],
    padding: space[3],
  },
  hubActions: {
    alignItems: 'stretch',
    gap: space[1],
  },
  hubActionButton: {
    width: '100%',
  },
  chapterGrid: {
    gap: space[1],
  },
  chapterCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    gap: space[0.75],
    minHeight: space[8],
    padding: space[2],
  },
  chapterCardPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  chapterCardPressedReducedMotion: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
  },
  chapterTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  chapterMeta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  chapterAction: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.caption.lineHeight,
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
    borderWidth: space.hairline,
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
    borderWidth: space.hairline,
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
  headerControlPressedReducedMotion: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focusSoft,
  },
  bookmarkButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
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
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
});
