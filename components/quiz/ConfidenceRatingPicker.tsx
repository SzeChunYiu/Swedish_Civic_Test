import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ConfidenceRating } from '../../types/progress';
import { colors, motion, radius, space, typography } from '../../lib/theme';
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
              android_ripple={{ color: colors.focusSoft }}
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
                pressed && !disabled ? styles.optionPressed : null,
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1],
    padding: space[1.5],
  },
  heading: {
    gap: space[0.5],
  },
  title: {
    color: colors.text,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
    lineHeight: typography.bodySemibold.lineHeight,
  },
  subtitle: {
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceMuted,
  },
  optionPressed: {
    backgroundColor: colors.focusSoft,
    borderColor: colors.focus,
    transform: [{ scale: motion.pressedScale }],
  },
  optionSelected: {
    backgroundColor: colors.badgeBlueBg,
    borderColor: colors.focus,
  },
  value: {
    color: colors.text,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.badge.lineHeight,
  },
  valueSelected: {
    color: colors.badgeBlueText,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.badgeBlueText,
  },
});
