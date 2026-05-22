import type {
  NativeRemoveAdsReceiptValidator,
  RemoveAdsPurchaseRecord,
  RemoveAdsReceiptValidationResult,
} from './purchases';

export const REMOVE_ADS_RECEIPT_VALIDATOR_URL_ENV =
  'EXPO_PUBLIC_REMOVE_ADS_RECEIPT_VALIDATOR_URL' as const;

type ReceiptValidatorFetch = (
  input: string,
  init: {
    body: string;
    headers: Record<string, string>;
    method: 'POST';
  },
) => Promise<{
  json(): Promise<unknown>;
  ok: boolean;
}>;

type ReceiptValidatorEnv = Record<string, string | undefined>;

interface NativeRemoveAdsReceiptValidatorOptions {
  endpointUrl?: string;
  env?: ReceiptValidatorEnv;
  fetchImpl?: ReceiptValidatorFetch;
  platform?: string;
}

function configuredValidatorUrl(env: ReceiptValidatorEnv = process.env): string | undefined {
  const value = env[REMOVE_ADS_RECEIPT_VALIDATOR_URL_ENV]?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function hasNativeRemoveAdsReceiptValidatorConfig(
  env: ReceiptValidatorEnv = process.env,
): boolean {
  return configuredValidatorUrl(env) !== undefined;
}

function normalizeReceiptValidationResult(
  value: unknown,
  purchase: RemoveAdsPurchaseRecord,
  productId: string,
): RemoveAdsReceiptValidationResult {
  if (typeof value !== 'object' || value === null) return { status: 'invalid' };

  const record = value as Partial<RemoveAdsReceiptValidationResult>;
  if (record.status !== 'valid' && record.status !== 'invalid' && record.status !== 'pending') {
    return { status: 'invalid' };
  }

  if (record.status !== 'valid') {
    return { status: record.status };
  }

  return {
    productId: typeof record.productId === 'string' ? record.productId : productId,
    purchaseToken:
      typeof record.purchaseToken === 'string'
        ? record.purchaseToken
        : (purchase.purchaseToken ?? null),
    status: 'valid',
    transactionId:
      typeof record.transactionId === 'string'
        ? record.transactionId
        : (purchase.transactionId ?? null),
    validatedAt: typeof record.validatedAt === 'string' ? record.validatedAt : undefined,
  };
}

export function createNativeRemoveAdsReceiptValidator({
  endpointUrl,
  env = process.env,
  fetchImpl = globalThis.fetch?.bind(globalThis) as ReceiptValidatorFetch | undefined,
  platform,
}: NativeRemoveAdsReceiptValidatorOptions = {}): NativeRemoveAdsReceiptValidator | undefined {
  const validatorUrl = endpointUrl?.trim() || configuredValidatorUrl(env);
  if (!validatorUrl || !fetchImpl) return undefined;

  return async (purchase, productId) => {
    const response = await fetchImpl(validatorUrl, {
      body: JSON.stringify({
        platform,
        productId,
        purchaseToken: purchase.purchaseToken ?? null,
        raw: purchase.raw ?? null,
        transactionId: purchase.transactionId ?? null,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) return { status: 'invalid' };
    return normalizeReceiptValidationResult(await response.json(), purchase, productId);
  };
}
