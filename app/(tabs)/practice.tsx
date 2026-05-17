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
import { getPracticeQuestionForSession } from '../../lib/quiz/practiceFlow';
import { usePracticeSessionStore } from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

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
  const question = getPracticeQuestionForSession(questions, completedQuestionIds, activeQuestionId);

  if (!question) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No practice questions are available yet.</Text>
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
        <Badge>5-minute practice</Badge>
        <Text accessibilityRole="header" style={styles.title}>
          Question {questionNumber}
        </Text>
        <Text style={styles.subtitle}>
          Answer, get instant feedback, then review the UHR source before moving on.
        </Text>
        <ProgressBar progress={bankProgress} />
        <Text style={styles.meta}>Completed questions: {completedQuestionIds.length}</Text>
        <Pressable
          aria-selected={isBookmarked}
          accessibilityLabel={
            isBookmarked ? 'Remove this question bookmark' : 'Bookmark this question'
          }
          accessibilityRole="button"
          accessibilityState={{ selected: isBookmarked }}
          onPress={() => toggleBookmark(question.id)}
          style={[styles.bookmarkButton, isBookmarked ? styles.bookmarkButtonActive : null]}
        >
          <Text style={[styles.bookmarkText, isBookmarked ? styles.bookmarkTextActive : null]}>
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
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
              Score: {currentScore.correct}/{currentScore.total}
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
              accessibilityLabel="Move to the next practice question"
              accessibilityRole="button"
              onPress={advanceQuestion}
              style={styles.nextQuestion}
            >
              <Text style={styles.nextQuestionText}>Next question</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Try this practice question again"
              accessibilityRole="button"
              onPress={resetSelection}
              style={styles.tryAgain}
            >
              <Text style={styles.tryAgainText}>Try again</Text>
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
