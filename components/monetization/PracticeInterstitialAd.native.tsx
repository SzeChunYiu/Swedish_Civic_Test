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

    const clearAttemptTimers = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        loadTimeout = undefined;
      }
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = undefined;
      }
    };
    const consumeShowKey = () => {
      lastInterstitialShowKey = showKey;
    };
    const applyAttemptEvent = (event: PracticeInterstitialAttemptEvent) => {
      const previousState = attemptState;
      attemptState = reducePracticeInterstitialAttemptState(attemptState, event);
      if (attemptState === previousState) return;

      interstitialLoadInFlight = attemptState.inFlight;
      if (!previousState.showKeyConsumed && attemptState.showKeyConsumed) {
        consumeShowKey();
      }
      if (previousState.phase === 'loading' && attemptState.phase === 'showing') {
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          loadTimeout = undefined;
        }
        showTimeout = setTimeout(
          () => applyAttemptEvent('show_timeout'),
          PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS,
        );
      }
      if (!previousState.settled && attemptState.settled) {
        clearAttemptTimers();
      }
    };

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      interstitialLoadInFlight = attemptState.inFlight;
      loadTimeout = setTimeout(
        () => applyAttemptEvent('load_timeout'),
        PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS,
      );

      unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        applyAttemptEvent('loaded');

        try {
          void Promise.resolve(interstitialAd.show())
            .then(() => {
              applyAttemptEvent('show_resolved');
            })
            .catch(() => {
              applyAttemptEvent('show_rejected');
            });
        } catch {
          applyAttemptEvent('show_rejected');
        }
      });

      unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        applyAttemptEvent('error');
      });

      unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        applyAttemptEvent('opened');
      });

      unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        applyAttemptEvent('closed');
      });

      interstitialAd.load();
      return () => {
        unsubscribeLoaded?.();
        unsubscribeError?.();
        unsubscribeOpened?.();
        unsubscribeClosed?.();
        applyAttemptEvent('cleanup');
      };
    } catch {
      unsubscribeLoaded?.();
      unsubscribeError?.();
      unsubscribeOpened?.();
      unsubscribeClosed?.();
      clearAttemptTimers();
      applyAttemptEvent('error');
      return undefined;
    }
  }, [entitlementsReady, mobileAdsConsent, resolvedEntitlements, showKey]);

  return null;
}
