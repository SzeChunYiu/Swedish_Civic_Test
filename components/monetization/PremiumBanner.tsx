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
import type { PremiumEntitlements } from '../../types/monetization';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, space, typography } from '../../lib/theme';

type PurchaseAction = 'buy' | 'restore';
type PurchaseUiStatus = RemoveAdsPurchaseStatus | 'idle' | 'error';

function getStatusMessage(status: PurchaseUiStatus): string {
  if (status === 'purchased' || status === 'restored') {
    return 'Ads are disabled on this device.';
  }
  if (status === 'pending') {
    return 'Waiting for store confirmation before removing ads.';
  }
  if (status === 'not_found') {
    return 'No previous Remove Ads purchase was found.';
  }
  if (status === 'error') {
    return 'Purchase is unavailable. Try again later.';
  }
  return 'One-time purchase. Restore is available if you already bought it.';
}

export function PremiumBanner({
  entitlements,
  onEntitlementsChange,
  runtimeOptions,
}: {
  entitlements: PremiumEntitlements;
  onEntitlementsChange?: (entitlements: PremiumEntitlements) => void;
  runtimeOptions?: PurchaseRuntimeOptions;
}) {
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

  const statusMessage = getStatusMessage(adsDisabled ? 'purchased' : status);

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
      <Text style={styles.eyebrow}>{adsDisabled ? 'Remove Ads active' : 'Remove Ads'}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {adsDisabled ? 'Ad-free study is active' : 'Remove Ads'}
      </Text>
      <Text style={styles.meta}>
        Free study keeps AdMob ads on. Pay {REMOVE_ADS_PRICE_LABEL} once to remove ads from study
        screens while exams stay ad-free.
      </Text>
      <View style={styles.actions}>
        <Button
          accessibilityLabel="Buy Remove Ads for 29 SEK"
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null || adsDisabled }}
          disabled={activeAction !== null || adsDisabled}
          onPress={() => void runPurchaseAction('buy')}
          style={styles.actionButton}
        >
          {activeAction === 'buy' ? 'Buying...' : `Buy ${REMOVE_ADS_PRICE_LABEL}`}
        </Button>
        <Button
          accessibilityLabel="Restore Remove Ads purchase"
          accessibilityRole="button"
          accessibilityState={{ disabled: activeAction !== null }}
          disabled={activeAction !== null}
          onPress={() => void runPurchaseAction('restore')}
          style={styles.actionButton}
          variant="secondary"
        >
          {activeAction === 'restore' ? 'Restoring...' : 'Restore'}
        </Button>
      </View>
      <Text
        aria-live="polite"
        accessibilityLabel={`Remove Ads status: ${statusMessage}`}
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
