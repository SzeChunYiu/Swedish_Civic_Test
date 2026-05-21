import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { locales, type LocaleOption } from '../../lib/i18n/locales';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
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

const closeIconSize = space[2];
const triggerIconSize = space[2];
type FocusableElement = { focus?: () => void };
type KeyboardEventLike = {
  key?: string;
  shiftKey?: boolean;
  nativeEvent?: { key?: string; shiftKey?: boolean };
  preventDefault?: () => void;
};
type WebPressableKeyboardProps = {
  onKeyDown?: (event: KeyboardEventLike) => void;
  tabIndex?: 0 | -1;
};

/**
 * Defaults: reads and writes the settings-store language, opens the locale
 * menu in-place, and uses settings copy unless `languageOverride` is provided
 * for focused previews or tests.
 */
export interface LanguagePickerProps {
  languageOverride?: AppLanguage;
  themeColors?: ThemeColors;
}

export function LanguagePicker({
  languageOverride,
  themeColors: providedThemeColors,
}: LanguagePickerProps = {}) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const fallbackThemeColors = useThemeColors();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<FocusableElement | null>(null);
  const closeButtonRef = useRef<FocusableElement | null>(null);
  const rowRefs = useRef<Record<string, FocusableElement | null>>({});
  const reduceMotion = useReducedMotion();
  const themeColors = providedThemeColors ?? fallbackThemeColors;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const pickerId = useId().replace(/:/g, '');
  const menuTitleId = `language-picker-title-${pickerId}`;
  const menuDescriptionId = `language-picker-description-${pickerId}`;

  const language = languageOverride ?? settingsLanguage;
  const currentCode = language === 'sv' ? 'sv' : 'en';
  const currentLabel = currentCode.toUpperCase();
  const copy = languagePickerCopy[language];
  const availableLocales = useMemo(() => locales.filter((option) => option.available), []);
  const selectedAvailableIndex = Math.max(
    0,
    availableLocales.findIndex((option) => option.fallback === language),
  );

  const focusAvailableLocale = useCallback(
    (index: number) => {
      if (Platform.OS !== 'web') return;
      const option = availableLocales[index];
      if (!option) return;
      rowRefs.current[option.code]?.focus?.();
    },
    [availableLocales],
  );

  const focusCloseButton = useCallback(() => {
    if (Platform.OS !== 'web') return;
    closeButtonRef.current?.focus?.();
  }, []);

  const focusFirstAvailableLocale = useCallback(() => {
    focusAvailableLocale(0);
  }, [focusAvailableLocale]);

  const focusLastAvailableLocale = useCallback(() => {
    focusAvailableLocale(availableLocales.length - 1);
  }, [availableLocales.length, focusAvailableLocale]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (Platform.OS === 'web') {
      window.setTimeout(() => triggerRef.current?.focus?.(), 0);
    }
  }, []);

  const handleSelect = (option: LocaleOption) => {
    if (!option.available) return;
    setLanguage(option.fallback);
    closeMenu();
  };

  const handleRowKeyDown = (event: KeyboardEventLike, option: LocaleOption) => {
    const key = event.nativeEvent?.key ?? event.key;
    const shiftKey = event.nativeEvent?.shiftKey ?? event.shiftKey;
    const currentIndex = availableLocales.findIndex((candidate) => candidate.code === option.code);
    if (currentIndex < 0) return;

    switch (key) {
      case 'Tab':
        if (shiftKey && currentIndex === 0) {
          event.preventDefault?.();
          focusCloseButton();
        } else if (!shiftKey && currentIndex === availableLocales.length - 1) {
          event.preventDefault?.();
          focusCloseButton();
        }
        break;
      case 'Escape':
        event.preventDefault?.();
        closeMenu();
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault?.();
        focusAvailableLocale((currentIndex + 1) % availableLocales.length);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault?.();
        focusAvailableLocale(
          (currentIndex - 1 + availableLocales.length) % availableLocales.length,
        );
        break;
      case 'Home':
        event.preventDefault?.();
        focusAvailableLocale(0);
        break;
      case 'End':
        event.preventDefault?.();
        focusAvailableLocale(availableLocales.length - 1);
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault?.();
        handleSelect(option);
        break;
      default:
        break;
    }
  };

  const handleCloseKeyDown = (event: KeyboardEventLike) => {
    const key = event.nativeEvent?.key ?? event.key;
    const shiftKey = event.nativeEvent?.shiftKey ?? event.shiftKey;
    if (key !== 'Tab') return;

    event.preventDefault?.();
    if (shiftKey) {
      focusLastAvailableLocale();
    } else {
      focusFirstAvailableLocale();
    }
  };

  const getRowWebKeyboardProps = (option: LocaleOption): WebPressableKeyboardProps =>
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: KeyboardEventLike) => handleRowKeyDown(event, option),
          tabIndex: option.available ? 0 : -1,
        }
      : {};

  const getCloseWebKeyboardProps = (): WebPressableKeyboardProps =>
    Platform.OS === 'web'
      ? {
          onKeyDown: handleCloseKeyDown,
          tabIndex: 0,
        }
      : {};

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return undefined;
    const focusTimer = window.setTimeout(() => focusAvailableLocale(selectedAvailableIndex), 0);
    return () => window.clearTimeout(focusTimer);
  }, [focusAvailableLocale, open, selectedAvailableIndex]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return undefined;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu();
    };

    window.document.addEventListener('keydown', handleDocumentKeyDown);
    return () => window.document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [open, closeMenu]);

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
        style={({ pressed }) => [
          styles.trigger,
          pressed
            ? reduceMotion
              ? styles.triggerPressedReducedMotion
              : styles.triggerPressed
            : null,
        ]}
      >
        <GlobeIcon size={triggerIconSize} color={themeColors.textMuted} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={closeMenu}>
        <View style={styles.backdropLayer}>
          <Pressable
            accessible={false}
            hitSlop={space[0]}
            importantForAccessibility="no-hide-descendants"
            onPress={closeMenu}
            style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
          />
          <Pressable
            aria-describedby={menuDescriptionId}
            aria-labelledby={menuTitleId}
            aria-modal={true}
            accessibilityLabel={copy.menuLabel}
            accessibilityRole="menu"
            hitSlop={space[0]}
            onPress={(e) => e.stopPropagation()}
            style={({ pressed }) => [
              styles.card,
              pressed ? (reduceMotion ? null : styles.cardPressed) : null,
            ]}
          >
            <Text nativeID={menuTitleId} style={styles.accessibilitySummaryText}>
              {copy.menuLabel}
            </Text>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text nativeID={menuDescriptionId} style={styles.subtitle}>
                  {copy.subtitle}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={copy.closeLabel}
                accessibilityRole="button"
                hitSlop={space[1]}
                onPress={closeMenu}
                ref={(node) => {
                  closeButtonRef.current = node as FocusableElement | null;
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed
                    ? reduceMotion
                      ? styles.closePressedReducedMotion
                      : styles.closePressed
                    : null,
                ]}
                {...getCloseWebKeyboardProps()}
              >
                <CloseIcon size={closeIconSize} color={themeColors.textMuted} />
              </Pressable>
            </View>
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
                    onPress={() => handleSelect(opt)}
                    ref={(node) => {
                      rowRefs.current[opt.code] = node as FocusableElement | null;
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      selected ? styles.rowSelected : null,
                      pressed && opt.available
                        ? reduceMotion
                          ? styles.rowPressedReducedMotion
                          : styles.rowPressed
                        : null,
                    ]}
                    {...getRowWebKeyboardProps(opt)}
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    trigger: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
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
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    triggerPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    triggerLabel: {
      color: themeColors.text,
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
      backgroundColor: themeColors.surfaceMuted,
    },
    backdropPressed: {
      backgroundColor: themeColors.focusSoft,
    },
    card: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
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
    accessibilitySummaryText: {
      height: 1,
      left: -10000,
      overflow: 'hidden',
      position: 'absolute',
      width: 1,
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: space[1],
    },
    headerText: {
      flex: 1,
      gap: space[1],
    },
    title: {
      color: themeColors.text,
      fontFamily: typography.subHeading.fontFamily,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.subHeading.fontWeight,
    },
    subtitle: {
      color: themeColors.textMuted,
      fontFamily: typography.bodyTight.fontFamily,
      fontSize: typography.bodyTight.fontSize,
      lineHeight: typography.bodyTight.lineHeight,
    },
    closeButton: {
      alignItems: 'center',
      borderRadius: radius.pill,
      justifyContent: 'center',
      minHeight: space[6],
      minWidth: space[6],
    },
    closePressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    closePressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
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
      backgroundColor: themeColors.badgeBlueBg,
    },
    rowPressed: {
      backgroundColor: themeColors.focusSoft,
      transform: [{ scale: motion.pressedScale }],
    },
    rowPressedReducedMotion: {
      backgroundColor: themeColors.focusSoft,
    },
    rowText: {
      flex: 1,
    },
    native: {
      color: themeColors.text,
      fontFamily: typography.bodySemibold.fontFamily,
      fontSize: typography.bodySemibold.fontSize,
      fontWeight: typography.bodySemibold.fontWeight,
    },
    english: {
      color: themeColors.textMuted,
      fontFamily: typography.captionLight.fontFamily,
      fontSize: typography.captionLight.fontSize,
    },
    dimmed: {
      opacity: 0.55,
    },
    checkmark: {
      color: themeColors.accent,
      fontFamily: typography.bodyBold.fontFamily,
      fontSize: typography.bodyBold.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    comingSoonBadge: {
      backgroundColor: themeColors.surfaceMuted,
      borderRadius: radius.pill,
      paddingHorizontal: space[1],
      paddingVertical: space[0.5],
    },
    comingSoonText: {
      color: themeColors.textMuted,
      fontFamily: typography.micro.fontFamily,
      fontSize: typography.micro.fontSize,
      letterSpacing: typography.micro.letterSpacing,
      textTransform: 'uppercase',
    },
  });
}
