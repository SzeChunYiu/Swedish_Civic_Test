import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowLaunchPopupAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import type { PremiumEntitlements } from '../../types/monetization';

let launchPopupShownThisRuntime = false;

export function LaunchPopupAd({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  useEffect(() => {
    if (
      !shouldShowLaunchPopupAd({
        alreadyShownThisLaunch: launchPopupShownThisRuntime,
        entitlements,
      })
    ) {
      return undefined;
    }

    const unitId = getPlatformAdUnitId('app_open_launch', Platform.OS);
    if (!unitId) return undefined;

    launchPopupShownThisRuntime = true;
    const appOpenAd = AppOpenAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubscribe = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      appOpenAd.show();
    });

    appOpenAd.load();
    return unsubscribe;
  }, [entitlements]);

  return null;
}
