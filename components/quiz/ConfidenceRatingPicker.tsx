import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import type { ConfidenceRating } from '../../types/progress';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { AppLanguage } from '../../lib/storage/settingsStore';

type RatingOption = {
  labelEn: string;
  labelSv: string;
  value: ConfidenceRating;
};

const ratingOptions: RatingOption[] = [
  { value: 1, labelSv: 'Gissar', labelEn: 'Guessing' },
  { value: 2, labelSv: 'Osäker', labelEn: 'Unsure' },
  { value: 3, labelSv: 'Mittemellan', labelEn: 'Mixed' },
  { value: 4, labelSv: 'Ganska säker', labelEn: 'Fairly sure' },
  { value: 5, labelSv: 'Helt säker', labelEn: 'Very sure' },
];

const copy = {
  sv: {
    title: 'Hur säker är du?',
    subtitle: 'Valfritt Pro-verktyg för kalibrering.',
    groupLabel: 'Valfri säkerhetsbedömning för Pro-kalibrering',
    optionLabel: (value: ConfidenceRating, label: string) =>
      `Sätt säkerhet till ${value} av 5: ${label}`,
  },
  en: {
    title: 'How confident are you?',
    subtitle: 'Optional Pro tool for calibration.',
    groupLabel: 'Optional confidence rating for Pro calibration',
    optionLabel: (value: ConfidenceRating, label: string) =>
      `Set confidence to ${value} out of 5: ${label}`,
  },
};

export interface ConfidenceRatingPickerProps {
  disabled?: boolean;
  language: AppLanguage;
  onChange: (value: ConfidenceRating) => void;
  style?: StyleProp<ViewStyle>;
  value: ConfidenceRating | null;
}

export function ConfidenceRatingPicker({
  disabled = false,
  language,
  onChange,
  style,
  value,
}: ConfidenceRatingPickerProps) {
  const localizedCopy = copy[language];
  const reduceMotion = useReducedMotion();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View
      accessibilityLabel={localizedCopy.groupLabel}
      accessibilityRole="radiogroup"
      style={[styles.container, style]}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>{localizedCopy.title}</Text>
        <Text style={styles.subtitle}>{localizedCopy.subtitle}</Text>
      </View>
      <View style={styles.options}>
        {ratingOptions.map((option) => {
          const selected = value === option.value;
          const label = language === 'sv' ? option.labelSv : option.labelEn;

          return (
            <Pressable
              key={option.value}
              android_ripple={{ color: themeColors.focusSoft }}
              aria-checked={selected}
              accessibilityLabel={localizedCopy.optionLabel(option.value, label)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              hitSlop={space[1]}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                disabled ? styles.optionDisabled : null,
                pressed && !disabled
                  ? reduceMotion
                    ? styles.optionPressedReducedMotion
                    : styles.optionPressed
                  : null,
              ]}
            >
              <Text style={[styles.value, selected ? styles.valueSelected : null]}>
                {option.value}
              </Text>
              <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space[1],
      padding: space[1.5],
    },
    heading: {
      gap: space[0.5],
    },
    title: {
      color: themeColors.text,
      fontSize: typography.bodySemibold.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
      lineHeight: typography.bodySemibold.lineHeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[0.75],
    },
    option: {
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      gap: space.micro,
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[7],
      paddingHorizontal: space[1],
      paddingVertical: space[0.75],
    },
    optionDisabled: {
      backgroundColor: themeColors.surfaceMuted,
    },
    optionPressed: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
      transform: [{ scale: motion.pressedScale }],
    },
    optionPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
      borderColor: themeColors.focus,
    },
    optionSelected: {
      backgroundColor: themeColors.badgeBlueBg,
      borderColor: themeColors.focus,
    },
    value: {
      color: themeColors.text,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      lineHeight: typography.badge.lineHeight,
    },
    valueSelected: {
      color: themeColors.badgeBlueText,
    },
    label: {
      color: themeColors.textSecondary,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      textAlign: 'center',
    },
    labelSelected: {
      color: themeColors.badgeBlueText,
    },
  });
}
