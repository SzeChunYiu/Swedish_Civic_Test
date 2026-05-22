import type { Href } from 'expo-router';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ConfidenceRatingPicker } from '../../components/quiz/ConfidenceRatingPicker';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { PostAnswerRewardPanel } from '../../components/quiz/PostAnswerRewardPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { QuestionReportLink } from '../../components/quiz/QuestionReportLink';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { Badge } from '../../components/ui/Badge';
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
import { calculateStreak } from '../../lib/learning/streaks';
import { calculateAnswerXp, calculateLevel } from '../../lib/learning/xp';
import { useProLifetimeEntitlements } from '../../lib/monetization/useProLifetimeEntitlements';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import { getChapterContextForQuizSession } from '../../lib/quiz/practiceFlow';
import { getQuestionOptionText } from '../../lib/quiz/questionText';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useAccessibilityStore } from '../../lib/storage/accessibilityStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { Chapter } from '../../types/content';
import type { ConfidenceRating } from '../../types/progress';

type QuizSessionCopy = {
  backToSearch: string;
  backToSearchAccessibilityLabel: string;
  backToPractice: string;
  backToPracticeAccessibilityLabel: string;
  badge: string;
  chapterSessionSubtitle: (chapterTitle: string) => string;
  chapterSessionTitle: (chapterTitle: string) => string;
  chapterTitle: (chapter: Chapter) => string;
  emptyBody: string;
  emptyTitle: string;
  notFoundBody: string;
  notFoundTitle: string;
  scoreLabel: string;
  sessionSubtitle: string;
  sessionTitle: (sessionId: string) => string;
  tryAgain: string;
  tryAgainAccessibilityLabel: string;
};

const quizSessionCopy: Record<AppLanguage, QuizSessionCopy> = {
  sv: {
    backToSearch: 'Sök övningsfrågor',
    backToSearchAccessibilityLabel: 'Sök efter övningsfrågor',
    backToPractice: 'Tillbaka till övning',
    backToPracticeAccessibilityLabel: 'Tillbaka till övning',
    badge: 'Frågepass',
    chapterSessionSubtitle: (chapterTitle) =>
      `Besvara en fråga från ${chapterTitle} och gå sedan igenom den källbaserade återkopplingen.`,
    chapterSessionTitle: (chapterTitle) => `Frågepass: ${chapterTitle}`,
    chapterTitle: (chapter) => chapter.nameSv,
    emptyBody: 'Gå tillbaka till övning eller sök när frågor har lagts till.',
    emptyTitle: 'Det finns inga övningsfrågor ännu.',
    notFoundBody: 'Vi hittar ingen övningsfråga för den här länken.',
    notFoundTitle: 'Frågan hittades inte',
    scoreLabel: 'Poäng',
    sessionSubtitle: 'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.',
    sessionTitle: (currentSessionId) => `Frågepass ${currentSessionId}`,
    tryAgain: 'Försök igen',
    tryAgainAccessibilityLabel: 'Försök igen med den här frågan',
  },
  en: {
    backToSearch: 'Search questions',
    backToSearchAccessibilityLabel: 'Search for practice questions',
    backToPractice: 'Back to Practice',
    backToPracticeAccessibilityLabel: 'Back to practice',
    badge: 'Quiz session',
    chapterSessionSubtitle: (chapterTitle) =>
      `Answer a question from ${chapterTitle}, then review the source-backed feedback.`,
    chapterSessionTitle: (chapterTitle) => `Quiz session: ${chapterTitle}`,
    chapterTitle: (chapter) => chapter.nameEn,
    emptyBody: 'Go back to Practice or Search when questions have been added.',
    emptyTitle: 'No quiz questions are available yet.',
    notFoundBody: 'We could not find a practice question for this link.',
    notFoundTitle: 'Question not found',
    scoreLabel: 'Score',
    sessionSubtitle: 'Answer the routed question, then review the source-backed feedback.',
    sessionTitle: (currentSessionId) => `Session ${currentSessionId}`,
    tryAgain: 'Try again',
    tryAgainAccessibilityLabel: 'Try this quiz question again',
  },
};

const maxSearchReturnQueryLength = 120;
let routedQuizShuffleAttemptSequence = 0;

function normalizeSessionId(sessionId: string | string[] | undefined): string {
  if (Array.isArray(sessionId)) return sessionId[0] ?? 'practice';
  return sessionId || 'practice';
}

function normalizeOptionalRouteParam(value: string | string[] | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue && rawValue.trim().length > 0 ? rawValue : null;
}

function normalizeSearchQueryParam(value: string | string[] | undefined): string | null {
  const normalizedValue = normalizeOptionalRouteParam(value);
  if (!normalizedValue || normalizedValue.length > maxSearchReturnQueryLength) return null;

  return normalizedValue;
}

function getBackToSearchHref(searchQuery: string | null): Href {
  if (!searchQuery) return '/search';

  return `/search?q=${encodeURIComponent(searchQuery)}` as Href;
}

function pickSessionQuestion(sessionId: string) {
  const exactMatch = questions.find((question) => question.id === sessionId);
  return exactMatch;
}

function createRoutedQuizShuffleSessionId(
  routeSessionId: string,
  now = Date.now(),
  random = Math.random(),
): string {
  routedQuizShuffleAttemptSequence += 1;
  const randomPart = Math.floor(random * Number.MAX_SAFE_INTEGER).toString(36) || '0';
  return `routed-quiz:${routeSessionId}:${now.toString(36)}:${routedQuizShuffleAttemptSequence.toString(
    36,
  )}:${randomPart}`;
}

function useRoutedQuizShuffleSessionId(routeSessionId: string): string {
  const attemptRef = useRef<{ routeSessionId: string; shuffleSessionId: string } | null>(null);

  if (attemptRef.current?.routeSessionId !== routeSessionId) {
    attemptRef.current = {
      routeSessionId,
      shuffleSessionId: createRoutedQuizShuffleSessionId(routeSessionId),
    };
  }

  return attemptRef.current.shuffleSessionId;
}

export default function QuizSessionScreen() {
  const { chapterId, q, query, sessionId } = useLocalSearchParams<{
    chapterId?: string | string[];
    q?: string | string[];
    query?: string | string[];
    sessionId: string | string[];
  }>();
  const normalizedSessionId = normalizeSessionId(sessionId);
  const routedQuizShuffleSessionId = useRoutedQuizShuffleSessionId(normalizedSessionId);
  const normalizedChapterId = normalizeOptionalRouteParam(chapterId);
  const returnSearchQuery = normalizeSearchQueryParam(q) ?? normalizeSearchQueryParam(query);
  const backToSearchHref = getBackToSearchHref(returnSearchQuery);
  const pickedQuestion = useMemo(
    () => pickSessionQuestion(normalizedSessionId),
    [normalizedSessionId],
  );
  const question = useMemo(
    () =>
      pickedQuestion
        ? shuffleQuestionOptionsForSession(pickedQuestion, routedQuizShuffleSessionId)
        : undefined,
    [routedQuizShuffleSessionId, pickedQuestion],
  );
  const chapterContext = useMemo(
    () => getChapterContextForQuizSession(chapters, pickedQuestion, normalizedChapterId),
    [normalizedChapterId, pickedQuestion],
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedConfidenceRating, setSelectedConfidenceRating] = useState<ConfidenceRating | null>(
    null,
  );
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const totalXp = useProgressStore((state) => state.totalXp);
  const answerDates = useProgressStore((state) => state.answerDates);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const audioPlaybackRate = useAccessibilityStore((state) => state.audioPlaybackRate);
  const listenFirstAudioEnabled = useAccessibilityStore((state) => state.listenFirstAudioEnabled);
  const { entitlements: proEntitlements, entitlementsReady: proEntitlementsReady } =
    useProLifetimeEntitlements();
  const confidenceRatingEnabled = proEntitlementsReady && proEntitlements.confidenceSlider === true;
  const copy = quizSessionCopy[language];
  const level = calculateLevel(totalXp);
  const streakDays = useMemo(() => calculateStreak(answerDates), [answerDates]);
  const chapterContextTitle = chapterContext ? copy.chapterTitle(chapterContext) : null;
  const sessionTitle = chapterContextTitle
    ? copy.chapterSessionTitle(chapterContextTitle)
    : copy.sessionTitle(normalizedSessionId);
  const sessionSubtitle = chapterContextTitle
    ? copy.chapterSessionSubtitle(chapterContextTitle)
    : copy.sessionSubtitle;
  const hasSelectedAnswer = Boolean(selectedOptionId);
  const questionSpeechText = useMemo(
    () => (question ? buildQuestionSpeechText(question) : ''),
    [question],
  );

  useQuestionAudioAutoplay({
    audioEnabled,
    listenFirstAudioEnabled,
    questionKey: question ? `quiz:${question.id}:${routedQuizShuffleSessionId}` : null,
    rate: audioPlaybackRate,
    speechText: questionSpeechText,
    stopSignal: hasSelectedAnswer,
  });

  useEffect(() => {
    setSelectedOptionId(null);
    setSelectedConfidenceRating(null);
  }, [routedQuizShuffleSessionId, question?.id]);

  if (!question) {
    const unknownSessionId = questions.length > 0;

    if (!unknownSessionId) {
      return (
        <View style={styles.emptyContainer}>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.emptyTitle}
          </Text>
          <Text style={styles.emptyBody}>{copy.emptyBody}</Text>
          <View style={styles.actions}>
            <Link
              accessibilityLabel={copy.backToPracticeAccessibilityLabel}
              accessibilityRole="link"
              dismissTo
              href="/practice"
              style={styles.linkButton}
            >
              {copy.backToPractice}
            </Link>
            <Link
              accessibilityLabel={copy.backToSearchAccessibilityLabel}
              accessibilityRole="link"
              href={backToSearchHref}
              style={styles.linkButton}
            >
              {copy.backToSearch}
            </Link>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.notFoundTitle}
        </Text>
        <Text style={styles.emptyBody}>{copy.notFoundBody}</Text>
        <View style={styles.actions}>
          <Link
            accessibilityLabel={copy.backToPracticeAccessibilityLabel}
            accessibilityRole="link"
            dismissTo
            href="/practice"
            style={styles.linkButton}
          >
            {copy.backToPractice}
          </Link>
          <Link
            accessibilityLabel={copy.backToSearchAccessibilityLabel}
            accessibilityRole="link"
            href={backToSearchHref}
            style={styles.linkButton}
          >
            {copy.backToSearch}
          </Link>
        </View>
      </View>
    );
  }

  const selectedIsCorrect = selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const score = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;
  const answerXp = hasSelectedAnswer
    ? calculateAnswerXp({ isCorrect: selectedIsCorrect, explanationRead: true })
    : 0;

  const handleSelectOption = (optionId: string) => {
    stopSpeech();
    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);
    const answerConfidenceRating = confidenceRatingEnabled
      ? (selectedConfidenceRating ?? undefined)
      : undefined;

    setSelectedOptionId(optionId);
    recordAnswer(question.id, optionIsCorrect, answerConfidenceRating);

    if (!optionIsCorrect && selectedOption) {
      recordWrongAnswerReview({
        questionId: question.id,
        selectedOptionTextEn: getQuestionOptionText(selectedOption, 'en'),
        selectedOptionTextSv: getQuestionOptionText(selectedOption, 'sv'),
      });
    }
  };
  const handleTryAgain = () => {
    stopSpeech();
    setSelectedOptionId(null);
    setSelectedConfidenceRating(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {sessionTitle}
        </Text>
        <Text style={styles.subtitle}>{sessionSubtitle}</Text>
        <ProgressBar language={language} progress={hasSelectedAnswer ? 1 : 0} />
        <View style={styles.actions}>
          <Link
            accessibilityLabel={copy.backToSearchAccessibilityLabel}
            accessibilityRole="link"
            href={backToSearchHref}
            style={styles.linkButton}
          >
            {copy.backToSearch}
          </Link>
        </View>
      </View>

      <QuestionDisclaimer language={language} />
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
              selected={selectedOptionId === option.id}
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
          {score ? (
            <Text style={styles.score}>
              {copy.scoreLabel}: {score.correct}/{score.total}
            </Text>
          ) : null}
          <PostAnswerRewardPanel
            answerXp={answerXp}
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
            explanationText={question.explanationText}
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
            screen="quiz"
            selectedOptionId={selectedOptionId}
          />
          <View style={styles.actions}>
            <Button
              accessibilityLabel={copy.tryAgainAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: false }}
              onPress={handleTryAgain}
              style={styles.actionButton}
              variant="secondary"
            >
              {copy.tryAgain}
            </Button>
            <Link
              accessibilityLabel={copy.backToPracticeAccessibilityLabel}
              accessibilityRole="link"
              dismissTo
              href="/practice"
              style={styles.linkButton}
            >
              {copy.backToPractice}
            </Link>
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: space[1.5],
    justifyContent: 'center',
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
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    maxWidth: 420,
    textAlign: 'center',
  },
  options: {
    gap: space[1],
  },
  feedback: {
    gap: space[1.5],
  },
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  actionButton: {
    minHeight: space[5] + space[0.5],
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[5] + space[0.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
    textDecorationLine: 'none',
  },
  link: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textDecorationLine: 'none',
  },
});
