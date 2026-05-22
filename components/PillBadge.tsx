import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../lib/theme';

export type PillBadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/**
 * Defaults: `variant="neutral"`, `accessible=true`,
 * `accessibilityRole="text"`, and pill-shaped badge styling. Pass
 * `accessibilityLabel` when the visible badge copy is abbreviated.
 */
export interface PillBadgeProps extends PropsWithChildren<
  Omit<ComponentProps<typeof View>, 'style'>
> {
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: PillBadgeVariant;
}

function getStringLabel(children: PillBadgeProps['children']) {
  return typeof children === 'string' || typeof children === 'number'
    ? String(children)
    : undefined;
}

export function PillBadge({
  accessibilityLabel,
  accessibilityRole = 'text',
  accessible = true,
  children,
  labelStyle,
  style,
  variant = 'neutral',
  ...viewProps
}: PillBadgeProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? getStringLabel(children)}
      accessibilityRole={accessibilityRole}
      accessible={accessible}
      style={[styles.base, styles[variant], style]}
      {...viewProps}
    >
      <NativeText style={[styles.label, styles[`${variant}Label`], labelStyle]}>
        {children}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: space[4],
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.5],
  },
  neutral: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.badgeBlueText,
  },
  success: {
    backgroundColor: colors.correctBg,
    borderColor: colors.success,
  },
  warning: {
    backgroundColor: colors.incorrectBg,
    borderColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  label: {
    ...typography.badge,
    textTransform: 'uppercase',
  },
  neutralLabel: {
    color: colors.textSecondary,
  },
  accentLabel: {
    color: colors.badgeBlueText,
  },
  successLabel: {
    color: colors.success,
  },
  warningLabel: {
    color: colors.warning,
  },
  dangerLabel: {
    color: colors.danger,
  },
});
