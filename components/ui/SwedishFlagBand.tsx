import { StyleSheet, View, type ViewProps } from 'react-native';

import { flagColors, radius, space } from '../../lib/theme';

export interface SwedishFlagBandProps extends Omit<ViewProps, 'style'> {
  height?: number;
  rounded?: boolean;
}

/**
 * A subtle two-stripe band in Swedish flag colors (blue + gold).
 * Used as a thin top accent on hero cards and section dividers to anchor the
 * product visually in its national context without going full flag.
 */
export function SwedishFlagBand({
  height = space[0.5],
  rounded = true,
  accessibilityElementsHidden = true,
  importantForAccessibility = 'no',
  ...viewProps
}: SwedishFlagBandProps) {
  return (
    <View
      {...viewProps}
      accessibilityElementsHidden={accessibilityElementsHidden}
      importantForAccessibility={importantForAccessibility}
      style={[styles.row, rounded && styles.rounded, { height }]}
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
