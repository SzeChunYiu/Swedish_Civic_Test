import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { shouldShowAd } from '../../lib/monetization/ads';
import { REMOVE_ADS_PRICE_LABEL } from '../../lib/monetization/purchases';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, radius, space, typography } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';

type RemoveAdsPlacementCtaCopy = {
  accessibilityLabel: string;
  body: (price: string) => string;
  eyebrow: string;
  link: string;
  title: string;
};

const removeAdsPlacementCtaCopy: Record<AppLanguage, RemoveAdsPlacementCtaCopy> = {
  sv: {
    accessibilityLabel: 'Öppna Ta bort annonser på profilsidan',
    body: (price) =>
      `Ett engångsköp på ${price} tar bort annonser från studieskärmar. Provet är fortfarande annonsfritt.`,
    eyebrow: 'Annonsfri genväg',
    link: 'Öppna Ta bort annonser',
    title: 'Studera utan den här annonsen',
  },
  en: {
    accessibilityLabel: 'Open Remove Ads on the profile page',
    body: (price) =>
      `A one-time ${price} purchase removes ads from study screens. The mock exam still stays ad-free.`,
    eyebrow: 'Ad-free shortcut',
    link: 'Open Remove Ads',
    title: 'Study without this ad',
  },
};

export function RemoveAdsPlacementCta({
  entitlements,
  placement,
}: {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  placement: AdPlacement;
}) {
  const language = useSettingsStore((state) => state.language);
  const copy = removeAdsPlacementCtaCopy[language];
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);

  if (!entitlementsReady || !shouldShowAd(placement, resolvedEntitlements)) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.body}>{copy.body(REMOVE_ADS_PRICE_LABEL)}</Text>
      <Link
        accessibilityLabel={copy.accessibilityLabel}
        accessibilityRole="link"
        href="/profile?focus=remove-ads"
        style={styles.link}
      >
        {copy.link}
      </Link>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
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
    lineHeight: typography.body.lineHeight,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  link: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.card,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.5],
    textDecorationLine: 'none',
  },
});
