import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { AccessibilityRole, StyleProp, TextProps, TextStyle } from 'react-native';
import { colors, radius, space, typography } from '../../lib/theme';

export type BadgeTone = 'blue' | 'green' | 'orange' | 'warm';

/**
 * Defaults: `tone="blue"`, `accessibilityRole="text"`, and a spoken label
 * derived from string or number children. Pass `accessibilityLabel` when badge
 * children are not plain text or need route-specific wording.
 */
export interface BadgeProps extends PropsWithChildren<Omit<TextProps, 'children' | 'style'>> {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<TextStyle>;
  tone?: BadgeTone;
}

export function Badge({
  accessibilityLabel,
  accessibilityRole = 'text',
  children,
  style,
  tone = 'blue',
  ...textProps
}: BadgeProps) {
  const badgeAccessibilityLabel =
    accessibilityLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  return (
    <Text
      aria-label={badgeAccessibilityLabel}
      accessibilityLabel={badgeAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.badge, styles[tone], style]}
      {...textProps}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    lineHeight: typography.badge.lineHeight,
    overflow: 'hidden',
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
    textTransform: 'uppercase',
  },
  blue: {
    backgroundColor: colors.badgeBlueBg,
    color: colors.badgeBlueText,
  },
  green: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  orange: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  },
  warm: {
    backgroundColor: colors.surfaceWarm,
    color: colors.textMuted,
  },
});
