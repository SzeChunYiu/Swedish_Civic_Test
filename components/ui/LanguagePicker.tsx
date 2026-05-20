import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

type FocusableView = View & {
  focus?: () => void;
};

type WebKeyboardEvent = {
  key: string;
  preventDefault: () => void;
  shiftKey?: boolean;
  stopPropagation: () => void;
};

type WebKeyboardProps = {
  onKeyDown?: (event: WebKeyboardEvent) => void;
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
  const [focusedOptionCode, setFocusedOptionCode] = useState<string | null>(null);
  const closeButtonRef = useRef<View | null>(null);
  const triggerRef = useRef<View | null>(null);
  const rowRefs = useRef<Record<string, View | null>>({});

  const language = languageOverride ?? settingsLanguage;
  const currentCode = language === 'sv' ? 'sv' : 'en';
  const currentLabel = currentCode.toUpperCase();
  const copy = languagePickerCopy[language];
  const closePicker = () => setOpen(false);

  const handleSelect = (option: LocaleOption) => {
    if (option.available) {
      setLanguage(option.fallback);
    }
    closePicker();
  };

  const handleMenuKeyDown = (event: WebKeyboardEvent) => {
    switch (event.key) {
      case 'Tab':
        containTabFocus(event);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        closePicker({ restoreFocus: true });
        break;
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        moveFocusBy(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        moveFocusBy(-1);
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        focusAvailableIndex(0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        focusAvailableIndex(availableLocaleOptions.length - 1);
        break;
      case 'Enter':
      case ' ':
        if (!focusedOptionCode) return;
        event.preventDefault();
        event.stopPropagation();
        handleSelect(
          availableLocaleOptions.find((option) => option.code === focusedOptionCode) ??
            availableLocaleOptions[selectedAvailableIndex],
        );
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;

    const nextOptionCode = availableLocaleOptions[selectedAvailableIndex]?.code ?? currentCode;
    setFocusedOptionCode(nextOptionCode);
    requestAnimationFrame(() => {
      (rowRefs.current[nextOptionCode] as FocusableView | null)?.focus?.();
    });
  }, [availableLocaleOptions, currentCode, open, selectedAvailableIndex]);

  const menuKeyboardProps: WebKeyboardProps =
    Platform.OS === 'web' ? { onKeyDown: handleMenuKeyDown } : {};
  const triggerKeyboardProps: WebKeyboardProps =
    Platform.OS === 'web' && open ? { onKeyDown: handleMenuKeyDown } : {};

  return (
    <>
      <Pressable
        aria-expanded={open}
        aria-haspopup="menu"
        accessibilityRole="button"
        accessibilityLabel={copy.triggerLabel(currentLabel)}
        accessibilityState={{ expanded: open }}
        hitSlop={space[1]}
        ref={triggerRef}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
        {...triggerKeyboardProps}
      >
        <GlobeIcon size={16} color={colors.textMuted} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={closePicker}>
        <View style={styles.backdropLayer}>
          <Pressable
            accessible={false}
            hitSlop={space[0]}
            importantForAccessibility="no"
            onPress={closePicker}
            style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
          />
          <View
            accessibilityLabel={copy.menuLabel}
            accessibilityRole="menu"
            accessibilityViewIsModal
            style={styles.card}
          >
            <View style={styles.header}>
              <View style={styles.headingCopy}>
                <Text accessibilityRole="header" style={styles.title}>
                  {copy.title}
                </Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
              </View>
              <Pressable
                accessibilityLabel={copy.closeLabel}
                accessibilityRole="button"
                hitSlop={space[1]}
                onPress={closePicker}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed ? styles.closeButtonPressed : null,
                ]}
              >
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.list}>
              {locales.map((opt) => {
                const selected = opt.available && opt.fallback === language;
                return (
                  <Pressable
                    key={opt.code}
                    aria-disabled={!opt.available}
                    aria-selected={selected}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`${opt.label}${opt.available ? '' : copy.unavailableSuffix}`}
                    accessibilityState={{ selected, disabled: !opt.available }}
                    disabled={!opt.available}
                    hitSlop={space[1]}
                    onFocus={() => {
                      if (opt.available) setFocusedOptionCode(opt.code);
                    }}
                    onPress={() => handleSelect(opt)}
                    ref={(node) => {
                      rowRefs.current[opt.code] = node;
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      selected ? styles.rowSelected : null,
                      pressed && opt.available ? styles.rowPressed : null,
                    ]}
                    tabIndex={
                      opt.available
                        ? opt.code === (focusedOptionCode ?? currentCode)
                          ? 0
                          : -1
                        : -1
                    }
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
          </View>
        </View>
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
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
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
  backdropLayer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: space[3],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceMuted,
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
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: space[1.5],
  },
  headingCopy: {
    flex: 1,
    gap: space[0.75],
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
  },
  closeButtonPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  closeGlyph: {
    color: colors.textMuted,
    fontFamily: typography.bodyBold.fontFamily,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: space[6],
    minWidth: space[6],
  },
  closeButtonPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
  },
  closeButtonText: {
    color: colors.textMuted,
    fontFamily: typography.bodyBold.fontFamily,
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    lineHeight: typography.bodyBold.lineHeight,
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
