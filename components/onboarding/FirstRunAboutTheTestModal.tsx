import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from '../../lib/motion/useReducedMotion';
import {
  FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
  shouldSuppressFirstRunAboutModalForPath,
} from '../../lib/onboarding/firstRunAboutModalRoutes';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import {
  shouldDeferFirstRunAboutModalForLaunchSession,
  subscribeToFirstRunAboutModalDeferralForLaunchSession,
} from '../monetization/launchPopupSession';

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
}

export function FirstRunAboutTheTestModal({
  deferWhenLaunchPopupAdShown = true,
  languageOverride,
  suppressedPathPrefixes = FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
}: FirstRunAboutTheTestModalProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const hasSeen = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markSeen = useSettingsStore((state) => state.markAboutTheTestSeen);
  const reduceMotion = useReducedMotion();
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
            >
              <Text style={styles.secondaryButtonText}>{copy.skip}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.subHeading.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
  },
  body: {
    color: colors.textSecondary,
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
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    justifyContent: 'center',
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
  primaryButtonPressedReducedMotion: {
    backgroundColor: colors.accentActive,
  },
  primaryButtonText: {
    color: colors.surface,
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
    backgroundColor: colors.surfaceWarm,
    transform: [{ scale: motion.pressedScale }],
  },
  secondaryButtonPressedReducedMotion: {
    backgroundColor: colors.surfaceWarm,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
