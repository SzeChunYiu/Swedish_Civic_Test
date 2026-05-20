import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAdUnit, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { PremiumEntitlements } from '../../types/monetization';
import { deferFirstRunAboutModalForLaunchSession } from './launchPopupSession';

let launchPopupShownThisRuntime = false;

type LaunchPopupAdCopy = {
  closeAccessibilityLabel: string;
  closeLabel: string;
  dialogAccessibilityLabel: string;
  liveBody: string;
  testBody: string;
  title: string;
};

type FocusableView = View & {
  focus?: () => void;
};

type RestorableElement = Element & {
  focus?: (options?: { preventScroll?: boolean }) => void;
};

type WebKeyboardEvent = {
  key: string;
  preventDefault: () => void;
  stopPropagation: () => void;
};

const launchPopupAdCopy: Record<AppLanguage, LaunchPopupAdCopy> = {
  sv: {
    closeAccessibilityLabel: 'Stäng startannons',
    closeLabel: 'Fortsätt studera',
    dialogAccessibilityLabel: 'Startannons',
    liveBody: 'Sponsrad annons vid appstart.',
    testBody: 'Testannons för appstart visas en gång per appstart.',
    title: 'Startannons',
  },
  en: {
    closeAccessibilityLabel: 'Close launch sponsor ad',
    closeLabel: 'Continue studying',
    dialogAccessibilityLabel: 'Launch sponsor ad',
    liveBody: 'Sponsored launch placement.',
    testBody: 'App-open test ad preview shown once per app launch.',
    title: 'Launch sponsor',
  },
};

/**
 * Defaults: uses free entitlements, reads language from settings, shows once
 * per runtime launch, and hides itself when ads are disabled or not allowed.
 */
export interface LaunchPopupAdProps {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}

function getInitialVisibility(entitlements: Pick<PremiumEntitlements, 'adsDisabled'>): boolean {
  const shouldShow = shouldShowLaunchPopupAd({
    alreadyShownThisLaunch: launchPopupShownThisRuntime,
    entitlements,
  });

  if (shouldShow) {
    deferFirstRunAboutModalForLaunchSession();
  }

  return shouldShow;
}

function isRestorableElement(element: Element | null): element is RestorableElement {
  return Boolean(element && typeof (element as RestorableElement).focus === 'function');
}

function isModalElement(element: Element | null): boolean {
  return Boolean(element?.closest('[aria-modal="true"]'));
}

function findLaunchFocusFallback(): RestorableElement | null {
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

function getLaunchFocusRestoreTarget(): RestorableElement | null {
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

  return findLaunchFocusFallback();
}

export function LaunchPopupAd({ entitlements = FREE_ENTITLEMENTS }: LaunchPopupAdProps) {
  const language = useSettingsStore((state) => state.language);
  const copy = launchPopupAdCopy[language];
  const closeButtonRef = useRef<View | null>(null);
  const restoreFocusRef = useRef<RestorableElement | null>(null);
  const [visible, setVisible] = useState(() => {
    const initialVisible = getInitialVisibility(entitlements);

    if (initialVisible) {
      restoreFocusRef.current = getLaunchFocusRestoreTarget();
    }

    return initialVisible;
  });

  const focusLaunchCloseButton = useCallback(() => {
    if (Platform.OS !== 'web') return;

    (closeButtonRef.current as FocusableView | null)?.focus?.();
  }, []);

  const restoreLaunchFocus = useCallback(() => {
    if (Platform.OS !== 'web') return;

    const target = restoreFocusRef.current ?? findLaunchFocusFallback();
    restoreFocusRef.current = null;

    if (!target) return;

    requestAnimationFrame(() => {
      if (target.isConnected === false) return;

      target.focus?.({ preventScroll: true });
    });
  }, []);

  const dismissLaunchPopupAd = useCallback(() => {
    setVisible(false);
    restoreLaunchFocus();
  }, [restoreLaunchFocus]);

  const handleDialogKeyDown = useCallback(
    (event: WebKeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          dismissLaunchPopupAd();
          break;
        case 'Tab':
          event.preventDefault();
          event.stopPropagation();
          focusLaunchCloseButton();
          break;
        default:
          break;
      }
    },
    [dismissLaunchPopupAd, focusLaunchCloseButton],
  );

  useEffect(() => {
    if (visible) {
      launchPopupShownThisRuntime = true;
      deferFirstRunAboutModalForLaunchSession();
      return;
    }

    if (
      !shouldShowLaunchPopupAd({
        alreadyShownThisLaunch: launchPopupShownThisRuntime,
        entitlements,
      })
    ) {
      return;
    }

    launchPopupShownThisRuntime = true;
    deferFirstRunAboutModalForLaunchSession();
    restoreFocusRef.current = getLaunchFocusRestoreTarget();
    setVisible(true);
  }, [entitlements, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    if (!restoreFocusRef.current) {
      restoreFocusRef.current = getLaunchFocusRestoreTarget();
    }

    requestAnimationFrame(focusLaunchCloseButton);
  }, [focusLaunchCloseButton, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.addEventListener('keydown', handleDialogKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown, true);
    };
  }, [handleDialogKeyDown, visible]);

  const unit = getAdUnit('app_open_launch');

  if (!visible) {
    return null;
  }

  return (
    <Modal
      accessibilityLabel={copy.dialogAccessibilityLabel}
      accessibilityViewIsModal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={dismissLaunchPopupAd}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Google AdMob</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.body}>{unit?.testOnly ? copy.testBody : copy.liveBody}</Text>
          <Pressable
            accessibilityLabel={copy.closeAccessibilityLabel}
            accessibilityRole="button"
            hitSlop={space[1]}
            onPress={dismissLaunchPopupAd}
            ref={closeButtonRef}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Text style={styles.closeText}>{copy.closeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.textDisclaimer,
    flex: 1,
    justifyContent: 'center',
    padding: space[3],
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space[1],
    maxWidth: 360,
    padding: space[3],
    width: '100%',
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
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    letterSpacing: typography.cardTitle.letterSpacing,
    lineHeight: typography.cardTitle.lineHeight,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.micro,
    marginTop: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  closeButtonPressed: {
    backgroundColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
  closeText: {
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
  },
});
