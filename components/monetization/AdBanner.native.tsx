import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { adBannerCopy } from '../../lib/monetization/adCopy';
import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space } from '../../lib/theme';
import type { BannerAdPlacement, PremiumEntitlements } from '../../types/monetization';

export function AdBanner({
  placement = 'home_banner',
  entitlements,
}: {
  placement?: BannerAdPlacement;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const language = useSettingsStore((state) => state.language);
  const copy = adBannerCopy[language];
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);
  const unitId = getPlatformAdUnitId(placement, Platform.OS);
  const visible =
    entitlementsReady &&
    mobileAdsConsent.initialized &&
    shouldShowAd(
      placement,
      resolvedEntitlements,
      mobileAdsConsent.decision.consentDecision,
      Platform.OS,
    );

  if (!visible || !unitId) return null;

  const placementLabel = copy.placementLabels[placement];

  return (
    <View
      accessible
      accessibilityHint={`${copy.previewHint} ${copy.removeAdsHint}`}
      accessibilityLabel={copy.accessibilityLabel(placementLabel, copy.liveStatus)}
      style={styles.nativeSlot}
    >
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
