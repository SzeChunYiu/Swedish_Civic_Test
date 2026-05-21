import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import type { PremiumEntitlements } from '../../types/monetization';

let lastInterstitialShowKey: string | undefined;
let interstitialLoadInFlight = false;

const INTERSTITIAL_LOAD_TIMEOUT_MS = 15_000;
const INTERSTITIAL_SHOW_TIMEOUT_MS = 10_000;

export function PracticeInterstitialAd({
  entitlements,
  showKey,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  showKey: string;
}) {
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);

  useEffect(() => {
    if (
      !showKey ||
      lastInterstitialShowKey === showKey ||
      interstitialLoadInFlight ||
      !entitlementsReady ||
      !mobileAdsConsent.initialized ||
      !shouldShowAd(
        'quiz_completed_interstitial',
        resolvedEntitlements,
        mobileAdsConsent.decision.consentDecision,
        Platform.OS,
      )
    ) {
      return undefined;
    }

    const unitId = getPlatformAdUnitId('quiz_completed_interstitial', Platform.OS);
    if (!unitId) return undefined;

    let unsubscribeLoaded: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;
    let unsubscribeClosed: (() => void) | undefined;
    let attemptTimeout: ReturnType<typeof setTimeout> | undefined;
    let attemptSettled = false;

    const clearAttemptTimeout = () => {
      if (attemptTimeout) {
        clearTimeout(attemptTimeout);
        attemptTimeout = undefined;
      }
    };

    const finishAttempt = () => {
      if (attemptSettled) return;
      clearAttemptTimeout();
      interstitialLoadInFlight = false;
      attemptSettled = true;
    };
    const consumeShowKey = () => {
      lastInterstitialShowKey = showKey;
    };
    const finishSuccessfulShow = () => {
      if (attemptSettled) return;
      consumeShowKey();
      finishAttempt();
    };
    const startAttemptTimeout = (timeoutMs: number) => {
      clearAttemptTimeout();
      attemptTimeout = setTimeout(() => {
        finishAttempt();
      }, timeoutMs);
    };

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      interstitialLoadInFlight = true;
      startAttemptTimeout(INTERSTITIAL_LOAD_TIMEOUT_MS);

      unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        if (attemptSettled) return;
        startAttemptTimeout(INTERSTITIAL_SHOW_TIMEOUT_MS);

        try {
          void Promise.resolve(interstitialAd.show())
            .then(() => {
              finishSuccessfulShow();
            })
            .catch(() => {
              finishAttempt();
            });
        } catch {
          finishAttempt();
        }
      });

      unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        finishAttempt();
      });

      unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        finishSuccessfulShow();
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        finishSuccessfulShow();
      });

      interstitialAd.load();
      return () => {
        unsubscribeLoaded?.();
        unsubscribeError?.();
        unsubscribeOpened?.();
        unsubscribeClosed?.();
        finishAttempt();
      };
    } catch {
      unsubscribeLoaded?.();
      unsubscribeError?.();
      unsubscribeOpened?.();
      unsubscribeClosed?.();
      finishAttempt();
      return undefined;
    }
  }, [entitlementsReady, mobileAdsConsent, resolvedEntitlements, showKey]);

  return null;
}
