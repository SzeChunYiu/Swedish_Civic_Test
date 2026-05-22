import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { PracticeQuestion } from '../../types/content';
import { Card } from '../ui/Card';
import {
  getQuestionDisplayText,
  getQuestionSourceCitation,
  getQuestionTranslationText,
} from '../../lib/quiz/questionText';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { ProvenanceBadge } from './ProvenanceBadge';
import { QuestionSourceCitation } from './QuestionSourceCitation';

type QuestionCardCopy = {
  difficultyLabel: string;
  difficultyValueLabels: Record<PracticeQuestion['difficulty'] | 'practice', string>;
  questionLabel: string;
  secondaryLabel: string;
  sourceCitationLabel: string;
};

const questionCardCopy: Record<AppLanguage, QuestionCardCopy> = {
  sv: {
    difficultyLabel: 'Svårighetsgrad',
    difficultyValueLabels: {
      easy: 'Lätt',
      medium: 'Medel',
      hard: 'Svår',
      practice: 'Övning',
    },
    questionLabel: 'Fråga',
    secondaryLabel: 'Engelsk översättning',
    sourceCitationLabel: 'Källhänvisning',
  },
  en: {
    difficultyLabel: 'Difficulty',
    difficultyValueLabels: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      practice: 'Practice',
    },
    questionLabel: 'Question',
    secondaryLabel: 'Swedish original',
    sourceCitationLabel: 'Source citation',
  },
};

export function QuestionCard({
  language = 'sv',
  question,
}: {
  language?: AppLanguage;
  question?: PracticeQuestion;
}) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = questionCardCopy[language];
  const difficulty = question?.difficulty ?? 'practice';
  const difficultyLabel = copy.difficultyValueLabels[difficulty];
  const questionText = getQuestionDisplayText(question, language);
  const questionTranslation = getQuestionTranslationText(question, language);
  const sourceCitation = getQuestionSourceCitation(question, language);
  const questionAccessibilityLabel = [
    `${copy.difficultyLabel}: ${difficultyLabel}`,
    `${copy.questionLabel}: ${questionText}`,
    questionTranslation ? `${copy.secondaryLabel}: ${questionTranslation}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Card accessibilityLabel={questionAccessibilityLabel}>
      <ProvenanceBadge question={question} language={language} />
      <Text style={styles.label}>{difficultyLabel}</Text>
      <Text accessibilityRole="header" style={styles.question}>
        {questionText}
      </Text>
      <QuestionSourceCitation
        accessibilityLabel={`${copy.sourceCitationLabel}: ${sourceCitation}`}
        citationText={sourceCitation}
        label={copy.sourceCitationLabel}
        language={language}
        question={question}
        style={styles.sourceCitationSurface}
      >
        <Text style={styles.sourceCitation}>{sourceCitation}</Text>
      </QuestionSourceCitation>
      {questionTranslation ? <Text style={styles.translation}>{questionTranslation}</Text> : null}
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    label: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.navButton.fontWeight,
      textTransform: 'uppercase',
    },
    question: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.body.lineHeight,
      marginTop: space[0.75],
    },
    sourceCitation: {
      color: themeColors.textDisclaimer,
      fontSize: typography.disclaimer.fontSize,
      lineHeight: typography.disclaimer.lineHeight,
    },
    sourceCitationSurface: {
      marginTop: space[0.75],
    },
    translation: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      marginTop: space[1],
    },
  });
}
