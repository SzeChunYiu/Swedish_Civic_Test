import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MistakeConvergencePoint } from '../../lib/learning/dashboardStats';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui/Card';

export type MistakeConvergenceCopy = {
  emptyState: string;
  pointAccessibilityLabel: (date: string, unresolvedMistakes: number) => string;
  resolvedLabel: (resolvedCount: number) => string;
  subtitle: string;
  summary: (latestUnresolved: number, resolvedCount: number, days: number) => string;
  title: string;
  unresolvedLabel: (unresolvedCount: number) => string;
};

type MistakeConvergenceProps = {
  copy: MistakeConvergenceCopy;
  points: MistakeConvergencePoint[];
};

export function MistakeConvergence({ copy, points }: MistakeConvergenceProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const maxUnresolved = Math.max(0, ...points.map((point) => point.unresolvedMistakes));
  const latestUnresolved = points.at(-1)?.unresolvedMistakes ?? 0;
  const resolvedCount = Math.max(0, maxUnresolved - latestUnresolved);
  const hasMistakeData = maxUnresolved > 0;
  const summary = hasMistakeData
    ? copy.summary(latestUnresolved, resolvedCount, points.length)
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
        {!hasMistakeData ? (
          <Text style={styles.emptyState}>{copy.emptyState}</Text>
        ) : (
          <>
            <View style={styles.metricRow}>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{latestUnresolved}</Text>
                <Text style={styles.metricLabel}>{copy.unresolvedLabel(latestUnresolved)}</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{resolvedCount}</Text>
                <Text style={styles.metricLabel}>{copy.resolvedLabel(resolvedCount)}</Text>
              </View>
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
            <ScrollView
              accessibilityLabel={summary}
              accessibilityRole="summary"
              aria-label={summary}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.chart}>
                {points.map((point) => {
                  const fillPercent =
                    maxUnresolved > 0
                      ? Math.max(
                          point.unresolvedMistakes > 0 ? 8 : 0,
                          Math.round((point.unresolvedMistakes / maxUnresolved) * 100),
                        )
                      : 0;
                  return (
                    <View
                      accessible
                      accessibilityLabel={copy.pointAccessibilityLabel(
                        point.date,
                        point.unresolvedMistakes,
                      )}
                      key={point.date}
                      style={styles.point}
                    >
                      <View style={styles.track}>
                        <View style={[styles.fill, { height: `${fillPercent}%` }]} />
                      </View>
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
    metricRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    metricPill: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      minWidth: space[9],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    metricValue: {
      color: themeColors.text,
      fontSize: typography.sectionTitle.fontSize,
      fontWeight: typography.sectionTitle.fontWeight,
      lineHeight: typography.sectionTitle.lineHeight,
    },
    metricLabel: {
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
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
      minHeight: space[8],
      paddingTop: space[0.5],
    },
    point: {
      justifyContent: 'flex-end',
      minWidth: space[1],
    },
    track: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[8],
      justifyContent: 'flex-end',
      overflow: 'hidden',
      width: space[1],
    },
    fill: {
      backgroundColor: themeColors.focusSoft,
      borderRadius: radius.micro,
      minHeight: space[0.5],
    },
  });
}
