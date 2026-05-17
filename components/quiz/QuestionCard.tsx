import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';
import {
  getQuestionDisplayText,
  getQuestionSourceCitation,
  getQuestionTranslationText,
} from '../../lib/quiz/questionText';
import { colors, space, typography } from '../../lib/theme';

export function QuestionCard({ question }: { question?: PracticeQuestion }) {
  const difficulty = question?.difficulty ?? 'practice';
  const questionText = getQuestionDisplayText(question, 'sv');
  const questionTranslation = getQuestionTranslationText(question);
  const sourceCitation = getQuestionSourceCitation(question);
  const questionAccessibilityLabel = [
    `Difficulty: ${difficulty}`,
    `Question: ${questionText}`,
    questionTranslation ? `English translation: ${questionTranslation}` : null,
    `Source citation: ${sourceCitation}`,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Card accessibilityLabel={questionAccessibilityLabel}>
      <Text style={styles.label}>{difficulty}</Text>
      <Text accessibilityRole="header" style={styles.question}>
        {questionText}
      </Text>
      <Text style={styles.sourceCitation}>{sourceCitation}</Text>
      {questionTranslation ? <Text style={styles.translation}>{questionTranslation}</Text> : null}
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
  sourceCitation: {
    color: colors.textDisclaimer,
    fontSize: typography.disclaimer.fontSize,
    lineHeight: typography.disclaimer.lineHeight,
    marginTop: space[0.75],
  },
  translation: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[1],
  },
});
