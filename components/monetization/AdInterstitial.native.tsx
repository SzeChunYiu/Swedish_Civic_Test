import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import type { PremiumEntitlements } from '../../types/monetization';

const shownInterstitialTriggerKeys = new Set<string>();

export function AdInterstitial({
  entitlements,
  triggerKey = 'practice-completion',
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  triggerKey?: string;
}) {
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);

  useEffect(() => {
    if (
      !entitlementsReady ||
      !mobileAdsConsent.initialized ||
      shownInterstitialTriggerKeys.has(triggerKey) ||
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

    let unsubscribe: (() => void) | undefined;

    try {
      const interstitialAd = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      });

      unsubscribe = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        try {
          void Promise.resolve(interstitialAd.show()).catch(() => undefined);
        } catch {
          // Interstitial ads are optional; a failed show must not block practice.
        }
      });

      interstitialAd.load();
      shownInterstitialTriggerKeys.add(triggerKey);
      return unsubscribe;
    } catch {
      unsubscribe?.();
      return undefined;
    }
  }, [
    entitlementsReady,
    mobileAdsConsent.decision.consentDecision,
    mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
    mobileAdsConsent.initialized,
    resolvedEntitlements,
    triggerKey,
  ]);

  return null;
}
