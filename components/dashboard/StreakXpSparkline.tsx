import { StyleSheet, Text, View } from 'react-native';

import type { XpDayPoint } from '../../lib/learning/dashboardStats';
import { colors, radius, space, typography } from '../../lib/theme';
import { Card } from '../ui/Card';

export type StreakXpSparklineCopy = {
  emptyState: string;
  levelLabel: string;
  streakLabel: string;
  subtitle: string;
  summary: (totalXp: number, activeDays: number, currentStreak: number, level: number) => string;
  title: string;
};

type StreakXpSparklineProps = {
  copy: StreakXpSparklineCopy;
  currentStreak: number;
  level: number;
  points: XpDayPoint[];
};

export function StreakXpSparkline({ copy, currentStreak, level, points }: StreakXpSparklineProps) {
  const totalXp = points.reduce((sum, point) => sum + point.xp, 0);
  const activeDays = points.filter((point) => point.xp > 0).length;
  const maxXp = Math.max(0, ...points.map((point) => point.xp));
  const accessibilityLabel = copy.summary(totalXp, activeDays, currentStreak, level);

  return (
    <Card accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{currentStreak}</Text>
          <Text style={styles.metricLabel}>{copy.streakLabel}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{level}</Text>
          <Text style={styles.metricLabel}>{copy.levelLabel}</Text>
        </View>
      </View>
      {totalXp === 0 ? (
        <Text style={styles.emptyState}>{copy.emptyState}</Text>
      ) : (
        <View
          accessibilityLabel={accessibilityLabel}
          aria-label={accessibilityLabel}
          style={styles.sparkline}
        >
          {points.map((point) => {
            const fillPercent = maxXp > 0 ? Math.max(5, Math.round((point.xp / maxXp) * 100)) : 5;
            return (
              <View key={point.date} style={styles.barTrack}>
                <View
                  accessibilityLabel={`${point.date}: ${point.xp}`}
                  style={[styles.barFill, { height: `${fillPercent}%` }]}
                />
              </View>
            );
          })}
        </View>
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
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  metricPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: space[9],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    lineHeight: typography.sectionTitle.lineHeight,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sparkline: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: space[0.5],
    height: space[8],
  },
  barTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    flex: 1,
    height: space[8],
    justifyContent: 'flex-end',
    minWidth: space[0.5],
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    minHeight: space[0.5],
  },
});
