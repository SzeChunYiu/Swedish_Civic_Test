import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import { flagColors, radius, space } from '../../lib/theme';

/**
 * Defaults: `height=space[0.5]`, `rounded=true`, and hidden from accessibility
 * because this is a decorative national accent.
 */
export interface SwedishFlagBandProps extends Omit<ViewProps, 'style'> {
  height?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A subtle two-stripe band in Swedish flag colors (blue + gold).
 * Used as a thin top accent on hero cards and section dividers to anchor the
 * product visually in its national context without going full flag.
 */
export function SwedishFlagBand({
  accessibilityElementsHidden = true,
  height = space[0.5],
  importantForAccessibility = 'no',
  rounded = true,
  style,
  ...viewProps
}: SwedishFlagBandProps) {
  return (
    <View
      accessibilityElementsHidden={accessibilityElementsHidden}
      importantForAccessibility={importantForAccessibility}
      style={[styles.row, rounded && styles.rounded, style, { height }]}
      {...viewProps}
    >
      <View style={[styles.blue, { height }]} />
      <View style={[styles.gold, { height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
  },
  rounded: {
    borderRadius: radius.pill,
  },
  blue: {
    backgroundColor: flagColors.blue,
    flex: 2,
  },
  gold: {
    backgroundColor: flagColors.gold,
    flex: 1,
  },
});
