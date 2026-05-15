import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, motion, radius, space } from '../../lib/theme';

export function ProgressBar({ progress = 0 }: { progress?: number }) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clampedProgress,
      duration: motion.duration.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, clampedProgress]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityLabel={`${Math.round(clampedProgress * 100)} percent complete`}
      style={styles.track}
    >
      <Animated.View style={[styles.fill, { width: fillWidth }]} />
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
  fill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: '100%',
  },
});
