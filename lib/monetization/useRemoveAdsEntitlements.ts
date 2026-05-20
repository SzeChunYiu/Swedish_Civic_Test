import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { PremiumEntitlements } from '../../types/monetization';
import { FREE_ENTITLEMENTS } from './premium';
import {
  createMockPurchaseProvider,
  createWebPurchaseStorage,
  getPurchaseEntitlements,
  type PurchaseRuntimeOptions,
} from './purchases';

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

function getE2ERemoveAdsMockOwned(): boolean {
  if (Platform.OS !== 'web') return false;

  const runtime = globalThis as RemoveAdsE2ERuntime;
  return runtime.__SMT_E2E__ === true && runtime.__SMT_REMOVE_ADS_MOCK_OWNED__ === true;
}

export function createDefaultPurchaseRuntimeOptions(
  initialAdsDisabled = false,
): PurchaseRuntimeOptions | undefined {
  if (Platform.OS !== 'web') return undefined;

  defaultWebPurchaseRuntimeOptions ??= {
    provider: createMockPurchaseProvider({ owned: getE2ERemoveAdsMockOwned() }),
    storage: createWebPurchaseStorage(initialAdsDisabled),
  };

  return defaultWebPurchaseRuntimeOptions;
}

export function useRemoveAdsEntitlements({
  initialEntitlements = FREE_ENTITLEMENTS,
  runtimeOptions,
}: {
  initialEntitlements?: PremiumEntitlements;
  runtimeOptions?: PurchaseRuntimeOptions;
} = {}) {
  const [entitlements, setCurrentEntitlements] = useState(initialEntitlements);
  const [entitlementsReady, setEntitlementsReady] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<RemoveAdsEntitlementStatus>('loading');
  const purchaseRuntime = useMemo(
    () => runtimeOptions ?? createDefaultPurchaseRuntimeOptions(initialEntitlements.adsDisabled),
    [initialEntitlements.adsDisabled, runtimeOptions],
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
  }, [applyEntitlements, purchaseRuntime]);

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
  const initialEntitlements = useMemo(
    () => ({
      ...FREE_ENTITLEMENTS,
      adsDisabled: explicitEntitlements?.adsDisabled ?? FREE_ENTITLEMENTS.adsDisabled,
    }),
    [explicitEntitlements?.adsDisabled],
  );
  const { entitlements, entitlementsReady, entitlementStatus } = useRemoveAdsEntitlements({
    initialEntitlements,
  });

  if (explicitEntitlements) {
    return {
      entitlements: explicitEntitlements,
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
