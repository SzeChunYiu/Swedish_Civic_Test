import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import {
  FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
  shouldSuppressFirstRunAboutModalForPath,
} from '../../lib/onboarding/firstRunAboutModalRoutes';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { motion, radius, space, typography, type ThemeColors } from '../../lib/theme';
import {
  shouldDeferFirstRunAboutModalForLaunchSession,
  subscribeToFirstRunAboutModalDeferralForLaunchSession,
} from '../monetization/launchPopupSession';
import { useResolvedThemeColors } from '../useResolvedThemeColors';

const firstRunAboutDialogTitleId = 'first-run-about-dialog-title';
const firstRunAboutDialogBodyId = 'first-run-about-dialog-body';

type FirstRunCopy = {
  eyebrow: string;
  title: string;
  body: string;
  open: string;
  openAccessibilityLabel: string;
  skip: string;
  skipAccessibilityLabel: string;
};

const firstRunCopy: Record<AppLanguage, FirstRunCopy> = {
  sv: {
    eyebrow: 'Välkommen',
    title: 'Vad är medborgarskapsprovet?',
    body: 'En kort guide till vad provet är, vem som ska göra det och hur det här studieverktyget förhåller sig till UHR:s officiella material.',
    open: 'Läs guiden',
    openAccessibilityLabel: 'Öppna guiden om medborgarskapsprovet',
    skip: 'Hoppa över',
    skipAccessibilityLabel: 'Hoppa över guiden',
  },
  en: {
    eyebrow: 'Welcome',
    title: 'What is the Swedish civic test?',
    body: "A short guide to what the test is, who takes it, and how this study tool relates to UHR's official material.",
    open: 'Read the guide',
    openAccessibilityLabel: 'Open the about-the-test guide',
    skip: 'Skip',
    skipAccessibilityLabel: 'Skip the guide',
  },
};

/**
 * Defaults: uses the settings-store language and first-run flag, suppresses
 * exam/quiz/auth/about routes, defers for the same app launch after a launch
 * sponsor modal appears, and dismisses after backdrop, skip, hardware back,
 * or guide-open actions.
 */
export interface FirstRunAboutTheTestModalProps {
  languageOverride?: AppLanguage;
  deferWhenLaunchPopupAdShown?: boolean;
  suppressedPathPrefixes?: readonly string[];
  themeColors?: ThemeColors;
}

export function FirstRunAboutTheTestModal({
  deferWhenLaunchPopupAdShown = true,
  languageOverride,
  suppressedPathPrefixes = FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
  themeColors,
}: FirstRunAboutTheTestModalProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const hasSeen = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markSeen = useSettingsStore((state) => state.markAboutTheTestSeen);
  const reduceMotion = useReducedMotion();
  const resolvedThemeColors = useResolvedThemeColors(themeColors);
  const styles = useMemo(() => createStyles(resolvedThemeColors), [resolvedThemeColors]);
  const [launchPopupAdDeferred, setLaunchPopupAdDeferred] = useState(() =>
    shouldDeferFirstRunAboutModalForLaunchSession(),
  );

  useEffect(
    () =>
      subscribeToFirstRunAboutModalDeferralForLaunchSession(() => {
        setLaunchPopupAdDeferred(shouldDeferFirstRunAboutModalForLaunchSession());
      }),
    [],
  );

  if (hasSeen) return null;
  if (shouldSuppressFirstRunAboutModalForPath(pathname, suppressedPathPrefixes)) return null;
  if (deferWhenLaunchPopupAdShown && launchPopupAdDeferred) return null;

  const language = languageOverride ?? settingsLanguage;
  const copy = firstRunCopy[language];
  const handleOpenGuide = () => {
    markSeen();
    router.push('/about-the-test');
  };

  return (
    <Modal
      aria-describedby={firstRunAboutDialogBodyId}
      aria-labelledby={firstRunAboutDialogTitleId}
      aria-modal={true}
      animationType="fade"
      transparent
      visible
      onRequestClose={markSeen}
      accessibilityLabel={copy.title}
      accessibilityViewIsModal
      role="dialog"
    >
      <Pressable
        accessible={false}
        hitSlop={space[1]}
        importantForAccessibility="no"
        onPress={markSeen}
        style={({ pressed }) => [styles.backdrop, pressed ? styles.backdropPressed : null]}
        testID="first-run-about-modal-backdrop"
      >
        <Pressable
          accessibilityRole="none"
          accessibilityLabel={copy.title}
          hitSlop={space[0]}
          onPress={(event) => event.stopPropagation()}
          style={({ pressed }) => [
            styles.card,
            pressed && !reduceMotion ? styles.cardPressed : null,
          ]}
          testID="first-run-about-modal-card"
        >
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text
            accessibilityRole="header"
            nativeID={firstRunAboutDialogTitleId}
            style={styles.title}
          >
            {copy.title}
          </Text>
          <Text nativeID={firstRunAboutDialogBodyId} style={styles.body}>
            {copy.body}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={copy.openAccessibilityLabel}
              accessibilityRole="link"
              hitSlop={space[1]}
              onPress={handleOpenGuide}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed
                  ? reduceMotion
                    ? styles.primaryButtonPressedReducedMotion
                    : styles.primaryButtonPressed
                  : null,
              ]}
              testID="first-run-about-modal-primary-action"
            >
              <Text style={styles.primaryButtonText}>{copy.open}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.skipAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={space[1]}
              onPress={markSeen}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed
                  ? reduceMotion
                    ? styles.secondaryButtonPressedReducedMotion
                    : styles.secondaryButtonPressed
                  : null,
              ]}
              testID="first-run-about-modal-secondary-action"
            >
              <Text style={styles.secondaryButtonText}>{copy.skip}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceMuted,
      flex: 1,
      justifyContent: 'center',
      padding: space[3],
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
      maxWidth: 480,
      padding: space[3],
      width: '100%',
    },
    cardPressed: {
      transform: [{ scale: motion.pressedScale }],
    },
    eyebrow: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.badge.fontWeight,
      letterSpacing: typography.badge.letterSpacing,
      textTransform: 'uppercase',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.subHeading.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
    },
    body: {
      color: themeColors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1.25],
      marginTop: space[1],
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: themeColors.accent,
      borderRadius: radius.micro,
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
    },
    primaryButtonPressed: {
      backgroundColor: themeColors.accentActive,
      transform: [{ scale: motion.pressedScale }],
    },
    primaryButtonPressedReducedMotion: {
      backgroundColor: themeColors.accentActive,
    },
    primaryButtonText: {
      color: themeColors.surface,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
    secondaryButton: {
      alignItems: 'center',
      borderRadius: radius.micro,
      justifyContent: 'center',
      minHeight: space[6],
      paddingHorizontal: space[2],
      paddingVertical: space[1],
    },
    secondaryButtonPressed: {
      backgroundColor: themeColors.surfaceWarm,
      transform: [{ scale: motion.pressedScale }],
    },
    secondaryButtonPressedReducedMotion: {
      backgroundColor: themeColors.surfaceWarm,
    },
    secondaryButtonText: {
      color: themeColors.textMuted,
      fontSize: typography.navButton.fontSize,
      fontWeight: typography.navButton.fontWeight,
    },
  });
}
