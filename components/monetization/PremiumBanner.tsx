import { StyleSheet, Text } from 'react-native';

import { isPremiumUser } from '../../lib/monetization/premium';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function PremiumBanner({ entitlements }: { entitlements: PremiumEntitlements }) {
  const isPremium = isPremiumUser(entitlements);

  return (
    <Card>
      <Text style={styles.eyebrow}>{isPremium ? 'Premium active' : 'Premium preview'}</Text>
      <Text style={styles.title}>
        {isPremium ? 'Premium active' : 'Premium and ads are deferred for v1.0'}
      </Text>
      <Text style={styles.meta}>
        Premium entitlements are wired as a local flag for now. Real ads and RevenueCat can be added
        only after store product, privacy, and data-safety review are approved.
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
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[0.5],
  },
});
