import { StyleSheet, Text } from 'react-native';

import { shouldShowAd } from '../../lib/monetization/ads';
import { FREE_ENTITLEMENTS } from '../../lib/monetization/premium';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { colors, space, typography } from '../../lib/theme';

export function NativeAdCard({
  entitlements = FREE_ENTITLEMENTS,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
}) {
  if (!shouldShowAd('results_native', entitlements)) return null;

  return (
    <Card>
      <Text style={styles.eyebrow}>Test native ad</Text>
      <Text style={styles.title}>Sponsored study placement</Text>
      <Text style={styles.meta}>
        Native ad placeholder using AdMob test placement. Keep out of timed exams.
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
