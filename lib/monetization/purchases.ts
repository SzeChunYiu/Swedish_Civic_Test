import type { Purchase } from 'react-native-iap';

import type { PremiumEntitlements } from '../../types/monetization';

export const REMOVE_ADS_PRODUCT_ID = 'com.billyyiu.swedishcivictest.removeads';
export const REMOVE_ADS_PRICE_LABEL = '29 SEK';
export const REMOVE_ADS_STORAGE_KEY = 'monetization.removeAds.adsDisabled.v1';
export const REMOVE_ADS_RECORD_SCHEMA_VERSION = 1;

type NativeIapModule = typeof import('react-native-iap');
type SecureStoreModule = typeof import('expo-secure-store');

export type RemoveAdsStorePlatform = keyof typeof REMOVE_ADS_STORE_PRODUCT_IDS;

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

export type RemoveAdsReceiptValidationStatus = 'valid' | 'invalid' | 'pending';

export interface RemoveAdsReceiptValidationResult {
  status: RemoveAdsReceiptValidationStatus;
  productId?: string | null;
  purchaseToken?: string | null;
  transactionId?: string | null;
  validatedAt?: string | null;
}

export type RemoveAdsGrantSource = 'purchase' | 'restore';

export interface StoredRemoveAdsEntitlementRecord {
  grantedAt: string;
  productId: typeof REMOVE_ADS_PRODUCT_ID;
  purchaseToken?: string | null;
  receiptValidatedAt: string;
  receiptValidationStatus: 'valid';
  schemaVersion: typeof REMOVE_ADS_RECORD_SCHEMA_VERSION;
  source: RemoveAdsGrantSource;
  transactionId?: string | null;
}

export interface RemoveAdsPurchaseProvider {
  connect(): Promise<void>;
  disconnect?(): Promise<void>;
  finishPurchase?(purchase: RemoveAdsPurchaseRecord): Promise<void>;
  validateRemoveAdsReceipt?(
    purchase: RemoveAdsPurchaseRecord,
    productId: typeof REMOVE_ADS_PRODUCT_ID,
  ): Promise<RemoveAdsReceiptValidationResult>;
  requestRemoveAdsPurchase(productId: string): Promise<RemoveAdsPurchaseRecord | null>;
  restorePurchases(productIds: readonly string[]): Promise<RemoveAdsPurchaseRecord[]>;
}

export type RemoveAdsPurchaseStatus =
  | 'purchased'
  | 'pending'
  | 'restored'
  | 'not_found'
  | 'persistence_failed';

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

interface RemoveAdsPersistenceResult {
  entitlements: PremiumEntitlements;
  persisted: boolean;
}

export interface NativePurchaseProviderOptions {
  iapModule?: NativeIapModule;
  platform?: RemoveAdsStorePlatform;
  purchaseTimeoutMs?: number;
}

export interface MockPurchaseProviderOptions {
  owned?: boolean;
  pendingPurchase?: boolean;
  receiptValidationStatus?: RemoveAdsReceiptValidationStatus;
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

function optionalStoredString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
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

function isRemoveAdsPurchase(purchase: RemoveAdsPurchaseRecord): boolean {
  if (purchase.productId === REMOVE_ADS_PRODUCT_ID) return true;
  if (!isRecord(purchase.raw)) return false;
  return (
    Array.isArray(purchase.raw.ids) &&
    purchase.raw.ids.some((productId) => productId === REMOVE_ADS_PRODUCT_ID)
  );
}

function hasStoreConfirmation(record: StoredRemoveAdsEntitlementRecord): boolean {
  return Boolean(
    (record.purchaseToken || record.transactionId) &&
    record.receiptValidationStatus === 'valid' &&
    isValidIsoDate(record.receiptValidatedAt),
  );
}

function createReceiptValidationResult(
  purchase: RemoveAdsPurchaseRecord,
  validatedAt = new Date(),
): RemoveAdsReceiptValidationResult {
  if (!isRemoveAdsPurchase(purchase)) return { status: 'invalid' };
  if (!purchase.purchaseToken && !purchase.transactionId) return { status: 'pending' };

  return {
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: purchase.purchaseToken ?? null,
    status: 'valid',
    transactionId: purchase.transactionId ?? null,
    validatedAt: validatedAt.toISOString(),
  };
}

function isValidatedRemoveAdsReceipt(
  result: RemoveAdsReceiptValidationResult | null | undefined,
): result is RemoveAdsReceiptValidationResult & {
  productId: typeof REMOVE_ADS_PRODUCT_ID;
  status: 'valid';
  validatedAt: string;
} {
  return Boolean(
    result &&
    result.status === 'valid' &&
    result.productId === REMOVE_ADS_PRODUCT_ID &&
    isValidIsoDate(result.validatedAt) &&
    (result.purchaseToken || result.transactionId),
  );
}

function createStoredRemoveAdsEntitlementRecord({
  grantedAt = new Date(),
  purchase,
  receiptValidation,
  source,
}: {
  grantedAt?: Date;
  purchase?: RemoveAdsPurchaseRecord;
  receiptValidation: RemoveAdsReceiptValidationResult;
  source: RemoveAdsGrantSource;
}): StoredRemoveAdsEntitlementRecord {
  return {
    grantedAt: grantedAt.toISOString(),
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: receiptValidation.purchaseToken ?? purchase?.purchaseToken ?? null,
    receiptValidatedAt: receiptValidation.validatedAt ?? grantedAt.toISOString(),
    receiptValidationStatus: 'valid',
    schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
    source,
    transactionId:
      receiptValidation.transactionId ?? purchase?.transactionId ?? `local-${source}-remove-ads`,
  };
}

function parseStoredRemoveAdsEntitlementRecord(
  storedValue: string | null,
): StoredRemoveAdsEntitlementRecord | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (!isRecord(parsed)) return null;

    const source = optionalString(parsed.source);
    const record: StoredRemoveAdsEntitlementRecord = {
      grantedAt: optionalString(parsed.grantedAt) ?? '',
      productId: optionalString(parsed.productId) as typeof REMOVE_ADS_PRODUCT_ID,
      purchaseToken: optionalStoredString(parsed.purchaseToken),
      receiptValidatedAt: optionalString(parsed.receiptValidatedAt) ?? '',
      receiptValidationStatus: optionalString(parsed.receiptValidationStatus) as 'valid',
      schemaVersion: parsed.schemaVersion as typeof REMOVE_ADS_RECORD_SCHEMA_VERSION,
      source: source as RemoveAdsGrantSource,
      transactionId: optionalStoredString(parsed.transactionId),
    };

    if (record.schemaVersion !== REMOVE_ADS_RECORD_SCHEMA_VERSION) return null;
    if (record.productId !== REMOVE_ADS_PRODUCT_ID) return null;
    if (record.source !== 'purchase' && record.source !== 'restore') return null;
    if (!isValidIsoDate(record.grantedAt)) return null;
    if (!hasStoreConfirmation(record)) return null;

    return record;
  } catch {
    return null;
  }
}

function serializeStoredRemoveAdsEntitlementRecord(
  record: StoredRemoveAdsEntitlementRecord,
): string {
  return JSON.stringify(record);
}

async function revalidateStoredRemoveAdsEntitlementRecord({
  provider,
  record,
  storage,
}: {
  provider: RemoveAdsPurchaseProvider;
  record: StoredRemoveAdsEntitlementRecord;
  storage: PurchaseStorage;
}): Promise<boolean> {
  let connected = false;

  try {
    await provider.connect();
    connected = true;

    const availablePurchases = await provider.restorePurchases([REMOVE_ADS_PRODUCT_ID]);
    const restoredPurchase =
      availablePurchases.find((purchase) => purchaseMatchesStoredRecord(purchase, record)) ??
      availablePurchases.find(isRemoveAdsPurchase);

    if (!restoredPurchase) {
      await clearStoredRemoveAdsEntitlement(storage);
      return false;
    }

    const receiptValidation = await validateRemoveAdsReceipt(provider, restoredPurchase);
    if (!receiptValidation) {
      await clearStoredRemoveAdsEntitlement(storage);
      return false;
    }

    await storage.setItemAsync(
      REMOVE_ADS_STORAGE_KEY,
      serializeStoredRemoveAdsEntitlementRecord(
        createStoredRemoveAdsEntitlementRecord({
          purchase: restoredPurchase,
          receiptValidation,
          source: 'restore',
        }),
      ),
    );
    return true;
  } catch {
    await clearStoredRemoveAdsEntitlement(storage);
    return false;
  } finally {
    if (connected) {
      await provider.disconnect?.();
    }
  }
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
  if (initialAdsDisabled) {
    const receiptValidation = createReceiptValidationResult({
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'mock-token-initial-remove-ads',
      transactionId: 'initial-remove-ads',
    });
    values.set(
      REMOVE_ADS_STORAGE_KEY,
      serializeStoredRemoveAdsEntitlementRecord(
        createStoredRemoveAdsEntitlementRecord({ receiptValidation, source: 'restore' }),
      ),
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

export function createWebPurchaseStorage(initialAdsDisabled = false): PurchaseStorage {
  const fallbackStorage = createMemoryPurchaseStorage(initialAdsDisabled);
  const browserStorage = getBrowserPurchaseStorage();

  if (browserStorage && initialAdsDisabled) {
    try {
      if (browserStorage.getItem(REMOVE_ADS_STORAGE_KEY) === null) {
        const receiptValidation = createReceiptValidationResult({
          productId: REMOVE_ADS_PRODUCT_ID,
          purchaseToken: 'mock-token-initial-remove-ads',
          transactionId: 'initial-remove-ads',
        });
        browserStorage.setItem(
          REMOVE_ADS_STORAGE_KEY,
          serializeStoredRemoveAdsEntitlementRecord(
            createStoredRemoveAdsEntitlementRecord({ receiptValidation, source: 'restore' }),
          ),
        );
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
  {
    grantedAt,
    purchase,
    receiptValidation,
    source = 'purchase',
    storage = createSecureStorePurchaseStorage(),
  }: Pick<PurchaseRuntimeOptions, 'storage'> & {
    grantedAt?: Date;
    purchase?: RemoveAdsPurchaseRecord;
    receiptValidation?: RemoveAdsReceiptValidationResult;
    source?: RemoveAdsGrantSource;
  } = {},
): Promise<PremiumEntitlements> {
  if (adsDisabled) {
    if (!isValidatedRemoveAdsReceipt(receiptValidation)) {
      return removeAdsEntitlements(false);
    }

    const record = createStoredRemoveAdsEntitlementRecord({
      grantedAt,
      purchase,
      receiptValidation,
      source,
    });
    await storage.setItemAsync(
      REMOVE_ADS_STORAGE_KEY,
      serializeStoredRemoveAdsEntitlementRecord(record),
    );
  } else if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(REMOVE_ADS_STORAGE_KEY);
  } else {
    await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, 'false');
  }

  return removeAdsEntitlements(adsDisabled);
}

export async function getPurchaseEntitlements({
  provider,
  storage = createSecureStorePurchaseStorage(),
}: PurchaseRuntimeOptions = {}): Promise<PremiumEntitlements> {
  const storedValue = await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY);
  const record = parseStoredRemoveAdsEntitlementRecord(storedValue);

  if (!record) {
    return removeAdsEntitlements(false);
  }

  if (!provider) {
    await clearStoredRemoveAdsEntitlement(storage);
    return removeAdsEntitlements(false);
  }

  return removeAdsEntitlements(
    await revalidateStoredRemoveAdsEntitlementRecord({
      provider,
      record,
      storage,
    }),
  );
}

async function getFailClosedPurchaseEntitlements(storage: PurchaseStorage) {
  try {
    return await getPurchaseEntitlements({ storage });
  } catch {
    return removeAdsEntitlements(false);
  }
}

export function createNativePurchaseProvider({
  iapModule,
  platform,
  purchaseTimeoutMs = 30000,
}: NativePurchaseProviderOptions = {}): RemoveAdsPurchaseProvider {
  let iapPromise: Promise<NativeIapModule> | undefined = iapModule
    ? Promise.resolve(iapModule)
    : undefined;
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
    async validateRemoveAdsReceipt(purchase) {
      return createReceiptValidationResult(purchase);
    },
    async requestRemoveAdsPurchase(productId) {
      const iap = await getIap();
      const storePlatform = await resolveNativeStorePlatform(platform);
      const storeProductId = getPurchaseStoreProductId(productId, storePlatform);
      const matchesRequestedPurchase = (purchase: RemoveAdsPurchaseRecord) =>
        purchaseMatchesProductId(purchase, productId, storeProductId);

      return new Promise<RemoveAdsPurchaseRecord | null>((resolve, reject) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let settled = false;
        const subscriptions = [
          iap.purchaseUpdatedListener((purchase) => {
            const matched = normalizePurchases(purchase).find(isRemoveAdsPurchase);
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
              apple: { sku: storeProductId },
              google: { skus: [storeProductId] },
            },
            type: 'in-app',
          })
          .then((requestResult) => {
            const matched = normalizePurchases(requestResult).find(isRemoveAdsPurchase);
            if (matched) settle(undefined, matched);
          })
          .catch((error: unknown) => settle(error));
      });
    },
    async restorePurchases() {
      const iap = await getIap();
      await iap.restorePurchases();
      return normalizePurchases(await iap.getAvailablePurchases()).filter(isRemoveAdsPurchase);
    },
  };
}

export function createMockPurchaseProvider({
  owned = false,
  pendingPurchase = false,
  receiptValidationStatus = 'valid',
}: MockPurchaseProviderOptions = {}): RemoveAdsPurchaseProvider {
  let connected = false;
  let ownsRemoveAds = owned;

  function assertConnected() {
    if (!connected) throw new Error('Mock purchase provider is not connected');
  }

  function createMockPurchase(transactionId: string): RemoveAdsPurchaseRecord {
    return {
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: `mock-token-${transactionId}`,
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
    async validateRemoveAdsReceipt(purchase) {
      assertConnected();
      if (receiptValidationStatus !== 'valid') return { status: receiptValidationStatus };
      return createReceiptValidationResult(purchase);
    },
    async requestRemoveAdsPurchase() {
      assertConnected();
      if (pendingPurchase) return null;
      ownsRemoveAds = true;
      return createMockPurchase('buy-remove-ads');
    },
    async restorePurchases(productIds) {
      assertConnected();
      if (!ownsRemoveAds || !productIds.includes(REMOVE_ADS_PRODUCT_ID)) return [];
      return [createMockPurchase('restore-remove-ads')];
    },
  };
}

async function validateRemoveAdsReceipt(
  provider: RemoveAdsPurchaseProvider,
  purchase: RemoveAdsPurchaseRecord,
): Promise<RemoveAdsReceiptValidationResult | null> {
  const receiptValidation = provider.validateRemoveAdsReceipt
    ? await provider.validateRemoveAdsReceipt(purchase, REMOVE_ADS_PRODUCT_ID)
    : createReceiptValidationResult(purchase);

  return isValidatedRemoveAdsReceipt(receiptValidation) ? receiptValidation : null;
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

    const receiptValidation = await validateRemoveAdsReceipt(provider, purchase);
    if (!receiptValidation) {
      return createResult('pending', await getPurchaseEntitlements({ storage }), purchase);
    }

    await provider.finishPurchase?.(purchase);
    const persistenceResult = await persistValidatedRemoveAdsEntitlement({
      purchase,
      receiptValidation,
      source: 'purchase',
      storage,
    });
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

    const receiptValidation = await validateRemoveAdsReceipt(provider, purchase);
    if (!receiptValidation) {
      return createResult('not_found', await getPurchaseEntitlements({ storage }), purchase);
    }

    const entitlements = await setRemoveAdsEntitlement(true, {
      purchase,
      receiptValidation,
      source: 'restore',
      storage,
    });
    return createResult('restored', entitlements, purchase);
  } finally {
    await provider.disconnect?.();
  }
}
