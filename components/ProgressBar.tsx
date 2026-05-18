import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, motion, radius, space } from '../lib/theme';

/**
 * Defaults: `progress=0`, `animated=true`,
 * `accessibilityRole="progressbar"`, and a generated percent-complete label.
 * Pass `accessibilityLabel` or `valueLabel` for localized spoken progress.
 */
export interface ProgressBarProps extends Omit<ComponentProps<typeof View>, 'style'> {
  animated?: boolean;
  fillStyle?: StyleProp<ViewStyle>;
  progress?: number;
  style?: StyleProp<ViewStyle>;
  valueLabel?: string;
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
  progress = 0,
  style,
  valueLabel,
  ...viewProps
}: ProgressBarProps) {
  const clampedProgress = clampProgress(progress);
  const progressPercent = Math.round(clampedProgress * 100);
  const resolvedValueLabel = valueLabel ?? `${progressPercent} percent complete`;
  const resolvedAccessibilityValue = {
    min: accessibilityValue?.min ?? 0,
    max: accessibilityValue?.max ?? 100,
    now: accessibilityValue?.now ?? progressPercent,
    text: accessibilityValue?.text ?? resolvedValueLabel,
  };
  const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;

  useEffect(() => {
    if (!animated) {
      animatedProgress.setValue(clampedProgress);
      return;
    }

    Animated.timing(animatedProgress, {
      duration: motion.duration.slow,
      toValue: clampedProgress,
      useNativeDriver: false,
    }).start();
  }, [animated, animatedProgress, clampedProgress]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      aria-label={accessibilityLabel ?? resolvedValueLabel}
      aria-valuemax={resolvedAccessibilityValue.max}
      aria-valuemin={resolvedAccessibilityValue.min}
      aria-valuenow={resolvedAccessibilityValue.now}
      aria-valuetext={resolvedAccessibilityValue.text}
      accessibilityLabel={accessibilityLabel ?? resolvedValueLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={resolvedAccessibilityValue}
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
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    height: space[1.5],
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: '100%',
  },
});
