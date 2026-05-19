import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../../lib/theme';

type SwedishFlagBandProps = {
  height?: number;
  rounded?: boolean;
};

/**
 * A subtle two-stripe band in Swedish flag colors (blue + gold).
 * Used as a thin top accent on hero cards and section dividers to anchor the
 * product visually in its national context without going full flag.
 */
export function SwedishFlagBand({ height = 4, rounded = true }: SwedishFlagBandProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
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
    backgroundColor: colors.swedishBlue,
    flex: 2,
  },
  gold: {
    backgroundColor: colors.swedishGold,
    flex: 1,
  },
});
