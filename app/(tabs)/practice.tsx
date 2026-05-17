import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { Badge } from '../../components/ui/Badge';
import { AdBanner } from '../../components/monetization/AdBanner';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { questions } from '../../data/questions';
import { buildQuestionSpeechText } from '../../lib/audio/speak';
import { getAnswerOptionFeedback, isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { shuffleQuestionOptionsForSession } from '../../lib/quiz/answerOptionShuffle';
import { getPracticeQuestionForSession } from '../../lib/quiz/practiceFlow';
import { usePracticeSessionStore } from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

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
  },
};

export default function Screen() {
  const activeQuestionId = usePracticeSessionStore((state) => state.activeQuestionId);
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const advanceQuestion = usePracticeSessionStore((state) => state.advanceQuestion);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const questionProgress = useProgressStore((state) => state.questionProgress);
  const toggleBookmark = useProgressStore((state) => state.toggleBookmark);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const language = useSettingsStore((state) => state.language);
  const copy = practiceCopy[language];
  const rawQuestion = getPracticeQuestionForSession(
    questions,
    completedQuestionIds,
    activeQuestionId,
  );
  const question = useMemo(
    () =>
      rawQuestion ? shuffleQuestionOptionsForSession(rawQuestion, 'practice-session') : undefined,
    [rawQuestion],
  );

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
  const questionIndex = questions.findIndex((candidate) => candidate.id === question.id);
  const questionNumber = questionIndex >= 0 ? questionIndex + 1 : 0;
  const bankProgress = questions.length > 0 ? questionNumber / questions.length : 0;
  const handleSelectOption = (optionId: string) => {
    selectOption(question.id, optionId);
    recordAnswer(question.id, isCorrectAnswer(question, optionId));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Badge>{copy.badge}</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.questionTitle(questionNumber)}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <ProgressBar progress={bankProgress} />
        <Text style={styles.meta}>{copy.completedQuestions(completedQuestionIds.length)}</Text>
        <Pressable
          aria-selected={isBookmarked}
          accessibilityLabel={copy.bookmarkAccessibilityLabel(isBookmarked)}
          accessibilityRole="button"
          accessibilityState={{ selected: isBookmarked }}
          onPress={() => toggleBookmark(question.id)}
          style={[styles.bookmarkButton, isBookmarked ? styles.bookmarkButtonActive : null]}
        >
          <Text style={[styles.bookmarkText, isBookmarked ? styles.bookmarkTextActive : null]}>
            {isBookmarked ? copy.bookmarked : copy.bookmark}
          </Text>
        </Pressable>
      </View>
      <QuestionDisclaimer />
      <QuestionCard question={question} />
      <AudioButton text={buildQuestionSpeechText(question)} enabled={audioEnabled} />

      <View style={styles.options}>
        {question.options.map((option) => {
          const feedback = getAnswerOptionFeedback(
            question,
            option.id,
            hasSelectedAnswer ? selectedOptionId : null,
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
          <UHRReferenceCard reference={question.uhrReference} />
          <AdBanner placement="quiz_completed_interstitial" />
          <View style={styles.feedbackActions}>
            <Pressable
              accessibilityLabel={copy.nextQuestionAccessibilityLabel}
              accessibilityRole="button"
              onPress={advanceQuestion}
              style={styles.nextQuestion}
            >
              <Text style={styles.nextQuestionText}>{copy.nextQuestion}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.tryAgainAccessibilityLabel}
              accessibilityRole="button"
              onPress={resetSelection}
              style={styles.tryAgain}
            >
              <Text style={styles.tryAgainText}>{copy.tryAgain}</Text>
            </Pressable>
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
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  bookmarkButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
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
  score: {
    color: colors.success,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  nextQuestion: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  nextQuestionText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
  tryAgain: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  tryAgainText: {
    color: colors.accent,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
