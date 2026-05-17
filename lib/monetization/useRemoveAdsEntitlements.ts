import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { PremiumEntitlements } from '../../types/monetization';
import { FREE_ENTITLEMENTS } from './premium';
import {
  createMemoryPurchaseStorage,
  createMockPurchaseProvider,
  getPurchaseEntitlements,
  type PurchaseRuntimeOptions,
} from './purchases';

const AD_BLOCKED_PENDING_ENTITLEMENTS: PremiumEntitlements = {
  ...FREE_ENTITLEMENTS,
  adsDisabled: true,
};

let defaultWebPurchaseRuntimeOptions: PurchaseRuntimeOptions | undefined;

export function createDefaultPurchaseRuntimeOptions(
  initialAdsDisabled = false,
): PurchaseRuntimeOptions | undefined {
  if (Platform.OS !== 'web') return undefined;

  defaultWebPurchaseRuntimeOptions ??= {
    provider: createMockPurchaseProvider(),
    storage: createMemoryPurchaseStorage(initialAdsDisabled),
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
  const setEntitlements = useCallback((nextEntitlements: PremiumEntitlements) => {
    setCurrentEntitlements(nextEntitlements);
    setEntitlementsReady(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setEntitlementsReady(false);

    void getPurchaseEntitlements(purchaseRuntime)
      .then((storedEntitlements) => {
        if (isMounted) setEntitlements(storedEntitlements);
      })
      .catch(() => {
        if (isMounted) setEntitlementsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [purchaseRuntime, setEntitlements]);

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
