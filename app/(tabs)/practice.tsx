import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { QuestionReportLink } from '../../components/quiz/QuestionReportLink';
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
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';
import type { ConfidenceRating } from '../../types/progress';

type PracticeHeaderControl = 'bookmark' | 'supplementary' | 'sources';

type PracticeCopy = {
  badge: string;
  bookmark: string;
  bookmarked: string;
  bookmarkAccessibilityLabel: (isBookmarked: boolean) => string;
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
  challengeBadge: string;
  challengeTimer: (remainingSeconds: number) => string;
  challengeTimedOut: string;
};

const practiceCopy: Record<AppLanguage, PracticeCopy> = {
  sv: {
    badge: '5-minutersövning',
    bookmark: 'Bokmärk',
    bookmarked: 'Bokmärkt',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Ta bort bokmärket från den här frågan' : 'Bokmärk den här frågan',
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
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av övningsprovet.',
    challengeBadge: 'Dagens utmaning',
    challengeTimer: (remainingSeconds) => `${remainingSeconds} sekunder kvar`,
    challengeTimedOut: 'Tiden är ute. Försök igen för att starta om dagens utmaning.',
  },
  en: {
    badge: '5-minute practice',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    bookmarkAccessibilityLabel: (isBookmarked) =>
      isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question',
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
    challengeBadge: 'Daily challenge',
    challengeTimer: (remainingSeconds) => `${remainingSeconds} seconds left`,
    challengeTimedOut: "Time is up. Try again to restart today's challenge.",
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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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
  const [remainingChallengeSeconds, setRemainingChallengeSeconds] = useState(
    DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
  );
  const [challengeRetryActive, setChallengeRetryActive] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, boolean>>({});
  const { entitlements: proEntitlements, entitlementsReady: proEntitlementsReady } =
    useProLifetimeEntitlements();
  const copy = practiceCopy[language];
  const dailyChallenge = useMemo(() => buildDailyChallenge({ bank: questions }), []);
  const challengeQuestions = useMemo(
    () =>
      dailyChallenge.questionIds
        .map((questionId) => questions.find((candidate) => candidate.id === questionId))
        .filter((question): question is PracticeQuestion => Boolean(question)),
    [dailyChallenge.questionIds],
  );
  const filteredQuestions = useMemo(
    () => filterQuestionsByProvenance(questions, { includeSupplementary }),
    [includeSupplementary],
  );
  const practiceQuestionBank = isChallengeMode ? challengeQuestions : filteredQuestions;
  const visibleCompletedQuestionIds = useMemo(
    () => getCompletedQuestionIdsForQuestionBank(practiceQuestionBank, completedQuestionIds),
    [completedQuestionIds, practiceQuestionBank],
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

  useEffect(() => {
    setSelectedConfidenceRating(null);
  }, [question?.id]);

  useEffect(() => {
    setRemainingChallengeSeconds(DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
    setChallengeAnswers({});
    setChallengeRetryActive(false);
  }, [dailyChallenge.dayKey, isChallengeMode]);

  const hasSelectedAnswer = Boolean(
    question && selectedOptionId && activeQuestionId === question.id,
  );
  const challengeTimedOut = isChallengeMode && remainingChallengeSeconds <= 0;

  useEffect(() => {
    if (!isChallengeMode || hasSelectedAnswer || challengeTimedOut) return undefined;

    const timer = setTimeout(() => {
      setRemainingChallengeSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    challengeRetryActive,
    challengeTimedOut,
    hasSelectedAnswer,
    isChallengeMode,
    remainingChallengeSeconds,
  ]);

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
  const currentScore = hasSelectedAnswer ? scoreAnswers([selectedIsCorrect]) : null;
  const celebrationStreak = selectedIsCorrect
    ? (questionProgress[question.id]?.correctStreak ?? 1)
    : 0;
  const questionIndex = practiceQuestionBank.findIndex((candidate) => candidate.id === question.id);
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress =
    practiceQuestionBank.length > 0 ? questionNumber / practiceQuestionBank.length : 0;
  const handleSelectOption = (optionId: string) => {
    if (challengeTimedOut) return;

    const selectedOption = question.options.find((option) => option.id === optionId);
    const optionIsCorrect = isCorrectAnswer(question, optionId);
    const answerConfidenceRating = confidenceRatingEnabled
      ? (selectedConfidenceRating ?? undefined)
      : undefined;

    selectOption(question.id, optionId);
    recordAnswer(question.id, optionIsCorrect, answerConfidenceRating);

    if (isChallengeMode) {
      const nextChallengeAnswers = { ...challengeAnswers, [question.id]: optionIsCorrect };
      setChallengeAnswers(nextChallengeAnswers);

      if (Object.keys(nextChallengeAnswers).length >= challengeQuestions.length) {
        const correctCount = Object.values(nextChallengeAnswers).filter(Boolean).length;
        const totalCount = challengeQuestions.length;
        recordDailyChallengeCompletion({
          dayKey: dailyChallenge.dayKey,
          questionIds: dailyChallenge.questionIds,
          correctCount,
          totalCount,
          score: totalCount > 0 ? correctCount / totalCount : 0,
          timeSpentSeconds: DAILY_CHALLENGE_TIME_LIMIT_SECONDS - remainingChallengeSeconds,
          completedAt: new Date().toISOString(),
        });
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
    advanceQuestion();
  };
  const handleTryAgain = () => {
    setSelectedConfidenceRating(null);
    if (isChallengeMode) {
      setChallengeRetryActive(true);
      setRemainingChallengeSeconds(DAILY_CHALLENGE_TIME_LIMIT_SECONDS);
      setChallengeAnswers({});
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
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <ProgressBar language={language} progress={bankProgress} />
        <Text style={styles.meta}>
          {isChallengeMode
            ? copy.challengeTimer(remainingChallengeSeconds)
            : copy.completedQuestions(visibleCompletedQuestionIds.length)}
        </Text>
        {challengeTimedOut ? <Text style={styles.meta}>{copy.challengeTimedOut}</Text> : null}
        <View style={styles.headerControls}>
          <Pressable
            android_ripple={{ color: themeColors.focusSoft }}
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
            android_ripple={{ color: themeColors.focusSoft }}
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
            android_ripple={{ color: themeColors.focusSoft }}
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
              disabled={hasSelectedAnswer || challengeTimedOut}
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
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
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: space[1.25],
      padding: space[3],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    meta: {
      color: themeColors.textMuted,
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
      backgroundColor: themeColors.badgeBlueBg,
      color: themeColors.badgeBlueText,
    },
    provenanceSupplementary: {
      backgroundColor: themeColors.surfaceWarm,
      color: themeColors.text,
    },
    provenanceEditorial: {
      backgroundColor: themeColors.surfaceMuted,
      color: themeColors.textMuted,
    },
    aboutSourcesTrigger: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
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
      color: themeColors.accent,
      fontSize: typography.caption.fontSize,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    aboutSourcesPanel: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: StyleSheet.hairlineWidth,
      gap: space[0.5],
      padding: space[1.5],
    },
    aboutSourcesItemTitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    aboutSourcesItemBody: {
      color: themeColors.textMuted,
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
      borderColor: themeColors.focus,
    },
    headerControlPressed: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    bookmarkButton: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
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
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.focusSoft,
    },
    bookmarkText: {
      color: themeColors.textSecondary,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    bookmarkTextActive: {
      color: themeColors.badgeBlueText,
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
      color: themeColors.success,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
  });
}
