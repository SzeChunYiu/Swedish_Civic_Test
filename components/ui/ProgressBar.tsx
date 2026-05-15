import { StyleSheet, View } from 'react-native';

export function ProgressBar({ progress = 0 }: { progress?: number }) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: '#f6f5f4', borderRadius: 9999, height: 8, overflow: 'hidden' },
  fill: { backgroundColor: '#0075de', height: '100%' },
});
