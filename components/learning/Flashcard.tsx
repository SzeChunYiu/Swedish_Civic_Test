import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type FlashcardCopy = {
  accessibilityLabel: (prompt: string, answer: string, isRevealed: boolean) => string;
  answerHeader: string;
  badgeLabel: string;
  fallbackPrompt: string;
  fallbackAnswer: string;
  hiddenAnswer: string;
  promptHeader: string;
  revealAccessibilityLabel: (prompt: string) => string;
  revealButton: string;
};

const flashcardCopy: Record<AppLanguage, FlashcardCopy> = {
  sv: {
    accessibilityLabel: (prompt, answer, isRevealed) =>
      isRevealed
        ? `Övningskort. Fråga: ${prompt}. Svar: ${answer}.`
        : `Övningskort. Fråga: ${prompt}. Försök svara innan du visar svaret.`,
    answerHeader: 'Svar',
    badgeLabel: 'Övningskort',
    fallbackPrompt: 'Studiefråga saknas',
    fallbackAnswer: 'Svar saknas',
    hiddenAnswer: 'Svara själv innan du visar svaret.',
    promptHeader: 'Fråga',
    revealAccessibilityLabel: (prompt) => `Visa svaret för övningskortet: ${prompt}`,
    revealButton: 'Visa svar',
  },
  en: {
    accessibilityLabel: (prompt, answer, isRevealed) =>
      isRevealed
        ? `Study flashcard. Prompt: ${prompt}. Answer: ${answer}.`
        : `Study flashcard. Prompt: ${prompt}. Try to answer before revealing it.`,
    answerHeader: 'Answer',
    badgeLabel: 'Flashcard',
    fallbackPrompt: 'Study prompt unavailable',
    fallbackAnswer: 'Answer unavailable',
    hiddenAnswer: 'Try to answer before revealing it.',
    promptHeader: 'Prompt',
    revealAccessibilityLabel: (prompt) => `Reveal the answer for flashcard: ${prompt}`,
    revealButton: 'Reveal answer',
  },
};

function cleanText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

type FlashcardProps = { front?: string; back?: string; language?: AppLanguage };

export function Flashcard({ front, back, language }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const copy = flashcardCopy[language ?? settingsLanguage];
  const prompt = cleanText(front, copy.fallbackPrompt);
  const answer = cleanText(back, copy.fallbackAnswer);
  const flashcardAccessibilityLabel = copy.accessibilityLabel(prompt, answer, isRevealed);

  return (
    <Card
      accessibilityLabel={flashcardAccessibilityLabel}
      style={styles.card}
      testID="learn-flashcard"
    >
      <Badge tone="warm">{copy.badgeLabel}</Badge>
      <Text accessibilityRole="header" style={styles.label}>
        {copy.promptHeader}
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
      {isRevealed ? (
        <View style={styles.answerBlock}>
          <Text accessibilityRole="header" style={styles.label}>
            {copy.answerHeader}
          </Text>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      ) : (
        <View style={styles.answerBlock}>
          <Text style={styles.hiddenAnswer}>{copy.hiddenAnswer}</Text>
          <Button
            accessibilityLabel={copy.revealAccessibilityLabel(prompt)}
            accessibilityRole="button"
            onPress={() => setIsRevealed(true)}
            variant="secondary"
          >
            {copy.revealButton}
          </Button>
        </View>
      )}
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
  answerBlock: {
    gap: space[1],
  },
  hiddenAnswer: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
