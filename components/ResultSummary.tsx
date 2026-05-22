import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';
import { Button } from './Button';
import type { ButtonVariant } from './Button';
import { PillBadge } from './PillBadge';
import { ProgressBar } from './ProgressBar';
import { Surface } from './Surface';
import type { SurfaceProps } from './Surface';
import { Text } from './Text';

export type ResultSummaryStatus = 'strong' | 'review';

type ResultSummaryCopy = {
  metricLabel: (correctCount: number, totalCount: number) => string;
  percentLabel: (percent: number) => string;
  progressLabel: (percent: number) => string;
  resultBadgeLabel: string;
  scoreLabel: string;
  statusLabels: Record<ResultSummaryStatus, string>;
};

const resultSummaryCopy: Record<AppLanguage, ResultSummaryCopy> = {
  sv: {
    metricLabel: (correctCount, totalCount) => `${correctCount}/${totalCount} rätt`,
    percentLabel: (percent) => `${percent} procent`,
    progressLabel: (percent) => `${percent} procent rätt`,
    resultBadgeLabel: 'Övningsresultat',
    scoreLabel: 'Poäng',
    statusLabels: {
      strong: 'Starkt övningsresultat',
      review: 'Behöver repeteras',
    },
  },
  en: {
    metricLabel: (correctCount, totalCount) => `${correctCount}/${totalCount} correct`,
    percentLabel: (percent) => `${percent} percent`,
    progressLabel: (percent) => `${percent} percent correct`,
    resultBadgeLabel: 'Practice result',
    scoreLabel: 'Score',
    statusLabels: {
      strong: 'Strong practice result',
      review: 'Needs review',
    },
  },
};

export interface ResultSummaryAction {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  testID?: string;
  variant?: ButtonVariant;
}

export interface ResultSummaryMetric {
  label: string;
  value: string | number;
}

/**
 * Defaults: a neutral practice-result badge, `tone="surface"`,
 * `elevation="card"`, localized fallback labels from settings, and
 * `accessibilityRole="summary"`. Pass localized label props for screen-specific
 * copy.
 */
export interface ResultSummaryProps extends Omit<SurfaceProps, 'children'> {
  actions?: ResultSummaryAction[];
  correctCount: number;
  languageOverride?: AppLanguage;
  metricLabel?: string;
  progressAccessibilityLabel?: string;
  scoreLabel?: string;
  status?: ResultSummaryStatus;
  statusLabel?: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  totalCount: number;
  trailingMetrics?: ResultSummaryMetric[];
}

function clampCount(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), max));
}

function getPercent(correctCount: number, totalCount: number) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return 0;
  const safeTotal = Math.round(totalCount);
  const safeCorrect = clampCount(correctCount, safeTotal);
  return Math.round((safeCorrect / safeTotal) * 100);
}

function getAccessibilityLabel({
  metricLabel,
  percentLabel,
  statusLabel,
}: {
  metricLabel: string;
  percentLabel: string;
  statusLabel: string;
}) {
  return `${statusLabel}. ${percentLabel}. ${metricLabel}.`;
}

export function ResultSummary({
  accessibilityLabel,
  accessibilityRole = 'summary',
  actions,
  correctCount,
  elevation = 'card',
  languageOverride,
  metricLabel,
  progressAccessibilityLabel,
  scoreLabel,
  status,
  statusLabel,
  style,
  subtitle,
  tone = 'surface',
  totalCount,
  trailingMetrics = [],
  ...surfaceProps
}: ResultSummaryProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const language = languageOverride ?? settingsLanguage;
  const copy = resultSummaryCopy[language];
  const safeTotal = Number.isFinite(totalCount) && totalCount > 0 ? Math.round(totalCount) : 0;
  const safeCorrect = clampCount(correctCount, safeTotal);
  const percent = getPercent(safeCorrect, safeTotal);
  const resolvedStatusLabel =
    statusLabel ?? (status ? copy.statusLabels[status] : copy.resultBadgeLabel);
  const resolvedMetricLabel = metricLabel ?? copy.metricLabel(safeCorrect, safeTotal);
  const percentAccessibilityLabel = copy.percentLabel(percent);
  const progressLabel = progressAccessibilityLabel ?? copy.progressLabel(percent);
  const resolvedScoreLabel = scoreLabel ?? copy.scoreLabel;
  const badgeVariant = status === 'strong' ? 'success' : status === 'review' ? 'warning' : 'accent';
  const fillStyle =
    status === 'strong'
      ? styles.strongFill
      : status === 'review'
        ? styles.reviewFill
        : styles.neutralFill;

  return (
    <Surface
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          metricLabel: resolvedMetricLabel,
          percentLabel: percentAccessibilityLabel,
          statusLabel: resolvedStatusLabel,
        })
      }
      accessibilityRole={accessibilityRole}
      elevation={elevation}
      style={[styles.card, style]}
      tone={tone}
      {...surfaceProps}
    >
      <View style={styles.header}>
        <PillBadge variant={badgeVariant}>{resolvedStatusLabel}</PillBadge>
        <Text accessibilityLabel={percentAccessibilityLabel} style={styles.percent} variant="h1">
          {percent}%
        </Text>
        {subtitle ? (
          <Text tone="secondary" variant="body">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <ProgressBar
        accessibilityLabel={progressLabel}
        fillStyle={fillStyle}
        languageOverride={language}
        progress={percent / 100}
        style={styles.progress}
      />

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text tone="secondary" variant="caption">
            {resolvedScoreLabel}
          </Text>
          <Text style={styles.metricValue} variant="label">
            {resolvedMetricLabel}
          </Text>
        </View>
        {trailingMetrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <Text tone="secondary" variant="caption">
              {metric.label}
            </Text>
            <Text style={styles.metricValue} variant="label">
              {metric.value}
            </Text>
          </View>
        ))}
      </View>

      {actions?.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              accessibilityLabel={action.accessibilityLabel ?? action.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: action.disabled }}
              disabled={action.disabled}
              key={action.label}
              languageOverride={language}
              onPress={action.onPress}
              style={styles.action}
              testID={action.testID}
              variant={action.variant ?? 'secondary'}
            >
              {action.label}
            </Button>
          ))}
        </View>
      ) : null}
    </Surface>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1.5],
      padding: space[2.25],
    },
    header: {
      gap: space[1],
    },
    percent: {
      ...typography.displayHero,
      color: themeColors.text,
    },
    progress: {
      height: space[1.25],
    },
    neutralFill: {
      backgroundColor: themeColors.accent,
    },
    strongFill: {
      backgroundColor: themeColors.success,
    },
    reviewFill: {
      backgroundColor: themeColors.warning,
    },
    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    metric: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.small,
      borderWidth: space.hairline,
      flexBasis: space[12],
      flexGrow: 1,
      gap: space[0.5],
      paddingHorizontal: space[1.5],
      paddingVertical: space[1],
    },
    metricValue: {
      color: themeColors.text,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
    },
    action: {
      flexGrow: 1,
    },
  });
}
