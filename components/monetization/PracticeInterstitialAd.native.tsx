import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import type { PremiumEntitlements } from '../../types/monetization';

const INTERSTITIAL_AD_LOAD_TIMEOUT_MS = 15_000;
const INTERSTITIAL_AD_SHOW_TIMEOUT_MS = 10_000;

let lastInterstitialShowKey: string | undefined;
let interstitialLoadInFlight = false;

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
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;
    let showTimeout: ReturnType<typeof setTimeout> | undefined;
    let attemptSettled = false;
    let showStarted = false;

    const clearLoadTimeout = () => {
      if (loadTimeout == null) return;
      clearTimeout(loadTimeout);
      loadTimeout = undefined;
    };
    const clearShowTimeout = () => {
      if (showTimeout == null) return;
      clearTimeout(showTimeout);
      showTimeout = undefined;
    };
    const unsubscribeLoadListeners = () => {
      unsubscribeLoaded?.();
      unsubscribeError?.();
      unsubscribeOpened?.();
      unsubscribeClosed?.();
      unsubscribeLoaded = undefined;
      unsubscribeError = undefined;
      unsubscribeOpened = undefined;
      unsubscribeClosed = undefined;
    };
    const finishAttempt = () => {
      if (attemptSettled) return;
      attemptSettled = true;
      clearLoadTimeout();
      clearShowTimeout();
      unsubscribeLoadListeners();
      interstitialLoadInFlight = false;
    };
    const consumeShowKey = () => {
      lastInterstitialShowKey = showKey;
    };

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      interstitialLoadInFlight = true;

      unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        if (attemptSettled) return;
        clearLoadTimeout();
        showStarted = true;
        showTimeout = setTimeout(() => {
          if (attemptSettled) return;
          finishAttempt();
        }, INTERSTITIAL_AD_SHOW_TIMEOUT_MS);

        try {
          void Promise.resolve(interstitialAd.show())
            .then(() => {
              if (attemptSettled) return;
              consumeShowKey();
              finishAttempt();
            })
            .catch(() => {
              if (attemptSettled) return;
              finishAttempt();
            });
        } catch {
          finishAttempt();
        }
      });

      unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        if (attemptSettled) return;
        finishAttempt();
      });

      unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        if (attemptSettled) return;
        consumeShowKey();
        finishAttempt();
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        if (attemptSettled) return;
        consumeShowKey();
        finishAttempt();
      });

      loadTimeout = setTimeout(() => {
        if (showStarted || attemptSettled) return;
        unsubscribeLoadListeners();
        finishAttempt();
      }, INTERSTITIAL_AD_LOAD_TIMEOUT_MS);

      interstitialAd.load();
      return () => {
        unsubscribeLoadListeners();
        if (!showStarted && !attemptSettled) {
          finishAttempt();
        } else {
          clearLoadTimeout();
        }
      };
    } catch {
      unsubscribeLoadListeners();
      finishAttempt();
      return undefined;
    }
  }, [entitlementsReady, mobileAdsConsent, resolvedEntitlements, showKey]);

  return null;
}
