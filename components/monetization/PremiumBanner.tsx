import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  REMOVE_ADS_PRICE_LABEL,
  buyRemoveAds,
  restoreRemoveAdsPurchase,
} from '../../lib/monetization/purchases';
import {
  createDefaultPurchaseRuntimeOptions,
  type RemoveAdsEntitlementStatus,
} from '../../lib/monetization/useRemoveAdsEntitlements';
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
type PurchaseUiStatus = RemoveAdsPurchaseStatus | 'idle' | 'error' | RemoveAdsEntitlementStatus;
type PremiumBannerCopy = {
  body: (price: string) => string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyIdle: (price: string) => string;
  buying: string;
  eyebrowActive: string;
  eyebrowChecking: string;
  eyebrowIdle: string;
  eyebrowReadFailed: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreIdle: string;
  restoring: string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<PurchaseUiStatus, string>;
  titleActive: string;
  titleChecking: string;
  titleIdle: string;
  titleReadFailed: string;
};

const premiumBannerCopy: Record<AppLanguage, PremiumBannerCopy> = {
  sv: {
    body: (price) =>
      `Gratisstudier visar AdMob-annonser. Betala ${price} en gång för att ta bort annonser från studieskärmar medan prov förblir annonsfria.`,
    buyAccessibilityHint:
      'Köpet tar bort annonser efter butikens bekräftelse. Provläget är redan annonsfritt.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyIdle: (price) => `Köp ${price}`,
    buying: 'Köper...',
    eyebrowActive: 'Annonsfri aktiv',
    eyebrowChecking: 'Kontrollerar köp',
    eyebrowIdle: 'Ta bort annonser',
    eyebrowReadFailed: 'Kontroll behövs',
    restoreAccessibilityHint:
      'Kontrollerar om Ta bort annonser redan har köpts på samma butikskonto.',
    restoreAccessibilityLabel: 'Återställ köp av Ta bort annonser',
    restoreIdle: 'Återställ',
    restoring: 'Återställer...',
    statusAccessibilityLabel: (message) => `Status för Ta bort annonser: ${message}`,
    statusMessages: {
      error: 'Köp är inte tillgängligt. Försök igen senare.',
      idle: 'Engångsköp. Återställning finns om du redan har köpt.',
      loading: 'Kontrollerar om Ta bort annonser redan är aktivt.',
      not_found: 'Inget tidigare köp av Ta bort annonser hittades.',
      pending: 'Väntar på butikens bekräftelse innan annonser tas bort.',
      purchased: 'Annonser är avstängda på den här enheten.',
      ready: 'Engångsköp. Återställning finns om du redan har köpt.',
      read_failed:
        'Köpet kunde inte kontrolleras. Annonser hålls avstängda här tills du återställer eller försöker igen.',
      restored: 'Annonser är avstängda på den här enheten.',
    },
    titleActive: 'Annonsfri studie är aktiv',
    titleChecking: 'Kontrollerar Ta bort annonser',
    titleIdle: 'Ta bort annonser',
    titleReadFailed: 'Återställ köp för att bekräfta Ta bort annonser',
  },
  en: {
    body: (price) =>
      `Free study keeps AdMob ads on. Pay ${price} once to remove ads from study screens while exams stay ad-free.`,
    buyAccessibilityHint:
      'Purchase removes ads after store confirmation. Exam mode is already ad-free.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyIdle: (price) => `Buy ${price}`,
    buying: 'Buying...',
    eyebrowActive: 'Remove Ads active',
    eyebrowChecking: 'Checking purchase',
    eyebrowIdle: 'Remove Ads',
    eyebrowReadFailed: 'Check needed',
    restoreAccessibilityHint:
      'Checks whether Remove Ads was already bought with the same store account.',
    restoreAccessibilityLabel: 'Restore Remove Ads purchase',
    restoreIdle: 'Restore',
    restoring: 'Restoring...',
    statusAccessibilityLabel: (message) => `Remove Ads status: ${message}`,
    statusMessages: {
      error: 'Purchase is unavailable. Try again later.',
      idle: 'One-time purchase. Restore is available if you already bought it.',
      loading: 'Checking whether Remove Ads is already active.',
      not_found: 'No previous Remove Ads purchase was found.',
      pending: 'Waiting for store confirmation before removing ads.',
      purchased: 'Ads are disabled on this device.',
      ready: 'One-time purchase. Restore is available if you already bought it.',
      read_failed:
        'Purchase state could not be checked. Ads stay suppressed here until you restore or try again.',
      restored: 'Ads are disabled on this device.',
    },
    titleActive: 'Ad-free study is active',
    titleChecking: 'Checking Remove Ads',
    titleIdle: 'Remove Ads',
    titleReadFailed: 'Restore purchase to confirm Remove Ads',
  },
};

function getStatusMessage(status: PurchaseUiStatus, copy: PremiumBannerCopy): string {
  return copy.statusMessages[status];
}

export function PremiumBanner({
  entitlements,
  entitlementStatus = 'ready',
  language = 'sv',
  onEntitlementsChange,
  runtimeOptions,
}: {
  entitlements: PremiumEntitlements;
  entitlementStatus?: RemoveAdsEntitlementStatus;
  language?: AppLanguage;
  onEntitlementsChange?: (entitlements: PremiumEntitlements) => void;
  runtimeOptions?: PurchaseRuntimeOptions;
}) {
  const copy = premiumBannerCopy[language];
  const purchaseRuntime = useMemo<PurchaseRuntimeOptions | undefined>(() => {
    if (runtimeOptions) return runtimeOptions;
    return createDefaultPurchaseRuntimeOptions(entitlements.adsDisabled);
  }, [entitlements.adsDisabled, runtimeOptions]);
  const [currentEntitlements, setCurrentEntitlements] = useState(entitlements);
  const [activeAction, setActiveAction] = useState<PurchaseAction | null>(null);
  const [status, setStatus] = useState<PurchaseUiStatus>('idle');
  const entitlementStateUnresolved =
    entitlementStatus === 'loading' || entitlementStatus === 'read_failed';
  const confirmedAdsDisabled = currentEntitlements.adsDisabled && entitlementStatus === 'ready';
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

  const statusMessage = getStatusMessage(
    entitlementStateUnresolved ? entitlementStatus : confirmedAdsDisabled ? 'purchased' : status,
    copy,
  );
  const eyebrow = confirmedAdsDisabled
    ? copy.eyebrowActive
    : entitlementStatus === 'loading'
      ? copy.eyebrowChecking
      : entitlementStatus === 'read_failed'
        ? copy.eyebrowReadFailed
        : copy.eyebrowIdle;
  const title = confirmedAdsDisabled
    ? copy.titleActive
    : entitlementStatus === 'loading'
      ? copy.titleChecking
      : entitlementStatus === 'read_failed'
        ? copy.titleReadFailed
        : copy.titleIdle;

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
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.meta}>{copy.body(REMOVE_ADS_PRICE_LABEL)}</Text>
      <View style={styles.actions}>
        <Button
          accessibilityHint={copy.buyAccessibilityHint}
          accessibilityLabel={copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)}
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null || confirmedAdsDisabled }}
          disabled={activeAction !== null || confirmedAdsDisabled}
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
    minWidth: 128,
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.finePrint.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});
