import { StyleSheet, Text } from 'react-native';

import { getAdUnit, shouldShowAd } from '../../lib/monetization/ads';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { colors, space, typography } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

export function AdBanner({
  placement = 'home_banner',
  entitlements,
}: {
  placement?: AdPlacement;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);

  if (!entitlementsReady || !shouldShowAd(placement, resolvedEntitlements)) return null;

  const unit = getAdUnit(placement);
  const placementLabel = placement.replaceAll('_', ' ');
  const adStatusLabel = unit?.testOnly
    ? 'AdMob test unit active · web preview'
    : 'AdMob placement active';

  return (
    <Card accessibilityLabel={`Google AdMob: ${placementLabel}. ${adStatusLabel}`}>
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
