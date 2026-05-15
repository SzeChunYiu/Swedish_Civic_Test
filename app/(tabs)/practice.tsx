import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { AdBanner } from '../../components/monetization/AdBanner';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { ExplanationPanel } from '../../components/quiz/ExplanationPanel';
import { QuestionCard } from '../../components/quiz/QuestionCard';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { UHRReferenceCard } from '../../components/quiz/UHRReferenceCard';
import { questions } from '../../data/questions';
import { buildQuestionSpeechText } from '../../lib/audio/speak';
import { isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { usePracticeSessionStore } from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useProgressStore } from '../../lib/storage/progressStore';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space } from '../../lib/theme';

export default function Screen() {
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const recordAnswer = useProgressStore((state) => state.recordAnswer);
  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const question = questions[0];

  if (!question) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No practice questions are available yet.</Text>
      </View>
    );
  }

  const selectedIsCorrect = selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const currentScore = selectedOptionId ? scoreAnswers([selectedIsCorrect]) : null;
  const handleSelectOption = (optionId: string) => {
    selectOption(optionId);
    recordAnswer(question.id, isCorrectAnswer(question, optionId));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Practice</Text>
      <QuestionDisclaimer />
      <Text style={styles.meta}>Completed questions: {completedQuestionIds.length}</Text>
      <QuestionCard question={question} />
      <AudioButton text={buildQuestionSpeechText(question)} enabled={audioEnabled} />

      <View style={styles.options}>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;

          return (
            <AnswerOption
              key={option.id}
              option={option}
              onPress={() => handleSelectOption(option.id)}
              resultLabel={isSelected ? (selectedIsCorrect ? 'Rätt' : 'Fel') : undefined}
            />
          );
        })}
      </View>

      {selectedOptionId ? (
        <View style={styles.feedback}>
          {currentScore ? (
            <Text style={styles.score}>
              Score: {currentScore.correct}/{currentScore.total}
            </Text>
          ) : null}
          <ExplanationPanel explanationSv={question.explanationSv} />
          <UHRReferenceCard reference={question.uhrReference} />
          <AdBanner placement="quiz_completed_interstitial" />
          <Pressable
            accessibilityLabel="Try this practice question again"
            onPress={resetSelection}
            style={styles.tryAgain}
          >
            <Text style={styles.tryAgainText}>Try again</Text>
          </Pressable>
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
  },
  emptyContainer: {
    flex: 1,
    padding: space[3],
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.625,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  options: {
    gap: space[1],
  },
  feedback: {
    gap: space[1.5],
  },
  score: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '600',
  },
});
