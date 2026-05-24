import type { PurchaseRuntimeOptions } from './purchases';

type RemoveAdsPurchaseUnavailableReason = NonNullable<
  PurchaseRuntimeOptions['purchaseUnavailableReason']
>;

type RemoveAdsUnavailableCopyBranch = {
  accessibilityHint: string;
  body: string;
  buyLabel: string;
  restoreLabel: string;
  statusMessage: string;
};

type RemoveAdsUnavailableCopyBranches = {
  nativeReceiptValidatorUnavailable: RemoveAdsUnavailableCopyBranch;
  webStoreUnavailable: RemoveAdsUnavailableCopyBranch;
};

export type ResolvedRemoveAdsUnavailableCopy = RemoveAdsUnavailableCopyBranch & {
  reason: RemoveAdsPurchaseUnavailableReason;
};

export function getRemoveAdsUnavailableCopy(
  reason: PurchaseRuntimeOptions['purchaseUnavailableReason'] | undefined,
  branches: RemoveAdsUnavailableCopyBranches,
): ResolvedRemoveAdsUnavailableCopy | undefined {
  switch (reason) {
    case undefined:
      return undefined;
    case 'web_store_unavailable':
      return {
        reason,
        ...branches.webStoreUnavailable,
      };
    case 'native_receipt_validator_unavailable':
      return {
        reason,
        ...branches.nativeReceiptValidatorUnavailable,
      };
    default: {
      const exhaustiveReason: never = reason;
      return exhaustiveReason;
    }
  }
}
