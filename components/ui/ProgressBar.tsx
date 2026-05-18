import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space } from '../../lib/theme';

type ProgressBarCopy = {
  progressLabel: (progressPercent: number) => string;
};

const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = {
  sv: {
    progressLabel: (progressPercent) => `${progressPercent} procent klart`,
  },
  en: {
    progressLabel: (progressPercent) => `${progressPercent} percent complete`,
  },
};

export function ProgressBar({
  progress = 0,
  language = 'sv',
}: {
  progress?: number;
  language?: AppLanguage;
}) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressPercent = Math.round(clampedProgress * 100);
  const copy = progressBarCopy[language];
  const progressAccessibilityLabel = copy.progressLabel(progressPercent);
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
      aria-label={progressAccessibilityLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progressPercent}
      aria-valuetext={progressAccessibilityLabel}
      accessibilityLabel={progressAccessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progressPercent,
        text: progressAccessibilityLabel,
      }}
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
