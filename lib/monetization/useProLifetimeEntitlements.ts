import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { ProTierEntitlements } from '../../types/monetization';
import {
  createE2EMockPurchaseProviderOptions,
  createMockPurchaseProvider,
  createNativePurchaseProvider,
  createSecureStorePurchaseStorage,
  createWebPurchaseStorage,
} from './purchases';
import { getProLifetimeEntitlement, type ProLifetimeRuntimeOptions } from './proLifetimePurchase';

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

type ProLifetimeE2ERuntime = typeof globalThis & {
  __SMT_E2E__?: boolean;
  __SMT_PRO_LIFETIME_MOCK_OWNED__?: boolean;
};

function getNativePurchasePlatform() {
  return Platform.OS === 'android' ? 'android' : 'ios';
}

function createE2EWebProLifetimeRuntimeOptions(): ProLifetimeRuntimeOptions | undefined {
  if (Platform.OS !== 'web') return undefined;

  const runtime = globalThis as ProLifetimeE2ERuntime;
  if (!runtime.__SMT_E2E__) return undefined;

  return {
    provider: createMockPurchaseProvider({
      owned: runtime.__SMT_PRO_LIFETIME_MOCK_OWNED__ === true,
      ...createE2EMockPurchaseProviderOptions(),
    }),
    storage: createWebPurchaseStorage(),
  };
}

export function createDefaultProLifetimeRuntimeOptions(): ProLifetimeRuntimeOptions {
  if (Platform.OS !== 'web') {
    return {
      provider: createNativePurchaseProvider({ platform: getNativePurchasePlatform() }),
      storage: createSecureStorePurchaseStorage(),
    };
  }

  const e2eRuntimeOptions = createE2EWebProLifetimeRuntimeOptions();
  if (e2eRuntimeOptions) return e2eRuntimeOptions;

  return {
    storage: createWebPurchaseStorage(),
  };
}

export function useProLifetimeEntitlements({
  initialEntitlements = FREE_PRO_ENTITLEMENTS,
  runtimeOptions,
}: {
  initialEntitlements?: ProTierEntitlements;
  runtimeOptions?: ProLifetimeRuntimeOptions;
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
