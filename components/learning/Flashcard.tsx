import { StyleSheet, Text } from 'react-native';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

type FlashcardCopy = {
  accessibilityLabel: (prompt: string, answer: string) => string;
  answerHeader: string;
  badgeLabel: string;
  fallbackPrompt: string;
  fallbackAnswer: string;
  promptHeader: string;
};

const flashcardCopy: Record<AppLanguage, FlashcardCopy> = {
  sv: {
    accessibilityLabel: (prompt, answer) => `Flashkort. Fråga: ${prompt}. Svar: ${answer}.`,
    answerHeader: 'Svar',
    badgeLabel: 'Flashkort',
    fallbackPrompt: 'Studiefråga saknas',
    fallbackAnswer: 'Svar saknas',
    promptHeader: 'Fråga',
  },
  en: {
    accessibilityLabel: (prompt, answer) =>
      `Study flashcard. Prompt: ${prompt}. Answer: ${answer}.`,
    answerHeader: 'Answer',
    badgeLabel: 'Flashcard',
    fallbackPrompt: 'Study prompt unavailable',
    fallbackAnswer: 'Answer unavailable',
    promptHeader: 'Prompt',
  },
};

function cleanText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

type FlashcardProps = { front?: string; back?: string; language?: AppLanguage };

export function Flashcard({ front, back, language }: FlashcardProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = flashcardCopy[language ?? settingsLanguage];
  const prompt = cleanText(front, copy.fallbackPrompt);
  const answer = cleanText(back, copy.fallbackAnswer);
  const flashcardAccessibilityLabel = copy.accessibilityLabel(prompt, answer);

  return (
    <Card accessibilityLabel={flashcardAccessibilityLabel} style={styles.card}>
      <Badge tone="warm">{copy.badgeLabel}</Badge>
      <Text accessibilityRole="header" style={styles.label}>
        {copy.promptHeader}
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <Text accessibilityRole="header" style={styles.label}>
        {copy.answerHeader}
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
