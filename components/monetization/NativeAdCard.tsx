import { Platform, StyleSheet, Text } from 'react-native';

import { nativeAdCardCopy } from '../../lib/monetization/adCopy';
import { shouldShowAd } from '../../lib/monetization/ads';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore } from '../../lib/storage/settingsStore';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

// Web cards are non-SDK placeholders; native rendering still goes through consent-aware paths.
const WEB_FALLBACK_CONSENT_DECISION = { adServingAllowed: true } as const;

export function NativeAdCard({
  entitlements,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const language = useSettingsStore((state) => state.language);
  const copy = nativeAdCardCopy[language];
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);
  const webFallbackConsentDecision =
    Platform.OS === 'web' ? WEB_FALLBACK_CONSENT_DECISION : undefined;
  const shouldRenderFallback =
    shouldShowAd('results_native', resolvedEntitlements) ||
    shouldShowAd('results_native', resolvedEntitlements, webFallbackConsentDecision);

  if (!entitlementsReady || !shouldRenderFallback) return null;

  return (
    <Card accessibilityHint={copy.hint} accessibilityLabel={copy.accessibilityLabel}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.meta}>{copy.meta}</Text>
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
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[0.5],
  },
});
