import { useMemo, type ComponentProps, type PropsWithChildren } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { radius, space, typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
    },
    accent: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.badgeBlueText,
    },
    success: {
      backgroundColor: themeColors.correctBg,
      borderColor: themeColors.success,
    },
    warning: {
      backgroundColor: themeColors.incorrectBg,
      borderColor: themeColors.warning,
    },
    danger: {
      backgroundColor: themeColors.dangerSoft,
      borderColor: themeColors.danger,
    },
    label: {
      ...typography.badge,
      textTransform: 'uppercase',
    },
    neutralLabel: {
      color: themeColors.textSecondary,
    },
    accentLabel: {
      color: themeColors.badgeBlueText,
    },
    successLabel: {
      color: themeColors.success,
    },
    warningLabel: {
      color: themeColors.warning,
    },
    dangerLabel: {
      color: themeColors.danger,
    },
  });
}
