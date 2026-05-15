import { StyleSheet, Text } from 'react-native';

import { isPremiumUser } from '../../lib/monetization/premium';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

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
    color: '#097fe8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: 'rgba(0, 0, 0, 0.95)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  meta: {
    color: '#615d59',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});
