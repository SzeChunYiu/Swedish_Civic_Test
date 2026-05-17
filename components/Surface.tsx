import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, shadows, space } from '../lib/theme';

export type SurfaceTone = 'canvas' | 'surface' | 'warm';
export type SurfaceElevation = 'none' | 'card' | 'elevated';

/**
 * Defaults: `tone="surface"`, `bordered=true`, `elevation="none"`,
 * `accessibilityRole="summary"`, and comfortable Notion-card padding. Pass
 * `accessibilityLabel` when children should be announced as one grouped item.
 */
export interface SurfaceProps extends PropsWithChildren<
  Omit<ComponentProps<typeof View>, 'style'>
> {
  accessibilityLabel?: string;
  bordered?: boolean;
  elevation?: SurfaceElevation;
  style?: StyleProp<ViewStyle>;
  tone?: SurfaceTone;
}

export function Surface({
  accessibilityRole = 'summary',
  bordered = true,
  children,
  elevation = 'none',
  style,
  tone = 'surface',
  ...viewProps
}: SurfaceProps) {
  return (
    <View
      accessibilityRole={accessibilityRole}
      style={[
        styles.base,
        styles[tone],
        bordered ? styles.bordered : null,
        elevation === 'card' ? styles.cardElevation : null,
        elevation === 'elevated' ? styles.elevated : null,
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    gap: space[1],
    padding: space[2],
  },
  canvas: {
    backgroundColor: colors.canvas,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  warm: {
    backgroundColor: colors.surfaceWarm,
  },
  bordered: {
    borderColor: colors.border,
    borderWidth: space.hairline,
  },
  cardElevation: {
    ...shadows.card,
  },
  elevated: {
    ...shadows.deep,
  },
});
