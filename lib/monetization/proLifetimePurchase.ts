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
} from './purchases';
import { appStoreProductIds } from './appStoreIdentity';
import { createNativePurchaseProvider, createSecureStorePurchaseStorage } from './purchases';
import { PRO_LIFETIME_ENTITLEMENTS, unionEntitlements } from './premium';
import type { PremiumEntitlements, ProTierEntitlements } from '../../types/monetization';

export const PRO_LIFETIME_PRODUCT_ID = appStoreProductIds.proLifetime;
export const PRO_LIFETIME_PRICE_LABEL = '59 SEK';
export const PRO_LIFETIME_STORAGE_KEY = 'monetization.proLifetime.entitled.v1';

const STORED_TRUE = 'true';

export type ProLifetimePurchaseFailureReason = 'entitlement_persistence_failed';
export type ProLifetimePurchaseStatus = 'purchased' | 'pending' | 'restored' | 'not_found';

export interface ProLifetimePurchaseResult {
  entitlements: ProTierEntitlements;
  failureReason?: ProLifetimePurchaseFailureReason;
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

function isProLifetimePurchase(purchase: RemoveAdsPurchaseRecord): boolean {
  if (purchase.productId === PRO_LIFETIME_PRODUCT_ID) return true;
  if (!purchase.raw || typeof purchase.raw !== 'object') return false;
  const raw = purchase.raw as { ids?: unknown };
  return (
    Array.isArray(raw.ids) && raw.ids.some((productId) => productId === PRO_LIFETIME_PRODUCT_ID)
  );
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
  failureReason?: ProLifetimePurchaseFailureReason,
): ProLifetimePurchaseResult {
  return {
    entitlements,
    failureReason,
    priceLabel: PRO_LIFETIME_PRICE_LABEL,
    productId: PRO_LIFETIME_PRODUCT_ID,
    purchaseToken: purchase?.purchaseToken,
    status,
    transactionId: purchase?.transactionId,
  };
}

async function getRecoverableProLifetimeEntitlement(
  storage: PurchaseStorage,
): Promise<ProTierEntitlements> {
  try {
    return await getProLifetimeEntitlement({ storage });
  } catch {
    return proLifetimeEntitlements(false);
  }
}

export async function setProLifetimeEntitlement(
  active: boolean,
  { storage = createSecureStorePurchaseStorage() }: Pick<ProLifetimeRuntimeOptions, 'storage'> = {},
): Promise<ProTierEntitlements> {
  if (active) {
    await storage.setItemAsync(PRO_LIFETIME_STORAGE_KEY, STORED_TRUE);
  } else if (storage.deleteItemAsync) {
    await storage.deleteItemAsync(PRO_LIFETIME_STORAGE_KEY);
  } else {
    await storage.setItemAsync(PRO_LIFETIME_STORAGE_KEY, 'false');
  }
  return proLifetimeEntitlements(active);
}

export async function getProLifetimeEntitlement({
  storage = createSecureStorePurchaseStorage(),
}: Pick<ProLifetimeRuntimeOptions, 'storage'> = {}): Promise<ProTierEntitlements> {
  const storedValue = await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY);
  return proLifetimeEntitlements(storedValue === STORED_TRUE);
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

    let entitlements: ProTierEntitlements;
    try {
      entitlements = await setProLifetimeEntitlement(true, { storage });
    } catch {
      return createResult(
        'pending',
        await getRecoverableProLifetimeEntitlement(storage),
        purchase,
        'entitlement_persistence_failed',
      );
    }

    await provider.finishPurchase?.(purchase);
    return createResult('purchased', entitlements, purchase);
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
    const entitlements = await setProLifetimeEntitlement(true, { storage });
    return createResult('restored', entitlements, purchase);
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
