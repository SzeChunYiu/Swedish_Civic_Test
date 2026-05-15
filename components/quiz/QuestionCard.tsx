import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';

export function QuestionCard({ question }: { question?: PracticeQuestion }) {
  return (
    <Card>
      <Text style={styles.label}>{question?.difficulty ?? 'practice'}</Text>
      <Text style={styles.question}>{question?.questionSv ?? 'Question placeholder'}</Text>
      {question?.questionEn ? <Text style={styles.translation}>{question.questionEn}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  question: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 6,
  },
  translation: {
    color: '#615d59',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});
