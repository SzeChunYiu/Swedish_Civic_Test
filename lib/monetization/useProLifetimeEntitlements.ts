import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { ProTierEntitlements } from '../../types/monetization';
import { createWebPurchaseStorage, type PurchaseStorage } from './purchases';
import { getProLifetimeEntitlement } from './proLifetimePurchase';

const FREE_PRO_ENTITLEMENTS: ProTierEntitlements = {
  adsDisabled: false,
  unlimitedMockExams: false,
  fullMistakeReview: false,
  spacedRepetition: false,
  nativeLangExplanations: false,
  customStudyPlan: false,
  notesExport: false,
  predictedPassProbability: false,
  confidenceSlider: false,
  multiColorHighlights: false,
};

export function createDefaultProLifetimeRuntimeOptions(): { storage: PurchaseStorage } | undefined {
  if (Platform.OS !== 'web') return undefined;

  return {
    storage: createWebPurchaseStorage(),
  };
}

export function useProLifetimeEntitlements({
  initialEntitlements = FREE_PRO_ENTITLEMENTS,
  runtimeOptions,
}: {
  initialEntitlements?: ProTierEntitlements;
  runtimeOptions?: { storage?: PurchaseStorage };
} = {}) {
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [entitlementsReady, setEntitlementsReady] = useState(false);
  const proRuntime = useMemo(
    () => runtimeOptions ?? createDefaultProLifetimeRuntimeOptions(),
    [runtimeOptions],
  );

  useEffect(() => {
    let isMounted = true;
    setEntitlementsReady(false);

    void getProLifetimeEntitlement(proRuntime)
      .then((storedEntitlements) => {
        if (!isMounted) return;
        setEntitlements(storedEntitlements);
        setEntitlementsReady(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setEntitlements(FREE_PRO_ENTITLEMENTS);
        setEntitlementsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [proRuntime]);

  return {
    entitlements,
    entitlementsReady,
  };
}
