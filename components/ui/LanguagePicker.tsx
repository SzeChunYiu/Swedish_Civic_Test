import { useEffect, useRef, useState, type ElementRef } from 'react';
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
const availableOptionIndexes = locales
  .map((option, index) => (option.available ? index : -1))
  .filter((index) => index >= 0);

type KeyboardActivationEvent = {
  key?: string;
  nativeEvent?: {
    key?: string;
  };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

type PressableRef = ElementRef<typeof Pressable>;

function getKeyboardEventKey(event: KeyboardActivationEvent) {
  return event.key ?? event.nativeEvent?.key;
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
  const triggerRef = useRef<PressableRef | null>(null);
  const rowRefs = useRef<Array<PressableRef | null>>([]);
  const wasOpenRef = useRef(false);

  const language = languageOverride ?? settingsLanguage;
  const currentCode = language === 'sv' ? 'sv' : 'en';
  const currentLabel = currentCode.toUpperCase();
  const copy = languagePickerCopy[language];
  const selectedOptionIndex = locales.findIndex(
    (option) => option.available && option.fallback === language,
  );

  const focusNode = (node: PressableRef | null) => {
    (node as unknown as { focus?: () => void } | null)?.focus?.();
  };

  const focusOptionAtIndex = (optionIndex: number) => {
    focusNode(rowRefs.current[optionIndex] ?? null);
  };

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (open) {
        focusOptionAtIndex(
          selectedOptionIndex >= 0 ? selectedOptionIndex : availableOptionIndexes[0],
        );
        return;
      }

      if (wasOpenRef.current) {
        focusNode(triggerRef.current);
      }
    }, 0);

    wasOpenRef.current = open;
    return () => clearTimeout(focusTimer);
  }, [open, selectedOptionIndex]);

  const handleSelect = (option: LocaleOption) => {
    if (!option.available) return;
    setLanguage(option.fallback);
    setOpen(false);
  };

  const handleRowKeyDown = (
    event: KeyboardActivationEvent,
    index: number,
    option: LocaleOption,
  ) => {
    const key = getKeyboardEventKey(event);
    if (!key) return;

    if (key === 'Escape') {
      event.preventDefault?.();
      event.stopPropagation?.();
      setOpen(false);
      return;
    }

    if (!option.available) return;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault?.();
      event.stopPropagation?.();
      handleSelect(option);
      return;
    }

    const currentAvailableIndex = availableOptionIndexes.indexOf(index);
    if (currentAvailableIndex < 0) return;

    if (key === 'ArrowDown' || key === 'ArrowRight') {
      event.preventDefault?.();
      event.stopPropagation?.();
      const nextIndex =
        availableOptionIndexes[(currentAvailableIndex + 1) % availableOptionIndexes.length];
      focusOptionAtIndex(nextIndex);
      return;
    }

    if (key === 'ArrowUp' || key === 'ArrowLeft') {
      event.preventDefault?.();
      event.stopPropagation?.();
      const nextIndex =
        availableOptionIndexes[
          (currentAvailableIndex - 1 + availableOptionIndexes.length) %
            availableOptionIndexes.length
        ];
      focusOptionAtIndex(nextIndex);
      return;
    }

    if (key === 'Home') {
      event.preventDefault?.();
      event.stopPropagation?.();
      focusOptionAtIndex(availableOptionIndexes[0]);
      return;
    }

    if (key === 'End') {
      event.preventDefault?.();
      event.stopPropagation?.();
      focusOptionAtIndex(availableOptionIndexes[availableOptionIndexes.length - 1]);
    }
  };

  const getRowKeyboardProps = (index: number, option: LocaleOption) =>
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: KeyboardActivationEvent) => handleRowKeyDown(event, index, option),
        }
      : {};

  const getTriggerKeyboardProps = () =>
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: KeyboardActivationEvent) => {
            const key = getKeyboardEventKey(event);
            if (!open || !key) return;

            if (key === 'Escape') {
              event.preventDefault?.();
              event.stopPropagation?.();
              setOpen(false);
              return;
            }

            if (key === 'ArrowDown' || key === 'ArrowUp') {
              event.preventDefault?.();
              event.stopPropagation?.();
              focusOptionAtIndex(
                selectedOptionIndex >= 0 ? selectedOptionIndex : availableOptionIndexes[0],
              );
            }
          },
        }
      : {};

  return (
    <>
      <Pressable
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="menu"
        accessibilityRole="button"
        accessibilityLabel={copy.triggerLabel(currentLabel)}
        accessibilityState={{ expanded: open }}
        hitSlop={space[1]}
        onPress={() => setOpen(true)}
        {...getTriggerKeyboardProps()}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
      >
        <GlobeIcon size={triggerIconSize} color={colors.textMuted} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdropLayer}>
          <Pressable
            accessible={false}
            hitSlop={space[0]}
            importantForAccessibility="no-hide-descendants"
            onPress={() => setOpen(false)}
            style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
          />
          <Pressable
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
                hitSlop={space[0]}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed ? styles.closeButtonPressed : null,
                ]}
              >
                <Text style={styles.closeButtonText}>x</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <ScrollView style={styles.list}>
              {locales.map((opt, index) => {
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
                    ref={(node) => {
                      rowRefs.current[index] = node;
                    }}
                    disabled={!opt.available}
                    hitSlop={space[1]}
                    onPress={() => handleSelect(opt)}
                    tabIndex={opt.available ? 0 : -1}
                    {...getRowKeyboardProps(index, opt)}
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
    borderWidth: StyleSheet.hairlineWidth,
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
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
  closeButtonText: {
    color: colors.text,
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
