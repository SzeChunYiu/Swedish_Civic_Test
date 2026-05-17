import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function QuestionCard({ question }: { question?: PracticeQuestion }) {
  const difficulty = question?.difficulty ?? 'practice';
  const questionText = question?.questionSv ?? 'Question unavailable';
  const sourceCitation = getSourceCitation(question);
  const questionAccessibilityLabel = [
    `Difficulty: ${difficulty}`,
    `Question: ${questionText}`,
    question?.questionEn ? `English translation: ${question.questionEn}` : null,
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
      {question?.questionEn ? <Text style={styles.translation}>{question.questionEn}</Text> : null}
    </Card>
  );
}

function getSourceCitation(question?: PracticeQuestion) {
  if (!question?.uhrReference) return 'Source citation unavailable';

  const { chapter, pageApprox, section } = question.uhrReference;
  return `Källa/Source: Sverige i fokus, ${chapter}, ${section}, s. ${pageApprox}`;
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
