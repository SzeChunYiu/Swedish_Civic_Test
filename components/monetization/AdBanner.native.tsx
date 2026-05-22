import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { adBannerCopy, getAdBannerStatusLabel } from '../../lib/monetization/adCopy';
import { getAdUnit, getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { radius, space, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
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
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);
  const unit = getAdUnit(placement);
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

  if (!visible) return null;
  if (!unitId) return null;

  const placementLabel = copy.placementLabels[placement];
  const adStatusLabel = getAdBannerStatusLabel(copy, unit);
  const accessibilityLabel = copy.accessibilityLabel(placementLabel, adStatusLabel);

  return (
    <View
      accessible
      accessibilityHint={`${copy.previewHint} ${copy.removeAdsHint}`}
      accessibilityLabel={accessibilityLabel}
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    nativeSlot: {
      alignItems: 'center',
      backgroundColor: themeColors.surfaceWarm,
      borderColor: themeColors.border,
      borderRadius: radius.card,
      borderWidth: space.hairline,
      overflow: 'hidden',
      paddingVertical: space[1],
    },
  });
}
