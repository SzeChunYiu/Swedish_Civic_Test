import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { getQuestionSourceCitation } from '../../lib/quiz/questionText';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PracticeQuestion } from '../../types/content';
import { QuestionSourceCitation } from '../quiz/QuestionSourceCitation';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

type FlashcardCopy = {
  accessibilityLabel: (prompt: string, answer: string, sourceCitation: string) => string;
  answerHeader: string;
  badgeLabel: string;
  fallbackPrompt: string;
  fallbackAnswer: string;
  promptHeader: string;
};

const flashcardCopy: Record<AppLanguage, FlashcardCopy> = {
  sv: {
    accessibilityLabel: (prompt, answer, sourceCitation) =>
      `Övningskort. Fråga: ${prompt}. Svar: ${answer}. Källhänvisning: ${sourceCitation}.`,
    answerHeader: 'Svar',
    badgeLabel: 'Övningskort',
    fallbackPrompt: 'Studiefråga saknas',
    fallbackAnswer: 'Svar saknas',
    promptHeader: 'Fråga',
  },
  en: {
    accessibilityLabel: (prompt, answer, sourceCitation) =>
      `Study flashcard. Prompt: ${prompt}. Answer: ${answer}. Source citation: ${sourceCitation}.`,
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

type FlashcardProps = {
  back?: string;
  front?: string;
  language?: AppLanguage;
  question?: PracticeQuestion;
};

export function Flashcard({ front, back, language, question }: FlashcardProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const settingsLanguage = useSettingsStore((state) => state.language);
  const resolvedLanguage = language ?? settingsLanguage;
  const copy = flashcardCopy[resolvedLanguage];
  const prompt = cleanText(front, copy.fallbackPrompt);
  const answer = cleanText(back, copy.fallbackAnswer);
  const sourceCitation = getQuestionSourceCitation(question, resolvedLanguage);
  const flashcardAccessibilityLabel = copy.accessibilityLabel(prompt, answer, sourceCitation);

  return (
    <Card
      accessibilityLabel={flashcardAccessibilityLabel}
      accessibilityRole="summary"
      style={styles.card}
      themeColors={themeColors}
    >
      <Badge themeColors={themeColors} tone="warm">
        {copy.badgeLabel}
      </Badge>
      <Text accessibilityRole="header" style={styles.label}>
        {copy.promptHeader}
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <Text accessibilityRole="header" style={styles.label}>
        {copy.answerHeader}
      </Text>
      <Text style={styles.answer}>{answer}</Text>
      <QuestionSourceCitation
        language={resolvedLanguage}
        question={question}
        style={styles.sourceCitationSurface}
        themeColors={themeColors}
      />
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1],
    },
    label: {
      color: themeColors.textMuted,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textTransform: 'uppercase',
    },
    prompt: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.sectionTitle.fontWeight,
      lineHeight: typography.sectionTitle.lineHeight,
    },
    answer: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    sourceCitationSurface: {
      marginTop: space[0.5],
    },
  });
}
