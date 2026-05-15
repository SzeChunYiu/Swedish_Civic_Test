import { StyleSheet, Text } from 'react-native';

import { getAdUnit, shouldShowAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import { colors, space, typography } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

export function AdBanner({
  placement = 'home_banner',
  entitlements = FREE_ENTITLEMENTS,
}: {
  placement?: AdPlacement;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  if (!shouldShowAd(placement, entitlements)) return null;

  const unit = getAdUnit(placement);
  return (
    <Card>
      <Text style={styles.eyebrow}>Google AdMob</Text>
      <Text style={styles.title}>{placement.replaceAll('_', ' ')}</Text>
      <Text style={styles.meta}>
        {unit?.testOnly ? 'AdMob test unit active · web preview' : 'AdMob placement active'}
      </Text>
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
