import { StyleSheet, Text } from 'react-native';
import { colors, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const fallbackPrompt = 'Study prompt unavailable';
const fallbackAnswer = 'Answer unavailable';

function cleanText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function Flashcard({ front, back }: { front?: string; back?: string }) {
  const prompt = cleanText(front, fallbackPrompt);
  const answer = cleanText(back, fallbackAnswer);

  return (
    <Card
      accessibilityLabel={`Study flashcard. Prompt: ${prompt}. Answer: ${answer}.`}
      style={styles.card}
    >
      <Badge tone="warm">Flashcard</Badge>
      <Text accessibilityRole="header" style={styles.label}>
        Prompt
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <Text accessibilityRole="header" style={styles.label}>
        Answer
      </Text>
      <Text style={styles.answer}>{answer}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  prompt: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  answer: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
