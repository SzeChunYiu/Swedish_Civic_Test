// Pro Lifetime IAP wiring (blueprint 13).
//
// Parallel module to `purchases.ts` rather than an extension — the v1.0
// Remove-Ads purchase contract is pinned by schema-parity tests, so we keep
// that file untouched and ship Pro Lifetime as a separate non-consumable.
//
// Reuses the existing `RemoveAdsPurchaseProvider` interface from
// `purchases.ts` — its methods take a productId param, the "RemoveAds" name
// is incidental (provider is generic).

import type {
  PurchaseStorage,
  RemoveAdsPurchaseProvider,
  RemoveAdsPurchaseRecord,
  RemoveAdsReceiptValidationResult,
} from './purchases';
import { isCanonicalUtcIsoTimestamp } from '../time/canonicalTimestamp';
import { appStoreProductIds } from './appStoreIdentity';
import { createNativePurchaseProvider, createSecureStorePurchaseStorage } from './purchases';
import { PRO_LIFETIME_ENTITLEMENTS, unionEntitlements } from './premium';
import type { PremiumEntitlements, ProTierEntitlements } from '../../types/monetization';

export const PRO_LIFETIME_PRODUCT_ID = appStoreProductIds.proLifetime;
export const PRO_LIFETIME_PRICE_LABEL = '59 SEK';
export const PRO_LIFETIME_STORAGE_KEY = 'monetization.proLifetime.entitled.v1';
export const PRO_LIFETIME_RECORD_SCHEMA_VERSION = 1;

type ProLifetimeGrantSource = 'purchase' | 'restore';

export type ProLifetimePurchaseStatus =
  | 'purchased'
  | 'pending'
  | 'restored'
  | 'not_found'
  | 'persistence_failed';

export interface StoredProLifetimeEntitlementRecord {
  grantedAt: string;
  productId: typeof PRO_LIFETIME_PRODUCT_ID;
  purchaseToken?: string | null;
  receiptValidatedAt: string;
  receiptValidationStatus: 'valid';
  schemaVersion: typeof PRO_LIFETIME_RECORD_SCHEMA_VERSION;
  source: ProLifetimeGrantSource;
  transactionId?: string | null;
}

export interface ProLifetimePurchaseResult {
  entitlements: ProTierEntitlements;
  priceLabel: typeof PRO_LIFETIME_PRICE_LABEL;
  productId: typeof PRO_LIFETIME_PRODUCT_ID;
  purchaseToken?: string | null;
  status: ProLifetimePurchaseStatus;
  transactionId?: string | null;
}

export interface ProLifetimeRuntimeOptions {
  provider?: RemoveAdsPurchaseProvider;
  storage?: PurchaseStorage;
}

interface ProLifetimePersistenceResult {
  entitlements: ProTierEntitlements;
  persisted: boolean;
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

function isProLifetimePurchase(purchase: RemoveAdsPurchaseRecord): boolean {
  if (purchase.productId === PRO_LIFETIME_PRODUCT_ID) return true;
  if (!purchase.raw || typeof purchase.raw !== 'object') return false;
  const raw = purchase.raw as { ids?: unknown };
  return (
    Array.isArray(raw.ids) && raw.ids.some((productId) => productId === PRO_LIFETIME_PRODUCT_ID)
  );
}

function hasStoreConfirmation(record: StoredProLifetimeEntitlementRecord): boolean {
  return Boolean(
    (record.purchaseToken || record.transactionId) &&
    record.receiptValidationStatus === 'valid' &&
    isCanonicalUtcIsoTimestamp(record.receiptValidatedAt),
  );
}

function isValidatedProLifetimeReceipt(
  result: RemoveAdsReceiptValidationResult | null | undefined,
): result is RemoveAdsReceiptValidationResult & {
  productId: typeof PRO_LIFETIME_PRODUCT_ID;
  status: 'valid';
  validatedAt: string;
} {
  return Boolean(
    result &&
    result.status === 'valid' &&
    result.productId === PRO_LIFETIME_PRODUCT_ID &&
    isCanonicalUtcIsoTimestamp(result.validatedAt) &&
    (result.purchaseToken || result.transactionId),
  );
}

function createStoredProLifetimeEntitlementRecord({
  grantedAt = new Date(),
  purchase,
  receiptValidation,
  source,
}: {
  grantedAt?: Date;
  purchase?: RemoveAdsPurchaseRecord;
  receiptValidation: RemoveAdsReceiptValidationResult;
  source: ProLifetimeGrantSource;
}): StoredProLifetimeEntitlementRecord {
  return {
    grantedAt: grantedAt.toISOString(),
    productId: PRO_LIFETIME_PRODUCT_ID,
    purchaseToken: receiptValidation.purchaseToken ?? purchase?.purchaseToken ?? null,
    receiptValidatedAt: receiptValidation.validatedAt ?? grantedAt.toISOString(),
    receiptValidationStatus: 'valid',
    schemaVersion: PRO_LIFETIME_RECORD_SCHEMA_VERSION,
    source,
    transactionId:
      receiptValidation.transactionId ?? purchase?.transactionId ?? `local-${source}-pro-lifetime`,
  };
}

function parseStoredProLifetimeEntitlementRecord(
  storedValue: string | null,
): StoredProLifetimeEntitlementRecord | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (!isRecord(parsed)) return null;

    const source = optionalString(parsed.source);
    const record: StoredProLifetimeEntitlementRecord = {
      grantedAt: optionalString(parsed.grantedAt) ?? '',
      productId: optionalString(parsed.productId) as typeof PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: optionalStoredString(parsed.purchaseToken),
      receiptValidatedAt: optionalString(parsed.receiptValidatedAt) ?? '',
      receiptValidationStatus: optionalString(parsed.receiptValidationStatus) as 'valid',
      schemaVersion: parsed.schemaVersion as typeof PRO_LIFETIME_RECORD_SCHEMA_VERSION,
      source: source as ProLifetimeGrantSource,
      transactionId: optionalStoredString(parsed.transactionId),
    };

    if (record.schemaVersion !== PRO_LIFETIME_RECORD_SCHEMA_VERSION) return null;
    if (record.productId !== PRO_LIFETIME_PRODUCT_ID) return null;
    if (record.source !== 'purchase' && record.source !== 'restore') return null;
    if (!isCanonicalUtcIsoTimestamp(record.grantedAt)) return null;
    if (!hasStoreConfirmation(record)) return null;

    return record;
  } catch {
    return null;
  }
}

function serializeStoredProLifetimeEntitlementRecord(
  record: StoredProLifetimeEntitlementRecord,
): string {
  return JSON.stringify(record);
}

async function clearStoredProLifetimeEntitlement(storage: PurchaseStorage): Promise<void> {
  if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(PRO_LIFETIME_STORAGE_KEY);
    return;
  }

  await storage.setItemAsync(PRO_LIFETIME_STORAGE_KEY, 'false');
}

function purchaseMatchesStoredRecord(
  purchase: RemoveAdsPurchaseRecord,
  record: StoredProLifetimeEntitlementRecord,
): boolean {
  if (!isProLifetimePurchase(purchase)) return false;
  if (record.purchaseToken && purchase.purchaseToken === record.purchaseToken) return true;
  if (record.transactionId && purchase.transactionId === record.transactionId) return true;
  return false;
}

async function validateProLifetimeReceipt(
  provider: RemoveAdsPurchaseProvider,
  purchase: RemoveAdsPurchaseRecord,
): Promise<RemoveAdsReceiptValidationResult | null> {
  type ReceiptProductId = Parameters<
    NonNullable<RemoveAdsPurchaseProvider['validateRemoveAdsReceipt']>
  >[1];
  const receiptValidation = provider.validateRemoveAdsReceipt
    ? await provider.validateRemoveAdsReceipt(purchase, PRO_LIFETIME_PRODUCT_ID as ReceiptProductId)
    : ({ status: 'pending' } satisfies RemoveAdsReceiptValidationResult);

  return isValidatedProLifetimeReceipt(receiptValidation) ? receiptValidation : null;
}

async function persistValidatedProLifetimeEntitlement({
  purchase,
  receiptValidation,
  source,
  storage,
}: {
  purchase: RemoveAdsPurchaseRecord;
  receiptValidation: RemoveAdsReceiptValidationResult;
  source: ProLifetimeGrantSource;
  storage: PurchaseStorage;
}): Promise<ProLifetimePersistenceResult> {
  try {
    const entitlements = await setProLifetimeEntitlement(true, {
      purchase,
      receiptValidation,
      source,
      storage,
    });
    return {
      entitlements,
      persisted: entitlements.spacedRepetition === true,
    };
  } catch {
    try {
      await clearStoredProLifetimeEntitlement(storage);
    } catch {
      // The caller gets a recoverable persistence_failed result even if cleanup fails.
    }
    return {
      entitlements: proLifetimeEntitlements(false),
      persisted: false,
    };
  }
}

async function revalidateStoredProLifetimeEntitlementRecord({
  provider,
  record,
  storage,
}: {
  provider: RemoveAdsPurchaseProvider;
  record: StoredProLifetimeEntitlementRecord;
  storage: PurchaseStorage;
}): Promise<boolean> {
  let connected = false;

  try {
    await provider.connect();
    connected = true;

    const availablePurchases = await provider.restorePurchases([PRO_LIFETIME_PRODUCT_ID]);
    const restoredPurchase =
      availablePurchases.find((purchase) => purchaseMatchesStoredRecord(purchase, record)) ??
      availablePurchases.find(isProLifetimePurchase);

    if (!restoredPurchase) {
      await clearStoredProLifetimeEntitlement(storage);
      return false;
    }

    const receiptValidation = await validateProLifetimeReceipt(provider, restoredPurchase);
    if (!receiptValidation) {
      await clearStoredProLifetimeEntitlement(storage);
      return false;
    }

    await storage.setItemAsync(
      PRO_LIFETIME_STORAGE_KEY,
      serializeStoredProLifetimeEntitlementRecord(
        createStoredProLifetimeEntitlementRecord({
          purchase: restoredPurchase,
          receiptValidation,
          source: 'restore',
        }),
      ),
    );
    return true;
  } catch {
    await clearStoredProLifetimeEntitlement(storage);
    return false;
  } finally {
    if (connected) {
      await provider.disconnect?.();
    }
  }
}

function proLifetimeEntitlements(active: boolean): ProTierEntitlements {
  if (!active) {
    return {
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
  }
  return PRO_LIFETIME_ENTITLEMENTS;
}

function createResult(
  status: ProLifetimePurchaseStatus,
  entitlements: ProTierEntitlements,
  purchase?: RemoveAdsPurchaseRecord,
): ProLifetimePurchaseResult {
  return {
    entitlements,
    priceLabel: PRO_LIFETIME_PRICE_LABEL,
    productId: PRO_LIFETIME_PRODUCT_ID,
    purchaseToken: purchase?.purchaseToken,
    status,
    transactionId: purchase?.transactionId,
  };
}

export async function setProLifetimeEntitlement(
  active: boolean,
  {
    grantedAt,
    purchase,
    receiptValidation,
    source = 'purchase',
    storage = createSecureStorePurchaseStorage(),
  }: Pick<ProLifetimeRuntimeOptions, 'storage'> & {
    grantedAt?: Date;
    purchase?: RemoveAdsPurchaseRecord;
    receiptValidation?: RemoveAdsReceiptValidationResult;
    source?: ProLifetimeGrantSource;
  } = {},
): Promise<ProTierEntitlements> {
  if (active) {
    if (!isValidatedProLifetimeReceipt(receiptValidation)) {
      return proLifetimeEntitlements(false);
    }

    const record = createStoredProLifetimeEntitlementRecord({
      grantedAt,
      purchase,
      receiptValidation,
      source,
    });
    await storage.setItemAsync(
      PRO_LIFETIME_STORAGE_KEY,
      serializeStoredProLifetimeEntitlementRecord(record),
    );
  } else if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(PRO_LIFETIME_STORAGE_KEY);
  } else {
    await storage.setItemAsync(PRO_LIFETIME_STORAGE_KEY, 'false');
  }
  return proLifetimeEntitlements(active);
}

export async function getProLifetimeEntitlement({
  provider,
  storage = createSecureStorePurchaseStorage(),
}: ProLifetimeRuntimeOptions = {}): Promise<ProTierEntitlements> {
  const storedValue = await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY);
  const record = parseStoredProLifetimeEntitlementRecord(storedValue);

  if (!record) {
    return proLifetimeEntitlements(false);
  }

  if (!provider) {
    return proLifetimeEntitlements(true);
  }

  return proLifetimeEntitlements(
    await revalidateStoredProLifetimeEntitlementRecord({
      provider,
      record,
      storage,
    }),
  );
}

export async function buyProLifetime({
  provider = createNativePurchaseProvider(),
  storage = createSecureStorePurchaseStorage(),
}: ProLifetimeRuntimeOptions = {}): Promise<ProLifetimePurchaseResult> {
  await provider.connect();
  try {
    const purchase = await provider.requestRemoveAdsPurchase(PRO_LIFETIME_PRODUCT_ID);
    if (!purchase || !isProLifetimePurchase(purchase)) {
      return createResult('pending', await getProLifetimeEntitlement({ storage }));
    }

    const receiptValidation = await validateProLifetimeReceipt(provider, purchase);
    if (!receiptValidation) {
      return createResult('pending', await getProLifetimeEntitlement({ storage }), purchase);
    }

    const persistenceResult = await persistValidatedProLifetimeEntitlement({
      purchase,
      receiptValidation,
      source: 'purchase',
      storage,
    });
    if (!persistenceResult.persisted) {
      return createResult('persistence_failed', persistenceResult.entitlements, purchase);
    }

    await provider.finishPurchase?.(purchase);
    return createResult('purchased', persistenceResult.entitlements, purchase);
  } finally {
    await provider.disconnect?.();
  }
}

export async function restoreProLifetime({
  provider = createNativePurchaseProvider(),
  storage = createSecureStorePurchaseStorage(),
}: ProLifetimeRuntimeOptions = {}): Promise<ProLifetimePurchaseResult> {
  await provider.connect();
  try {
    const purchases = await provider.restorePurchases([PRO_LIFETIME_PRODUCT_ID]);
    const purchase = purchases.find(isProLifetimePurchase);
    if (!purchase) {
      return createResult('not_found', await getProLifetimeEntitlement({ storage }));
    }

    const receiptValidation = await validateProLifetimeReceipt(provider, purchase);
    if (!receiptValidation) {
      return createResult('not_found', await getProLifetimeEntitlement({ storage }), purchase);
    }

    const persistenceResult = await persistValidatedProLifetimeEntitlement({
      purchase,
      receiptValidation,
      source: 'restore',
      storage,
    });
    if (!persistenceResult.persisted) {
      return createResult('persistence_failed', persistenceResult.entitlements, purchase);
    }

    return createResult('restored', persistenceResult.entitlements, purchase);
  } finally {
    await provider.disconnect?.();
  }
}

/**
 * Merge the v1.0 Remove-Ads entitlement (already on the device, possibly
 * just `adsDisabled=true`) with the v1.1 Pro Lifetime entitlement. Use this
 * to derive the effective entitlement at runtime — Pro is a superset, so
 * union always works (no field is "true on Remove Ads, false on Pro").
 */
export function mergeWithRemoveAds(
  removeAds: PremiumEntitlements,
  pro: ProTierEntitlements,
): ProTierEntitlements {
  return unionEntitlements({ ...removeAds }, pro);
}
