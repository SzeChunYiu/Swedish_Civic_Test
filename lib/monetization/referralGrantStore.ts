import {
  REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
  type ReferralGrantSnapshot,
} from './effectiveEntitlements';
import { parseCanonicalUtcIsoTimestamp } from '../time/canonicalTimestamp';

export interface ReferralGrantStorage {
  deleteItemAsync?: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
}

function localStorageBackedReferralGrantStorage(): ReferralGrantStorage | null {
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

function secureStoreBackedReferralGrantStorage(): ReferralGrantStorage | null {
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

export function createDefaultReferralGrantStorage(): ReferralGrantStorage | null {
  return localStorageBackedReferralGrantStorage() ?? secureStoreBackedReferralGrantStorage();
}

async function clearStorageKey(storage: ReferralGrantStorage): Promise<void> {
  if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY);
    return;
  }

  await storage.setItemAsync(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY, '');
}

export async function getReferralGrantSnapshot({
  storage = createDefaultReferralGrantStorage(),
}: {
  storage?: ReferralGrantStorage | null;
} = {}): Promise<ReferralGrantSnapshot | null> {
  if (!storage) return null;

  const storedValue = await storage.getItemAsync(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY);
  const canonical = parseCanonicalUtcIsoTimestamp(storedValue);
  if (!canonical) {
    if (storedValue) await clearStorageKey(storage);
    return null;
  }

  return { expiresAtIso: canonical.iso };
}

export async function persistReferralGrantSnapshot(
  expiresAtIso: unknown,
  {
    storage = createDefaultReferralGrantStorage(),
  }: {
    storage?: ReferralGrantStorage | null;
  } = {},
): Promise<ReferralGrantSnapshot | null> {
  if (!storage) return null;

  const canonical = parseCanonicalUtcIsoTimestamp(expiresAtIso);
  if (!canonical) {
    await clearStorageKey(storage);
    return null;
  }

  await storage.setItemAsync(REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY, canonical.iso);
  return { expiresAtIso: canonical.iso };
}

export async function clearReferralGrantSnapshot({
  storage = createDefaultReferralGrantStorage(),
}: {
  storage?: ReferralGrantStorage | null;
} = {}): Promise<void> {
  if (!storage) return;

  await clearStorageKey(storage);
}
