import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';
import {
  isStrictlyCorrectAnswer,
  normalizeHeatmapSeconds,
  normalizeMedianSecondsFromMs,
} from '../lib/learning/examDiagnostic';
import type { AppLanguage } from '../lib/storage/settingsStore';
import type { QuizAnswer } from '../types/progress';
import { PillBadge } from './PillBadge';
import { Surface } from './Surface';
import { Text } from './Text';

type TimePace = 'rushed' | 'median' | 'overthought' | 'stuck';

type MockExamTimeHeatmapCopy = {
  median: (seconds: number) => string;
  paceLabels: Record<TimePace, string>;
  questionLabel: (
    questionNumber: number,
    seconds: number,
    pace: string,
    correct: boolean,
  ) => string;
  resultLabels: Record<'correct' | 'review', string>;
  title: string;
};

const timeHeatmapCopy: Record<AppLanguage, MockExamTimeHeatmapCopy> = {
  sv: {
    median: (seconds) => `Mediantid ${formatSeconds(seconds, 'sv')}`,
    paceLabels: {
      rushed: 'Snabb',
      median: 'Nära median',
      overthought: 'Tog längre tid',
      stuck: 'Fastnade',
    },
    questionLabel: (questionNumber, seconds, pace, correct) =>
      `Fråga ${questionNumber}, ${formatSeconds(seconds, 'sv')}, ${pace}, ${
        correct ? 'rätt' : 'behöver granskas'
      }. Hoppa till genomgången.`,
    resultLabels: {
      correct: 'rätt',
      review: 'granska',
    },
    title: 'Tidskarta per fråga',
  },
  en: {
    median: (seconds) => `Median time ${formatSeconds(seconds, 'en')}`,
    paceLabels: {
      rushed: 'Rushed',
      median: 'Near median',
      overthought: 'Over-thought',
      stuck: 'Stuck',
    },
    questionLabel: (questionNumber, seconds, pace, correct) =>
      `Question ${questionNumber}, ${formatSeconds(seconds, 'en')}, ${pace}, ${
        correct ? 'correct' : 'needs review'
      }. Jump to review.`,
    resultLabels: {
      correct: 'correct',
      review: 'review',
    },
    title: 'Time map by question',
  },
};

export interface MockExamTimeHeatmapProps {
  answers: QuizAnswer[];
  language: AppLanguage;
  medianMs: number | null;
  onSelectQuestion?: (questionId: string) => void;
}

function formatSeconds(seconds: number, language: AppLanguage): string {
  const safeSeconds = normalizeHeatmapSeconds(seconds) ?? 0;
  if (safeSeconds < 60) {
    return language === 'sv' ? `${safeSeconds} sek` : `${safeSeconds} sec`;
  }
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return language === 'sv' ? `${minutes} min ${remainder} sek` : `${minutes} min ${remainder} sec`;
}

function classifyPace(seconds: number, medianSeconds: number | null): TimePace {
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0 ||
    medianSeconds == null ||
    !Number.isFinite(medianSeconds) ||
    medianSeconds <= 0
  ) {
    return 'median';
  }
  if (seconds <= Math.max(5, medianSeconds * 0.5)) return 'rushed';
  if (seconds <= medianSeconds * 1.5) return 'median';
  if (seconds <= medianSeconds * 2.5) return 'overthought';
  return 'stuck';
}

export function MockExamTimeHeatmap({
  answers,
  language,
  medianMs,
  onSelectQuestion,
}: MockExamTimeHeatmapProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const copy = timeHeatmapCopy[language];
  const medianSeconds = normalizeMedianSecondsFromMs(medianMs);
  const timedAnswers = answers
    .map((answer, index) => {
      const seconds = normalizeHeatmapSeconds(answer.timeSpentSeconds);
      if (seconds == null) return null;
      return {
        ...answer,
        index,
        isCorrect: isStrictlyCorrectAnswer(answer.isCorrect),
        seconds,
      };
    })
    .filter((answer): answer is QuizAnswer & { index: number; seconds: number } => answer != null);

  if (timedAnswers.length === 0) return null;
  const summaryLabel =
    medianSeconds == null ? copy.title : `${copy.title}. ${copy.median(medianSeconds)}`;

  return (
    <Surface
      accessibilityLabel={summaryLabel}
      accessibilityRole="summary"
      style={styles.card}
      tone="surface"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title} variant="h2">
          {copy.title}
        </Text>
        {medianSeconds == null ? null : (
          <PillBadge variant="accent">{copy.median(medianSeconds)}</PillBadge>
        )}
      </View>
      <View style={styles.grid}>
        {timedAnswers.map((answer) => {
          const pace = classifyPace(answer.seconds, medianSeconds);
          const paceLabel = copy.paceLabels[pace];
          const resultLabel = answer.isCorrect
            ? copy.resultLabels.correct
            : copy.resultLabels.review;

          return (
            <Pressable
              accessibilityLabel={copy.questionLabel(
                answer.index + 1,
                answer.seconds,
                paceLabel,
                answer.isCorrect,
              )}
              accessibilityRole="button"
              key={answer.questionId}
              onPress={() => onSelectQuestion?.(answer.questionId)}
              style={({ pressed }) => [
                styles.cell,
                styles[pace],
                !answer.isCorrect ? styles.reviewCell : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text align="center" style={styles.cellNumber} variant="label">
                {answer.index + 1}
              </Text>
              <Text align="center" style={styles.cellTime} variant="caption">
                {formatSeconds(answer.seconds, language)}
              </Text>
              <Text align="center" style={styles.cellResult} variant="caption">
                {resultLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        {(['rushed', 'median', 'overthought', 'stuck'] as const).map((pace) => (
          <View key={pace} style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles[pace]]} />
            <Text tone="secondary" variant="caption">
              {copy.paceLabels[pace]}
            </Text>
          </View>
        ))}
      </View>
    </Surface>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1.5],
    },
    header: {
      alignItems: 'flex-start',
      gap: space[1],
    },
    title: {
      color: themeColors.text,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    cell: {
      alignItems: 'center',
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      gap: space[0.5],
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[7],
      paddingHorizontal: space[1],
      paddingVertical: space[0.75],
    },
    rushed: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    median: {
      backgroundColor: themeColors.correctBg,
      borderColor: themeColors.success,
    },
    overthought: {
      backgroundColor: themeColors.warningSoft,
      borderColor: themeColors.warning,
    },
    stuck: {
      backgroundColor: themeColors.incorrectBg,
      borderColor: themeColors.warning,
    },
    reviewCell: {
      borderColor: themeColors.warning,
    },
    pressed: {
      opacity: 0.82,
    },
    cellNumber: {
      color: themeColors.text,
      fontWeight: typography.bodyBold.fontWeight,
    },
    cellTime: {
      color: themeColors.textSecondary,
    },
    cellResult: {
      color: themeColors.textMuted,
      textTransform: 'uppercase',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    legendItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space[0.5],
    },
    legendSwatch: {
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[1.25],
      width: space[1.25],
    },
  });
}
