import { Pressable, StyleSheet, View } from 'react-native';

import { colors, motion, radius, space, typography } from '../lib/theme';
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
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (safeSeconds < 60) {
    return language === 'sv' ? `${safeSeconds} sek` : `${safeSeconds} sec`;
  }
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return language === 'sv' ? `${minutes} min ${remainder} sek` : `${minutes} min ${remainder} sec`;
}

function classifyPace(seconds: number, medianSeconds: number | null): TimePace {
  if (!medianSeconds || medianSeconds <= 0) return 'median';
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
  const copy = timeHeatmapCopy[language];
  const medianSeconds = medianMs == null ? null : Math.round(medianMs / 1000);
  const timedAnswers = answers
    .map((answer, index) => ({
      ...answer,
      index,
      seconds: Math.max(0, Math.round(answer.timeSpentSeconds)),
    }))
    .filter((answer) => answer.seconds > 0);

  if (timedAnswers.length === 0) return null;

  return (
    <Surface
      accessibilityLabel={`${copy.title}. ${
        medianSeconds == null ? '' : copy.median(medianSeconds)
      }`}
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
              hitSlop={space[1]}
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

const styles = StyleSheet.create({
  card: {
    gap: space[1.5],
  },
  header: {
    alignItems: 'flex-start',
    gap: space[1],
  },
  title: {
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  cell: {
    alignItems: 'center',
    borderColor: colors.border,
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
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  median: {
    backgroundColor: colors.correctBg,
    borderColor: colors.success,
  },
  overthought: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  stuck: {
    backgroundColor: colors.incorrectBg,
    borderColor: colors.warning,
  },
  reviewCell: {
    borderColor: colors.warning,
  },
  pressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  cellNumber: {
    color: colors.text,
    fontWeight: typography.bodyBold.fontWeight,
  },
  cellTime: {
    color: colors.textSecondary,
  },
  cellResult: {
    color: colors.textMuted,
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
