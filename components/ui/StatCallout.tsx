import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '../../lib/theme';

type Tone = 'default' | 'accent' | 'success' | 'warning';

/**
 * Defaults: `tone="default"`, `accessible=true`, `accessibilityRole="summary"`,
 * and an accessibility label derived from the visible label/value pair.
 */
export interface StatCalloutProps extends Omit<ComponentProps<typeof View>, 'children' | 'style'> {
  value: string | number;
  label: string;
  tone?: Tone;
  style?: ComponentProps<typeof View>['style'];
}

const toneStyles: Record<
  Tone,
  { background: string; valueColor: string; labelColor: string; borderColor: string }
> = {
  default: {
    background: colors.surface,
    valueColor: colors.text,
    labelColor: colors.textMuted,
    borderColor: colors.border,
  },
  accent: {
    background: colors.badgeBlueBg,
    valueColor: colors.badgeBlueText,
    labelColor: colors.badgeBlueText,
    borderColor: colors.focusSoft,
  },
  success: {
    background: colors.successSoft,
    valueColor: colors.success,
    labelColor: colors.success,
    borderColor: colors.success,
  },
  warning: {
    background: colors.warningSoft,
    valueColor: colors.warning,
    labelColor: colors.warning,
    borderColor: colors.warning,
  },
};

export function StatCallout({
  accessible = true,
  accessibilityLabel,
  accessibilityRole = 'summary',
  label,
  style,
  tone = 'default',
  value,
  ...viewProps
}: StatCalloutProps) {
  const t = toneStyles[tone];
  const statAccessibilityLabel = accessibilityLabel ?? `${label}: ${value}`;

  return (
    <View
      aria-label={statAccessibilityLabel}
      accessible={accessible}
      accessibilityLabel={statAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.card, { backgroundColor: t.background, borderColor: t.borderColor }, style]}
      {...viewProps}
    >
      <Text style={[styles.value, { color: t.valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: t.labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flex: 1,
    gap: space[0.5],
    padding: space[1.5],
  },
  value: {
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
    letterSpacing: typography.subHeading.letterSpacing,
    lineHeight: typography.subHeading.lineHeight,
  },
  label: {
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    lineHeight: typography.badge.lineHeight,
    textTransform: 'uppercase',
  },
});
