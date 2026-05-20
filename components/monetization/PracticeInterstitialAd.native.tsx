import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import type { PremiumEntitlements } from '../../types/monetization';

let lastInterstitialShowKey: string | undefined;
let interstitialLoadInFlight = false;
let interstitialShowInFlight = false;

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
      interstitialShowInFlight ||
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
    let unsubscribeOpened: (() => void) | undefined;
    let unsubscribeClosed: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;
    let didReachShowPath = false;
    let didOpenInterstitial = false;

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      interstitialLoadInFlight = true;

      unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoadInFlight = false;
        interstitialShowInFlight = true;
        didReachShowPath = true;

        try {
          void Promise.resolve(interstitialAd.show()).catch(() => {
            interstitialShowInFlight = false;
          });
        } catch {
          interstitialShowInFlight = false;
          // Interstitial ads are optional; feedback and navigation must continue.
        }
      });

      unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        didOpenInterstitial = true;
        lastInterstitialShowKey = showKey;
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialShowInFlight = false;
      });

      unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        interstitialLoadInFlight = false;
        if (!didOpenInterstitial) {
          interstitialShowInFlight = false;
        }
      });

      interstitialAd.load();
      return () => {
        unsubscribeLoaded?.();
        unsubscribeOpened?.();
        unsubscribeClosed?.();
        unsubscribeError?.();
        if (!didReachShowPath) {
          interstitialLoadInFlight = false;
        }
        interstitialShowInFlight = false;
      };
    } catch {
      unsubscribeLoaded?.();
      unsubscribeOpened?.();
      unsubscribeClosed?.();
      unsubscribeError?.();
      interstitialLoadInFlight = false;
      interstitialShowInFlight = false;
      return undefined;
    }
  }, [entitlementsReady, mobileAdsConsent, resolvedEntitlements, showKey]);

  return null;
}
