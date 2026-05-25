import { isReferralCode, normalizeReferralCode } from './generateCode';

export const PENDING_REFERRAL_CODE_STORAGE_KEY = 'referral.pendingCode.v1';
export const REFERRAL_APP_SCHEME = 'almost-swedish';

export interface ReferralCodeStorage {
  deleteItemAsync?: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
}

function localStorageBackedReferralStorage(): ReferralCodeStorage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  return {
    async deleteItemAsync(key) {
      window.localStorage.removeItem(key);
    },
    async getItemAsync(key) {
      return window.localStorage.getItem(key);
    },
    async setItemAsync(key, value) {
      window.localStorage.setItem(key, value);
    },
  };
}

function secureStoreBackedReferralStorage(): ReferralCodeStorage | null {
  try {
    const secureStore = require('expo-secure-store') as {
      deleteItemAsync?: (key: string) => Promise<void>;
      getItemAsync?: (key: string) => Promise<string | null>;
      setItemAsync?: (key: string, value: string) => Promise<void>;
    };

    if (!secureStore.getItemAsync || !secureStore.setItemAsync) return null;

    return {
      deleteItemAsync: secureStore.deleteItemAsync,
      getItemAsync: secureStore.getItemAsync,
      setItemAsync: secureStore.setItemAsync,
    };
  } catch {
    return null;
  }
}

export function createDefaultPendingReferralStorage(): ReferralCodeStorage | null {
  return localStorageBackedReferralStorage() ?? secureStoreBackedReferralStorage();
}

async function deleteStoredReferralCode(storage: ReferralCodeStorage): Promise<void> {
  if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY);
    return;
  }

  await storage.setItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY, '');
}

export async function storePendingReferralCode(
  code: unknown,
  {
    storage = createDefaultPendingReferralStorage(),
  }: {
    storage?: ReferralCodeStorage | null;
  } = {},
): Promise<string | null> {
  const normalizedCode = normalizeReferralCode(code);
  if (!isReferralCode(normalizedCode) || !storage) return null;

  await storage.setItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY, normalizedCode);
  return normalizedCode;
}

export async function peekPendingReferralCode({
  storage = createDefaultPendingReferralStorage(),
}: {
  storage?: ReferralCodeStorage | null;
} = {}): Promise<string | null> {
  if (!storage) return null;

  const normalizedCode = normalizeReferralCode(
    await storage.getItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY),
  );
  return isReferralCode(normalizedCode) ? normalizedCode : null;
}

export async function consumePendingReferralCode({
  storage = createDefaultPendingReferralStorage(),
}: {
  storage?: ReferralCodeStorage | null;
} = {}): Promise<string | null> {
  if (!storage) return null;

  const normalizedCode = normalizeReferralCode(
    await storage.getItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY),
  );
  if (!isReferralCode(normalizedCode)) {
    await deleteStoredReferralCode(storage);
    return null;
  }

  await deleteStoredReferralCode(storage);
  return normalizedCode;
}

export function referralRouteForCode(code: unknown): string | null {
  const normalizedCode = normalizeReferralCode(code);
  return isReferralCode(normalizedCode) ? `/r/${normalizedCode}` : null;
}

export function referralDeepLinkForCode(code: unknown): string | null {
  const route = referralRouteForCode(code);
  return route ? `${REFERRAL_APP_SCHEME}://${route.replace(/^\//, '')}` : null;
}
