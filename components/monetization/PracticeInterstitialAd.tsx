import { StyleSheet, Text } from 'react-native';

import { adBannerCopy, getAdBannerStatusLabel } from '../../lib/monetization/adCopy';
import {
  getAdUnit,
  shouldShowAd,
  WEB_AD_FALLBACK_CONSENT_DECISION,
} from '../../lib/monetization/ads';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

export function PracticeInterstitialAd({
  entitlements,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  showKey: string;
}) {
  const language = useSettingsStore((state) => state.language);
  const copy = adBannerCopy[language];
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const shouldRenderFallback =
    shouldShowAd('quiz_completed_interstitial', resolvedEntitlements) ||
    shouldShowAd(
      'quiz_completed_interstitial',
      resolvedEntitlements,
      WEB_AD_FALLBACK_CONSENT_DECISION,
    );

  if (!entitlementsReady || !shouldRenderFallback) {
    return null;
  }

  const unit = getAdUnit('quiz_completed_interstitial');
  const placementLabel = copy.placementLabels.quiz_completed_interstitial;
  const adStatusLabel = getAdBannerStatusLabel(copy, unit);
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
