import { StyleSheet, Text } from 'react-native';

import { adBannerCopy } from '../../lib/monetization/adCopy';
import { getAdUnit, shouldShowAd } from '../../lib/monetization/ads';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import type { BannerAdPlacement, PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

// Web cards are non-SDK placeholders; this lets real-unit web exports preview the slot.
const WEB_FALLBACK_CONSENT_DECISION = { adServingAllowed: true } as const;

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
  const shouldRenderFallback =
    shouldShowAd(placement, resolvedEntitlements) ||
    shouldShowAd(placement, resolvedEntitlements, WEB_FALLBACK_CONSENT_DECISION);

  if (!entitlementsReady || !shouldRenderFallback) return null;

  const unit = getAdUnit(placement);
  const placementLabel = copy.placementLabels[placement];
  const adStatusLabel = unit?.testOnly ? copy.testStatus : copy.liveStatus;
  const accessibilityLabel = copy.accessibilityLabel(placementLabel, adStatusLabel);

  return (
    <Card
      accessibilityHint={`${copy.previewHint} ${copy.removeAdsHint}`}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.eyebrow}>Google AdMob</Text>
      <Text style={styles.title}>{placementLabel}</Text>
      <Text style={styles.meta}>{adStatusLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    marginTop: space[0.5],
    textTransform: 'capitalize',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    marginTop: space[0.5],
  },
});
