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
  completedMockExamSessionIdsByDate: {},
  completedMockExamsToday: 0,
  dateKey: '',
  rewardedExtraExamCredits: 0,
};

type MockExamAccessTestHooks = typeof globalThis & {
  __SMT_TEST_FAIL_MOCK_EXAM_COMPLETION_ONCE__?: boolean;
};

function getMockExamAccessTestHooks(): MockExamAccessTestHooks {
  return globalThis as MockExamAccessTestHooks;
}

function mockExamAccessTestHooksEnabled(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

function shouldFailMockExamCompletionOnce(): boolean {
  if (!mockExamAccessTestHooksEnabled()) return false;

  const hooks = getMockExamAccessTestHooks();
  if (hooks.__SMT_TEST_FAIL_MOCK_EXAM_COMPLETION_ONCE__ !== true) return false;

  hooks.__SMT_TEST_FAIL_MOCK_EXAM_COMPLETION_ONCE__ = false;
  return true;
}

function createDefaultMockExamAccessStorage(): MockExamAccessStorage {
  return Platform.OS === 'web'
    ? createWebMockExamAccessStorage()
    : createSecureStoreMockExamAccessStorage();
}

function buildAccessDecision({
  accessReadFailed,
  consentDecision,
  entitlements,
  freeMockExamLimit,
  snapshot,
}: {
  accessReadFailed?: boolean;
  consentDecision?: Pick<AdConsentDecision, 'adServingAllowed'>;
  entitlements: PremiumEntitlements;
  freeMockExamLimit: number;
  snapshot: StoredMockExamAccessSnapshot;
}): MockExamAccessDecision {
  return getMockExamAccessDecision({
    accessReadFailed,
    completedMockExamsToday: snapshot.completedMockExamsToday,
    consentDecision,
    entitlements,
    freeMockExamLimit,
    platform: Platform.OS,
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
  const [accessReadFailed, setAccessReadFailed] = useState(false);
  const [snapshot, setSnapshot] = useState<StoredMockExamAccessSnapshot>(EMPTY_ACCESS_SNAPSHOT);

  const refreshAccess = useCallback(async () => {
    const nextSnapshot = await getStoredMockExamAccess({ storage });
    setSnapshot(nextSnapshot);
    setAccessReadFailed(false);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  useEffect(() => {
    let isMounted = true;
    setAccessReady(false);
    setAccessReadFailed(false);

    void getStoredMockExamAccess({ storage })
      .then((nextSnapshot) => {
        if (!isMounted) return;
        setSnapshot(nextSnapshot);
        setAccessReadFailed(false);
        setAccessReady(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setAccessReadFailed(true);
        setAccessReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [storage]);

  const accessDecision = useMemo(
    () =>
      buildAccessDecision({
        accessReadFailed,
        consentDecision,
        entitlements,
        freeMockExamLimit,
        snapshot,
      }),
    [
      accessReadFailed,
      consentDecision,
      entitlements,
      freeMockExamLimit,
      snapshot.completedMockExamsToday,
      snapshot.rewardedExtraExamCredits,
    ],
  );

  const recordExamCompletion = useCallback(async () => {
    if (shouldFailMockExamCompletionOnce()) {
      throw new Error('Mock exam completion write forced to fail once');
    }

    const nextSnapshot = await recordStoredMockExamCompletion({ storage });
    setSnapshot(nextSnapshot);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  const grantRewardedExamCredit = useCallback(async () => {
    const nextSnapshot = await grantStoredRewardedExtraExamCredit({ storage });
    setSnapshot(nextSnapshot);
    setAccessReadFailed(false);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  const consumeRewardedExamCredit = useCallback(async () => {
    const nextSnapshot = await consumeStoredRewardedExtraExamCredit({ storage });
    setSnapshot(nextSnapshot);
    setAccessReadFailed(false);
    setAccessReady(true);
    return nextSnapshot;
  }, [storage]);

  return {
    accessDecision,
    accessReadFailed,
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
