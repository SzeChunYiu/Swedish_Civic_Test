import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { shouldShowAd } from '../../lib/monetization/ads';
import {
  REMOVE_ADS_PRICE_LABEL,
  buyRemoveAds,
  restoreRemoveAdsPurchase,
} from '../../lib/monetization/purchases';
import type {
  PurchaseRuntimeOptions,
  RemoveAdsPurchaseStatus,
} from '../../lib/monetization/purchases';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { colors, space, typography } from '../../lib/theme';
import type { AdPlacement } from '../../types/monetization';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type PurchaseAction = 'buy' | 'restore';
type PlacementCtaStatus = RemoveAdsPurchaseStatus | 'idle' | 'error';

type RemoveAdsPlacementCtaCopy = {
  body: (price: string) => string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyIdle: (price: string) => string;
  buying: string;
  eyebrow: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreIdle: string;
  restoring: string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<PlacementCtaStatus, string>;
  title: string;
};

const removeAdsPlacementCtaCopy: Record<AppLanguage, RemoveAdsPlacementCtaCopy> = {
  sv: {
    body: (price) => `Engångsköp för ${price}. Övningsprov är redan annonsfria.`,
    buyAccessibilityHint:
      'Köpet tar bort annonser efter butikens bekräftelse och påverkar inte övningsprov.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyIdle: (price) => `Köp ${price}`,
    buying: 'Köper...',
    eyebrow: 'Annonsfri studie',
    restoreAccessibilityHint:
      'Kontrollerar om Ta bort annonser redan har köpts på samma butikskonto.',
    restoreAccessibilityLabel: 'Återställ köp av Ta bort annonser',
    restoreIdle: 'Återställ',
    restoring: 'Återställer...',
    statusAccessibilityLabel: (message) => `Status för Ta bort annonser: ${message}`,
    statusMessages: {
      error: 'Köp är inte tillgängligt just nu. Försök igen senare.',
      idle: 'Döljer annonser på studieskärmar när köpet är bekräftat.',
      not_found: 'Inget tidigare köp hittades.',
      pending: 'Väntar på butikens bekräftelse.',
      purchased: 'Annonser är avstängda på den här enheten.',
      restored: 'Annonser är avstängda på den här enheten.',
    },
    title: 'Ta bort annonser från studieskärmar',
  },
  en: {
    body: (price) => `One-time ${price} purchase. Mock exams are already ad-free.`,
    buyAccessibilityHint:
      'Purchase removes ads after store confirmation and does not affect mock exams.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyIdle: (price) => `Buy ${price}`,
    buying: 'Buying...',
    eyebrow: 'Ad-free study',
    restoreAccessibilityHint:
      'Checks whether Remove Ads was already bought with the same store account.',
    restoreAccessibilityLabel: 'Restore Remove Ads purchase',
    restoreIdle: 'Restore',
    restoring: 'Restoring...',
    statusAccessibilityLabel: (message) => `Remove Ads status: ${message}`,
    statusMessages: {
      error: 'Purchase is unavailable right now. Try again later.',
      idle: 'Hides ads on study screens after the purchase is confirmed.',
      not_found: 'No previous purchase was found.',
      pending: 'Waiting for store confirmation.',
      purchased: 'Ads are disabled on this device.',
      restored: 'Ads are disabled on this device.',
    },
    title: 'Remove ads from study screens',
  },
};

function getStatusMessage(status: PlacementCtaStatus, copy: RemoveAdsPlacementCtaCopy): string {
  return copy.statusMessages[status];
}

/**
 * Defaults: reads the settings language, hides while Remove Ads entitlements
 * are unresolved, and hides after ads are disabled.
 */
export interface RemoveAdsPlacementCtaProps {
  language?: AppLanguage;
  placement: AdPlacement;
  runtimeOptions?: PurchaseRuntimeOptions;
}

export function RemoveAdsPlacementCta({
  language: languageOverride,
  placement,
  runtimeOptions,
}: RemoveAdsPlacementCtaProps) {
  const settingsLanguage = useSettingsStore((state) => state.language);
  const language = languageOverride ?? settingsLanguage;
  const copy = removeAdsPlacementCtaCopy[language];
  const { entitlements, entitlementsReady, purchaseRuntime, setEntitlements } =
    useRemoveAdsEntitlements({ runtimeOptions });
  const [activeAction, setActiveAction] = useState<PurchaseAction | null>(null);
  const [status, setStatus] = useState<PlacementCtaStatus>('idle');

  if (!entitlementsReady || !shouldShowAd(placement, entitlements)) return null;

  const statusMessage = getStatusMessage(status, copy);

  async function runPurchaseAction(action: PurchaseAction) {
    setActiveAction(action);

    try {
      const result =
        action === 'buy'
          ? await buyRemoveAds(purchaseRuntime)
          : await restoreRemoveAdsPurchase(purchaseRuntime);

      setEntitlements(result.entitlements);
      setStatus(result.status);
    } catch {
      setStatus('error');
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Text>
        <Text style={styles.body}>{copy.body(REMOVE_ADS_PRICE_LABEL)}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          accessibilityHint={copy.buyAccessibilityHint}
          accessibilityLabel={copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)}
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null }}
          disabled={activeAction !== null}
          onPress={() => void runPurchaseAction('buy')}
          style={styles.actionButton}
        >
          {activeAction === 'buy' ? copy.buying : copy.buyIdle(REMOVE_ADS_PRICE_LABEL)}
        </Button>
        <Button
          accessibilityHint={copy.restoreAccessibilityHint}
          accessibilityLabel={copy.restoreAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null }}
          disabled={activeAction !== null}
          onPress={() => void runPurchaseAction('restore')}
          style={styles.actionButton}
          variant="secondary"
        >
          {activeAction === 'restore' ? copy.restoring : copy.restoreIdle}
        </Button>
      </View>
      <Text
        aria-live="polite"
        accessibilityLabel={copy.statusAccessibilityLabel(statusMessage)}
        accessibilityLiveRegion="polite"
        style={styles.status}
      >
        {statusMessage}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[1],
  },
  copyBlock: {
    gap: space[0.5],
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
  },
  actionButton: {
    flexGrow: 1,
    minWidth: space[15],
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
