import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { FeedbackAudioButton } from '../../components/learning/FeedbackAudioButton';
import { Badge } from '../../components/ui/Badge';
import { PracticeInterstitialAd } from '../../components/monetization/PracticeInterstitialAd';
import { RemoveAdsPlacementCta } from '../../components/monetization/RemoveAdsPlacementCta';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { CelebrationBurst } from '../../components/quiz/CelebrationBurst';
import { ConfidenceRatingPicker } from '../../components/quiz/ConfidenceRatingPicker';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { PersistenceWarningNotice } from '../../components/storage/PersistenceWarningNotice';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { questions } from '../../data/questions';
import { buildAnswerFeedbackSpeechText, buildQuestionSpeechText } from '../../lib/audio/speak';
import { filterQuestionsByProvenance } from '../../lib/content/provenance';
import {
  buildDailyChallenge,
  DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
} from '../../lib/learning/dailyChallenge';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import {
  getCompletedQuestionIdsForQuestionBank,
  getPracticeQuestionForSession,
} from '../../lib/quiz/practiceFlow';
import { useProLifetimeEntitlements } from '../../lib/monetization/useProLifetimeEntitlements';
import {
  getPracticeInterstitialShowKey,
  usePracticeSessionStore,
} from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useMistakeReviewStore } from '../../lib/storage/mistakeReviewStore';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { ConfidenceRating } from '../../types/progress';

type PracticeHeaderControl = 'bookmark' | 'supplementary' | 'sources';

type ChallengeAnswer = {
  questionId: string;
  isCorrect: boolean;
};

type PracticeCopy = {
  badge: string;
  bookmark: string;
  bookmarked: string;
  bookmarkAccessibilityLabel: (isBookmarked: boolean) => string;
  challengeBadge: string;
  challengeSubtitle: string;
  challengeTimer: (seconds: number) => string;
  completedQuestions: (count: number) => string;
  emptyTitle: string;
  nextQuestion: string;
  nextQuestionAccessibilityLabel: string;
  questionTitle: (questionNumber: number) => string;
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
    challengeBadge: 'Dagens utmaning',
    challengeSubtitle:
      'Fem frågor från dagens urval. Timern är lokal och försöket sparas som klart för dagen.',
    challengeTimer: (seconds) => `${seconds} sekunder kvar`,
    completedQuestions: (count) => `Besvarade frågor: ${count}`,
    emptyTitle: 'Det finns inga övningsfrågor ännu.',
    nextQuestion: 'Nästa fråga',
    nextQuestionAccessibilityLabel: 'Gå till nästa övningsfråga',
    questionTitle: (questionNumber) => `Fråga ${questionNumber}`,
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
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av mock-provet.',
  },
  en: {
    badge: '5-minute practice',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question',
    challengeBadge: 'Daily challenge',
    challengeSubtitle:
      "Five questions from today's set. The timer is local and completion is saved for the day.",
    challengeTimer: (seconds) => `${seconds} seconds left`,
    completedQuestions: (count) => `Completed questions: ${count}`,
    emptyTitle: 'No practice questions are available yet.',
    nextQuestion: 'Next question',
    nextQuestionAccessibilityLabel: 'Move to the next practice question',
    questionTitle: (questionNumber) => `Question ${questionNumber}`,
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
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const recordDailyChallengeCompletion = useProgressStore(
    (state) => state.recordDailyChallengeCompletion,
  );
  const dailyChallengeCompletions = useProgressStore((state) => state.dailyChallengeCompletions);
  const progressPersistenceWarning = useProgressStore((state) => state.persistenceWarning);
  const clearProgressPersistenceWarning = useProgressStore(
    (state) => state.clearPersistenceWarning,
  );
  const recordWrongAnswerReview = useMistakeReviewStore((state) => state.recordWrongAnswerReview);
  const mistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.persistenceWarning,
  );
  const clearMistakeReviewPersistenceWarning = useMistakeReviewStore(
    (state) => state.clearPersistenceWarning,
  );
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
  const [selectedConfidenceRating, setSelectedConfidenceRating] = useState<ConfidenceRating | null>(
    null,
  );
  const [challengeAnswers, setChallengeAnswers] = useState<ChallengeAnswer[]>([]);
  const [remainingChallengeSeconds, setRemainingChallengeSeconds] = useState(
    DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
  );
  const [challengeRetryActive, setChallengeRetryActive] = useState(false);
  const { entitlements: proEntitlements, entitlementsReady: proEntitlementsReady } =
    useProLifetimeEntitlements();
  const copy = practiceCopy[language];
  const dailyChallenge = useMemo(() => buildDailyChallenge({ bank: questions }), []);
  const challengeQuestions = useMemo(
    () =>
      dailyChallenge.questionIds
        .map((questionId) => questions.find((candidate) => candidate.id === questionId))
        .filter((candidate): candidate is (typeof questions)[number] => Boolean(candidate)),
    [dailyChallenge.questionIds],
  );
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const practiceQuestionBank = isChallengeMode ? challengeQuestions : filteredQuestions;
  const visibleCompletedQuestionIds = useMemo(
    () =>
      isChallengeMode
        ? challengeAnswers.map((answer) => answer.questionId)
        : getCompletedQuestionIdsForQuestionBank(practiceQuestionBank, completedQuestionIds),
    [challengeAnswers, completedQuestionIds, isChallengeMode, practiceQuestionBank],
  );
  const rawQuestion = getPracticeQuestionForSession(
    practiceQuestionBank,
    visibleCompletedQuestionIds,
    activeQuestionId,
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId) : undefined,
    [rawQuestion, shuffleSessionId],
  );
  const confidenceRatingEnabled = proEntitlementsReady && proEntitlements.confidenceSlider === true;
  const challengeQuestionTotal = challengeQuestions.length;
  const challengeCompletedToday = Boolean(dailyChallengeCompletions[dailyChallenge.dayKey]);
  const challengeInactive =
    isChallengeMode &&
    (challengeRetryActive || remainingChallengeSeconds <= 0 || challengeQuestionTotal === 0);

  useEffect(() => {
    setSelectedConfidenceRating(null);
  }, [question?.id]);

  useEffect(() => {
    if (!isChallengeMode) return;

    resetSelection();
    setChallengeAnswers([]);
    setChallengeRetryActive(false);
    setRemainingChallengeSeconds(dailyChallenge.timeLimitSeconds);
  }, [dailyChallenge.dayKey, dailyChallenge.timeLimitSeconds, isChallengeMode, resetSelection]);

  useEffect(() => {
    if (!isChallengeMode || challengeInactive || challengeCompletedToday) return;

    const timerId = setInterval(() => {
      setRemainingChallengeSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timerId);
  }, [challengeCompletedToday, challengeInactive, isChallengeMode]);

  useEffect(() => {
    if (
      !isChallengeMode ||
      remainingChallengeSeconds > 0 ||
      challengeRetryActive ||
      challengeQuestionTotal === 0
    ) {
      return;
    }

    const correctCount = challengeAnswers.filter((answer) => answer.isCorrect).length;
    recordDailyChallengeCompletion({
      dayKey: dailyChallenge.dayKey,
      questionIds: dailyChallenge.questionIds,
      correctCount,
      totalCount: challengeQuestionTotal,
      score: challengeQuestionTotal > 0 ? correctCount / challengeQuestionTotal : 0,
      timeSpentSeconds: dailyChallenge.timeLimitSeconds,
      completedAt: new Date().toISOString(),
    });
    setChallengeRetryActive(true);
  }, [
    challengeAnswers,
    challengeQuestionTotal,
    challengeRetryActive,
    dailyChallenge.dayKey,
    dailyChallenge.questionIds,
    dailyChallenge.timeLimitSeconds,
    isChallengeMode,
    recordDailyChallengeCompletion,
    remainingChallengeSeconds,
  ]);

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
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;
  const questionIndex = practiceQuestionBank.findIndex((candidate) => candidate.id === question.id);
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress =
    isChallengeMode && challengeQuestionTotal > 0
      ? challengeAnswers.length / challengeQuestionTotal
      : practiceQuestionBank.length > 0
        ? questionNumber / practiceQuestionBank.length
        : 0;
  const completedQuestionCount = isChallengeMode
    ? challengeAnswers.length
    : visibleCompletedQuestionIds.length;
  const handleSelectOption = (optionId: string) => {
    if (challengeInactive) return;

    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);
    const answerConfidenceRating = confidenceRatingEnabled
      ? (selectedConfidenceRating ?? undefined)
      : undefined;

    selectOption(question.id, optionId);
    recordAnswer(question.id, optionIsCorrect, answerConfidenceRating);

    if (isChallengeMode && !challengeAnswers.some((answer) => answer.questionId === question.id)) {
      const nextChallengeAnswers = [
        ...challengeAnswers,
        { questionId: question.id, isCorrect: optionIsCorrect },
      ];
      setChallengeAnswers(nextChallengeAnswers);

      if (nextChallengeAnswers.length >= challengeQuestionTotal) {
        const correctCount = nextChallengeAnswers.filter((answer) => answer.isCorrect).length;
        const timeSpentSeconds = Math.max(
          0,
          dailyChallenge.timeLimitSeconds - remainingChallengeSeconds,
        );
        recordDailyChallengeCompletion({
          dayKey: dailyChallenge.dayKey,
          questionIds: dailyChallenge.questionIds,
          correctCount,
          totalCount: challengeQuestionTotal,
          score: challengeQuestionTotal > 0 ? correctCount / challengeQuestionTotal : 0,
          timeSpentSeconds,
          completedAt: new Date().toISOString(),
        });
        setChallengeRetryActive(true);
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
  const handleAdvanceQuestion = () => {
    setSelectedConfidenceRating(null);
    if (isChallengeMode && challengeRetryActive) return;
    advanceQuestion();
  };
  const handleTryAgain = () => {
    setSelectedConfidenceRating(null);
    if (isChallengeMode && challengeRetryActive) {
      resetSelection();
      setChallengeAnswers([]);
      setRemainingChallengeSeconds(dailyChallenge.timeLimitSeconds);
      setChallengeRetryActive(false);
      return;
    }
    resetSelection();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{isChallengeMode ? copy.challengeBadge : copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.questionTitle(questionNumber)}
        </Text>
        <Text style={styles.subtitle}>
          {isChallengeMode ? copy.challengeSubtitle : copy.subtitle}
        </Text>
        {isChallengeMode ? (
          <Text accessibilityRole="timer" style={styles.challengeTimer}>
            {copy.challengeTimer(remainingChallengeSeconds)}
          </Text>
        ) : null}
        <ProgressBar language={language} progress={bankProgress} />
        <Text style={styles.meta}>{copy.completedQuestions(completedQuestionCount)}</Text>
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
          {isChallengeMode ? null : (
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
                style={[
                  styles.bookmarkText,
                  includeSupplementary ? styles.bookmarkTextActive : null,
                ]}
              >
                {includeSupplementary ? copy.supplementaryToggleOn : copy.supplementaryToggleOff}
              </Text>
            </Pressable>
          )}
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
      <QuestionCard question={question} language={language} />
      <AudioButton
        enabled={audioEnabled}
        language={language}
        text={buildQuestionSpeechText(question)}
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
              disabled={hasSelectedAnswer || challengeInactive}
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
  challengeTimer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
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
