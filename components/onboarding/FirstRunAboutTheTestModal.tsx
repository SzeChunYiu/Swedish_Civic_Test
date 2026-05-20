import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import { shouldDeferFirstRunAboutModalForLaunchSession } from '../monetization/launchPopupSession';

/**
 * Suppress on routes where a blocking modal would be hostile to flow:
 * - exam routes (timed)
 * - quiz mid-session
 * - auth modals
 * - the about-the-test screen itself (otherwise the modal sits on top of the page it sends you to)
 */
const SUPPRESSED_PATH_PREFIXES = ['/exam', '/quiz', '/(auth)', '/about-the-test'] as const;

type FirstRunCopy = {
  eyebrow: string;
  title: string;
  body: string;
  open: string;
  openAccessibilityLabel: string;
  skip: string;
  skipAccessibilityLabel: string;
};

type FocusableView = View & {
  contains?: (element: Element | null) => boolean;
  focus?: () => void;
  isConnected?: boolean;
};

type RestorableElement = Element & {
  focus?: (options?: { preventScroll?: boolean }) => void;
};

type WebKeyboardEvent = {
  key: string;
  preventDefault: () => void;
  shiftKey?: boolean;
  stopPropagation: () => void;
};

const firstRunCopy: Record<AppLanguage, FirstRunCopy> = {
  sv: {
    eyebrow: 'Välkommen',
    title: 'Vad är medborgarskapsprovet?',
    body: 'En kort guide till vad provet är, vem som ska göra det och hur det här studieverktyget förhåller sig till UHR:s officiella material.',
    open: 'Läs guiden',
    openAccessibilityLabel: 'Läs guiden om medborgarskapsprovet',
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

function pathIsSuppressed(
  pathname: string | null,
  suppressedPathPrefixes: readonly string[],
): boolean {
  if (!pathname) return false;
  return suppressedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isRestorableElement(element: Element | null): element is RestorableElement {
  return Boolean(element && typeof (element as RestorableElement).focus === 'function');
}

function isModalElement(element: Element | null): boolean {
  return Boolean(element?.closest('[aria-modal="true"]'));
}

function findFirstRunFocusFallback(): RestorableElement | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const selectors = [
    'a[aria-label="Sök"]',
    'a[aria-label="Search"]',
    '[role="link"][aria-label="Sök"]',
    '[role="link"][aria-label="Search"]',
    'a.top-bar-action-link[aria-label]',
    '[role="link"][aria-label]',
    'button[aria-label]',
    '[role="button"][aria-label]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (isRestorableElement(element) && !isModalElement(element)) {
      return element;
    }
  }

  return null;
}

function getFirstRunFocusRestoreTarget(): RestorableElement | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const activeElement = document.activeElement;

  if (
    isRestorableElement(activeElement) &&
    activeElement !== document.body &&
    activeElement !== document.documentElement &&
    !isModalElement(activeElement)
  ) {
    return activeElement;
  }

  return findFirstRunFocusFallback();
}

export function FirstRunAboutTheTestModal({
  deferWhenLaunchPopupAdShown = true,
  languageOverride,
  suppressedPathPrefixes = SUPPRESSED_PATH_PREFIXES,
}: FirstRunAboutTheTestModalProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsLanguage = useSettingsStore((state) => state.language);
  const hasSeen = useSettingsStore((state) => state.hasSeenAboutTheTest);
  const markSeen = useSettingsStore((state) => state.markAboutTheTestSeen);
  const guideLinkRef = useRef<View | null>(null);
  const skipButtonRef = useRef<View | null>(null);
  const restoreFocusRef = useRef<RestorableElement | null>(null);

  const visible =
    !hasSeen &&
    !pathIsSuppressed(pathname, suppressedPathPrefixes) &&
    !(deferWhenLaunchPopupAdShown && shouldDeferFirstRunAboutModalForLaunchSession());

  const language = languageOverride ?? settingsLanguage;
  const copy = firstRunCopy[language];

  const focusFirstRunAction = useCallback((index: number) => {
    if (Platform.OS !== 'web') return;

    const actions = [guideLinkRef.current, skipButtonRef.current];
    (actions[index] as FocusableView | null)?.focus?.();
  }, []);

  const getFocusedFirstRunActionIndex = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return -1;

    const activeElement = document.activeElement;
    const actions = [guideLinkRef.current, skipButtonRef.current];

    return actions.findIndex((action) => {
      const node = action as FocusableView | null;

      return (
        (node as unknown as Element | null) === activeElement ||
        Boolean(node?.contains?.(activeElement))
      );
    });
  }, []);

  const restoreFirstRunFocus = useCallback(() => {
    if (Platform.OS !== 'web') return;

    const target = restoreFocusRef.current ?? findFirstRunFocusFallback();
    restoreFocusRef.current = null;

    if (!target) return;

    requestAnimationFrame(() => {
      if (target.isConnected === false) return;

      target.focus?.({ preventScroll: true });
    });
  }, []);

  const dismissFirstRunModal = useCallback(() => {
    markSeen();
    restoreFirstRunFocus();
  }, [markSeen, restoreFirstRunFocus]);

  const handleOpenGuide = useCallback(() => {
    restoreFocusRef.current = null;
    markSeen();
    router.push('/about-the-test');
  }, [markSeen, router]);

  const handleDialogKeyDown = useCallback(
    (event: WebKeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          dismissFirstRunModal();
          break;
        case 'Tab': {
          event.preventDefault();
          event.stopPropagation();

          const actionsCount = 2;
          const focusedIndex = getFocusedFirstRunActionIndex();
          const nextIndex =
            focusedIndex < 0
              ? 0
              : event.shiftKey
                ? (focusedIndex - 1 + actionsCount) % actionsCount
                : (focusedIndex + 1) % actionsCount;

          focusFirstRunAction(nextIndex);
          break;
        }
        default:
          break;
      }
    },
    [dismissFirstRunModal, focusFirstRunAction, getFocusedFirstRunActionIndex],
  );

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    if (!restoreFocusRef.current) {
      restoreFocusRef.current = getFirstRunFocusRestoreTarget();
    }

    requestAnimationFrame(() => focusFirstRunAction(0));
  }, [focusFirstRunAction, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.addEventListener('keydown', handleDialogKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown, true);
    };
  }, [handleDialogKeyDown, visible]);

  if (!visible) return null;

  return (
    <Modal
      accessibilityViewIsModal
      animationType="fade"
      transparent
      visible
      onRequestClose={dismissFirstRunModal}
      accessibilityLabel={copy.title}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={dismissFirstRunModal}
          style={({ pressed }) => [
            styles.backdropDismissLayer,
            pressed ? styles.backdropPressed : null,
          ]}
        />
        <View accessibilityRole="none" style={styles.card}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={copy.openAccessibilityLabel}
              accessibilityRole="link"
              hitSlop={space[1]}
              onPress={handleOpenGuide}
              ref={guideLinkRef}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{copy.open}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.skipAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={space[1]}
              onPress={dismissFirstRunModal}
              ref={skipButtonRef}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.secondaryButtonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{copy.skip}</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  backdropDismissLayer: {
    ...StyleSheet.absoluteFillObject,
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
    zIndex: 1,
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
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
