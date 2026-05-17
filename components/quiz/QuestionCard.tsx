import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function QuestionCard({ question }: { question?: PracticeQuestion }) {
  return (
    <Card>
      <Text style={styles.label}>{question?.difficulty ?? 'practice'}</Text>
      <Text style={styles.question}>{question?.questionSv ?? 'Question unavailable'}</Text>
      {question?.questionEn ? <Text style={styles.translation}>{question.questionEn}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.navButton.fontWeight,
    textTransform: 'uppercase',
  },
  question: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.body.lineHeight,
    marginTop: space[0.75],
  },
  translation: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[1],
  },
});
