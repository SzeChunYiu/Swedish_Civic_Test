import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaAspectRatio,
  NativeMediaView,
} from 'react-native-google-mobile-ads';

import { getNativeAdCardCopy } from '../../lib/monetization/adCopy';
import { getAdUnit, getPlatformAdUnitId, shouldShowAd } from '../../lib/monetization/ads';
import { useMobileAdsConsent } from '../../lib/monetization/useMobileAdsConsent';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { PremiumEntitlements } from '../../types/monetization';

export function NativeAdCard({
  entitlements,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const language = useSettingsStore((state) => state.language);
  const unit = getAdUnit('results_native');
  const copy = getNativeAdCardCopy(language, unit);
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const mobileAdsConsent = useMobileAdsConsent(resolvedEntitlements);
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  const visible =
    entitlementsReady &&
    mobileAdsConsent.initialized &&
    shouldShowAd('results_native', resolvedEntitlements, mobileAdsConsent.decision.consentDecision);

  useEffect(() => {
    if (!visible) {
      setNativeAd((currentAd) => {
        currentAd?.destroy();
        return null;
      });
      return undefined;
    }

    const unitId = getPlatformAdUnitId('results_native', Platform.OS);
    if (!unitId) return undefined;

    let cancelled = false;
    let loadedAd: NativeAd | null = null;

    void NativeAd.createForAdRequest(unitId, {
      adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
      aspectRatio: NativeMediaAspectRatio.LANDSCAPE,
      requestNonPersonalizedAdsOnly: mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
      startVideoMuted: true,
    })
      .then((nextAd) => {
        if (cancelled) {
          nextAd.destroy();
          return;
        }

        loadedAd = nextAd;
        setNativeAd((currentAd) => {
          currentAd?.destroy();
          return nextAd;
        });
      })
      .catch(() => {
        if (!cancelled) setNativeAd(null);
      });

    return () => {
      cancelled = true;
      loadedAd?.destroy();
      setNativeAd((currentAd) => {
        if (currentAd === loadedAd) return null;
        return currentAd;
      });
    };
  }, [
    mobileAdsConsent.decision.consentDecision,
    mobileAdsConsent.decision.requestNonPersonalizedAdsOnly,
    resolvedEntitlements,
    visible,
  ]);

  if (!nativeAd || !visible) return null;

  return (
    <NativeAdView accessible={false} nativeAd={nativeAd} style={styles.card}>
      <View
        accessible
        accessibilityHint={copy.hint}
        accessibilityLabel={copy.accessibilityLabel}
        accessibilityRole="summary"
        style={styles.summary}
      >
        <View style={styles.header}>
          {nativeAd.icon ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image
                accessibilityIgnoresInvertColors
                source={{ uri: nativeAd.icon.url }}
                style={styles.icon}
              />
            </NativeAsset>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text numberOfLines={2} style={styles.title}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>
            {nativeAd.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text numberOfLines={1} style={styles.advertiser}>
                  {nativeAd.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>

        {nativeAd.mediaContent ? <NativeMediaView resizeMode="cover" style={styles.media} /> : null}

        {nativeAd.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text numberOfLines={3} style={styles.meta}>
              {nativeAd.body}
            </Text>
          </NativeAsset>
        ) : (
          <Text numberOfLines={2} style={styles.meta}>
            {copy.meta}
          </Text>
        )}
      </View>

      {nativeAd.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text
            accessible
            accessibilityHint={copy.ctaHint}
            accessibilityLabel={copy.ctaAccessibilityLabel(nativeAd.callToAction)}
            accessibilityRole="button"
            style={styles.cta}
          >
            {nativeAd.callToAction}
          </Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  advertiser: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    marginTop: space[0.5],
  },
  card: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    gap: space[1],
    overflow: 'hidden',
    padding: space[2],
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.small,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.75],
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1],
  },
  headerCopy: {
    flex: 1,
  },
  icon: {
    borderRadius: radius.micro,
    height: space[6],
    width: space[6],
  },
  media: {
    borderRadius: radius.micro,
    minHeight: space[15],
    overflow: 'hidden',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  summary: {
    gap: space[1],
  },
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginTop: space[0.5],
  },
});
