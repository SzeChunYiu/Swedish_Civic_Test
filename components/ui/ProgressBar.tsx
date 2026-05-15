import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../../lib/theme';

export function ProgressBar({ progress = 0 }: { progress?: number }) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.pill,
    height: space[1],
    overflow: 'hidden',
  },
  fill: { backgroundColor: colors.accent, height: '100%' },
});
