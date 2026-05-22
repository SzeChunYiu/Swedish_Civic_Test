import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TimeOfDayBin } from '../../lib/learning/dashboardStats';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui/Card';

export type TimeOfDayPatternCopy = {
  binAccessibilityLabel: (hourLabel: string, answers: number, accuracy: number | null) => string;
  emptyState: string;
  hourLabel: (hour: number) => string;
  summary: (totalAnswers: number, bestHourLabel: string, bestAccuracy: number) => string;
  subtitle: string;
  title: string;
};

type TimeOfDayPatternProps = {
  bins: TimeOfDayBin[];
  copy: TimeOfDayPatternCopy;
};

function percent(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function bestAccuracyBin(bins: TimeOfDayBin[]): TimeOfDayBin | null {
  return bins
    .filter((bin) => bin.answers > 0 && bin.accuracy !== null)
    .sort((a, b) => {
      const accuracyDelta = (b.accuracy ?? 0) - (a.accuracy ?? 0);
      if (accuracyDelta !== 0) return accuracyDelta;
      return b.answers - a.answers;
    })[0];
}

export function TimeOfDayPattern({ bins, copy }: TimeOfDayPatternProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const totalAnswers = bins.reduce((sum, bin) => sum + bin.answers, 0);
  const bestBin = bestAccuracyBin(bins);
  const summary =
    totalAnswers > 0 && bestBin
      ? copy.summary(totalAnswers, copy.hourLabel(bestBin.hour), percent(bestBin.accuracy))
      : copy.emptyState;

  return (
    <>
      <Text accessibilityRole="summary" style={styles.accessibilitySummary}>
        {summary}
      </Text>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
        {totalAnswers === 0 ? (
          <Text style={styles.emptyState}>{copy.emptyState}</Text>
        ) : (
          <>
            <Text style={styles.summaryText}>{summary}</Text>
            <ScrollView
              accessibilityLabel={summary}
              accessibilityRole="summary"
              aria-label={summary}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.chart}>
                {bins.map((bin) => {
                  const accuracyPercent = percent(bin.accuracy);
                  const hourLabel = copy.hourLabel(bin.hour);
                  return (
                    <View
                      accessible
                      accessibilityLabel={copy.binAccessibilityLabel(
                        hourLabel,
                        bin.answers,
                        bin.accuracy,
                      )}
                      key={bin.hour}
                      style={styles.bin}
                    >
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            {
                              height: bin.answers > 0 ? `${Math.max(8, accuracyPercent)}%` : '0%',
                            },
                          ]}
                        />
                      </View>
                      {bin.hour % 6 === 0 ? <Text style={styles.hour}>{hourLabel}</Text> : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}
      </Card>
    </>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    accessibilitySummary: {
      height: space[0],
      left: space[0],
      opacity: 0,
      position: 'absolute',
      top: space[0],
      width: space[0],
    },
    card: {
      gap: space[1.5],
    },
    header: {
      gap: space[0.5],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.cardTitle.lineHeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    emptyState: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    summaryText: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    chart: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: space[0.5],
      minHeight: space[10],
      paddingTop: space[0.5],
    },
    bin: {
      alignItems: 'center',
      gap: space[0.5],
      minWidth: space[1.5],
    },
    track: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[8],
      justifyContent: 'flex-end',
      overflow: 'hidden',
      width: space[1.25],
    },
    fill: {
      backgroundColor: themeColors.accent,
      borderRadius: radius.micro,
      minHeight: space[0.5],
    },
    hour: {
      color: themeColors.textMuted,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
  });
}
