import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { Badge } from '../../components/ui/Badge';
import { PracticeInterstitialAd } from '../../components/monetization/PracticeInterstitialAd';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import { buildAnswerFeedbackSpeechText, buildQuestionSpeechText } from '../../lib/audio/speak';
import { filterQuestionsByProvenance } from '../../lib/content/provenance';
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
  const activeQuestionId = usePracticeSessionStore((state) => state.activeQuestionId);
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const advanceQuestion = usePracticeSessionStore((state) => state.advanceQuestion);
  const shuffleSessionId = usePracticeSessionStore((state) => state.shuffleSessionId);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const questionProgress = useProgressStore((state) => state.questionProgress);
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
  const [practiceScope, setPracticeScope] = useState<PracticeScope>({ type: 'all' });
  const [practiceStarted, setPracticeStarted] = useState(() => Boolean(activeQuestionId));
  const copy = practiceCopy[language];
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const visibleCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(filteredQuestions, completedQuestionIds),
    [completedQuestionIds, filteredQuestions],
  );
  const selectedPracticeQuestions = useMemo(
    () =>
      getQuestionsForPracticeScope(
        filteredQuestions,
        visibleCompletedQuestionIds,
        practiceScope,
        QUICK_ROUND_SIZE,
      ),
    [filteredQuestions, practiceScope, visibleCompletedQuestionIds],
  );
  const scopedCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(selectedPracticeQuestions, completedQuestionIds),
    [completedQuestionIds, selectedPracticeQuestions],
  );
  const chapterPracticeSummaries = useMemo(
    () =>
      buildChapterPracticeSummaries(
        filteredQuestions,
        visibleCompletedQuestionIds,
        questionProgress,
        language,
      ),
    [filteredQuestions, language, questionProgress, visibleCompletedQuestionIds],
  );
  const quickRoundQuestionCount = Math.min(QUICK_ROUND_SIZE, filteredQuestions.length);
  const rawQuestion = getPracticeQuestionForSession(
    selectedPracticeQuestions,
    scopedCompletedQuestionIds,
    activeQuestionId,
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId) : undefined,
    [rawQuestion, shuffleSessionId],
  );
  const startPractice = (scope: PracticeScope) => {
    setPracticeScope(scope);
    setPracticeStarted(true);
    advanceQuestion();
  };

  if (!practiceStarted && !activeQuestionId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.hubContent}>
        <View style={styles.hubHero}>
          <Badge>{copy.hubBadge}</Badge>
          <Text accessibilityRole="header" style={styles.hubTitle}>
            {copy.hubTitle}
          </Text>
          <Text style={styles.subtitle}>{copy.hubSubtitle}</Text>
          <ProgressBar
            language={language}
            progress={
              filteredQuestions.length > 0
                ? visibleCompletedQuestionIds.length / filteredQuestions.length
                : 0
            }
          />
          <Text style={styles.meta}>
            {copy.hubProgressSummary(visibleCompletedQuestionIds.length, filteredQuestions.length)}
          </Text>
        </View>

        <View style={styles.hubActionGrid}>
          <View style={styles.hubActionPanel}>
            <Text accessibilityRole="header" style={styles.hubPanelTitle}>
              {copy.allPracticeTitle}
            </Text>
            <Text style={styles.hubPanelBody}>{copy.allPracticeBody}</Text>
            <Button
              accessibilityLabel={copy.allPracticeAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: filteredQuestions.length === 0 }}
              disabled={filteredQuestions.length === 0}
              onPress={() => startPractice({ type: 'all' })}
              style={styles.hubActionButton}
            >
              {copy.allPracticeCta}
            </Button>
          </View>
          <View style={styles.hubActionPanel}>
            <Text accessibilityRole="header" style={styles.hubPanelTitle}>
              {copy.quickRoundTitle}
            </Text>
            <Text style={styles.hubPanelBody}>{copy.quickRoundBody(quickRoundQuestionCount)}</Text>
            <Button
              accessibilityLabel={copy.quickRoundAccessibilityLabel(quickRoundQuestionCount)}
              accessibilityRole="button"
              accessibilityState={{ disabled: quickRoundQuestionCount === 0 }}
              disabled={quickRoundQuestionCount === 0}
              onPress={() => startPractice({ type: 'quick' })}
              style={styles.hubActionButton}
              variant="secondary"
            >
              {copy.quickRoundCta}
            </Button>
          </View>
          <View style={styles.hubActionPanel}>
            <Text accessibilityRole="header" style={styles.hubPanelTitle}>
              {copy.mockExamTitle}
            </Text>
            <Text style={styles.hubPanelBody}>{copy.mockExamBody}</Text>
            <Link
              accessibilityLabel={copy.mockExamAccessibilityLabel}
              accessibilityRole="link"
              href="/exam"
              style={styles.examLink}
            >
              {copy.mockExamCta}
            </Link>
          </View>
        </View>

        <View style={styles.chapterHub}>
          <Text accessibilityRole="header" style={styles.chapterHubTitle}>
            {copy.chapterHubTitle}
          </Text>
          <Text style={styles.chapterHubSubtitle}>{copy.chapterHubSubtitle}</Text>
          <View style={styles.chapterGrid}>
            {chapterPracticeSummaries.map((chapter) => (
              <Pressable
                key={chapter.id}
                android_ripple={{ color: colors.focusSoft }}
                aria-disabled={chapter.total === 0}
                accessibilityLabel={copy.chapterCardAccessibilityLabel(
                  chapter.title,
                  chapter.answered,
                  chapter.total,
                  chapter.accuracy,
                )}
                accessibilityRole="button"
                accessibilityState={{ disabled: chapter.total === 0 }}
                disabled={chapter.total === 0}
                hitSlop={space[1]}
                onPress={() => startPractice({ type: 'chapter', chapterId: chapter.id })}
                style={({ pressed }) => [
                  styles.chapterCard,
                  chapter.total === 0 ? styles.chapterCardDisabled : null,
                  pressed ? styles.chapterCardPressed : null,
                ]}
              >
                <Text accessibilityRole="header" style={styles.chapterCardTitle}>
                  {chapter.title}
                </Text>
                <Text style={styles.chapterCardDescription}>{chapter.description}</Text>
                <Text style={styles.chapterCardMeta}>
                  {copy.chapterProgressLabel(chapter.answered, chapter.total)}
                </Text>
                <Text style={styles.chapterCardMeta}>
                  {copy.chapterAccuracyLabel(chapter.accuracy)}
                </Text>
                <Text style={styles.chapterCardCta}>{copy.chapterStartCta}</Text>
              </Pressable>
            ))}
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
  const practiceInterstitialShowKey = getPracticeInterstitialShowKey(question.id, shuffleSessionId);
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;
  const questionIndex = selectedPracticeQuestions.findIndex(
    (candidate) => candidate.id === question.id,
  );
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress =
    selectedPracticeQuestions.length > 0 ? questionNumber / selectedPracticeQuestions.length : 0;
  const handleSelectOption = (optionId: string) => {
    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);

    selectOption(question.id, optionId);
    recordAnswer(question.id, optionIsCorrect);

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
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.questionTitle(questionNumber)}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <ProgressBar language={language} progress={bankProgress} />
        <Text style={styles.meta}>
          {copy.completedQuestions(scopedCompletedQuestionIds.length)}
        </Text>
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
            onPress={() => setIncludeSupplementary(!includeSupplementary)}
            style={({ pressed }) => [
              styles.bookmarkButton,
              includeSupplementary ? styles.bookmarkButtonActive : null,
              focusedHeaderControl === 'supplementary' ? styles.headerControlFocused : null,
              pressed ? styles.headerControlPressed : null,
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
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
});
