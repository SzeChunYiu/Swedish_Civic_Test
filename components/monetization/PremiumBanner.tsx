import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  PURCHASE_UNAVAILABLE_REASONS,
  buyRemoveAds,
  restoreRemoveAdsPurchase,
} from '../../lib/monetization/purchases';
import {
  createDefaultPurchaseRuntimeOptions,
  useRemoveAdsPriceLabel,
} from '../../lib/monetization/useRemoveAdsEntitlements';
import type {
  PurchaseRuntimeOptions,
  PurchaseUnavailableReason,
  RemoveAdsPurchaseStatus,
} from '../../lib/monetization/purchases';
import type { AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { Button } from '../Button';

type PurchaseAction = 'buy' | 'restore';
type PurchaseUiStatus = RemoveAdsPurchaseStatus | 'idle' | 'error' | 'unavailable';
type PremiumUnavailableCopy = {
  body: string;
  buyAccessibilityHint: string;
  buyLabel: string;
  restoreAccessibilityHint: string;
  restoreLabel: string;
  statusMessage: string;
};
type PremiumBannerCopy = {
  body: (price: string) => string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyIdle: (price: string) => string;
  buyNativeUnavailable: string;
  buyUnavailable: string;
  buying: string;
  eyebrowActive: string;
  eyebrowIdle: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreIdle: string;
  restoreNativeUnavailable: string;
  restoreUnavailable: string;
  restoring: string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<PurchaseUiStatus, string>;
  titleActive: string;
  titleIdle: string;
  nativeUnavailableAccessibilityHint: string;
  nativeUnavailableBody: (price: string) => string;
  nativeUnavailableStatus: string;
  webUnavailableAccessibilityHint: string;
  webUnavailableBody: (price: string) => string;
};

const premiumBannerCopy: Record<AppLanguage, PremiumBannerCopy> = {
  sv: {
    body: (price) =>
      `Den kostnadsfria versionen visar annonser från AdMob. Betala ${price} en gång för att ta bort annonser från studieskärmar medan tidsatta övningsprov i appen redan är annonsfria.`,
    buyAccessibilityHint:
      'Köpet tar bort annonser efter butikens bekräftelse. Tidsatta övningsprov i appen är redan annonsfria.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyIdle: (price) => `Köp ${price}`,
    buyNativeUnavailable: 'Köp inte tillgängligt',
    buyUnavailable: 'Köp i mobilappen',
    buying: 'Köper...',
    eyebrowActive: 'Annonsfri aktiv',
    eyebrowIdle: 'Ta bort annonser',
    restoreAccessibilityHint:
      'Kontrollerar om Ta bort annonser redan har köpts på samma butikskonto.',
    restoreAccessibilityLabel: 'Återställ köp av Ta bort annonser',
    restoreIdle: 'Återställ',
    restoreNativeUnavailable: 'Återställ inte tillgängligt',
    restoreUnavailable: 'Återställ i mobilappen',
    restoring: 'Återställer...',
    statusAccessibilityLabel: (message) => `Status för Ta bort annonser: ${message}`,
    statusMessages: {
      error: 'Köp är inte tillgängligt. Försök igen senare.',
      finish_failed:
        'Annonser är avstängda. Butiken kunde inte markera köpet som slutfört, så återställ köpet om det visas igen.',
      idle: 'Engångsköp. Återställning finns om du redan har köpt.',
      not_found: 'Inget tidigare köp av Ta bort annonser hittades.',
      pending: 'Väntar på butikens bekräftelse innan annonser tas bort.',
      persistence_failed:
        'Köpet bekräftades, men annonsfri status kunde inte sparas på den här enheten. Försök återställa köpet.',
      purchased: 'Annonser är avstängda på den här enheten.',
      restored: 'Annonser är avstängda på den här enheten.',
      unavailable: 'Ta bort annonser kan köpas eller återställas i mobilappen.',
    },
    titleActive: 'Annonsfri studie är aktiv',
    titleIdle: 'Ta bort annonser',
    nativeUnavailableAccessibilityHint:
      'Köp är tillfälligt inte tillgängliga eftersom kvittovalidering inte är konfigurerad.',
    nativeUnavailableBody: (price) =>
      `Ta bort annonser för ${price} är tillfälligt inte tillgängligt eftersom kvittovalidering inte är konfigurerad för den här versionen.`,
    nativeUnavailableStatus:
      'Köp är tillfälligt inte tillgängliga eftersom kvittovalidering inte är konfigurerad.',
    webUnavailableAccessibilityHint:
      'Ta bort annonser är ett butiksköp i mobilappen och kan inte köpas från webbversionen.',
    webUnavailableBody: (price) =>
      `Ta bort annonser för ${price} är ett butiksköp i mobilappen. Webbversionen visar bara status och kan inte skapa eller återställa köp.`,
  },
  en: {
    body: (price) =>
      `Free study keeps AdMob ads on. Pay ${price} once to remove ads from study screens while exams stay ad-free.`,
    buyAccessibilityHint:
      'Purchase removes ads after store confirmation. Exam mode is already ad-free.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyIdle: (price) => `Buy ${price}`,
    buyNativeUnavailable: 'Buy unavailable',
    buyUnavailable: 'Buy in mobile app',
    buying: 'Buying...',
    eyebrowActive: 'Remove Ads active',
    eyebrowIdle: 'Remove Ads',
    restoreAccessibilityHint:
      'Checks whether Remove Ads was already bought with the same store account.',
    restoreAccessibilityLabel: 'Restore Remove Ads purchase',
    restoreIdle: 'Restore',
    restoreNativeUnavailable: 'Restore unavailable',
    restoreUnavailable: 'Restore in mobile app',
    restoring: 'Restoring...',
    statusAccessibilityLabel: (message) => `Remove Ads status: ${message}`,
    statusMessages: {
      error: 'Purchase is unavailable. Try again later.',
      finish_failed:
        'Ads are disabled. The store could not mark the purchase as finished, so restore the purchase if it appears again.',
      idle: 'One-time purchase. Restore is available if you already bought it.',
      not_found: 'No previous Remove Ads purchase was found.',
      pending: 'Waiting for store confirmation before removing ads.',
      persistence_failed:
        'Purchase was confirmed, but ad-free status could not be saved on this device. Try restoring the purchase.',
      purchased: 'Ads are disabled on this device.',
      restored: 'Ads are disabled on this device.',
      unavailable: 'Remove Ads can be bought or restored in the mobile app.',
    },
    titleActive: 'Ad-free study is active',
    titleIdle: 'Remove Ads',
    nativeUnavailableAccessibilityHint:
      'Purchases are temporarily unavailable because receipt validation is not configured.',
    nativeUnavailableBody: (price) =>
      `Remove Ads for ${price} is temporarily unavailable because receipt validation is not configured for this build.`,
    nativeUnavailableStatus:
      'Purchases are temporarily unavailable because receipt validation is not configured.',
    webUnavailableAccessibilityHint:
      'Remove Ads is a mobile app store purchase and cannot be bought from the web version.',
    webUnavailableBody: (price) =>
      `Remove Ads for ${price} is a mobile app store purchase. The web version shows status only and cannot create or restore purchases.`,
  },
};

function assertNeverPurchaseUnavailableReason(reason: never): never {
  throw new Error(`Unhandled Remove Ads unavailable reason: ${String(reason)}`);
}

function getPremiumUnavailableCopy(
  reason: PurchaseUnavailableReason | undefined,
  copy: PremiumBannerCopy,
  priceLabel: string,
): PremiumUnavailableCopy | undefined {
  switch (reason) {
    case undefined:
      return undefined;
    case PURCHASE_UNAVAILABLE_REASONS.webStoreUnavailable:
      return {
        body: copy.webUnavailableBody(priceLabel),
        buyAccessibilityHint: copy.webUnavailableAccessibilityHint,
        buyLabel: copy.buyUnavailable,
        restoreAccessibilityHint: copy.webUnavailableAccessibilityHint,
        restoreLabel: copy.restoreUnavailable,
        statusMessage: copy.statusMessages.unavailable,
      };
    case PURCHASE_UNAVAILABLE_REASONS.nativeReceiptValidatorUnavailable:
      return {
        body: copy.nativeUnavailableBody(priceLabel),
        buyAccessibilityHint: copy.nativeUnavailableAccessibilityHint,
        buyLabel: copy.buyNativeUnavailable,
        restoreAccessibilityHint: copy.nativeUnavailableAccessibilityHint,
        restoreLabel: copy.restoreNativeUnavailable,
        statusMessage: copy.nativeUnavailableStatus,
      };
    default:
      return assertNeverPurchaseUnavailableReason(reason);
  }
}

function getStatusMessage(status: PurchaseUiStatus, copy: PremiumBannerCopy): string {
  return copy.statusMessages[status];
}

export function PremiumBanner({
  entitlements,
  language = 'sv',
  onEntitlementsChange,
  priceLabel,
  runtimeOptions,
}: {
  entitlements: PremiumEntitlements;
  language?: AppLanguage;
  onEntitlementsChange?: (entitlements: PremiumEntitlements) => void;
  priceLabel?: string;
  runtimeOptions?: PurchaseRuntimeOptions;
}) {
  const copy = premiumBannerCopy[language];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const purchaseRuntime = useMemo<PurchaseRuntimeOptions | undefined>(() => {
    if (runtimeOptions) return runtimeOptions;
    return createDefaultPurchaseRuntimeOptions(entitlements.adsDisabled === true);
  }, [entitlements.adsDisabled, runtimeOptions]);
  const resolvedPriceLabel = useRemoveAdsPriceLabel(purchaseRuntime, priceLabel);
  const [currentEntitlements, setCurrentEntitlements] = useState(entitlements);
  const [activeAction, setActiveAction] = useState<PurchaseAction | null>(null);
  const [status, setStatus] = useState<PurchaseUiStatus>('idle');
  const purchaseActionInFlightRef = useRef(false);
  const adsDisabled = currentEntitlements.adsDisabled === true;
  const unavailableCopy = getPremiumUnavailableCopy(
    purchaseRuntime?.purchaseUnavailableReason,
    copy,
    resolvedPriceLabel,
  );
  const purchaseUnavailable = unavailableCopy !== undefined;
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

  const visibleStatus =
    status === 'finish_failed'
      ? 'finish_failed'
      : adsDisabled
        ? 'purchased'
        : purchaseUnavailable
          ? 'unavailable'
          : status;
  const statusMessage =
    unavailableCopy && visibleStatus === 'unavailable'
      ? unavailableCopy.statusMessage
      : getStatusMessage(visibleStatus, copy);
  const actionsDisabled = activeAction !== null || adsDisabled || purchaseUnavailable;

  async function runPurchaseAction(action: PurchaseAction) {
    if (purchaseActionInFlightRef.current) return;
    if (purchaseUnavailable) {
      setStatus('unavailable');
      return;
    }

    purchaseActionInFlightRef.current = true;
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
      purchaseActionInFlightRef.current = false;
      setActiveAction(null);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>{adsDisabled ? copy.eyebrowActive : copy.eyebrowIdle}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {adsDisabled ? copy.titleActive : copy.titleIdle}
      </Text>
      <Text style={styles.meta}>{unavailableCopy?.body ?? copy.body(resolvedPriceLabel)}</Text>
      <View style={styles.actions}>
        <Button
          accessibilityHint={unavailableCopy?.buyAccessibilityHint ?? copy.buyAccessibilityHint}
          accessibilityLabel={copy.buyAccessibilityLabel(resolvedPriceLabel)}
          accessibilityRole="button"
          accessibilityState={{
            busy: activeAction === 'buy',
            disabled: actionsDisabled,
          }}
          disabled={actionsDisabled}
          onPress={() => void runPurchaseAction('buy')}
          style={styles.actionButton}
        >
          {activeAction === 'buy'
            ? copy.buying
            : (unavailableCopy?.buyLabel ?? copy.buyIdle(resolvedPriceLabel))}
        </Button>
        <Button
          accessibilityHint={
            unavailableCopy?.restoreAccessibilityHint ?? copy.restoreAccessibilityHint
          }
          accessibilityLabel={copy.restoreAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ busy: activeAction === 'restore', disabled: actionsDisabled }}
          disabled={actionsDisabled}
          onPress={() => void runPurchaseAction('restore')}
          style={styles.actionButton}
          variant="secondary"
        >
          {activeAction === 'restore'
            ? copy.restoring
            : (unavailableCopy?.restoreLabel ?? copy.restoreIdle)}
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

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: space[1],
    },
    eyebrow: {
      color: themeColors.badgeBlueText,
      fontSize: typography.badge.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      textTransform: 'uppercase',
    },
    title: {
      color: themeColors.text,
      fontSize: typography.body.fontSize,
      fontWeight: typography.bodyBold.fontWeight,
      marginTop: space[0.5],
    },
    meta: {
      color: themeColors.textMuted,
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
      color: themeColors.textMuted,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
