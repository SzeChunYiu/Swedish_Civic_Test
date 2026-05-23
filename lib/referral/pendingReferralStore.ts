import { isReferralCode, normalizeReferralCode } from './generateCode';

export const PENDING_REFERRAL_CODE_STORAGE_KEY = 'referral.pendingCode.v1';

export interface PendingReferralStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

export function createPendingReferralStorage(): PendingReferralStorage {
  const browserStorage = getBrowserStorage();

  if (browserStorage) {
    return {
      async getItemAsync(key) {
        return browserStorage.getItem(key);
      },
      async setItemAsync(key, value) {
        browserStorage.setItem(key, value);
      },
    };
  }

  return {
    async getItemAsync(key) {
      const SecureStore = await import('expo-secure-store');
      return SecureStore.getItemAsync(key);
    },
    async setItemAsync(key, value) {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    },
  };
}

export async function storePendingReferralCode(
  code: unknown,
  storage: PendingReferralStorage = createPendingReferralStorage(),
): Promise<string | null> {
  const normalizedCode = normalizeReferralCode(code);

  if (!isReferralCode(normalizedCode)) {
    return null;
  }

  await storage.setItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY, normalizedCode);
  return normalizedCode;
}

export async function getPendingReferralCode(
  storage: PendingReferralStorage = createPendingReferralStorage(),
): Promise<string | null> {
  const storedCode = await storage.getItemAsync(PENDING_REFERRAL_CODE_STORAGE_KEY);
  const normalizedCode = normalizeReferralCode(storedCode);
  return isReferralCode(normalizedCode) ? normalizedCode : null;
}
