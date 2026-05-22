import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { ProTierEntitlements } from '../../types/monetization';
import {
  createNativePurchaseProvider,
  createSecureStorePurchaseStorage,
  createWebPurchaseStorage,
  type RemoveAdsPurchaseProvider,
} from './purchases';
import { createInstrumentedE2EPurchaseRuntimeOptions } from './e2ePurchaseRuntime';
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

function createUnavailableWebProLifetimePurchaseProvider(): RemoveAdsPurchaseProvider {
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

export function createDefaultProLifetimeRuntimeOptions(): ProLifetimeRuntimeOptions {
  if (Platform.OS !== 'web') {
    return {
      provider: createNativePurchaseProvider({ platform: getNativePurchasePlatform() }),
      storage: createSecureStorePurchaseStorage(),
    };
  }

  const runtime = globalThis as ProLifetimeE2ERuntime;
  const instrumentedRuntimeOptions = createInstrumentedE2EPurchaseRuntimeOptions({
    owned: runtime.__SMT_PRO_LIFETIME_MOCK_OWNED__,
    scope: 'proLifetime',
    storage: createWebPurchaseStorage(),
  });
  if (instrumentedRuntimeOptions) return instrumentedRuntimeOptions;

  return {
    provider: createUnavailableWebProLifetimePurchaseProvider(),
    purchaseUnavailableReason: 'web_store_unavailable',
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
