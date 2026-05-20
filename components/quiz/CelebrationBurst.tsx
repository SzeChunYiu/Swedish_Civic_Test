import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';

type CelebrationBurstCopy = {
  correctAnswerLabel: string;
  streakLabel: (streak: number) => string;
};

const celebrationBurstCopy: Record<AppLanguage, CelebrationBurstCopy> = {
  sv: {
    correctAnswerLabel: 'Rätt svar',
    streakLabel: (streak) => `${streak} rätt i rad`,
  },
  en: {
    correctAnswerLabel: 'Correct answer',
    streakLabel: (streak) => `${streak} correct in a row`,
  },
};

/**
 * Defaults: `streak=0`, decorative accessibility-hidden motion, and success
 * copy from settings. Pass `languageOverride` for screen-specific language.
 */
export interface CelebrationBurstProps {
  active: boolean;
  languageOverride?: AppLanguage;
  streak?: number;
}

const particles = [
  { label: '✓', x: -42, y: -34, tone: colors.success },
  { label: '★', x: 36, y: -42, tone: colors.accent },
  { label: '+', x: -18, y: -58, tone: colors.teal },
  { label: '•', x: 52, y: -12, tone: colors.pink },
] as const;

function getCelebrationLabel(copy: CelebrationBurstCopy, streak: number) {
  return streak > 1 ? copy.streakLabel(streak) : copy.correctAnswerLabel;
}

export function CelebrationBurst({ active, languageOverride, streak = 0 }: CelebrationBurstProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = celebrationBurstCopy[language];

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.slow * 2,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  if (!active) return null;

  const containerScale = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.82, 1.06, 1],
  });
  const containerOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.container,
        { opacity: containerOpacity, transform: [{ scale: containerScale }] },
      ]}
    >
      <View style={styles.pill}>
        <Text style={styles.pillText}>{getCelebrationLabel(copy, streak)}</Text>
      </View>
      {particles.map((particle) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.y],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.25, 1],
          outputRange: [0.4, 1.25, 0.8],
        });

        return (
          <Animated.Text
            key={`${particle.label}-${particle.x}`}
            style={[
              styles.particle,
              { color: particle.tone, transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          >
            {particle.label}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: space[8],
  },
  pill: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    paddingHorizontal: space[2],
    paddingVertical: space[0.75],
  },
  pillText: {
    color: colors.success,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  particle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    position: 'absolute',
  },
});
