import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adBannerCopy } from '../../lib/monetization/adCopy';
import { shouldShowAd } from '../../lib/monetization/ads';
import { REMOVE_ADS_PRICE_LABEL } from '../../lib/monetization/purchases';
import { useResolvedAdEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, motion, radius, space, typography } from '../../lib/theme';
import type { AdPlacement, PremiumEntitlements } from '../../types/monetization';

type RemoveAdsPlacementCtaCopy = {
  action: string;
  accessibilityLabel: (placementLabel: string, price: string) => string;
  body: (price: string) => string;
  eyebrow: string;
};

const removeAdsPlacementCtaCopy: Record<AppLanguage, RemoveAdsPlacementCtaCopy> = {
  sv: {
    action: 'Öppna Ta bort annonser',
    accessibilityLabel: (placementLabel, price) =>
      `Ta bort annonser för ${price}. Öppna köp och återställning för att dölja ${placementLabel}.`,
    body: (price) => `Engångsköp ${price}. Köp eller återställ på profilen.`,
    eyebrow: 'Vill du slippa annonsen?',
  },
  en: {
    action: 'Open Remove Ads',
    accessibilityLabel: (placementLabel, price) =>
      `Remove Ads for ${price}. Open buy and restore options to hide ${placementLabel}.`,
    body: (price) => `One-time ${price} purchase. Buy or restore on Profile.`,
    eyebrow: 'Want to skip this ad?',
  },
};

/**
 * Defaults: renders a compact localized Remove Ads paywall link for a visible
 * non-exam ad placement, and hides itself when Remove Ads is active.
 */
export interface RemoveAdsPlacementCtaProps {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  placement: AdPlacement;
}

export function RemoveAdsPlacementCta({ entitlements, placement }: RemoveAdsPlacementCtaProps) {
  const [isPressed, setIsPressed] = useState(false);
  const language = useSettingsStore((state) => state.language);
  const copy = removeAdsPlacementCtaCopy[language];
  const adCopy = adBannerCopy[language];
  const { entitlements: resolvedEntitlements, entitlementsReady } =
    useResolvedAdEntitlements(entitlements);

  if (!entitlementsReady || !shouldShowAd(placement, resolvedEntitlements)) return null;

  const placementLabel = adCopy.placementLabels[placement];

  return (
    <View style={styles.card}>
      <View style={styles.copyColumn}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.body}>{copy.body(REMOVE_ADS_PRICE_LABEL)}</Text>
      </View>
      <Link
        accessibilityLabel={copy.accessibilityLabel(placementLabel, REMOVE_ADS_PRICE_LABEL)}
        accessibilityRole="link"
        href="/profile"
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[styles.link, isPressed ? styles.linkPressed : null]}
      >
        {copy.action}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    justifyContent: 'space-between',
    padding: space[1.5],
  },
  copyColumn: {
    flex: 1,
    gap: space[0.5],
    minWidth: space[15],
  },
  eyebrow: {
    color: colors.badgeBlueText,
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
    letterSpacing: typography.badge.letterSpacing,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  link: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderRadius: radius.card,
    borderWidth: space.hairline,
    color: colors.surface,
    fontSize: typography.navButton.fontSize,
    fontWeight: typography.navButton.fontWeight,
    justifyContent: 'center',
    lineHeight: typography.navButton.lineHeight,
    minHeight: space[6],
    paddingHorizontal: space[2],
    paddingVertical: space[1.25],
    textAlign: 'center',
    textDecorationLine: 'none',
  },
  linkPressed: {
    backgroundColor: colors.accentActive,
    borderColor: colors.accentActive,
    transform: [{ scale: motion.pressedScale }],
  },
});
