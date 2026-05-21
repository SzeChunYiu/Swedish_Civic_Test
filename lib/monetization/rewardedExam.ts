import type { PremiumEntitlements } from '../../types/monetization';
import { getLocalDateKey } from '../learning/streaks';
import { REAL_ADS_ENABLED, shouldShowAd } from './ads';
import type { AdRuntimePlatform } from './ads';
import type { AdConsentDecision } from './consent';
import { isStrictEntitlementFlag } from './premium';

export const REWARDED_EXTRA_EXAM_PLACEMENT = 'rewarded_extra_exam' as const;
export const MOCK_EXAM_ACCESS_STORAGE_KEY = 'monetization.mockExamAccess.v1';
export const FREE_MOCK_EXAM_DAILY_LIMIT = 1;

export type MockExamAccessReason =
  | 'free_exam_available'
  | 'premium_unlimited_mock_exams'
  | 'rewarded_exam_credit'
  | 'rewarded_ad_available'
  | 'remove_ads_active'
  | 'consent_required'
  | 'ads_unavailable'
  | 'access_read_failed';

export type MockExamAccessState = {
  completedMockExamsToday: number;
  consentDecision?: Pick<AdConsentDecision, 'adServingAllowed'>;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled' | 'unlimitedMockExams'>;
  freeMockExamLimit: number;
  platform?: AdRuntimePlatform | string;
  rewardedExtraExamCredits?: number;
};

export type MockExamAccessDecision = {
  canOfferRewardedAd: boolean;
  canStartExam: boolean;
  freeExamsRemaining: number;
  placement: typeof REWARDED_EXTRA_EXAM_PLACEMENT;
  reason: MockExamAccessReason;
  rewardedExtraExamCredits: number;
};

export type PersistedMockExamAccess = {
  completedMockExamsByDate: Record<string, number>;
  completedMockExamSessionIdsByDate: Record<string, string[]>;
  rewardedExtraExamCredits: number;
};

export type StoredMockExamAccessSnapshot = PersistedMockExamAccess & {
  completedMockExamsToday: number;
  dateKey: string;
};

export interface MockExamAccessStorage {
  deleteItemAsync?(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

export type MockExamAccessStorageOptions = {
  date?: Date | string;
  storage: MockExamAccessStorage;
};

export type RecordMockExamCompletionOptions = MockExamAccessStorageOptions & {
  sessionId: string;
};

type SecureStoreModule = typeof import('expo-secure-store');

interface BrowserMockExamAccessStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MOCK_EXAM_SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;

function toNonNegativeInteger(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

function createEmptyPersistedMockExamAccess(): PersistedMockExamAccess {
  return {
    completedMockExamsByDate: {},
    completedMockExamSessionIdsByDate: {},
    rewardedExtraExamCredits: 0,
  };
}

function normalizeDateKey(value: string): string | null {
  const dateKey = value;
  if (!DATE_KEY_PATTERN.test(dateKey)) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const normalizedDate = new Date(Date.UTC(year, month - 1, day));
  normalizedDate.setUTCFullYear(year);
  const normalizedDateKey = normalizedDate.toISOString().slice(0, 10);

  return normalizedDateKey === dateKey ? dateKey : null;
}

function normalizeMockExamSessionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const sessionId = value.trim();
  return MOCK_EXAM_SESSION_ID_PATTERN.test(sessionId) ? sessionId : null;
}

function getBrowserMockExamAccessStorage(): BrowserMockExamAccessStorage | undefined {
  const storage = (
    globalThis as {
      localStorage?: Partial<BrowserMockExamAccessStorage>;
    }
  ).localStorage;

  if (
    typeof storage?.getItem === 'function' &&
    typeof storage.removeItem === 'function' &&
    typeof storage.setItem === 'function'
  ) {
    return storage as BrowserMockExamAccessStorage;
  }

  return undefined;
}

function normalizePersistedMockExamAccess(value: unknown): PersistedMockExamAccess {
  if (!value || typeof value !== 'object') return createEmptyPersistedMockExamAccess();

  const candidate = value as Partial<PersistedMockExamAccess>;
  const completedMockExamsByDate: Record<string, number> = {};
  const completedMockExamSessionIdsByDate: Record<string, string[]> = {};

  if (
    candidate.completedMockExamsByDate &&
    typeof candidate.completedMockExamsByDate === 'object'
  ) {
    for (const [rawDateKey, rawCount] of Object.entries(candidate.completedMockExamsByDate)) {
      const dateKey = normalizeDateKey(rawDateKey);
      if (!dateKey) continue;
      completedMockExamsByDate[dateKey] = toNonNegativeInteger(
        typeof rawCount === 'number' ? rawCount : undefined,
      );
    }
  }

  if (
    candidate.completedMockExamSessionIdsByDate &&
    typeof candidate.completedMockExamSessionIdsByDate === 'object'
  ) {
    for (const [rawDateKey, rawSessionIds] of Object.entries(
      candidate.completedMockExamSessionIdsByDate,
    )) {
      const dateKey = normalizeDateKey(rawDateKey);
      if (!dateKey || !Array.isArray(rawSessionIds)) continue;

      const sessionIds = Array.from(
        new Set(rawSessionIds.map(normalizeMockExamSessionId).filter((id): id is string => !!id)),
      );
      if (sessionIds.length === 0) continue;

      completedMockExamSessionIdsByDate[dateKey] = sessionIds;
      completedMockExamsByDate[dateKey] = Math.max(
        completedMockExamsByDate[dateKey] ?? 0,
        sessionIds.length,
      );
    }
  }

  return {
    completedMockExamsByDate,
    completedMockExamSessionIdsByDate,
    rewardedExtraExamCredits: toNonNegativeInteger(candidate.rewardedExtraExamCredits),
  };
}

function getStoredSnapshot(
  persistedAccess: PersistedMockExamAccess,
  date: Date | string | undefined,
): StoredMockExamAccessSnapshot {
  const dateKey = getMockExamAccessDateKey(date);
  const completedSessionIds = persistedAccess.completedMockExamSessionIdsByDate[dateKey] ?? [];

  return {
    completedMockExamsByDate: { ...persistedAccess.completedMockExamsByDate },
    completedMockExamSessionIdsByDate: Object.fromEntries(
      Object.entries(persistedAccess.completedMockExamSessionIdsByDate).map(
        ([sessionDateKey, sessionIds]) => [sessionDateKey, [...sessionIds]],
      ),
    ),
    completedMockExamsToday: Math.max(
      persistedAccess.completedMockExamsByDate[dateKey] ?? 0,
      completedSessionIds.length,
    ),
    dateKey,
    rewardedExtraExamCredits: persistedAccess.rewardedExtraExamCredits,
  };
}

async function readPersistedMockExamAccess(
  storage: MockExamAccessStorage,
): Promise<PersistedMockExamAccess> {
  const rawAccess = await storage.getItemAsync(MOCK_EXAM_ACCESS_STORAGE_KEY);
  if (!rawAccess) return createEmptyPersistedMockExamAccess();

  try {
    return normalizePersistedMockExamAccess(JSON.parse(rawAccess));
  } catch {
    return createEmptyPersistedMockExamAccess();
  }
}

async function writePersistedMockExamAccess(
  storage: MockExamAccessStorage,
  persistedAccess: PersistedMockExamAccess,
): Promise<PersistedMockExamAccess> {
  const normalizedAccess = normalizePersistedMockExamAccess(persistedAccess);
  await storage.setItemAsync(MOCK_EXAM_ACCESS_STORAGE_KEY, JSON.stringify(normalizedAccess));
  return normalizedAccess;
}

async function loadSecureStore(): Promise<SecureStoreModule> {
  return import('expo-secure-store');
}

export function getMockExamAccessDateKey(date: Date | string = new Date()): string {
  if (typeof date === 'string') {
    const trimmedDate = date.trim();
    const directDateKey = normalizeDateKey(trimmedDate);
    if (directDateKey) return directDateKey;

    const datePrefix = trimmedDate.slice(0, 10);
    if (DATE_KEY_PATTERN.test(datePrefix) && !normalizeDateKey(datePrefix)) {
      return getLocalDateKey(new Date());
    }

    const parsedDate = new Date(trimmedDate);
    if (!Number.isNaN(parsedDate.getTime())) return getLocalDateKey(parsedDate);
    return getLocalDateKey(new Date());
  }

  return Number.isNaN(date.getTime()) ? getLocalDateKey(new Date()) : getLocalDateKey(date);
}

export function createMemoryMockExamAccessStorage(
  initialAccess?: Partial<PersistedMockExamAccess>,
): MockExamAccessStorage {
  const values = new Map<string, string>();

  if (initialAccess) {
    values.set(
      MOCK_EXAM_ACCESS_STORAGE_KEY,
      JSON.stringify(normalizePersistedMockExamAccess(initialAccess)),
    );
  }

  return {
    async deleteItemAsync(key) {
      values.delete(key);
    },
    async getItemAsync(key) {
      return values.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      values.set(key, value);
    },
  };
}

export function createSecureStoreMockExamAccessStorage(): MockExamAccessStorage {
  return {
    async deleteItemAsync(key) {
      const SecureStore = await loadSecureStore();
      await SecureStore.deleteItemAsync(key);
    },
    async getItemAsync(key) {
      const SecureStore = await loadSecureStore();
      return SecureStore.getItemAsync(key);
    },
    async setItemAsync(key, value) {
      const SecureStore = await loadSecureStore();
      await SecureStore.setItemAsync(key, value);
    },
  };
}

export function createWebMockExamAccessStorage(
  initialAccess?: Partial<PersistedMockExamAccess>,
): MockExamAccessStorage {
  const fallbackStorage = createMemoryMockExamAccessStorage(initialAccess);
  const browserStorage = getBrowserMockExamAccessStorage();

  if (browserStorage && initialAccess) {
    try {
      if (browserStorage.getItem(MOCK_EXAM_ACCESS_STORAGE_KEY) === null) {
        browserStorage.setItem(
          MOCK_EXAM_ACCESS_STORAGE_KEY,
          JSON.stringify(normalizePersistedMockExamAccess(initialAccess)),
        );
      }
    } catch {
      // The in-memory fallback remains authoritative when browser storage is unavailable.
    }
  }

  return {
    async deleteItemAsync(key) {
      await fallbackStorage.deleteItemAsync?.(key);

      if (!browserStorage) return;

      try {
        browserStorage.removeItem(key);
      } catch {
        // The in-memory fallback has already been cleared.
      }
    },
    async getItemAsync(key) {
      if (browserStorage) {
        try {
          const storedValue = browserStorage.getItem(key);
          if (storedValue !== null) return storedValue;
        } catch {
          // Read through to the in-memory fallback below.
        }
      }

      return fallbackStorage.getItemAsync(key);
    },
    async setItemAsync(key, value) {
      await fallbackStorage.setItemAsync(key, value);

      if (!browserStorage) return;

      try {
        browserStorage.setItem(key, value);
      } catch {
        // The in-memory fallback has already been updated.
      }
    },
  };
}

export async function getStoredMockExamAccess({
  date,
  storage,
}: MockExamAccessStorageOptions): Promise<StoredMockExamAccessSnapshot> {
  return getStoredSnapshot(await readPersistedMockExamAccess(storage), date);
}

export async function clearStoredMockExamAccess({
  date,
  storage,
}: MockExamAccessStorageOptions): Promise<StoredMockExamAccessSnapshot> {
  if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(MOCK_EXAM_ACCESS_STORAGE_KEY);
  } else {
    await storage.setItemAsync(
      MOCK_EXAM_ACCESS_STORAGE_KEY,
      JSON.stringify(createEmptyPersistedMockExamAccess()),
    );
  }

  return getStoredSnapshot(createEmptyPersistedMockExamAccess(), date);
}

export async function recordStoredMockExamCompletion({
  date,
  sessionId,
  storage,
}: RecordMockExamCompletionOptions): Promise<StoredMockExamAccessSnapshot> {
  const normalizedSessionId = normalizeMockExamSessionId(sessionId);
  if (!normalizedSessionId) {
    throw new Error('Mock exam completion requires a valid sessionId.');
  }

  const dateKey = getMockExamAccessDateKey(date);
  const persistedAccess = await readPersistedMockExamAccess(storage);
  const completedSessionIds = persistedAccess.completedMockExamSessionIdsByDate[dateKey] ?? [];
  const completedCount = Math.max(
    toNonNegativeInteger(persistedAccess.completedMockExamsByDate[dateKey]),
    completedSessionIds.length,
  );

  if (completedSessionIds.includes(normalizedSessionId)) {
    return getStoredSnapshot(persistedAccess, dateKey);
  }

  const nextAccess = {
    ...persistedAccess,
    completedMockExamsByDate: {
      ...persistedAccess.completedMockExamsByDate,
      [dateKey]: completedCount + 1,
    },
    completedMockExamSessionIdsByDate: {
      ...persistedAccess.completedMockExamSessionIdsByDate,
      [dateKey]: [...completedSessionIds, normalizedSessionId],
    },
  };

  return getStoredSnapshot(await writePersistedMockExamAccess(storage, nextAccess), dateKey);
}

export async function grantStoredRewardedExtraExamCredit({
  date,
  storage,
}: MockExamAccessStorageOptions): Promise<StoredMockExamAccessSnapshot> {
  const persistedAccess = await readPersistedMockExamAccess(storage);
  const nextAccess = {
    ...persistedAccess,
    rewardedExtraExamCredits: grantRewardedExtraExamCredit(
      persistedAccess.rewardedExtraExamCredits,
    ),
  };

  return getStoredSnapshot(await writePersistedMockExamAccess(storage, nextAccess), date);
}

export async function consumeStoredRewardedExtraExamCredit({
  date,
  storage,
}: MockExamAccessStorageOptions): Promise<StoredMockExamAccessSnapshot> {
  const persistedAccess = await readPersistedMockExamAccess(storage);
  const nextAccess = {
    ...persistedAccess,
    rewardedExtraExamCredits: consumeRewardedExtraExamCredit(
      persistedAccess.rewardedExtraExamCredits,
    ),
  };

  return getStoredSnapshot(await writePersistedMockExamAccess(storage, nextAccess), date);
}

export function grantRewardedExtraExamCredit(currentCredits = 0): number {
  return toNonNegativeInteger(currentCredits) + 1;
}

export function consumeRewardedExtraExamCredit(currentCredits = 0): number {
  return Math.max(0, toNonNegativeInteger(currentCredits) - 1);
}

export function getMockExamAccessDecision({
  completedMockExamsToday,
  consentDecision,
  entitlements,
  freeMockExamLimit,
  platform,
  rewardedExtraExamCredits,
}: MockExamAccessState): MockExamAccessDecision {
  const completedExams = toNonNegativeInteger(completedMockExamsToday);
  const freeLimit = toNonNegativeInteger(freeMockExamLimit);
  const freeExamsRemaining = Math.max(0, freeLimit - completedExams);
  const credits = toNonNegativeInteger(rewardedExtraExamCredits);
  const baseDecision = {
    freeExamsRemaining,
    placement: REWARDED_EXTRA_EXAM_PLACEMENT,
    rewardedExtraExamCredits: credits,
  };

  if (isStrictEntitlementFlag(entitlements.unlimitedMockExams)) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'premium_unlimited_mock_exams',
    };
  }

  if (freeExamsRemaining > 0) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'free_exam_available',
    };
  }

  if (credits > 0) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'rewarded_exam_credit',
    };
  }

  if (isStrictEntitlementFlag(entitlements.adsDisabled)) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: false,
      reason: 'remove_ads_active',
    };
  }

  const placementAvailableAfterConsent = shouldShowAd(
    REWARDED_EXTRA_EXAM_PLACEMENT,
    entitlements,
    {
      adServingAllowed: true,
    },
    platform,
  );
  const canOfferRewardedAd = shouldShowAd(
    REWARDED_EXTRA_EXAM_PLACEMENT,
    entitlements,
    consentDecision,
    platform,
  );
  const reason: MockExamAccessReason = canOfferRewardedAd
    ? 'rewarded_ad_available'
    : placementAvailableAfterConsent &&
        REAL_ADS_ENABLED &&
        consentDecision?.adServingAllowed !== true
      ? 'consent_required'
      : 'ads_unavailable';

  return {
    ...baseDecision,
    canOfferRewardedAd,
    canStartExam: false,
    reason,
  };
}

export function getMockExamAccessReadFailedDecision(): MockExamAccessDecision {
  return {
    canOfferRewardedAd: false,
    canStartExam: false,
    freeExamsRemaining: 0,
    placement: REWARDED_EXTRA_EXAM_PLACEMENT,
    reason: 'access_read_failed',
    rewardedExtraExamCredits: 0,
  };
}
