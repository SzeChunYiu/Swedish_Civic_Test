import {
  REMOVE_ADS_PRODUCT_ID,
  REMOVE_ADS_RECORD_SCHEMA_VERSION,
  REMOVE_ADS_STORAGE_KEY,
  type RemoveAdsPurchaseRecord,
  type StoredRemoveAdsEntitlementRecord,
} from './purchases';

export { REMOVE_ADS_PRODUCT_ID as E2E_REMOVE_ADS_PRODUCT_ID };
export { REMOVE_ADS_STORAGE_KEY as E2E_REMOVE_ADS_STORAGE_KEY };

export type E2EPurchaseAction = 'buy' | 'restore';

export function normalizeE2EPurchaseProductId(productId: string): string {
  return productId.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function createE2EMockPurchase(
  productId: string,
  action: E2EPurchaseAction,
): RemoveAdsPurchaseRecord {
  const normalizedProductId = normalizeE2EPurchaseProductId(productId);
  const transactionId = `${action}-${normalizedProductId}`;

  return {
    productId,
    purchaseToken: `mock-token-${transactionId}`,
    raw: { ids: [productId] },
    transactionId,
  };
}

export function createStoredRemoveAdsE2ERestoreEntitlement({
  nowIso,
}: {
  nowIso: string;
}): StoredRemoveAdsEntitlementRecord {
  const restorePurchase = createE2EMockPurchase(REMOVE_ADS_PRODUCT_ID, 'restore');

  return {
    grantedAt: nowIso,
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: restorePurchase.purchaseToken,
    receiptValidatedAt: nowIso,
    receiptValidationStatus: 'valid',
    schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
    source: 'restore',
    transactionId: restorePurchase.transactionId,
  };
}
