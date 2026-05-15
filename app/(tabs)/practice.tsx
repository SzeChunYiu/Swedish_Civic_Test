import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AudioButton } from '../../components/learning/AudioButton';
import { AnswerOption } from '../../components/quiz/AnswerOption';
import { QuestionDisclaimer } from '../../components/quiz/QuestionDisclaimer';
import { questions } from '../../data/questions';
import { isCorrectAnswer } from '../../lib/quiz/answerValidation';
import { usePracticeSessionStore } from '../../lib/quiz/practiceSessionStore';
import { scoreAnswers } from '../../lib/quiz/scoring';
import { useProgressStore } from '../../lib/storage/progressStore';

export default function Screen() {
  const selectedOptionId = usePracticeSessionStore((state) => state.selectedOptionId);
  const selectOption = usePracticeSessionStore((state) => state.selectOption);
  const resetSelection = usePracticeSessionStore((state) => state.resetSelection);
  const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);
  const markQuestionCompleted = useProgressStore((state) => state.markQuestionCompleted);
  const question = questions[0];

  if (!question) {
    return (
      <View style={styles.container}>
        <Text>No practice questions are available yet.</Text>
      </View>
    );
  }

  const selectedIsCorrect = selectedOptionId ? isCorrectAnswer(question, selectedOptionId) : false;
  const currentScore = selectedOptionId ? scoreAnswers([selectedIsCorrect]) : null;
  const handleSelectOption = (optionId: string) => {
    selectOption(optionId);
    markQuestionCompleted(question.id);
  };

  return (
    <View style={styles.container}>
      <Text>Practice</Text>
      <QuestionDisclaimer />
      <Text>Completed questions: {completedQuestionIds.length}</Text>
      <Text>{question.questionSv}</Text>
      <AudioButton text={question.questionSv} />

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
        <>
          {currentScore ? (
            <Text>
              Score: {currentScore.correct}/{currentScore.total}
            </Text>
          ) : null}
          <Text>{question.explanationSv}</Text>
          <Pressable onPress={resetSelection}>
            <Text>Try again</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  options: {
    gap: 8,
  },
});
