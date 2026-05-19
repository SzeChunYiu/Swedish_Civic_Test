import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { PremiumEntitlements } from '../../types/monetization';
import type { AdConsentDecision } from './consent';
import { FREE_ENTITLEMENTS } from './premium';
import type { PurchaseRuntimeOptions } from './purchases';
import {
  consumeStoredRewardedExtraExamCredit,
  createSecureStoreMockExamAccessStorage,
  createWebMockExamAccessStorage,
  FREE_MOCK_EXAM_DAILY_LIMIT,
  getMockExamAccessDecision,
  getStoredMockExamAccess,
  grantStoredRewardedExtraExamCredit,
  recordStoredMockExamCompletion,
  type MockExamAccessDecision,
  type MockExamAccessStorage,
  type StoredMockExamAccessSnapshot,
} from './rewardedExam';
import { useRemoveAdsEntitlements } from './useRemoveAdsEntitlements';

const EMPTY_ACCESS_SNAPSHOT: StoredMockExamAccessSnapshot = {
  completedMockExamsByDate: {},
  completedMockExamsToday: 0,
  dateKey: '',
  rewardedExtraExamCredits: 0,
};

function createDefaultMockExamAccessStorage(): MockExamAccessStorage {
  return Platform.OS === 'web'
    ? createWebMockExamAccessStorage()
    : createSecureStoreMockExamAccessStorage();
}

function buildAccessDecision({
  consentDecision,
  entitlements,
  freeMockExamLimit,
  snapshot,
}: {
  consentDecision?: Pick<AdConsentDecision, 'adServingAllowed'>;
  entitlements: PremiumEntitlements;
  freeMockExamLimit: number;
  snapshot: StoredMockExamAccessSnapshot;
}): MockExamAccessDecision {
  return getMockExamAccessDecision({
    completedMockExamsToday: snapshot.completedMockExamsToday,
    consentDecision,
    entitlements,
    freeMockExamLimit,
    rewardedExtraExamCredits: snapshot.rewardedExtraExamCredits,
  });
}

export function useMockExamAccess({
  consentDecision,
  freeMockExamLimit = FREE_MOCK_EXAM_DAILY_LIMIT,
  initialEntitlements = FREE_ENTITLEMENTS,
  purchaseRuntimeOptions,
  storage: providedStorage,
}: {
  consentDecision?: Pick<AdConsentDecision, 'adServingAllowed'>;
  freeMockExamLimit?: number;
  initialEntitlements?: PremiumEntitlements;
  purchaseRuntimeOptions?: PurchaseRuntimeOptions;
  storage?: MockExamAccessStorage;
} = {}) {
  const storage = useMemo(
    () => providedStorage ?? createDefaultMockExamAccessStorage(),
    [providedStorage],
  );
  const { entitlements, entitlementsReady, purchaseRuntime, setEntitlements } =
    useRemoveAdsEntitlements({
      initialEntitlements,
      runtimeOptions: purchaseRuntimeOptions,
    });
  const [accessReady, setAccessReady] = useState(false);
  const [snapshot, setSnapshot] = useState<StoredMockExamAccessSnapshot>(EMPTY_ACCESS_SNAPSHOT);

  const refreshAccess = useCallback(async () => {
    const nextSnapshot = await getStoredMockExamAccess({ storage });
    setSnapshot(nextSnapshot);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  useEffect(() => {
    let isMounted = true;
    setAccessReady(false);

    void getStoredMockExamAccess({ storage })
      .then((nextSnapshot) => {
        if (!isMounted) return;
        setSnapshot(nextSnapshot);
        setAccessReady(true);
      })
      .catch(() => {
        if (isMounted) setAccessReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [storage]);

  const accessDecision = useMemo(
    () =>
      buildAccessDecision({
        consentDecision,
        entitlements,
        freeMockExamLimit,
        snapshot,
      }),
    [
      consentDecision,
      entitlements,
      freeMockExamLimit,
      snapshot.completedMockExamsToday,
      snapshot.rewardedExtraExamCredits,
    ],
  );

  const recordExamCompletion = useCallback(async () => {
    const nextSnapshot = await recordStoredMockExamCompletion({ storage });
    setSnapshot(nextSnapshot);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  const grantRewardedExamCredit = useCallback(async () => {
    const nextSnapshot = await grantStoredRewardedExtraExamCredit({ storage });
    setSnapshot(nextSnapshot);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  const consumeRewardedExamCredit = useCallback(async () => {
    const nextSnapshot = await consumeStoredRewardedExtraExamCredit({ storage });
    setSnapshot(nextSnapshot);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  return {
    accessDecision,
    accessReady,
    consumeRewardedExamCredit,
    entitlements,
    entitlementsReady,
    freeMockExamLimit,
    grantRewardedExamCredit,
    purchaseRuntime,
    recordExamCompletion,
    refreshAccess,
    setEntitlements,
    snapshot,
  };
}
