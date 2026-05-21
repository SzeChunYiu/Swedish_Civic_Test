import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { MockHistoryEntry } from '../../lib/learning/dashboardStats';
import { colors, radius, space, typography } from '../../lib/theme';
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

function completedDate(entry: MockHistoryEntry): string {
  return entry.completedAt.slice(0, 10);
}

export function MockExamHistoryCard({ bestScore, copy, entries }: MockExamHistoryCardProps) {
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

                    return (
                      <View
                        key={entry.sessionId}
                        accessible
                        accessibilityLabel={copy.trendPointAccessibilityLabel(
                          index + 1,
                          trendEntries.length,
                          scorePercent,
                          completedDate(entry),
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
                  return (
                    <View key={entry.sessionId} style={styles.recentRow}>
                      <View style={styles.recentCopy}>
                        <Text style={styles.recentScore}>{scorePercent}%</Text>
                        <Text style={styles.recentMeta}>
                          {copy.scoreLabel(scorePercent, completedDate(entry), duration)}
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

const styles = StyleSheet.create({
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
  attemptCount: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexBasis: space[12],
    flexGrow: 1,
    minWidth: space[12],
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
  scoreTrendBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1],
    padding: space[1.5],
  },
  scoreTrendHeader: {
    gap: space[0.5],
  },
  scoreTrendTitle: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  scoreTrendSummaryVisible: {
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    height: space[8],
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  scoreTrendBar: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    minHeight: space[1],
  },
  scoreTrendPercent: {
    color: colors.textMuted,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  recentBlock: {
    gap: space[1],
  },
  recentTitle: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  recentList: {
    gap: space[1],
  },
  recentRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
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
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  recentMeta: {
    color: colors.textSecondary,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  duration: {
    color: colors.textMuted,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  examLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.micro,
    color: colors.text,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    textDecorationLine: 'none',
  },
});
