import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';

let launchPopupShownThisRuntime = false;

export function LaunchPopupAd({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const mobileAdsConsent = useMobileAdsConsent(entitlements);

  useEffect(() => {
    if (
      !mobileAdsConsent.initialized ||
      !shouldShowLaunchPopupAd({
        alreadyShownThisLaunch: launchPopupShownThisRuntime,
        consentDecision: mobileAdsConsent.decision.consentDecision,
        entitlements,
      })
    ) {
      return undefined;
    }

    const unitId = getPlatformAdUnitId('app_open_launch', Platform.OS);
    if (!unitId) return undefined;

    let unsubscribe: (() => void) | undefined;

    try {
      const appOpenAd = AppOpenAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      unsubscribe = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        try {
          void Promise.resolve(appOpenAd.show()).catch(() => undefined);
        } catch {
          // App-open ads are optional; a failed show must not block launch.
        }
      });

      appOpenAd.load();
      launchPopupShownThisRuntime = true;
      return unsubscribe;
    } catch {
      unsubscribe?.();
      return undefined;
    }
  }, [entitlements, mobileAdsConsent]);

  return null;
}
