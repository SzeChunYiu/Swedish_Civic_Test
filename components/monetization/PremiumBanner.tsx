import { StyleSheet, Text } from 'react-native';

import { isPremiumUser } from '../../lib/monetization/premium';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

export function PremiumBanner({ entitlements }: { entitlements: PremiumEntitlements }) {
  const isPremium = isPremiumUser(entitlements);

  return (
    <Card>
      <Text style={styles.eyebrow}>{isPremium ? 'Premium active' : 'Premium preview'}</Text>
      <Text style={styles.title}>{isPremium ? 'Ads disabled' : 'Upgrade later to remove ads'}</Text>
      <Text style={styles.meta}>
        Premium entitlements are wired as a local flag for now. RevenueCat can be added after the
        store product setup is approved.
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
