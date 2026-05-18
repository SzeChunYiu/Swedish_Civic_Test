import type { ComponentProps, PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edges } from 'react-native-safe-area-context';

import { colors, space } from '../lib/theme';

export type ScreenTone = 'canvas' | 'surface' | 'warm';
export type ScreenPadding = 'none' | 'compact' | 'comfortable';

/**
 * Defaults: `tone="canvas"`, `padding="comfortable"`, `scroll=false`,
 * `edges=["top", "right", "bottom", "left"]`, and
 * `accessibilityRole="none"`. Pass `accessibilityLabel` when the screen
 * wrapper itself should be announced as a grouped region.
 */
export interface ScreenProps extends PropsWithChildren<
  Omit<ComponentProps<typeof SafeAreaView>, 'edges' | 'style'>
> {
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edges;
  padding?: ScreenPadding;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: ScreenTone;
}

const defaultEdges = ['top', 'right', 'bottom', 'left'] as const satisfies Edges;

export function Screen({
  accessibilityRole = 'none',
  children,
  contentContainerStyle,
  edges = defaultEdges,
  padding = 'comfortable',
  scroll = false,
  style,
  tone = 'canvas',
  ...safeAreaProps
}: ScreenProps) {
  const contentStyle = [styles.content, paddingStyles[padding], contentContainerStyle];

  return (
    <SafeAreaView
      accessibilityRole={accessibilityRole}
      edges={edges}
      style={[styles.safeArea, toneStyles[tone], style]}
      {...safeAreaProps}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroller: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space[2],
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
  none: {
    padding: space[0],
  },
  compact: {
    padding: space[2],
    paddingBottom: space[4],
  },
  comfortable: {
    padding: space[3],
    paddingBottom: space[5],
  },
});

const toneStyles = {
  canvas: styles.canvas,
  surface: styles.surface,
  warm: styles.warm,
} as const satisfies Record<ScreenTone, StyleProp<ViewStyle>>;

const paddingStyles = {
  none: styles.none,
  compact: styles.compact,
  comfortable: styles.comfortable,
} as const satisfies Record<ScreenPadding, StyleProp<ViewStyle>>;
