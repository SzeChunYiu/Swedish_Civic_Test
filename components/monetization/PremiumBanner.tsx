import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  REMOVE_ADS_PRICE_LABEL,
  buyRemoveAds,
  restoreRemoveAdsPurchase,
} from '../../lib/monetization/purchases';
import { createDefaultPurchaseRuntimeOptions } from '../../lib/monetization/useRemoveAdsEntitlements';
import type {
  PurchaseRuntimeOptions,
  RemoveAdsPurchaseStatus,
} from '../../lib/monetization/purchases';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, space, typography } from '../../lib/theme';

type PurchaseAction = 'buy' | 'restore';
type PurchaseUiStatus = RemoveAdsPurchaseStatus | 'idle' | 'error';
type PremiumBannerCopy = {
  bodyActive: string;
  bodyIdle: (price: string) => string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyHint: string;
  buyIdle: (price: string) => string;
  buying: string;
  eyebrowActive: string;
  eyebrowIdle: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreHint: string;
  restoreIdle: string;
  restoring: string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<PurchaseUiStatus, string>;
  titleActive: string;
  titleIdle: string;
};

const premiumBannerCopy: Record<AppLanguage, PremiumBannerCopy> = {
  sv: {
    body: (price) =>
      `Hela frågebanken och alla 13 ämnen ingår gratis. Betala ${price} en gång för att ta bort annonser från studieskärmar; provläget är redan annonsfritt.`,
    buyAccessibilityHint:
      'Köpet tar bort annonser efter butikens bekräftelse. Provläget är redan annonsfritt.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyHint: 'Startar ett engångsköp som tar bort annonser från studieskärmar.',
    buyIdle: (price) => `Köp ${price}`,
    buying: 'Köper...',
    eyebrowActive: 'Annonsfri aktiv',
    eyebrowIdle: 'Ta bort annonser',
    restoreAccessibilityHint:
      'Kontrollerar om Ta bort annonser redan har köpts på samma butikskonto.',
    restoreAccessibilityLabel: 'Återställ köp av Ta bort annonser',
    restoreHint: 'Kontrollerar om Ta bort annonser redan har köpts.',
    restoreIdle: 'Återställ',
    restoring: 'Återställer...',
    statusAccessibilityLabel: (message) => `Status för Ta bort annonser: ${message}`,
    statusMessages: {
      error: 'Köp är inte tillgängligt. Försök igen senare.',
      idle: 'Engångsköp. Återställning finns om du redan har köpt.',
      not_found: 'Inget tidigare köp av Ta bort annonser hittades.',
      pending: 'Väntar på butikens bekräftelse innan annonser tas bort.',
      purchased: 'Köpet är bekräftat. Annonser är avstängda på den här enheten.',
      restored: 'Köpet är återställt. Annonser är avstängda på den här enheten.',
    },
    titleActive: 'Annonsfri studie är aktiv',
    titleIdle: 'Ta bort annonser',
  },
  en: {
    body: (price) =>
      `The full question bank and all 13 topics are free. Pay ${price} once to remove ads from study screens; exams stay ad-free.`,
    buyAccessibilityHint:
      'Purchase removes ads after store confirmation. Exam mode is already ad-free.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyHint: 'Starts a one-time purchase that removes ads from study screens.',
    buyIdle: (price) => `Buy ${price}`,
    buying: 'Buying...',
    eyebrowActive: 'Remove Ads active',
    eyebrowIdle: 'Remove Ads',
    restoreAccessibilityHint:
      'Checks whether Remove Ads was already bought with the same store account.',
    restoreAccessibilityLabel: 'Restore Remove Ads purchase',
    restoreHint: 'Checks whether Remove Ads has already been purchased.',
    restoreIdle: 'Restore',
    restoring: 'Restoring...',
    statusAccessibilityLabel: (message) => `Remove Ads status: ${message}`,
    statusMessages: {
      error: 'Purchase is unavailable. Try again later.',
      idle: 'One-time purchase. Restore is available if you already bought it.',
      not_found: 'No previous Remove Ads purchase was found.',
      pending: 'Waiting for store confirmation before removing ads.',
      purchased: 'Purchase confirmed. Ads are disabled on this device.',
      restored: 'Purchase restored. Ads are disabled on this device.',
    },
    titleActive: 'Ad-free study is active',
    titleIdle: 'Remove Ads',
  },
};

function getStatusMessage(status: PurchaseUiStatus, copy: PremiumBannerCopy): string {
  return copy.statusMessages[status];
}

/**
 * Defaults: Swedish copy, local purchase runtime derived from the current
 * `adsDisabled` entitlement, and visible Buy/Restore actions.
 */
export interface PremiumBannerProps {
  entitlements: PremiumEntitlements;
  language?: AppLanguage;
  onEntitlementsChange?: (entitlements: PremiumEntitlements) => void;
  runtimeOptions?: PurchaseRuntimeOptions;
}

export function PremiumBanner({
  entitlements,
  language = 'sv',
  onEntitlementsChange,
  runtimeOptions,
}: PremiumBannerProps) {
  const copy = premiumBannerCopy[language];
  const purchaseRuntime = useMemo<PurchaseRuntimeOptions | undefined>(() => {
    if (runtimeOptions) return runtimeOptions;
    return createDefaultPurchaseRuntimeOptions(entitlements.adsDisabled);
  }, [entitlements.adsDisabled, runtimeOptions]);
  const [currentEntitlements, setCurrentEntitlements] = useState(entitlements);
  const [activeAction, setActiveAction] = useState<PurchaseAction | null>(null);
  const [status, setStatus] = useState<PurchaseUiStatus>('idle');
  const adsDisabled = currentEntitlements.adsDisabled;
  const updateEntitlements = useCallback(
    (nextEntitlements: PremiumEntitlements) => {
      setCurrentEntitlements(nextEntitlements);
      onEntitlementsChange?.(nextEntitlements);
    },
    [onEntitlementsChange],
  );

  useEffect(() => {
    setCurrentEntitlements(entitlements);
  }, [entitlements]);

  const statusMessage = getStatusMessage(getVisibleStatus(adsDisabled, status), copy);

  async function runPurchaseAction(action: PurchaseAction) {
    setActiveAction(action);

    try {
      const result =
        action === 'buy'
          ? await buyRemoveAds(purchaseRuntime)
          : await restoreRemoveAdsPurchase(purchaseRuntime);

      updateEntitlements(result.entitlements);
      setStatus(result.status);
    } catch {
      setStatus('error');
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>{adsDisabled ? copy.eyebrowActive : copy.eyebrowIdle}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {adsDisabled ? copy.titleActive : copy.titleIdle}
      </Text>
      <Text style={styles.meta}>
        {adsDisabled ? copy.bodyActive : copy.bodyIdle(REMOVE_ADS_PRICE_LABEL)}
      </Text>
      <View style={styles.actions}>
        {!adsDisabled ? (
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
        ) : null}
        <Button
          accessibilityHint={copy.buyHint}
          accessibilityLabel={copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)}
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null || adsDisabled }}
          disabled={activeAction !== null || adsDisabled}
          onPress={() => void runPurchaseAction('buy')}
          style={styles.actionButton}
        >
          {activeAction === 'buy' ? copy.buying : copy.buyIdle(REMOVE_ADS_PRICE_LABEL)}
        </Button>
        <Button
          accessibilityHint={copy.restoreHint}
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    marginTop: space[0.5],
  },
  actionButton: {
    minWidth: space[15],
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
