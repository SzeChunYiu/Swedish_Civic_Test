import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useReducedMotion } from '../lib/motion/useReducedMotion';
import { useSettingsStore, type AppLanguage } from '../lib/storage/settingsStore';
import { colors, motion, radius, space } from '../lib/theme';

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

/**
 * Defaults: `progress=0`, `animated=true`, `accessibilityRole="progressbar"`,
 * localized percentage copy from settings, and a rounded accent fill over a
 * warm tokenized track. Pass `accessibilityLabel` when the default percentage
 * copy and native progress value text need a screen-specific phrase.
 */
export interface ProgressBarProps extends Omit<ComponentProps<typeof View>, 'style'> {
  animated?: boolean;
  fillStyle?: StyleProp<ViewStyle>;
  languageOverride?: AppLanguage;
  progress?: number;
  style?: StyleProp<ViewStyle>;
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(1, progress));
}

export function ProgressBar({
  accessibilityLabel,
  accessibilityRole = 'progressbar',
  accessibilityValue,
  animated = true,
  fillStyle,
  languageOverride,
  progress = 0,
  style,
  ...viewProps
}: ProgressBarProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const clampedProgress = clampProgress(progress);
  const progressPercent = Math.round(clampedProgress * 100);
  const defaultAccessibilityText = progressBarCopy[language].progressLabel(progressPercent);
  const resolvedAccessibilityLabel = accessibilityLabel ?? defaultAccessibilityText;
  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
  const reducedMotionEnabled = useReducedMotion();
  const shouldAnimate = animated && !reducedMotionEnabled;

  useEffect(() => {
    if (!shouldAnimate) {
      animatedProgress.setValue(clampedProgress);
      return undefined;
    }

    const timing = Animated.timing(animatedProgress, {
      duration: motion.duration.slow,
      easing: Easing.out(Easing.cubic),
      toValue: clampedProgress,
      useNativeDriver: false,
    });

    timing.start();
    return () => timing.stop();
  }, [animatedProgress, clampedProgress, shouldAnimate]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progressPercent,
        text: resolvedAccessibilityLabel,
        ...accessibilityValue,
      }}
      style={[styles.track, style]}
      {...viewProps}
    >
      <Animated.View style={[styles.fill, { width: fillWidth }, fillStyle]} />
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
