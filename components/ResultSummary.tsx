import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';
import { Button } from './Button';
import type { ButtonVariant } from './Button';
import { PillBadge } from './PillBadge';
import { ProgressBar } from './ProgressBar';
import { Surface } from './Surface';
import type { SurfaceProps } from './Surface';
import { Text } from './Text';

export type ResultSummaryStatus = 'pass' | 'review';

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
 * Defaults: `passingPercent=75`, status inferred from score, `tone="surface"`,
 * `elevation="card"`, and `accessibilityRole="summary"`. Pass localized
 * labels when the result summary is shown in a translated screen.
 */
export interface ResultSummaryProps extends Omit<SurfaceProps, 'children'> {
  actions?: ResultSummaryAction[];
  correctCount: number;
  metricLabel?: string;
  passingLineLabel?: string;
  passingPercent?: number;
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
  passingLineLabel,
  percent,
  statusLabel,
}: {
  metricLabel: string;
  passingLineLabel: string;
  percent: number;
  statusLabel: string;
}) {
  return `${statusLabel}. ${percent} percent. ${metricLabel}. ${passingLineLabel}.`;
}

export function ResultSummary({
  accessibilityLabel,
  accessibilityRole = 'summary',
  actions,
  correctCount,
  elevation = 'card',
  metricLabel,
  passingLineLabel = 'Passing line',
  passingPercent = 75,
  progressAccessibilityLabel,
  scoreLabel = 'Score',
  status,
  statusLabel,
  style,
  subtitle,
  tone = 'surface',
  totalCount,
  trailingMetrics = [],
  ...surfaceProps
}: ResultSummaryProps) {
  const safeTotal = Number.isFinite(totalCount) && totalCount > 0 ? Math.round(totalCount) : 0;
  const safeCorrect = clampCount(correctCount, safeTotal);
  const percent = getPercent(safeCorrect, safeTotal);
  const resolvedStatus = status ?? (percent >= passingPercent ? 'pass' : 'review');
  const resolvedStatusLabel =
    statusLabel ?? (resolvedStatus === 'pass' ? 'Passed' : 'Needs review');
  const resolvedMetricLabel = metricLabel ?? `${safeCorrect}/${safeTotal} correct`;
  const resolvedPassingLineLabel = `${passingLineLabel} ${passingPercent}%`;
  const progressLabel = progressAccessibilityLabel ?? `${percent} percent correct`;
  const badgeVariant = resolvedStatus === 'pass' ? 'success' : 'warning';
  const fillStyle = resolvedStatus === 'pass' ? styles.passFill : styles.reviewFill;

  return (
    <Surface
      accessibilityLabel={
        accessibilityLabel ??
        getAccessibilityLabel({
          metricLabel: resolvedMetricLabel,
          passingLineLabel: resolvedPassingLineLabel,
          percent,
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
        <Text accessibilityLabel={`${percent} percent`} style={styles.percent} variant="h1">
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
        progress={percent / 100}
        style={styles.progress}
      />

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text tone="secondary" variant="caption">
            {scoreLabel}
          </Text>
          <Text style={styles.metricValue} variant="label">
            {resolvedMetricLabel}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text tone="secondary" variant="caption">
            {passingLineLabel}
          </Text>
          <Text style={styles.metricValue} variant="label">
            {passingPercent}%
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

const styles = StyleSheet.create({
  card: {
    gap: space[1.5],
    padding: space[2.25],
  },
  header: {
    gap: space[1],
  },
  percent: {
    ...typography.displayHero,
    color: colors.text,
  },
  progress: {
    height: space[1.25],
  },
  passFill: {
    backgroundColor: colors.success,
  },
  reviewFill: {
    backgroundColor: colors.warning,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  metric: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.small,
    borderWidth: space.hairline,
    flexBasis: space[12],
    flexGrow: 1,
    gap: space[0.5],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1],
  },
  metricValue: {
    color: colors.text,
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
