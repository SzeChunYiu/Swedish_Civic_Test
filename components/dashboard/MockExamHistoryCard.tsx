import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MockHistoryEntry } from '../../lib/learning/dashboardStats';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui/Card';

const recentMockLimit = 3;
const trendMockLimit = 5;

export type MockExamHistoryCardCopy = {
  attemptCount: (count: number) => string;
  averageLabel: string;
  bestLabel: string;
  emptyState: string;
  examLink: string;
  examLinkAccessibilityLabel: string;
  formatCompletedDate: (completedAt: string) => string;
  latestLabel: string;
  lowestLabel: string;
  recentLabel: string;
  scoreLabel: (scorePercent: number, completedDate: string, duration: string | null) => string;
  subtitle: string;
  summary: (
    attemptCount: number,
    latestScore: number,
    bestScore: number,
    averageScore: number,
    lowestScore: number,
  ) => string;
  timeUsedLabel: (duration: string) => string;
  title: string;
  trendLabel: string;
  trendPointAccessibilityLabel: (
    pointIndex: number,
    pointCount: number,
    scorePercent: number,
    completedDate: string,
  ) => string;
  trendSummary: (pointCount: number, firstScore: number, latestScore: number) => string;
};

type MockExamHistoryCardProps = {
  bestScore: number | null;
  copy: MockExamHistoryCardCopy;
  entries: MockHistoryEntry[];
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

function formatPercent(score: number): number {
  return Math.round(clampScore(score) * 100);
}

function formatDuration(durationMs: number | null): string | null {
  if (durationMs === null || !Number.isFinite(durationMs) || durationMs <= 0) return null;
  const totalMinutes = Math.max(1, Math.round(durationMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function MockExamHistoryCard({ bestScore, copy, entries }: MockExamHistoryCardProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const scoredEntries = entries.filter(
    (entry): entry is MockHistoryEntry & { score: number } => entry.score !== null,
  );
  const recentEntries = [...scoredEntries].reverse().slice(0, recentMockLimit);
  const trendEntries = scoredEntries.slice(-trendMockLimit);
  const latestScore = scoredEntries.at(-1)?.score ?? null;
  const lowestScore =
    scoredEntries.length > 0 ? Math.min(...scoredEntries.map((entry) => entry.score)) : null;
  const averageScore =
    scoredEntries.length > 0
      ? scoredEntries.reduce((sum, entry) => sum + entry.score, 0) / scoredEntries.length
      : null;
  const resolvedBestScore =
    bestScore ??
    (scoredEntries.length > 0 ? Math.max(...scoredEntries.map((entry) => entry.score)) : null);
  const hasHistory =
    entries.length > 0 && latestScore !== null && averageScore !== null && lowestScore !== null;
  const accessibilityLabel = hasHistory
    ? copy.summary(
        entries.length,
        formatPercent(latestScore),
        formatPercent(resolvedBestScore ?? latestScore),
        formatPercent(averageScore),
        formatPercent(lowestScore),
      )
    : copy.emptyState;
  const hasTrend = trendEntries.length >= 2;
  const trendSummary = hasTrend
    ? copy.trendSummary(
        trendEntries.length,
        formatPercent(trendEntries[0].score),
        formatPercent(trendEntries.at(-1)?.score ?? trendEntries[0].score),
      )
    : '';

  return (
    <>
      <Text accessibilityRole="summary" style={styles.accessibilitySummary}>
        {accessibilityLabel}
      </Text>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              {copy.title}
            </Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <Text style={styles.attemptCount}>{copy.attemptCount(entries.length)}</Text>
        </View>

        {hasHistory ? (
          <>
            <View style={styles.metricGrid}>
              {[
                [copy.latestLabel, latestScore],
                [copy.bestLabel, resolvedBestScore ?? latestScore],
                [copy.averageLabel, averageScore],
                [copy.lowestLabel, lowestScore],
              ].map(([label, score]) => (
                <View key={String(label)} style={styles.metricPill}>
                  <Text style={styles.metricValue}>{formatPercent(score as number)}%</Text>
                  <Text style={styles.metricLabel}>{label}</Text>
                </View>
              ))}
            </View>
            {hasTrend ? (
              <View style={styles.scoreTrendBlock}>
                <View style={styles.scoreTrendHeader}>
                  <Text style={styles.scoreTrendTitle}>{copy.trendLabel}</Text>
                  <Text style={styles.scoreTrendSummaryVisible}>{trendSummary}</Text>
                </View>
                <Text style={styles.trendSummary}>{trendSummary}</Text>
                <View style={styles.scoreTrendChart}>
                  {trendEntries.map((entry, index) => {
                    const scorePercent = formatPercent(entry.score);
                    const completedDate = copy.formatCompletedDate(entry.completedAt);

                    return (
                      <View
                        key={entry.sessionId}
                        accessible
                        accessibilityLabel={copy.trendPointAccessibilityLabel(
                          index + 1,
                          trendEntries.length,
                          scorePercent,
                          completedDate,
                        )}
                        style={styles.scoreTrendPoint}
                      >
                        <View style={styles.scoreTrendTrack}>
                          <View
                            style={[
                              styles.scoreTrendBar,
                              { height: `${Math.max(8, scorePercent)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreTrendPercent}>{scorePercent}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
            <View style={styles.recentBlock}>
              <Text style={styles.recentTitle}>{copy.recentLabel}</Text>
              <View style={styles.recentList}>
                {recentEntries.map((entry) => {
                  const scorePercent = formatPercent(entry.score);
                  const duration = formatDuration(entry.durationMs);
                  const completedDate = copy.formatCompletedDate(entry.completedAt);
                  return (
                    <View key={entry.sessionId} style={styles.recentRow}>
                      <View style={styles.recentCopy}>
                        <Text style={styles.recentScore}>{scorePercent}%</Text>
                        <Text style={styles.recentMeta}>
                          {copy.scoreLabel(scorePercent, completedDate, duration)}
                        </Text>
                      </View>
                      {duration ? (
                        <Text style={styles.duration}>{copy.timeUsedLabel(duration)}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>{copy.emptyState}</Text>
        )}

        <Link
          accessibilityLabel={copy.examLinkAccessibilityLabel}
          accessibilityRole="link"
          href="/exam"
          style={styles.examLink}
        >
          {copy.examLink}
        </Link>
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
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'space-between',
    },
    titleBlock: {
      flex: 1,
      gap: space[0.5],
      minWidth: space[15],
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
    attemptCount: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
      paddingHorizontal: space[1.5],
      paddingVertical: space[0.75],
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    metricPill: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexBasis: space[12],
      flexGrow: 1,
      minWidth: space[12],
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
    scoreTrendBlock: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[1.5],
    },
    scoreTrendHeader: {
      gap: space[0.5],
    },
    scoreTrendTitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    scoreTrendSummaryVisible: {
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    trendSummary: {
      height: space[0],
      left: space[0],
      opacity: 0,
      position: 'absolute',
      top: space[0],
      width: space[0],
    },
    scoreTrendChart: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: space[1],
      minHeight: space[10],
    },
    scoreTrendPoint: {
      alignItems: 'center',
      flex: 1,
      gap: space[0.5],
      minWidth: space[4],
    },
    scoreTrendTrack: {
      alignItems: 'stretch',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.pill,
      borderWidth: space.hairline,
      height: space[8],
      justifyContent: 'flex-end',
      overflow: 'hidden',
      width: '100%',
    },
    scoreTrendBar: {
      backgroundColor: themeColors.accent,
      borderRadius: radius.pill,
      minHeight: space[1],
    },
    scoreTrendPercent: {
      color: themeColors.textMuted,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    recentBlock: {
      gap: space[1],
    },
    recentTitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    recentList: {
      gap: space[1],
    },
    recentRow: {
      alignItems: 'flex-start',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'space-between',
      padding: space[1.5],
    },
    recentCopy: {
      flex: 1,
      gap: space[0.5],
      minWidth: space[15],
    },
    recentScore: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    recentMeta: {
      color: themeColors.textSecondary,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    duration: {
      color: themeColors.textMuted,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
    emptyState: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    examLink: {
      alignSelf: 'flex-start',
      backgroundColor: themeColors.surfaceMuted,
      borderRadius: radius.micro,
      color: themeColors.text,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
      textDecorationLine: 'none',
    },
  });
}
