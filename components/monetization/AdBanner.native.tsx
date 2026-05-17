import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { colors, radius, space } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';

export function AdBanner({
  placement = 'home_banner',
  entitlements,
}: {
  placement?: AdPlacement;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);
  const unitId = getPlatformAdUnitId(placement, Platform.OS);
  const visible =
    entitlementsReady &&
    mobileAdsConsent.initialized &&
    shouldShowAd(placement, resolvedEntitlements, mobileAdsConsent.decision.consentDecision);

  if (!visible || !unitId) return null;

  return (
    <View accessibilityLabel={`Google AdMob banner for ${placement}`} style={styles.nativeSlot}>
      <BannerAd
        requestOptions={{
          requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
        }}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        unitId={unitId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nativeSlot: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: space[1],
  },
});
