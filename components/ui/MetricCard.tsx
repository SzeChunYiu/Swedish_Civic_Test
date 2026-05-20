import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, space, typography } from '../../lib/theme';

export type MetricCardTone = 'warm' | 'blue';

/**
 * Defaults: `tone="warm"`, `accessible=true`, `accessibilityRole="summary"`,
 * and an accessibility label derived from the visible label/value/helper text.
 */
export interface MetricCardProps extends Omit<ComponentProps<typeof View>, 'children' | 'style'> {
  accessibilityLabel?: string;
  helper?: string;
  label: string;
  style?: ComponentProps<typeof View>['style'];
  tone?: MetricCardTone;
  value: string | number;
}

export function MetricCard({
  accessible = true,
  accessibilityLabel,
  accessibilityRole = 'summary',
  helper,
  label,
  style,
  tone = 'warm',
  value,
  ...viewProps
}: MetricCardProps) {
  const metricAccessibilityLabel =
    accessibilityLabel ?? `${label}: ${value}${helper ? `. ${helper}` : ''}`;

  return (
    <View
      aria-label={metricAccessibilityLabel}
      accessible={accessible}
      accessibilityLabel={metricAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.card, tone === 'blue' ? styles.blueCard : null, style]}
      {...viewProps}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flex: 1,
    gap: space[0.5],
    padding: space[2],
  },
  blueCard: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focusSoft,
    ...shadows.card,
  },
  value: {
    color: colors.text,
    fontSize: typography.heroMobile.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.heroMobile.lineHeight,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  helper: {
    color: colors.textDisclaimer,
    fontSize: typography.micro.fontSize,
    lineHeight: typography.micro.lineHeight,
  },
});
