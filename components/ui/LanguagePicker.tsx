import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { locales, type LocaleOption } from '../../lib/i18n/locales';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import { GlobeIcon } from './icons/GlobeIcon';

type LanguagePickerCopy = {
  triggerLabel: (currentLabel: string) => string;
  closeLabel: string;
  menuLabel: string;
  title: string;
  subtitle: string;
  unavailableSuffix: string;
  comingSoon: string;
};

const languagePickerCopy: Record<AppLanguage, LanguagePickerCopy> = {
  sv: {
    triggerLabel: (currentLabel) => `Nuvarande språk ${currentLabel}. Öppna språkväljaren.`,
    closeLabel: 'Stäng språkväljaren',
    menuLabel: 'Språkväljare',
    title: 'Välj språk',
    subtitle:
      'Gränssnittet översätts stegvis. Frågeinnehållet är svenska/engelska tills varje språk har granskats av mänskliga översättare.',
    unavailableSuffix: ', kommer snart',
    comingSoon: 'Kommer snart',
  },
  en: {
    triggerLabel: (currentLabel) => `Current language ${currentLabel}. Open language picker.`,
    closeLabel: 'Close language picker',
    menuLabel: 'Language picker',
    title: 'Choose language',
    subtitle:
      'UI translations land in waves. Question content stays Swedish/English until human translators review each language.',
    unavailableSuffix: ', coming soon',
    comingSoon: 'Coming soon',
  },
};

/**
 * Defaults: reads and writes the settings-store language, opens the locale
 * menu in-place, and uses settings copy unless `languageOverride` is provided
 * for focused previews or tests.
 */
export interface LanguagePickerProps {
  languageOverride?: AppLanguage;
}

export function LanguagePicker({ languageOverride }: LanguagePickerProps = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  const language = languageOverride ?? settingsLanguage;
  const currentCode = language === 'sv' ? 'sv' : 'en';
  const currentLabel = currentCode.toUpperCase();
  const copy = languagePickerCopy[language];

  const handleSelect = (option: LocaleOption) => {
    if (!option.available) return;

    setLanguage(option.fallback);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.triggerLabel(currentLabel)}
        hitSlop={space[1]}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
      >
        <GlobeIcon size={16} color={colors.textMuted} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityLabel={copy.closeLabel}
          accessibilityRole="button"
          hitSlop={space[1]}
          onPress={() => setOpen(false)}
          style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
        >
          <Pressable
            accessibilityLabel={copy.menuLabel}
            accessibilityRole="menu"
            hitSlop={space[0]}
            onPress={(e) => e.stopPropagation()}
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
          >
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <ScrollView style={styles.list}>
              {locales.map((opt) => {
                const selected = opt.available && opt.fallback === language;
                return (
                  <Pressable
                    key={opt.code}
                    accessibilityRole="button"
                    accessibilityLabel={`${opt.label}${opt.available ? '' : copy.unavailableSuffix}`}
                    accessibilityState={{ selected, disabled: !opt.available }}
                    disabled={!opt.available}
                    hitSlop={space[1]}
                    onPress={() => handleSelect(opt)}
                    style={({ pressed }) => [
                      styles.row,
                      selected ? styles.rowSelected : null,
                      pressed && opt.available ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.native, !opt.available && styles.dimmed]}>
                        {opt.nativeLabel}
                      </Text>
                      <Text style={[styles.english, !opt.available && styles.dimmed]}>
                        {opt.label}
                      </Text>
                    </View>
                    {opt.available ? (
                      selected ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : null
                    ) : (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{copy.comingSoon}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: space[0.5],
    paddingHorizontal: space[1.25],
    paddingVertical: space[0.5],
  },
  triggerPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  triggerLabel: {
    color: colors.text,
    fontFamily: typography.badge.fontFamily,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    flex: 1,
    justifyContent: 'center',
    padding: space[3],
  },
  backdropPressed: {
    backgroundColor: colors.focusSoft,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1.5],
    maxHeight: '80%',
    maxWidth: 420,
    padding: space[3],
    width: '100%',
  },
  cardPressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  title: {
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyTight.fontFamily,
    fontSize: typography.bodyTight.fontSize,
    lineHeight: typography.bodyTight.lineHeight,
  },
  list: {
    marginTop: space[1],
  },
  row: {
    alignItems: 'center',
    borderRadius: radius.small,
    flexDirection: 'row',
    gap: space[1],
    paddingHorizontal: space[1.5],
    paddingVertical: space[1.5],
  },
  rowSelected: {
    backgroundColor: colors.badgeBlueBg,
  },
  rowPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  rowText: {
    flex: 1,
  },
  native: {
    color: colors.text,
    fontFamily: typography.bodySemibold.fontFamily,
    fontSize: typography.bodySemibold.fontSize,
    fontWeight: typography.bodySemibold.fontWeight,
  },
  english: {
    color: colors.textMuted,
    fontFamily: typography.captionLight.fontFamily,
    fontSize: typography.captionLight.fontSize,
  },
  dimmed: {
    opacity: 0.55,
  },
  checkmark: {
    color: colors.accent,
    fontFamily: typography.bodyBold.fontFamily,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: space[1],
    paddingVertical: space[0.5],
  },
  comingSoonText: {
    color: colors.textMuted,
    fontFamily: typography.micro.fontFamily,
    fontSize: typography.micro.fontSize,
    letterSpacing: typography.micro.letterSpacing,
    textTransform: 'uppercase',
  },
});
