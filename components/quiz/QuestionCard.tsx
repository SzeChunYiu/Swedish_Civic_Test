import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space } from '../../lib/theme';

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
    color: colors.badgeBlueText,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  question: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: space[0.75],
  },
  translation: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space[1],
  },
});
