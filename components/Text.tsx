import { useMemo, type ComponentProps, type PropsWithChildren } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';
import type { AccessibilityRole, StyleProp, TextStyle } from 'react-native';

import { fontScaleFor, useAccessibilityStore } from '../lib/storage/accessibilityStore';
import { colors, fontFamilyForAccessibility, scaleTypographyValue, typography } from '../lib/theme';

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

const typographyForVariant: Record<TextVariant, TextStyle> = {
  h1: typography.displaySecondary,
  h2: typography.sectionHeading,
  body: typography.body,
  caption: typography.captionLight,
  label: typography.navButton,
};

export function Text({
  accessibilityRole,
  align = 'left',
  children,
  style,
  tone = 'primary',
  variant = 'body',
  ...textProps
}: TextProps) {
  const easyReadFont = useAccessibilityStore((state) => state.easyReadFont);
  const fontSizeStep = useAccessibilityStore((state) => state.fontSizeStep);
  const fontScale = fontScaleFor(fontSizeStep);
  const accessibilityTextStyle = useMemo(() => {
    const variantTypography = typographyForVariant[variant];
    return {
      fontFamily: fontFamilyForAccessibility(easyReadFont),
      fontSize: scaleTypographyValue(variantTypography.fontSize, fontScale),
      lineHeight: scaleTypographyValue(variantTypography.lineHeight, fontScale),
    };
  }, [easyReadFont, fontScale, variant]);

  return (
    <NativeText
      accessibilityRole={accessibilityRole ?? getDefaultRole(variant)}
      style={[
        styles.base,
        styles[variant],
        accessibilityTextStyle,
        styles[tone],
        styles[align],
        style,
      ]}
      {...textProps}
    >
      {children}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
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
    color: colors.text,
  },
  secondary: {
    color: colors.textSecondary,
  },
  disclaimer: {
    color: colors.textDisclaimer,
  },
  accent: {
    color: colors.accent,
  },
  success: {
    color: colors.success,
  },
  warning: {
    color: colors.warning,
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
