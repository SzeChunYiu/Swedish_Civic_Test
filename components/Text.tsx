import { useMemo, type ComponentProps, type PropsWithChildren } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';
import type { AccessibilityRole, StyleProp, TextStyle } from 'react-native';

import { typography, type ThemeColors } from '../lib/theme';
import { useThemeColors } from '../lib/theme/ThemeProvider';

export type TextVariant = 'h1' | 'h2' | 'body' | 'caption' | 'label';
export type TextTone = 'primary' | 'secondary' | 'disclaimer' | 'accent' | 'success' | 'warning';
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Defaults: `variant="body"`, `tone="primary"`, `align="left"`, and
 * `accessibilityRole="header"` for h1/h2 or `"text"` for all other variants.
 * Pass `accessibilityLabel` when the visible text needs a clearer spoken label.
 */
export interface TextProps extends PropsWithChildren<
  Omit<ComponentProps<typeof NativeText>, 'style'>
> {
  accessibilityLabel?: string;
  align?: TextAlign;
  style?: StyleProp<TextStyle>;
  tone?: TextTone;
  variant?: TextVariant;
}

function getDefaultRole(variant: TextVariant): AccessibilityRole {
  return variant === 'h1' || variant === 'h2' ? 'header' : 'text';
}

export function Text({
  accessibilityRole,
  align = 'left',
  children,
  style,
  tone = 'primary',
  variant = 'body',
  ...textProps
}: TextProps) {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <NativeText
      accessibilityRole={accessibilityRole ?? getDefaultRole(variant)}
      style={[styles.base, styles[variant], styles[tone], styles[align], style]}
      {...textProps}
    >
      {children}
    </NativeText>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    base: {
      color: themeColors.text,
    },
    h1: {
      ...typography.displaySecondary,
    },
    h2: {
      ...typography.sectionHeading,
    },
    body: {
      ...typography.body,
    },
    caption: {
      ...typography.captionLight,
    },
    label: {
      ...typography.navButton,
    },
    primary: {
      color: themeColors.text,
    },
    secondary: {
      color: themeColors.textSecondary,
    },
    disclaimer: {
      color: themeColors.textDisclaimer,
    },
    accent: {
      color: themeColors.accent,
    },
    success: {
      color: themeColors.success,
    },
    warning: {
      color: themeColors.warning,
    },
    left: {
      textAlign: 'left',
    },
    center: {
      textAlign: 'center',
    },
    right: {
      textAlign: 'right',
    },
  });
}
