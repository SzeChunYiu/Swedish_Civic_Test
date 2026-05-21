import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, shadows, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';

/**
 * Defaults: `tone="warm"`, `accessible=true`, `accessibilityRole="summary"`,
 * and an accessibility label derived from the visible label/value/helper text.
 */
export interface MetricCardProps extends Omit<ComponentProps<typeof View>, 'children' | 'style'> {
  accessibilityLabel?: string;
  accessible?: boolean;
  accessibilityRole?: ComponentProps<typeof View>['accessibilityRole'];
  helper?: string;
  label: string;
  style?: ComponentProps<typeof View>['style'];
  tone?: 'warm' | 'blue';
  value: string | number;
}

export function MetricCard({
  accessible = true,
  accessibilityLabel,
  accessibilityRole = 'summary',
  label,
  value,
  helper,
  style,
  tone = 'warm',
  ...viewProps
}: MetricCardProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      flex: 1,
      gap: space[0.5],
      padding: space[2],
    },
    blueCard: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.focusSoft,
      ...shadows.card,
    },
    value: {
      color: themeColors.text,
      fontSize: typography.heroMobile.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      letterSpacing: typography.subHeading.letterSpacing,
      lineHeight: typography.heroMobile.lineHeight,
    },
    label: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    helper: {
      color: themeColors.textDisclaimer,
      fontSize: typography.micro.fontSize,
      lineHeight: typography.micro.lineHeight,
    },
  });
}
