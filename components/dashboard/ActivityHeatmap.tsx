import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActivityDayDetail, DailyActivityBin } from '../../lib/learning/dashboardStats';
import { radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import { Card } from '../ui/Card';

export type ActivityHeatmapCopy = {
  dayLabel: (date: string, answers: number) => string;
  detail: {
    accessibilityLabel: (
      date: string,
      answers: number,
      correct: number,
      review: number,
      mocks: number,
    ) => string;
    mockSummary: (
      scorePercent: number | null,
      questionCount: number,
      duration: string | null,
    ) => string;
    mockTitle: string;
    noMockSummaries: string;
    selectedLabel: (date: string, answers: number) => string;
    studyAnswers: (answers: number, correct: number, review: number) => string;
    title: (date: string) => string;
  };
  emptyState: string;
  legend: {
    high: string;
    low: string;
    medium: string;
    none: string;
    title: string;
  };
  summary: (totalAnswers: number, activeDays: number, maxDayCount: number) => string;
  subtitle: string;
  title: string;
};

type ActivityHeatmapProps = {
  bins: DailyActivityBin[];
  copy: ActivityHeatmapCopy;
  dayDetail: ActivityDayDetail | null;
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
};

type HeatStyle = 'heatZero' | 'heatSoft' | 'heatMedium' | 'heatStrong';
type KeyboardEventLike = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};
type WebActivationProps = {
  onKeyDown?: (event: KeyboardEventLike) => void;
  tabIndex?: 0;
};

function heatLevel(count: number, maxCount: number): HeatStyle {
  if (count <= 0 || maxCount <= 0) return 'heatZero';
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 'heatStrong';
  if (ratio >= 0.4) return 'heatMedium';
  return 'heatSoft';
}

function formatDuration(durationMs: number | null): string | null {
  if (durationMs === null) return null;
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  return `${minutes}m`;
}

function scorePercent(score: number | null): number | null {
  if (score === null) return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function isActivationKey(event: KeyboardEventLike): boolean {
  const key = event.nativeEvent?.key ?? event.key;
  return key === 'Enter' || key === ' ';
}

export function ActivityHeatmap({
  bins,
  copy,
  dayDetail,
  onSelectDate,
  selectedDate,
}: ActivityHeatmapProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const totalAnswers = bins.reduce((sum, bin) => sum + bin.count, 0);
  const activeDays = bins.filter((bin) => bin.count > 0).length;
  const maxDayCount = Math.max(0, ...bins.map((bin) => bin.count));
  const accessibilityLabel = copy.summary(totalAnswers, activeDays, maxDayCount);
  const legendItems: { label: string; style: HeatStyle }[] = [
    { label: copy.legend.none, style: 'heatZero' },
    { label: copy.legend.low, style: 'heatSoft' },
    { label: copy.legend.medium, style: 'heatMedium' },
    { label: copy.legend.high, style: 'heatStrong' },
  ];
  const selectedDayHasDetail =
    dayDetail !== null && (dayDetail.answerCount > 0 || dayDetail.mockSummaries.length > 0);

  return (
    <Card style={styles.card}>
      <Text accessibilityRole="summary" style={styles.accessibilitySummary}>
        {accessibilityLabel}
      </Text>
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
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>{copy.legend.title}</Text>
            <View style={styles.legendItems}>
              {legendItems.map((item) => (
                <View key={item.style} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, styles[item.style]]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <ScrollView
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="summary"
            aria-label={accessibilityLabel}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.heatmap}>
              {bins.map((bin) => {
                const active = bin.count > 0;
                const selected = selectedDate === bin.date;
                const label = selected
                  ? copy.detail.selectedLabel(bin.date, bin.count)
                  : copy.dayLabel(bin.date, bin.count);
                const cellStyle = [
                  styles.cell,
                  styles[heatLevel(bin.count, maxDayCount)],
                  selected ? styles.selectedCell : null,
                ];
                const webActivationProps: WebActivationProps =
                  Platform.OS === 'web'
                    ? {
                        onKeyDown: (event: KeyboardEventLike) => {
                          if (!isActivationKey(event)) return;
                          event.preventDefault?.();
                          onSelectDate(bin.date);
                        },
                        tabIndex: 0,
                      }
                    : {};

                if (!active) {
                  return <View key={bin.date} accessibilityLabel={label} style={cellStyle} />;
                }

                return (
                  <Pressable
                    key={bin.date}
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    aria-selected={selected}
                    hitSlop={space[1]}
                    onPress={() => onSelectDate(bin.date)}
                    style={({ pressed }) => [...cellStyle, pressed ? styles.pressedCell : null]}
                    {...webActivationProps}
                  />
                );
              })}
            </View>
          </ScrollView>
          {selectedDayHasDetail ? (
            <View
              accessibilityLabel={copy.detail.accessibilityLabel(
                dayDetail.date,
                dayDetail.answerCount,
                dayDetail.strictCorrectCount,
                dayDetail.wrongOrNeedsReviewCount,
                dayDetail.mockSummaries.length,
              )}
              accessibilityRole="summary"
              style={styles.detailPanel}
            >
              <Text accessibilityRole="header" style={styles.detailTitle}>
                {copy.detail.title(dayDetail.date)}
              </Text>
              <Text style={styles.detailText}>
                {copy.detail.studyAnswers(
                  dayDetail.answerCount,
                  dayDetail.strictCorrectCount,
                  dayDetail.wrongOrNeedsReviewCount,
                )}
              </Text>
              <Text style={styles.detailSubtitle}>{copy.detail.mockTitle}</Text>
              {dayDetail.mockSummaries.length === 0 ? (
                <Text style={styles.detailText}>{copy.detail.noMockSummaries}</Text>
              ) : (
                <View style={styles.mockList}>
                  {dayDetail.mockSummaries.map((mock) => (
                    <Text key={mock.sessionId} style={styles.detailText}>
                      {copy.detail.mockSummary(
                        scorePercent(mock.score),
                        mock.questionCount,
                        formatDuration(mock.durationMs),
                      )}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    accessibilitySummary: {
      height: 1,
      left: -10000,
      overflow: 'hidden',
      position: 'absolute',
      width: 1,
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
    legend: {
      gap: space[0.75],
    },
    legendTitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    legendItems: {
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
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[1.5],
      width: space[1.5],
    },
    legendText: {
      color: themeColors.textSecondary,
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
      borderColor: themeColors.border,
      borderRadius: radius.micro,
      borderWidth: space.hairline,
      height: space[1],
      width: space[1],
    },
    selectedCell: {
      borderColor: themeColors.text,
      borderWidth: space.hairline * 2,
    },
    pressedCell: {
      opacity: 0.72,
    },
    detailPanel: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[0.75],
      padding: space[1.5],
    },
    detailTitle: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    detailSubtitle: {
      color: themeColors.text,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    detailText: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    mockList: {
      gap: space[0.5],
    },
    heatZero: {
      backgroundColor: themeColors.surfaceMuted,
    },
    heatSoft: {
      backgroundColor: themeColors.badgeBlueBg,
    },
    heatMedium: {
      backgroundColor: themeColors.focusSoft,
    },
    heatStrong: {
      backgroundColor: themeColors.accent,
    },
  });
}
