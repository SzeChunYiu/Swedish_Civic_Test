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

export function createDefaultPurchaseRuntimeOptions(
  initialAdsDisabled = false,
): PurchaseRuntimeOptions | undefined {
  if (Platform.OS !== 'web') return undefined;

  defaultWebPurchaseRuntimeOptions ??= {
    provider: createMockPurchaseProvider(),
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
  const purchaseRuntime = useMemo(
    () => runtimeOptions ?? createDefaultPurchaseRuntimeOptions(initialEntitlements.adsDisabled),
    [initialEntitlements.adsDisabled, runtimeOptions],
  );
  const applyEntitlements = useCallback((nextEntitlements: PremiumEntitlements) => {
    setCurrentEntitlements(nextEntitlements);
    setEntitlementsReady(true);
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

    if (sharedRemoveAdsEntitlements) {
      applyEntitlements(sharedRemoveAdsEntitlements);
    }

    void getPurchaseEntitlements(purchaseRuntime)
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
          setEntitlementsReady(true);
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
  const { entitlements, entitlementsReady } = useRemoveAdsEntitlements({ initialEntitlements });

  if (explicitEntitlements) {
    return {
      entitlements: explicitEntitlements,
      entitlementsReady: true,
    };
  }

  if (!entitlementsReady) {
    return {
      entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS,
      entitlementsReady: false,
    };
  }

  return {
    entitlements,
    entitlementsReady,
  };
}
