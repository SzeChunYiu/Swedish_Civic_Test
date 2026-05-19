import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adBannerCopy } from '../../lib/monetization/adCopy';
import {
  REMOVE_ADS_PRICE_LABEL,
  buyRemoveAds,
  type RemoveAdsPurchaseStatus,
} from '../../lib/monetization/purchases';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import type { AdPlacement } from '../../types/monetization';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type RemoveAdsPlacementCtaCopy = {
  body: string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyIdle: (price: string) => string;
  buying: string;
  eyebrow: string;
  statusMessages: Partial<Record<RemoveAdsPurchaseStatus | 'error', string>>;
  title: (placementLabel: string) => string;
};

const removeAdsPlacementCtaCopy: Record<AppLanguage, RemoveAdsPlacementCtaCopy> = {
  sv: {
    body: 'Döljer den här och andra studieannonser efter butikens bekräftelse. Tidsatta övningsprov är redan annonsfria.',
    buyAccessibilityHint:
      'Köpet döljer den här annonsplaceringen och andra studieannonser på den här enheten.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyIdle: (price) => `Köp ${price}`,
    buying: 'Köper...',
    eyebrow: 'Ta bort annonser',
    statusMessages: {
      error: 'Köp är inte tillgängligt. Försök igen senare.',
      not_found: 'Inget tidigare köp av Ta bort annonser hittades.',
      pending: 'Väntar på butikens bekräftelse innan annonser tas bort.',
    },
    title: (placementLabel) => `Ta bort annonser vid ${placementLabel.toLowerCase()}`,
  },
  en: {
    body: 'Hides this and other study ads after store confirmation. Exams are already ad-free.',
    buyAccessibilityHint: 'Purchase hides this ad placement and other study ads on this device.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyIdle: (price) => `Buy ${price}`,
    buying: 'Buying...',
    eyebrow: 'Remove Ads',
    statusMessages: {
      error: 'Purchase is unavailable. Try again later.',
      not_found: 'No previous Remove Ads purchase was found.',
      pending: 'Waiting for store confirmation before removing ads.',
    },
    title: (placementLabel) => `Remove ads near ${placementLabel.toLowerCase()}`,
  },
};

export function RemoveAdsPlacementCta({ placement }: { placement: AdPlacement }) {
  const language = useSettingsStore((state) => state.language);
  const copy = removeAdsPlacementCtaCopy[language];
  const placementLabel = adBannerCopy[language].placementLabels[placement];
  const { entitlements, entitlementsReady, purchaseRuntime, setEntitlements } =
    useRemoveAdsEntitlements();
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<RemoveAdsPurchaseStatus | 'error' | null>(null);

  if (!entitlementsReady || entitlements.adsDisabled) return null;

  async function handleBuy() {
    setActive(true);
    setStatus(null);

    try {
      const result = await buyRemoveAds(purchaseRuntime);
      setEntitlements(result.entitlements);
      setStatus(result.entitlements.adsDisabled ? null : result.status);
    } catch {
      setStatus('error');
    } finally {
      setActive(false);
    }
  }

  const statusMessage = status ? copy.statusMessages[status] : undefined;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title(placementLabel)}
          </Text>
          <Text style={styles.body}>{copy.body}</Text>
        </View>
        <Button
          accessibilityHint={copy.buyAccessibilityHint}
          accessibilityLabel={copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)}
          accessibilityRole="button"
          accessibilityState={{ busy: active, disabled: active }}
          disabled={active}
          onPress={() => void handleBuy()}
          style={styles.button}
        >
          {active ? copy.buying : copy.buyIdle(REMOVE_ADS_PRICE_LABEL)}
        </Button>
      </View>
      {statusMessage ? (
        <Text aria-live="polite" accessibilityLiveRegion="polite" style={styles.status}>
          {statusMessage}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
  },
  copy: {
    flex: 1,
    minWidth: 180,
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
    marginTop: space[0.5],
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: space[0.5],
  },
  button: {
    minWidth: 128,
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
