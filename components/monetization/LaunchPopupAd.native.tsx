import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';
import {
  clearFirstRunAboutModalDeferralForLaunchSession,
  deferFirstRunAboutModalForLaunchSession,
} from './launchPopupSession';

const LAUNCH_POPUP_AD_LOAD_TIMEOUT_MS = 15_000;

let launchPopupShownThisRuntime = false;
let launchPopupLoadInFlight = false;

export function LaunchPopupAd({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const mobileAdsConsent = useMobileAdsConsent(entitlements);
  const nativeLaunchPopupUnitId = getPlatformAdUnitId('app_open_launch', Platform.OS);
  const launchPopupAdUnitId =
    mobileAdsConsent.initialized &&
    shouldShowLaunchPopupAd({
      alreadyShownThisLaunch: launchPopupShownThisRuntime || launchPopupLoadInFlight,
      consentDecision: mobileAdsConsent.decision.consentDecision,
      entitlements,
      platform: Platform.OS,
    })
      ? nativeLaunchPopupUnitId
      : undefined;

  if (launchPopupAdUnitId) {
    deferFirstRunAboutModalForLaunchSession();
  }

  useEffect(() => {
    if (!launchPopupAdUnitId) return undefined;

    let unsubscribe: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;
    let didReachShowPath = false;
    let attemptSettled = false;

    const clearLoadTimeout = () => {
      if (loadTimeout == null) return;
      clearTimeout(loadTimeout);
      loadTimeout = undefined;
    };

    const unsubscribeLoadListeners = () => {
      unsubscribe?.();
      unsubscribeError?.();
      unsubscribe = undefined;
      unsubscribeError = undefined;
    };

    const finishLoadAttempt = () => {
      clearLoadTimeout();
      launchPopupLoadInFlight = false;
      attemptSettled = true;
    };

    const clearTentativeFirstRunDeferral = () => {
      if (didReachShowPath) return;
      clearFirstRunAboutModalDeferralForLaunchSession();
    };

    try {
      const appOpenAd = AppOpenAd.createForAdRequest(launchPopupAdUnitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      launchPopupLoadInFlight = true;

      unsubscribe = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        if (attemptSettled) return;
        launchPopupShownThisRuntime = true;
        finishLoadAttempt();
        didReachShowPath = true;

        try {
          void Promise.resolve(appOpenAd.show()).catch(() => undefined);
        } catch {
          // App-open ads are optional; a failed show must not block launch.
        }
      });

      unsubscribeError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
        finishLoadAttempt();
        clearTentativeFirstRunDeferral();
      });

      loadTimeout = setTimeout(() => {
        if (didReachShowPath || attemptSettled) return;
        unsubscribeLoadListeners();
        finishLoadAttempt();
        clearTentativeFirstRunDeferral();
      }, LAUNCH_POPUP_AD_LOAD_TIMEOUT_MS);

      appOpenAd.load();
      return () => {
        unsubscribeLoadListeners();
        if (!didReachShowPath && !attemptSettled) {
          finishLoadAttempt();
          clearTentativeFirstRunDeferral();
        } else {
          clearLoadTimeout();
        }
      };
    } catch {
      unsubscribeLoadListeners();
      finishLoadAttempt();
      clearTentativeFirstRunDeferral();
      return undefined;
    }
  }, [launchPopupAdUnitId, mobileAdsConsent.decision.requestNonPersonalizedAdsOnly]);

  return null;
}
