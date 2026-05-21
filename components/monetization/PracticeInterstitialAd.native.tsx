import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import {
  createPracticeInterstitialAttemptState,
  PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS,
  PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS,
  reducePracticeInterstitialAttemptState,
  type PracticeInterstitialAttemptEvent,
} from '../../lib/monetization/practiceInterstitialAttempt';
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
    let attemptState = createPracticeInterstitialAttemptState();

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
    const clearAttemptTimeouts = () => {
      clearLoadTimeout();
      clearShowTimeout();
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
    const consumeShowKey = () => {
      lastInterstitialShowKey = showKey;
    };
    const dispatchAttemptEvent = (event: PracticeInterstitialAttemptEvent) => {
      const previousAttemptState = attemptState;
      attemptState = reducePracticeInterstitialAttemptState(attemptState, event);

      if (!previousAttemptState.settled && attemptState.settled) {
        clearAttemptTimeouts();
        interstitialLoadInFlight = attemptState.inFlight;
        if (attemptState.showKeyConsumed) consumeShowKey();
      }

      return previousAttemptState !== attemptState;
    };

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      interstitialLoadInFlight = true;

      unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        if (!dispatchAttemptEvent('loaded')) return;
        clearLoadTimeout();

        showTimeout = setTimeout(() => {
          dispatchAttemptEvent('show_timeout');
        }, PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS);

        try {
          void Promise.resolve(interstitialAd.show())
            .then(() => {
              dispatchAttemptEvent('show_resolved');
            })
            .catch(() => {
              dispatchAttemptEvent('show_rejected');
            });
        } catch {
          dispatchAttemptEvent('show_rejected');
        }
      });

      unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        dispatchAttemptEvent('error');
      });

      unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        dispatchAttemptEvent('opened');
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        dispatchAttemptEvent('closed');
      });

      loadTimeout = setTimeout(() => {
        unsubscribeLoadListeners();
        dispatchAttemptEvent('load_timeout');
      }, PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS);

      interstitialAd.load();
      return () => {
        unsubscribeLoadListeners();
        dispatchAttemptEvent('cleanup');
        clearAttemptTimeouts();
      };
    } catch {
      unsubscribeLoadListeners();
      dispatchAttemptEvent('error');
      return undefined;
    }
  }, [entitlementsReady, mobileAdsConsent, resolvedEntitlements, showKey]);

  return null;
}
