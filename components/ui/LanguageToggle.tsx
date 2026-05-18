import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';

const OPTIONS: { value: AppLanguage; label: string; full: string }[] = [
  { value: 'sv', label: 'SV', full: 'Svenska' },
  { value: 'en', label: 'EN', full: 'English' },
];

export function LanguageToggle() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Switch language">
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityLabel={`Switch to ${opt.full}`}
            accessibilityState={{ selected: active }}
            onPress={() => setLanguage(opt.value)}
            style={[styles.button, active && styles.buttonActive]}
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
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: space.hairline,
  },
  button: {
    borderRadius: radius.pill,
    paddingHorizontal: space[1.5],
    paddingVertical: space[0.5],
  },
  buttonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
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
