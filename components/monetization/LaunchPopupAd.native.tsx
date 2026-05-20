import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';

let launchPopupShownThisRuntime = false;
let launchPopupLoadInFlight = false;

export function LaunchPopupAd({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const mobileAdsConsent = useMobileAdsConsent(entitlements);

  useEffect(() => {
    if (
      launchPopupLoadInFlight ||
      !mobileAdsConsent.initialized ||
      !shouldShowLaunchPopupAd({
        alreadyShownThisLaunch: launchPopupShownThisRuntime,
        consentDecision: mobileAdsConsent.decision.consentDecision,
        entitlements,
        platform: Platform.OS,
      })
    ) {
      return undefined;
    }

    const unitId = getPlatformAdUnitId('app_open_launch', Platform.OS);
    if (!unitId) return undefined;

    let unsubscribe: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;
    let didReachShowPath = false;

    try {
      const appOpenAd = AppOpenAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      launchPopupLoadInFlight = true;

      unsubscribe = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        launchPopupShownThisRuntime = true;
        launchPopupLoadInFlight = false;
        didReachShowPath = true;

        try {
          void Promise.resolve(appOpenAd.show()).catch(() => undefined);
        } catch {
          // App-open ads are optional; a failed show must not block launch.
        }
      });

      unsubscribeError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
        launchPopupLoadInFlight = false;
      });

      appOpenAd.load();
      return () => {
        unsubscribe?.();
        unsubscribeError?.();
        if (!didReachShowPath) {
          launchPopupLoadInFlight = false;
        }
      };
    } catch {
      unsubscribe?.();
      unsubscribeError?.();
      launchPopupLoadInFlight = false;
      return undefined;
    }
  }, [entitlements, mobileAdsConsent]);

  return null;
}
