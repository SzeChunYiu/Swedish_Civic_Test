import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import type { PremiumEntitlements } from '../../types/monetization';

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
    let attemptSettled = false;
    let showStarted = false;

    const finishAttempt = () => {
      interstitialLoadInFlight = false;
      attemptSettled = true;
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
        showStarted = true;

        try {
          void Promise.resolve(interstitialAd.show())
            .then(() => {
              consumeShowKey();
              finishAttempt();
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
        consumeShowKey();
        finishAttempt();
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        consumeShowKey();
        finishAttempt();
      });

      interstitialAd.load();
      return () => {
        unsubscribeLoaded?.();
        unsubscribeError?.();
        unsubscribeOpened?.();
        unsubscribeClosed?.();
        if (!showStarted && !attemptSettled) {
          finishAttempt();
        }
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
