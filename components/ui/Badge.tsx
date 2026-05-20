import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { colors, radius, space, typography } from '../../lib/theme';

type BadgeTone = 'blue' | 'green' | 'orange' | 'warm';
export interface BadgeProps extends PropsWithChildren {
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
  tone?: BadgeTone;
}

export function Badge({ accessibilityLabel, children, style, tone = 'blue' }: BadgeProps) {
  const badgeAccessibilityLabel =
    accessibilityLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  return (
    <Text
      aria-label={badgeAccessibilityLabel}
      accessibilityLabel={badgeAccessibilityLabel}
      style={[styles.badge, styles[tone], style]}
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
