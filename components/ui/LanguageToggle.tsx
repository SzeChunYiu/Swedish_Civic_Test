import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'sv', label: 'SV' },
  { value: 'en', label: 'EN' },
];

type LanguageToggleCopy = {
  groupLabel: string;
  optionLabels: Record<AppLanguage, string>;
};

const languageToggleCopy: Record<AppLanguage, LanguageToggleCopy> = {
  sv: {
    groupLabel: 'Byt språk',
    optionLabels: {
      sv: 'Byt till svenska',
      en: 'Byt till engelska',
    },
  },
  en: {
    groupLabel: 'Switch language',
    optionLabels: {
      sv: 'Switch to Swedish',
      en: 'Switch to English',
    },
  },
};

/**
 * Compact Swedish/English switcher. Defaults to the current settings language
 * unless a caller provides `languageOverride` for previews or focused tests.
 */
export interface LanguageToggleProps {
  languageOverride?: AppLanguage;
}

export function LanguageToggle({ languageOverride }: LanguageToggleProps = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const language = languageOverride ?? settingsLanguage;
  const copy = languageToggleCopy[language];

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={copy.groupLabel}>
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityLabel={copy.optionLabels[opt.value]}
            accessibilityState={{ selected: active }}
            hitSlop={space[1]}
            onPress={() => setLanguage(opt.value)}
            style={({ pressed }) => [
              styles.button,
              active && styles.buttonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: space.divider,
  },
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.5],
  },
  buttonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: space.hairline,
  },
  buttonPressed: {
    backgroundColor: colors.focusSoft,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
  },
  labelActive: {
    color: colors.text,
  },
});
