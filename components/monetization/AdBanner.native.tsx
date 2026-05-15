import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { colors, radius, space } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';

export function AdBanner({
  placement = 'home_banner',
  entitlements = FREE_ENTITLEMENTS,
}: {
  placement?: AdPlacement;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const unitId = getPlatformAdUnitId(placement, Platform.OS);
  const visible = shouldShowAd(placement, entitlements);

  if (!visible || !unitId) return null;

  return (
    <View accessibilityLabel={`Google AdMob banner for ${placement}`} style={styles.nativeSlot}>
      <BannerAd
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
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
