import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { locales, type LocaleOption } from '../../lib/i18n/locales';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import { CloseIcon } from './icons/CloseIcon';
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

const triggerIconSize = space[2];
const closeIconSize = space[2];

type FocusableElement = {
  focus?: () => void;
};

type LanguagePickerKeyboardEvent = {
  key?: string;
  shiftKey?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
  nativeEvent?: {
    key?: string;
    shiftKey?: boolean;
    preventDefault?: () => void;
    stopPropagation?: () => void;
  };
};

type FocusedMenuTarget = 'close' | `row:${string}` | null;

function focusElement(element: FocusableElement | null | undefined) {
  if (!element?.focus) return;
  requestAnimationFrame(() => element.focus?.());
}

function preventKeyboardDefault(event: LanguagePickerKeyboardEvent) {
  event.preventDefault?.();
  event.stopPropagation?.();
  event.nativeEvent?.preventDefault?.();
  event.nativeEvent?.stopPropagation?.();
}

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
  const [focusedMenuTarget, setFocusedMenuTarget] = useState<FocusedMenuTarget>(null);
  const triggerRef = useRef<FocusableElement | null>(null);
  const closeButtonRef = useRef<FocusableElement | null>(null);
  const rowRefs = useRef<Record<string, FocusableElement | null>>({});

  const language = languageOverride ?? settingsLanguage;
  const currentCode = language === 'sv' ? 'sv' : 'en';
  const currentLabel = currentCode.toUpperCase();
  const copy = languagePickerCopy[language];
  const availableLocaleCodes = useMemo(
    () => locales.filter((option) => option.available).map((option) => option.code),
    [],
  );
  const selectedAvailableLocaleCode =
    locales.find((option) => option.available && option.fallback === language)?.code ??
    availableLocaleCodes[0];

  const closePicker = () => {
    setOpen(false);
    setFocusedMenuTarget(null);
    if (Platform.OS === 'web') focusElement(triggerRef.current);
  };

  const handleSelect = (option: LocaleOption) => {
    if (!option.available) return;
    setLanguage(option.fallback);
    closePicker();
  };

  const focusCloseButton = () => {
    focusElement(closeButtonRef.current);
  };

  const focusLocaleRow = (code: string | undefined) => {
    if (!code) return;
    focusElement(rowRefs.current[code]);
  };

  const focusedLocaleCode = focusedMenuTarget?.startsWith('row:')
    ? focusedMenuTarget.slice('row:'.length)
    : null;

  const focusNextAvailableRow = (direction: 1 | -1) => {
    const currentIndex = focusedLocaleCode
      ? availableLocaleCodes.findIndex((code) => code === focusedLocaleCode)
      : -1;
    const fallbackIndex = direction === 1 ? 0 : availableLocaleCodes.length - 1;
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + direction + availableLocaleCodes.length) % availableLocaleCodes.length
        : fallbackIndex;
    focusLocaleRow(availableLocaleCodes[nextIndex]);
  };

  const handleMenuKeyDown = (event: LanguagePickerKeyboardEvent) => {
    const key = event.key ?? event.nativeEvent?.key;
    const shiftKey = event.shiftKey ?? event.nativeEvent?.shiftKey ?? false;
    const firstCode = availableLocaleCodes[0];
    const lastCode = availableLocaleCodes[availableLocaleCodes.length - 1];

    if (key === 'Escape') {
      preventKeyboardDefault(event);
      closePicker();
      return;
    }

    if (key === 'Tab') {
      if (focusedMenuTarget === 'close') {
        preventKeyboardDefault(event);
        focusLocaleRow(shiftKey ? lastCode : firstCode);
        return;
      }
      if (focusedLocaleCode === firstCode && shiftKey) {
        preventKeyboardDefault(event);
        focusCloseButton();
        return;
      }
      if (focusedLocaleCode === lastCode && !shiftKey) {
        preventKeyboardDefault(event);
        focusCloseButton();
      }
      return;
    }

    if (key === 'ArrowDown') {
      preventKeyboardDefault(event);
      focusNextAvailableRow(1);
      return;
    }

    if (key === 'ArrowUp') {
      preventKeyboardDefault(event);
      focusNextAvailableRow(-1);
      return;
    }

    if (key === 'Home') {
      preventKeyboardDefault(event);
      focusLocaleRow(firstCode);
      return;
    }

    if (key === 'End') {
      preventKeyboardDefault(event);
      focusLocaleRow(lastCode);
      return;
    }

    if ((key === 'Enter' || key === ' ') && focusedLocaleCode) {
      const option = locales.find((candidate) => candidate.code === focusedLocaleCode);
      if (option?.available) {
        preventKeyboardDefault(event);
        handleSelect(option);
      }
    }
  };

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    focusLocaleRow(selectedAvailableLocaleCode);
  }, [open, selectedAvailableLocaleCode]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePicker();
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [open]);

  return (
    <>
      <Pressable
        aria-expanded={open}
        aria-haspopup="menu"
        accessibilityRole="button"
        accessibilityLabel={copy.triggerLabel(currentLabel)}
        accessibilityState={{ expanded: open }}
        hitSlop={space[1]}
        onPress={() => setOpen(true)}
        ref={(node) => {
          triggerRef.current = node as FocusableElement | null;
        }}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
      >
        <GlobeIcon size={triggerIconSize} color={colors.textMuted} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={closePicker}>
        <View style={styles.backdropLayer}>
          <Pressable
            accessibilityElementsHidden
            accessible={false}
            hitSlop={space[0]}
            importantForAccessibility="no-hide-descendants"
            onPress={closePicker}
            style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
          />
          <Pressable
            {...(Platform.OS === 'web' ? { onKeyDown: handleMenuKeyDown } : {})}
            aria-modal={true}
            accessibilityLabel={copy.menuLabel}
            accessibilityRole="menu"
            hitSlop={space[0]}
            onPress={(e) => e.stopPropagation()}
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{copy.title}</Text>
              <Pressable
                accessibilityLabel={copy.closeLabel}
                accessibilityRole="button"
                hitSlop={space[1]}
                onFocus={() => setFocusedMenuTarget('close')}
                onPress={closePicker}
                ref={(node) => {
                  closeButtonRef.current = node as FocusableElement | null;
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  focusedMenuTarget === 'close' ? styles.closeButtonFocused : null,
                  pressed ? styles.closeButtonPressed : null,
                ]}
              >
                <CloseIcon color={colors.textSecondary} size={closeIconSize} />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <ScrollView style={styles.list}>
              {locales.map((opt) => {
                const selected = opt.available && opt.fallback === language;
                const comingSoonLabel = opt.comingSoonLabel ?? copy.comingSoon;
                return (
                  <Pressable
                    aria-disabled={!opt.available}
                    aria-selected={selected}
                    key={opt.code}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`${opt.label}${opt.available ? '' : copy.unavailableSuffix}`}
                    accessibilityState={{ selected, disabled: !opt.available }}
                    disabled={!opt.available}
                    hitSlop={space[1]}
                    onFocus={() => {
                      if (opt.available) setFocusedMenuTarget(`row:${opt.code}`);
                    }}
                    onPress={() => handleSelect(opt)}
                    ref={(node) => {
                      rowRefs.current[opt.code] = node as FocusableElement | null;
                    }}
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
                        <Text style={styles.comingSoonText}>{comingSoonLabel}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
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
    borderWidth: space.hairline,
    flexShrink: 0,
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
    borderWidth: space.hairline,
    gap: space[1.5],
    maxHeight: '80%',
    maxWidth: 420,
    padding: space[3],
    width: '100%',
  },
  cardPressed: {
    transform: [{ scale: motion.pressedScale }],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1],
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.subHeading.fontFamily,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.subHeading.fontWeight,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: space.hairline,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  closeButtonFocused: {
    borderColor: colors.focus,
  },
  closeButtonPressed: {
    backgroundColor: colors.focusSoft,
    transform: [{ scale: motion.pressedScale }],
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
