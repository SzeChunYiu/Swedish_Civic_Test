import { Platform } from 'react-native';

import type {
  PurchaseRuntimeOptions,
  PurchaseStorage,
  RemoveAdsPurchaseProvider,
  RemoveAdsPurchaseRecord,
} from './purchases';

type E2EPurchaseScope = 'proLifetime' | 'removeAds';
type E2EPurchaseAction = 'buy' | 'restore';
type E2EPurchaseRuntime = typeof globalThis & {
  __SMT_E2E__?: boolean;
  __SMT_PRO_LIFETIME_MOCK_OWNED__?: boolean;
  __SMT_PURCHASE_INFLIGHT_CALLS__?: Partial<
    Record<`${E2EPurchaseScope}.${E2EPurchaseAction}`, number>
  >;
  __SMT_PURCHASE_INFLIGHT_DELAY_MS?: number;
  __SMT_REMOVE_ADS_MOCK_OWNED__?: boolean;
};

type E2EPurchaseRuntimeOptions = PurchaseRuntimeOptions & {
  provider: RemoveAdsPurchaseProvider;
  storage: PurchaseStorage;
};

function getE2EDelayMs(runtime: E2EPurchaseRuntime): number {
  const delayMs = runtime.__SMT_PURCHASE_INFLIGHT_DELAY_MS;
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) return 0;
  return Math.min(Math.round(delayMs), 10000);
}

function waitForE2EDelay(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function recordE2EPurchaseCall(
  runtime: E2EPurchaseRuntime,
  scope: E2EPurchaseScope,
  action: E2EPurchaseAction,
) {
  const calls = (runtime.__SMT_PURCHASE_INFLIGHT_CALLS__ ??= {});
  const key = `${scope}.${action}` as const;
  calls[key] = (calls[key] ?? 0) + 1;
}

function createE2EPurchase(productId: string, action: E2EPurchaseAction): RemoveAdsPurchaseRecord {
  const normalizedProductId = productId.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const transactionId = `${action}-${normalizedProductId}`;

  return {
    productId,
    purchaseToken: `mock-token-${transactionId}`,
    raw: { ids: [productId] },
    transactionId,
  };
}

export function createInstrumentedE2EPurchaseRuntimeOptions({
  owned,
  scope,
  storage,
}: {
  owned: boolean | undefined;
  scope: E2EPurchaseScope;
  storage: PurchaseStorage;
}): E2EPurchaseRuntimeOptions | undefined {
  if (Platform.OS !== 'web') return undefined;

  const runtime = globalThis as E2EPurchaseRuntime;
  if (!runtime.__SMT_E2E__ || typeof owned !== 'boolean') return undefined;

  const ownedProductIds = new Set<string>();
  const delayMs = getE2EDelayMs(runtime);

  return {
    provider: {
      async connect() {},
      async disconnect() {},
      async finishPurchase() {},
      async validateRemoveAdsReceipt(purchase, productId) {
        if (purchase.productId !== productId) return { status: 'invalid' };
        return {
          productId,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'valid',
          transactionId: purchase.transactionId ?? null,
          validatedAt: new Date().toISOString(),
        };
      },
      async requestRemoveAdsPurchase(productId) {
        recordE2EPurchaseCall(runtime, scope, 'buy');
        await waitForE2EDelay(delayMs);
        ownedProductIds.add(productId);
        return createE2EPurchase(productId, 'buy');
      },
      async restorePurchases(productIds) {
        recordE2EPurchaseCall(runtime, scope, 'restore');
        await waitForE2EDelay(delayMs);
        const productId = productIds[0];
        if (!productId || (!owned && !ownedProductIds.has(productId))) return [];
        return [createE2EPurchase(productId, 'restore')];
      },
    },
    storage,
  };
}
