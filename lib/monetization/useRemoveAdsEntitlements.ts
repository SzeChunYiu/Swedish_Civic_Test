import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { PremiumEntitlements } from '../../types/monetization';
import { FREE_ENTITLEMENTS } from './premium';
import {
  createNativePurchaseProvider,
  createMockPurchaseProvider,
  createSecureStorePurchaseStorage,
  createWebPurchaseStorage,
  getPurchaseEntitlements,
  type PurchaseRuntimeOptions,
  type RemoveAdsPurchaseProvider,
  type RemoveAdsStorePlatform,
} from './purchases';
import { createInstrumentedE2EPurchaseRuntimeOptions } from './e2ePurchaseRuntime';

const AD_BLOCKED_PENDING_ENTITLEMENTS: PremiumEntitlements = {
  ...FREE_ENTITLEMENTS,
  adsDisabled: true,
};

export type RemoveAdsEntitlementStatus = 'loading' | 'ready' | 'read_failed';

type RemoveAdsE2ERuntime = typeof globalThis & {
  __SMT_E2E__?: boolean;
  __SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS?: number;
  __SMT_REMOVE_ADS_MOCK_OWNED__?: boolean;
};

let defaultNativePurchaseRuntimeOptions: PurchaseRuntimeOptions | undefined;
let defaultWebPurchaseRuntimeOptions: PurchaseRuntimeOptions | undefined;
let sharedRemoveAdsEntitlements: PremiumEntitlements | undefined;
let sharedRemoveAdsEntitlementsVersion = 0;
const removeAdsEntitlementListeners = new Set<(entitlements: PremiumEntitlements) => void>();

function publishRemoveAdsEntitlements(entitlements: PremiumEntitlements) {
  const nextEntitlements = { ...entitlements };
  sharedRemoveAdsEntitlements = nextEntitlements;
  sharedRemoveAdsEntitlementsVersion += 1;

  for (const listener of removeAdsEntitlementListeners) {
    listener(nextEntitlements);
  }
}

function subscribeToRemoveAdsEntitlements(listener: (entitlements: PremiumEntitlements) => void) {
  removeAdsEntitlementListeners.add(listener);
  return () => removeAdsEntitlementListeners.delete(listener);
}

function getE2ERemoveAdsEntitlementDelayMs(): number {
  if (Platform.OS !== 'web') return 0;

  const runtime = globalThis as RemoveAdsE2ERuntime;
  if (!runtime.__SMT_E2E__) return 0;

  const delayMs = runtime.__SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS;
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) return 0;
  return Math.min(Math.round(delayMs), 10000);
}

function waitForEntitlementDelay(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function getNativePurchasePlatform(): RemoveAdsStorePlatform {
  return Platform.OS === 'android' ? 'android' : 'ios';
}

function createE2EWebPurchaseRuntimeOptions(
  initialAdsDisabled: boolean,
): PurchaseRuntimeOptions | undefined {
  if (Platform.OS === 'web') {
    const runtime = globalThis as RemoveAdsE2ERuntime;
    if (!runtime.__SMT_E2E__ || typeof runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ !== 'boolean') {
      return undefined;
    }

    const instrumentedRuntimeOptions = createInstrumentedE2EPurchaseRuntimeOptions({
      owned: runtime.__SMT_REMOVE_ADS_MOCK_OWNED__,
      scope: 'removeAds',
      storage: createWebPurchaseStorage(initialAdsDisabled),
    });
    if (instrumentedRuntimeOptions) return instrumentedRuntimeOptions;

    return {
      provider: createMockPurchaseProvider({ owned: runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ }),
      storage: createWebPurchaseStorage(initialAdsDisabled),
    };
  }

  return undefined;
}

function createUnavailableWebPurchaseProvider(): RemoveAdsPurchaseProvider {
  return {
    async connect() {},
    async disconnect() {},
    async validateRemoveAdsReceipt() {
      return { status: 'invalid' };
    },
    async requestRemoveAdsPurchase() {
      return null;
    },
    async restorePurchases() {
      return [];
    },
  };
}

export function createDefaultPurchaseRuntimeOptions(
  initialAdsDisabled = false,
): PurchaseRuntimeOptions {
  if (Platform.OS === 'web') {
    const e2eRuntimeOptions = createE2EWebPurchaseRuntimeOptions(initialAdsDisabled);
    if (e2eRuntimeOptions) return e2eRuntimeOptions;

    defaultWebPurchaseRuntimeOptions ??= {
      provider: createUnavailableWebPurchaseProvider(),
      purchaseUnavailableReason: 'web_store_unavailable',
      storage: createWebPurchaseStorage(false),
    };

    return defaultWebPurchaseRuntimeOptions;
  }

  defaultNativePurchaseRuntimeOptions ??= {
    provider: createNativePurchaseProvider({ platform: getNativePurchasePlatform() }),
    storage: createSecureStorePurchaseStorage(),
  };

  return defaultNativePurchaseRuntimeOptions;
}

export function useRemoveAdsEntitlements({
  initialEntitlements = FREE_ENTITLEMENTS,
  runtimeOptions,
  skipPurchaseRuntime = false,
}: {
  initialEntitlements?: PremiumEntitlements;
  runtimeOptions?: PurchaseRuntimeOptions;
  skipPurchaseRuntime?: boolean;
} = {}) {
  return useRemoveAdsEntitlementsRuntime({
    initialEntitlements,
    purchaseRuntimeEnabled: !skipPurchaseRuntime,
    runtimeOptions,
  });
}

function useRemoveAdsEntitlementsRuntime({
  initialEntitlements,
  purchaseRuntimeEnabled,
  runtimeOptions,
}: {
  initialEntitlements: PremiumEntitlements;
  purchaseRuntimeEnabled: boolean;
  runtimeOptions?: PurchaseRuntimeOptions;
}) {
  const [entitlements, setCurrentEntitlements] = useState(initialEntitlements);
  const [entitlementsReady, setEntitlementsReady] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<RemoveAdsEntitlementStatus>('loading');
  const purchaseRuntime = useMemo<PurchaseRuntimeOptions | undefined>(
    () =>
      purchaseRuntimeEnabled
        ? (runtimeOptions ??
          createDefaultPurchaseRuntimeOptions(initialEntitlements.adsDisabled === true))
        : undefined,
    [initialEntitlements.adsDisabled, purchaseRuntimeEnabled, runtimeOptions],
  );
  const applyEntitlements = useCallback((nextEntitlements: PremiumEntitlements) => {
    setCurrentEntitlements(nextEntitlements);
    setEntitlementsReady(true);
    setEntitlementStatus('ready');
  }, []);
  const setEntitlements = useCallback((nextEntitlements: PremiumEntitlements) => {
    publishRemoveAdsEntitlements(nextEntitlements);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!purchaseRuntimeEnabled || !purchaseRuntime) {
      applyEntitlements(initialEntitlements);
      return () => {
        isMounted = false;
      };
    }

    const loadVersion = sharedRemoveAdsEntitlementsVersion;
    const unsubscribe = subscribeToRemoveAdsEntitlements((nextEntitlements) => {
      if (isMounted) applyEntitlements(nextEntitlements);
    });

    setEntitlementsReady(false);
    setEntitlementStatus('loading');

    if (sharedRemoveAdsEntitlements) {
      applyEntitlements(sharedRemoveAdsEntitlements);
    }

    void getPurchaseEntitlements(purchaseRuntime)
      .then(async (storedEntitlements) => {
        const delayMs = getE2ERemoveAdsEntitlementDelayMs();
        if (delayMs > 0) await waitForEntitlementDelay(delayMs);
        return storedEntitlements;
      })
      .then((storedEntitlements) => {
        if (!isMounted) return;

        if (
          sharedRemoveAdsEntitlementsVersion === loadVersion ||
          sharedRemoveAdsEntitlements === undefined
        ) {
          publishRemoveAdsEntitlements(storedEntitlements);
        } else {
          applyEntitlements(sharedRemoveAdsEntitlements);
        }
      })
      .catch(() => {
        if (!isMounted) return;

        if (sharedRemoveAdsEntitlements) {
          applyEntitlements(sharedRemoveAdsEntitlements);
        } else {
          setCurrentEntitlements(AD_BLOCKED_PENDING_ENTITLEMENTS);
          setEntitlementsReady(false);
          setEntitlementStatus('read_failed');
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applyEntitlements, initialEntitlements, purchaseRuntime, purchaseRuntimeEnabled]);

  return {
    entitlements,
    entitlementsReady,
    entitlementStatus,
    purchaseRuntime,
    setEntitlements,
  };
}

export function useResolvedAdEntitlements(
  explicitEntitlements?: Pick<PremiumEntitlements, 'adsDisabled'>,
) {
  const hasExplicitEntitlements = explicitEntitlements !== undefined;
  const normalizedExplicitEntitlements = useMemo(
    () =>
      explicitEntitlements
        ? {
            ...FREE_ENTITLEMENTS,
            adsDisabled: explicitEntitlements.adsDisabled === true,
          }
        : undefined,
    [explicitEntitlements?.adsDisabled],
  );
  const initialEntitlements = normalizedExplicitEntitlements ?? FREE_ENTITLEMENTS;
  const { entitlements, entitlementsReady, entitlementStatus } = useRemoveAdsEntitlementsRuntime({
    initialEntitlements,
    purchaseRuntimeEnabled: !hasExplicitEntitlements,
  });

  if (hasExplicitEntitlements) {
    return {
      entitlements: normalizedExplicitEntitlements ?? FREE_ENTITLEMENTS,
      entitlementsReady: true,
      entitlementStatus: 'ready' as const,
    };
  }

  if (!entitlementsReady) {
    return {
      entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS,
      entitlementsReady: false,
      entitlementStatus,
    };
  }

  return {
    entitlements,
    entitlementsReady,
    entitlementStatus,
  };
}
