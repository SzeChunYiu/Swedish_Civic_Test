import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { adBannerCopy } from '../../lib/monetization/adCopy';
import { isStrictEntitlementFlag } from '../../lib/monetization/premium';
import {
  REMOVE_ADS_PRICE_LABEL,
  buyRemoveAds,
  restoreRemoveAdsPurchase,
  type RemoveAdsPurchaseStatus,
} from '../../lib/monetization/purchases';
import { useRemoveAdsEntitlements } from '../../lib/monetization/useRemoveAdsEntitlements';
import { useSettingsStore, type AppLanguage } from '../../lib/storage/settingsStore';
import { space, typography, type ThemeColors } from '../../lib/theme';
import { useThemeColors } from '../../lib/theme/ThemeProvider';
import type { AdPlacement } from '../../types/monetization';
import { Button } from '../Button';
import { Card } from '../ui/Card';

type RemoveAdsPlacementCtaCopy = {
  body: string;
  buyAccessibilityHint: string;
  buyAccessibilityLabel: (price: string) => string;
  buyIdle: (price: string) => string;
  buyNativeUnavailable: string;
  buyUnavailable: string;
  buying: string;
  eyebrow: string;
  restoreAccessibilityHint: string;
  restoreAccessibilityLabel: string;
  restoreIdle: string;
  restoreNativeUnavailable: string;
  restoreUnavailable: string;
  restoring: string;
  statusAccessibilityLabel: (message: string) => string;
  statusMessages: Record<PlacementPurchaseStatus, string>;
  title: (placementLabel: string) => string;
  nativeUnavailableAccessibilityHint: string;
  nativeUnavailableBody: (price: string) => string;
  nativeUnavailableStatus: string;
  webUnavailableAccessibilityHint: string;
  webUnavailableBody: (price: string) => string;
};

type ActivePurchaseAction = 'buy' | 'restore';
type PlacementPurchaseStatus = RemoveAdsPurchaseStatus | 'error' | 'unavailable';

const removeAdsPlacementCtaCopy: Record<AppLanguage, RemoveAdsPlacementCtaCopy> = {
  sv: {
    body: 'Döljer den här och andra studieannonser efter butikens bekräftelse. Tidsatta övningsprov är redan annonsfria.',
    buyAccessibilityHint:
      'Köpet döljer den här annonsplaceringen och andra studieannonser på den här enheten.',
    buyAccessibilityLabel: (price) => `Köp Ta bort annonser för ${price}`,
    buyIdle: (price) => `Köp ${price}`,
    buyNativeUnavailable: 'Köp inte tillgängligt',
    buyUnavailable: 'Köp i mobilappen',
    buying: 'Köper...',
    eyebrow: 'Ta bort annonser',
    restoreAccessibilityHint:
      'Kontrollerar butikskontot efter ett tidigare köp av Ta bort annonser.',
    restoreAccessibilityLabel: 'Återställ köp av Ta bort annonser',
    restoreIdle: 'Återställ',
    restoreNativeUnavailable: 'Återställ inte tillgängligt',
    restoreUnavailable: 'Återställ i mobilappen',
    restoring: 'Återställer...',
    statusAccessibilityLabel: (message) => `Status för Ta bort annonser: ${message}`,
    statusMessages: {
      cancelled: 'Köpet avbröts. Ingen betalning drogs och annonser är fortfarande på.',
      error: 'Köp är inte tillgängligt. Försök igen senare.',
      finish_failed:
        'Annonser är avstängda. Butiken kunde inte markera köpet som slutfört, så återställ köpet om det visas igen.',
      not_found: 'Inget tidigare köp av Ta bort annonser hittades.',
      pending: 'Väntar på butikens bekräftelse innan annonser tas bort.',
      persistence_failed:
        'Köpet bekräftades, men annonsfri status kunde inte sparas på den här enheten. Försök återställa köpet.',
      purchased: 'Köpet är bekräftat. Studieannonser tas bort.',
      restored: 'Köpet är återställt. Studieannonser tas bort.',
      unavailable: 'Ta bort annonser kan köpas eller återställas i mobilappen.',
    },
    title: (placementLabel) => `Ta bort annonser vid ${placementLabel.toLowerCase()}`,
    nativeUnavailableAccessibilityHint:
      'Köp är tillfälligt inte tillgängliga eftersom kvittovalidering inte är konfigurerad.',
    nativeUnavailableBody: (price) =>
      `Ta bort annonser för ${price} är tillfälligt inte tillgängligt eftersom kvittovalidering inte är konfigurerad för den här versionen.`,
    nativeUnavailableStatus:
      'Köp är tillfälligt inte tillgängliga eftersom kvittovalidering inte är konfigurerad.',
    webUnavailableAccessibilityHint:
      'Ta bort annonser är ett butiksköp i mobilappen och kan inte köpas från webbversionen.',
    webUnavailableBody: (price) =>
      `Ta bort annonser för ${price} är ett butiksköp i mobilappen. Den här placeringen visar bara status på webben och kan inte starta eller återställa köp.`,
  },
  en: {
    body: 'Hides this and other study ads after store confirmation. Exams are already ad-free.',
    buyAccessibilityHint: 'Purchase hides this ad placement and other study ads on this device.',
    buyAccessibilityLabel: (price) => `Buy Remove Ads for ${price}`,
    buyIdle: (price) => `Buy ${price}`,
    buyNativeUnavailable: 'Buy unavailable',
    buyUnavailable: 'Buy in mobile app',
    buying: 'Buying...',
    eyebrow: 'Remove Ads',
    restoreAccessibilityHint: 'Checks the store account for a previous Remove Ads purchase.',
    restoreAccessibilityLabel: 'Restore Remove Ads purchase',
    restoreIdle: 'Restore',
    restoreNativeUnavailable: 'Restore unavailable',
    restoreUnavailable: 'Restore in mobile app',
    restoring: 'Restoring...',
    statusAccessibilityLabel: (message) => `Remove Ads status: ${message}`,
    statusMessages: {
      cancelled: 'Purchase cancelled. You were not charged and ads are still on.',
      error: 'Purchase is unavailable. Try again later.',
      finish_failed:
        'Ads are disabled. The store could not mark the purchase as finished, so restore the purchase if it appears again.',
      not_found: 'No previous Remove Ads purchase was found.',
      pending: 'Waiting for store confirmation before removing ads.',
      persistence_failed:
        'Purchase was confirmed, but ad-free status could not be saved on this device. Try restoring the purchase.',
      purchased: 'Purchase confirmed. Study ads are being removed.',
      restored: 'Purchase restored. Study ads are being removed.',
      unavailable: 'Remove Ads can be bought or restored in the mobile app.',
    },
    title: (placementLabel) => `Remove ads near ${placementLabel.toLowerCase()}`,
    nativeUnavailableAccessibilityHint:
      'Purchases are temporarily unavailable because receipt validation is not configured.',
    nativeUnavailableBody: (price) =>
      `Remove Ads for ${price} is temporarily unavailable because receipt validation is not configured for this build.`,
    nativeUnavailableStatus:
      'Purchases are temporarily unavailable because receipt validation is not configured.',
    webUnavailableAccessibilityHint:
      'Remove Ads is a mobile app store purchase and cannot be bought from the web version.',
    webUnavailableBody: (price) =>
      `Remove Ads for ${price} is a mobile app store purchase. This placement shows status only on the web and cannot create or restore purchases.`,
  },
};

export function RemoveAdsPlacementCta({ placement }: { placement: AdPlacement }) {
  const language = useSettingsStore((state) => state.language);
  const copy = removeAdsPlacementCtaCopy[language];
  const placementLabel = adBannerCopy[language].placementLabels[placement];
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { entitlements, entitlementsReady, purchaseRuntime, setEntitlements } =
    useRemoveAdsEntitlements();
  const [activeAction, setActiveAction] = useState<ActivePurchaseAction | null>(null);
  const [status, setStatus] = useState<PlacementPurchaseStatus | null>(null);
  const purchaseActionInFlightRef = useRef(false);

  if (!entitlementsReady || isStrictEntitlementFlag(entitlements.adsDisabled)) return null;
  const webPurchaseUnavailable =
    purchaseRuntime?.purchaseUnavailableReason === 'web_store_unavailable';
  const nativePurchaseUnavailable =
    purchaseRuntime?.purchaseUnavailableReason === 'native_receipt_validator_unavailable';
  const purchaseUnavailable = webPurchaseUnavailable || nativePurchaseUnavailable;

  async function runPurchaseAction(
    action: ActivePurchaseAction,
    purchaseAction: typeof buyRemoveAds,
  ) {
    if (purchaseActionInFlightRef.current) return;
    if (purchaseUnavailable) {
      setStatus('unavailable');
      return;
    }

    purchaseActionInFlightRef.current = true;
    setActiveAction(action);
    setStatus(null);

    try {
      const result = await purchaseAction(purchaseRuntime);
      setEntitlements(result.entitlements);
      setStatus(result.status);
    } catch {
      setStatus('error');
    } finally {
      purchaseActionInFlightRef.current = false;
      setActiveAction(null);
    }
  }

  const actionsDisabled = activeAction !== null || purchaseUnavailable;
  const statusMessage = purchaseUnavailable
    ? nativePurchaseUnavailable
      ? copy.nativeUnavailableStatus
      : copy.statusMessages.unavailable
    : status
      ? copy.statusMessages[status]
      : undefined;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title(placementLabel)}
          </Text>
          <Text style={styles.body}>
            {nativePurchaseUnavailable
              ? copy.nativeUnavailableBody(REMOVE_ADS_PRICE_LABEL)
              : webPurchaseUnavailable
                ? copy.webUnavailableBody(REMOVE_ADS_PRICE_LABEL)
                : copy.body}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            accessibilityHint={
              nativePurchaseUnavailable
                ? copy.nativeUnavailableAccessibilityHint
                : webPurchaseUnavailable
                  ? copy.webUnavailableAccessibilityHint
                  : copy.buyAccessibilityHint
            }
            accessibilityLabel={copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)}
            accessibilityRole="button"
            accessibilityState={{ busy: activeAction === 'buy', disabled: actionsDisabled }}
            disabled={actionsDisabled}
            onPress={() => void runPurchaseAction('buy', buyRemoveAds)}
            style={styles.button}
          >
            {activeAction === 'buy'
              ? copy.buying
              : nativePurchaseUnavailable
                ? copy.buyNativeUnavailable
                : webPurchaseUnavailable
                  ? copy.buyUnavailable
                  : copy.buyIdle(REMOVE_ADS_PRICE_LABEL)}
          </Button>
          <Button
            accessibilityHint={
              nativePurchaseUnavailable
                ? copy.nativeUnavailableAccessibilityHint
                : webPurchaseUnavailable
                  ? copy.webUnavailableAccessibilityHint
                  : copy.restoreAccessibilityHint
            }
            accessibilityLabel={copy.restoreAccessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ busy: activeAction === 'restore', disabled: actionsDisabled }}
            disabled={actionsDisabled}
            onPress={() => void runPurchaseAction('restore', restoreRemoveAdsPurchase)}
            style={styles.button}
            variant="secondary"
          >
            {activeAction === 'restore'
              ? copy.restoring
              : nativePurchaseUnavailable
                ? copy.restoreNativeUnavailable
                : webPurchaseUnavailable
                  ? copy.restoreUnavailable
                  : copy.restoreIdle}
          </Button>
        </View>
      </View>
      {statusMessage ? (
        <Text
          aria-live="polite"
          accessibilityLabel={copy.statusAccessibilityLabel(statusMessage)}
          accessibilityLiveRegion="polite"
          style={styles.status}
        >
          {statusMessage}
        </Text>
      ) : null}
    </Card>
  );
}

function createStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
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
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space[1],
      justifyContent: 'flex-end',
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
    body: {
      color: themeColors.textMuted,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.caption.lineHeight,
      marginTop: space[0.5],
    },
    button: {
      minWidth: 128,
    },
    status: {
      color: themeColors.textMuted,
      fontSize: typography.finePrint.fontSize,
      lineHeight: typography.caption.lineHeight,
    },
  });
}
