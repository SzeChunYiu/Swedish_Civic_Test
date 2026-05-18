import type { Purchase } from 'react-native-iap';

import type { PremiumEntitlements } from '../../types/monetization';

export const REMOVE_ADS_PRODUCT_ID = 'com.billyyiu.swedishcivictest.removeads';
export const REMOVE_ADS_PRICE_LABEL = '29 SEK';
export const REMOVE_ADS_STORAGE_KEY = 'monetization.removeAds.adsDisabled.v1';

const STORED_TRUE = 'true';

type NativeIapModule = typeof import('react-native-iap');
type SecureStoreModule = typeof import('expo-secure-store');

export interface PurchaseStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync?(key: string): Promise<void>;
}

export interface RemoveAdsPurchaseRecord {
  productId: string;
  purchaseToken?: string | null;
  transactionId?: string | null;
  raw?: unknown;
}

export interface RemoveAdsPurchaseProvider {
  connect(): Promise<void>;
  disconnect?(): Promise<void>;
  finishPurchase?(purchase: RemoveAdsPurchaseRecord): Promise<void>;
  requestRemoveAdsPurchase(productId: string): Promise<RemoveAdsPurchaseRecord | null>;
  restorePurchases(productIds: readonly string[]): Promise<RemoveAdsPurchaseRecord[]>;
}

export type RemoveAdsPurchaseStatus = 'purchased' | 'pending' | 'restored' | 'not_found';

export interface RemoveAdsPurchaseResult {
  entitlements: PremiumEntitlements;
  priceLabel: typeof REMOVE_ADS_PRICE_LABEL;
  productId: typeof REMOVE_ADS_PRODUCT_ID;
  purchaseToken?: string | null;
  status: RemoveAdsPurchaseStatus;
  transactionId?: string | null;
}

export interface PurchaseRuntimeOptions {
  provider?: RemoveAdsPurchaseProvider;
  storage?: PurchaseStorage;
}

export interface NativePurchaseProviderOptions {
  purchaseTimeoutMs?: number;
}

export interface MockPurchaseProviderOptions {
  owned?: boolean;
  ownedProductIds?: readonly string[];
  pendingPurchase?: boolean;
}

interface BrowserPurchaseStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

function removeAdsEntitlements(adsDisabled: boolean): PremiumEntitlements {
  return {
    adsDisabled,
    fullMistakeReview: false,
    unlimitedMockExams: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | null | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getBrowserPurchaseStorage(): BrowserPurchaseStorage | undefined {
  const storage = (globalThis as { localStorage?: Partial<BrowserPurchaseStorage> }).localStorage;

  if (
    typeof storage?.getItem === 'function' &&
    typeof storage.removeItem === 'function' &&
    typeof storage.setItem === 'function'
  ) {
    return storage as BrowserPurchaseStorage;
  }

  return undefined;
}

function normalizePurchase(value: unknown): RemoveAdsPurchaseRecord | null {
  if (!isRecord(value)) return null;

  const productId =
    optionalString(value.productId) ??
    optionalString(value.currentPlanId) ??
    optionalString(value.id) ??
    undefined;

  if (!productId) return null;

  return {
    productId,
    purchaseToken: optionalString(value.purchaseToken),
    raw: value,
    transactionId: optionalString(value.transactionId),
  };
}

function normalizePurchases(value: unknown): RemoveAdsPurchaseRecord[] {
  if (Array.isArray(value)) return value.flatMap((item) => normalizePurchase(item) ?? []);
  const purchase = normalizePurchase(value);
  return purchase ? [purchase] : [];
}

function purchaseMatchesProductId(purchase: RemoveAdsPurchaseRecord, productId: string): boolean {
  if (purchase.productId === productId) return true;
  if (!isRecord(purchase.raw)) return false;
  return (
    Array.isArray(purchase.raw.ids) &&
    purchase.raw.ids.some((rawProductId) => rawProductId === productId)
  );
}

function isRemoveAdsPurchase(purchase: RemoveAdsPurchaseRecord): boolean {
  return purchaseMatchesProductId(purchase, REMOVE_ADS_PRODUCT_ID);
}

function createResult(
  status: RemoveAdsPurchaseStatus,
  entitlements: PremiumEntitlements,
  purchase?: RemoveAdsPurchaseRecord,
): RemoveAdsPurchaseResult {
  return {
    entitlements,
    priceLabel: REMOVE_ADS_PRICE_LABEL,
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: purchase?.purchaseToken,
    status,
    transactionId: purchase?.transactionId,
  };
}

async function loadNativeIap(): Promise<NativeIapModule> {
  return import('react-native-iap');
}

async function loadSecureStore(): Promise<SecureStoreModule> {
  return import('expo-secure-store');
}

export function createSecureStorePurchaseStorage(): PurchaseStorage {
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

export function createMemoryPurchaseStorage(initialAdsDisabled = false): PurchaseStorage {
  const values = new Map<string, string>();
  if (initialAdsDisabled) values.set(REMOVE_ADS_STORAGE_KEY, STORED_TRUE);

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

export function createWebPurchaseStorage(initialAdsDisabled = false): PurchaseStorage {
  const fallbackStorage = createMemoryPurchaseStorage(initialAdsDisabled);
  const browserStorage = getBrowserPurchaseStorage();

  if (browserStorage && initialAdsDisabled) {
    try {
      if (browserStorage.getItem(REMOVE_ADS_STORAGE_KEY) === null) {
        browserStorage.setItem(REMOVE_ADS_STORAGE_KEY, STORED_TRUE);
      }
    } catch {
      // Fall back to in-memory storage when browser persistence is unavailable.
    }
  }

  return {
    async deleteItemAsync(key) {
      await fallbackStorage.deleteItemAsync?.(key);

      if (!browserStorage) return;

      try {
        browserStorage.removeItem(key);
      } catch {
        // The in-memory fallback has already been updated.
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

export async function setRemoveAdsEntitlement(
  adsDisabled: boolean,
  { storage = createSecureStorePurchaseStorage() }: Pick<PurchaseRuntimeOptions, 'storage'> = {},
): Promise<PremiumEntitlements> {
  if (adsDisabled) {
    await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, STORED_TRUE);
  } else if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(REMOVE_ADS_STORAGE_KEY);
  } else {
    await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, 'false');
  }

  return removeAdsEntitlements(adsDisabled);
}

export async function getPurchaseEntitlements({
  storage = createSecureStorePurchaseStorage(),
}: Pick<PurchaseRuntimeOptions, 'storage'> = {}): Promise<PremiumEntitlements> {
  const storedValue = await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY);
  return removeAdsEntitlements(storedValue === STORED_TRUE);
}

export function createNativePurchaseProvider({
  purchaseTimeoutMs = 30000,
}: NativePurchaseProviderOptions = {}): RemoveAdsPurchaseProvider {
  let iapPromise: Promise<NativeIapModule> | undefined;
  const getIap = () => {
    iapPromise ??= loadNativeIap();
    return iapPromise;
  };

  return {
    async connect() {
      const iap = await getIap();
      await iap.initConnection();
    },
    async disconnect() {
      const iap = await getIap();
      await iap.endConnection();
    },
    async finishPurchase(purchase) {
      if (!purchase.raw) return;
      const iap = await getIap();
      await iap.finishTransaction({
        isConsumable: false,
        purchase: purchase.raw as Purchase,
      });
    },
    async requestRemoveAdsPurchase(productId) {
      const iap = await getIap();

      return new Promise<RemoveAdsPurchaseRecord | null>((resolve, reject) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let settled = false;
        const subscriptions = [
          iap.purchaseUpdatedListener((purchase) => {
            const matched = normalizePurchases(purchase).find((candidate) =>
              purchaseMatchesProductId(candidate, productId),
            );
            if (matched) settle(undefined, matched);
          }),
          iap.purchaseErrorListener((error) => {
            settle(error);
          }),
        ];

        function cleanup() {
          if (timeout) clearTimeout(timeout);
          for (const subscription of subscriptions) subscription.remove();
        }

        function settle(error?: unknown, purchase?: RemoveAdsPurchaseRecord | null) {
          if (settled) return;
          settled = true;
          cleanup();
          if (error) {
            reject(error);
          } else {
            resolve(purchase ?? null);
          }
        }

        timeout = setTimeout(() => settle(undefined, null), purchaseTimeoutMs);

        void iap
          .requestPurchase({
            request: {
              apple: { sku: productId },
              google: { skus: [productId] },
            },
            type: 'in-app',
          })
          .then((requestResult) => {
            const matched = normalizePurchases(requestResult).find((candidate) =>
              purchaseMatchesProductId(candidate, productId),
            );
            if (matched) settle(undefined, matched);
          })
          .catch((error: unknown) => settle(error));
      });
    },
    async restorePurchases(productIds) {
      const iap = await getIap();
      await iap.restorePurchases();
      return normalizePurchases(await iap.getAvailablePurchases()).filter((purchase) =>
        productIds.some((productId) => purchaseMatchesProductId(purchase, productId)),
      );
    },
  };
}

export function createMockPurchaseProvider({
  owned = false,
  ownedProductIds = owned ? [REMOVE_ADS_PRODUCT_ID] : [],
  pendingPurchase = false,
}: MockPurchaseProviderOptions = {}): RemoveAdsPurchaseProvider {
  let connected = false;
  const ownedProductIdsSet = new Set(ownedProductIds);

  function assertConnected() {
    if (!connected) throw new Error('Mock purchase provider is not connected');
  }

  function createMockPurchase(
    transactionId: string,
    productId = REMOVE_ADS_PRODUCT_ID,
  ): RemoveAdsPurchaseRecord {
    return {
      productId,
      purchaseToken: `mock-token-${transactionId}`,
      raw: { ids: [productId] },
      transactionId,
    };
  }

  return {
    async connect() {
      connected = true;
    },
    async disconnect() {
      connected = false;
    },
    async finishPurchase() {
      assertConnected();
    },
    async requestRemoveAdsPurchase(productId) {
      assertConnected();
      if (pendingPurchase) return null;
      ownedProductIdsSet.add(productId);
      return createMockPurchase(
        productId === REMOVE_ADS_PRODUCT_ID ? 'buy-remove-ads' : 'buy-purchase',
        productId,
      );
    },
    async restorePurchases(productIds) {
      assertConnected();
      if (
        productIds.includes(REMOVE_ADS_PRODUCT_ID) &&
        ownedProductIdsSet.has(REMOVE_ADS_PRODUCT_ID)
      ) {
        return [createMockPurchase('restore-remove-ads')];
      }

      const productId = productIds.find((candidate) => ownedProductIdsSet.has(candidate));
      if (!productId) return [];
      return [createMockPurchase('restore-purchase', productId)];
    },
  };
}

export async function buyRemoveAds({
  provider = createNativePurchaseProvider(),
  storage = createSecureStorePurchaseStorage(),
}: PurchaseRuntimeOptions = {}): Promise<RemoveAdsPurchaseResult> {
  await provider.connect();

  try {
    const purchase = await provider.requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID);
    if (!purchase || !isRemoveAdsPurchase(purchase)) {
      return createResult('pending', await getPurchaseEntitlements({ storage }));
    }

    await provider.finishPurchase?.(purchase);
    const entitlements = await setRemoveAdsEntitlement(true, { storage });
    return createResult('purchased', entitlements, purchase);
  } finally {
    await provider.disconnect?.();
  }
}

export async function restoreRemoveAdsPurchase({
  provider = createNativePurchaseProvider(),
  storage = createSecureStorePurchaseStorage(),
}: PurchaseRuntimeOptions = {}): Promise<RemoveAdsPurchaseResult> {
  await provider.connect();

  try {
    const purchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);
    const purchase = purchases.find(isRemoveAdsPurchase);
    if (!purchase) {
      return createResult('not_found', await getPurchaseEntitlements({ storage }));
    }

    const entitlements = await setRemoveAdsEntitlement(true, { storage });
    return createResult('restored', entitlements, purchase);
  } finally {
    await provider.disconnect?.();
  }
}
