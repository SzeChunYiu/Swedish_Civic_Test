import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';

import { colors, space } from '../lib/theme';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerSpacing = 'none' | 'sm' | 'md' | 'lg';
export type DividerTone = 'default' | 'muted' | 'accent';

/**
 * Defaults: `orientation="horizontal"`, `spacing="md"`,
 * `tone="default"`, `accessibilityRole="none"`, and decorative dividers are
 * hidden from assistive technology unless an `accessibilityLabel` is supplied.
 */
export interface DividerProps extends Omit<ComponentProps<typeof View>, 'style'> {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  orientation?: DividerOrientation;
  spacing?: DividerSpacing;
  style?: StyleProp<ViewStyle>;
  tone?: DividerTone;
}

export function Divider({
  accessibilityLabel,
  accessibilityRole = 'none',
  accessible,
  orientation = 'horizontal',
  spacing = 'md',
  style,
  tone = 'default',
  ...viewProps
}: DividerProps) {
  const isAccessible = accessible ?? Boolean(accessibilityLabel);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessible={isAccessible}
      importantForAccessibility={isAccessible ? 'auto' : 'no'}
      style={[
        styles.base,
        styles[orientation],
        toneStyles[tone],
        orientation === 'horizontal'
          ? horizontalSpacingStyles[spacing]
          : verticalSpacingStyles[spacing],
        style,
      ]}
      {...viewProps}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderColor: colors.border,
  },
  horizontal: {
    borderTopWidth: space.hairline,
    width: '100%',
  },
  vertical: {
    borderLeftWidth: space.hairline,
    height: '100%',
  },
  defaultTone: {
    borderColor: colors.border,
  },
  mutedTone: {
    borderColor: colors.surfaceWarm,
  },
  accentTone: {
    borderColor: colors.accent,
  },
  horizontalNone: {
    marginVertical: space[0],
  },
  horizontalSm: {
    marginVertical: space[0.5],
  },
  horizontalMd: {
    marginVertical: space[1],
  },
  horizontalLg: {
    marginVertical: space[2],
  },
  verticalNone: {
    marginHorizontal: space[0],
  },
  verticalSm: {
    marginHorizontal: space[0.5],
  },
  verticalMd: {
    marginHorizontal: space[1],
  },
  verticalLg: {
    marginHorizontal: space[2],
  },
});

const toneStyles = {
  default: styles.defaultTone,
  muted: styles.mutedTone,
  accent: styles.accentTone,
} as const satisfies Record<DividerTone, StyleProp<ViewStyle>>;

const horizontalSpacingStyles = {
  none: styles.horizontalNone,
  sm: styles.horizontalSm,
  md: styles.horizontalMd,
  lg: styles.horizontalLg,
} as const satisfies Record<DividerSpacing, StyleProp<ViewStyle>>;

const verticalSpacingStyles = {
  none: styles.verticalNone,
  sm: styles.verticalSm,
  md: styles.verticalMd,
  lg: styles.verticalLg,
} as const satisfies Record<DividerSpacing, StyleProp<ViewStyle>>;
