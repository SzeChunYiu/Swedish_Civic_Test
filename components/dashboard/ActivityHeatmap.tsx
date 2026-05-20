import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DailyActivityBin } from '../../lib/learning/dashboardStats';
import { colors, radius, space, typography } from '../../lib/theme';
import { Card } from '../ui/Card';

export type ActivityHeatmapCopy = {
  emptyState: string;
  summary: (totalAnswers: number, activeDays: number, maxDayCount: number) => string;
  subtitle: string;
  title: string;
};

type ActivityHeatmapProps = {
  bins: DailyActivityBin[];
  copy: ActivityHeatmapCopy;
};

type HeatStyle = 'heatZero' | 'heatSoft' | 'heatMedium' | 'heatStrong';

function heatLevel(count: number, maxCount: number): HeatStyle {
  if (count <= 0 || maxCount <= 0) return 'heatZero';
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 'heatStrong';
  if (ratio >= 0.4) return 'heatMedium';
  return 'heatSoft';
}

export function ActivityHeatmap({ bins, copy }: ActivityHeatmapProps) {
  const totalAnswers = bins.reduce((sum, bin) => sum + bin.count, 0);
  const activeDays = bins.filter((bin) => bin.count > 0).length;
  const maxDayCount = Math.max(0, ...bins.map((bin) => bin.count));
  const accessibilityLabel = copy.summary(totalAnswers, activeDays, maxDayCount);

  return (
    <Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      {totalAnswers === 0 ? (
        <Text style={styles.emptyState}>{copy.emptyState}</Text>
      ) : (
        <ScrollView
          accessibilityLabel={accessibilityLabel}
          aria-label={accessibilityLabel}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.heatmap}>
            {bins.map((bin) => (
              <View
                key={bin.date}
                accessibilityLabel={`${bin.date}: ${bin.count}`}
                style={[styles.cell, styles[heatLevel(bin.count, maxDayCount)]]}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1.5],
  },
  header: {
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.cardTitle.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  heatmap: {
    alignContent: 'flex-start',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: space[0.5],
    height: space[10],
  },
  cell: {
    borderColor: colors.border,
    borderRadius: radius.micro,
    borderWidth: StyleSheet.hairlineWidth,
    height: space[1],
    width: space[1],
  },
  heatZero: {
    backgroundColor: colors.surfaceMuted,
  },
  heatSoft: {
    backgroundColor: colors.badgeBlueBg,
  },
  heatMedium: {
    backgroundColor: colors.focusSoft,
  },
  heatStrong: {
    backgroundColor: colors.accent,
  },
});
