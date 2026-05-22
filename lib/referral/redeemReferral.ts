import {
  REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
  type ReferralGrantSnapshot,
} from '../monetization/effectiveEntitlements';
import { isReferralCode, normalizeReferralCode } from './generateCode';

export type ReferralRedemptionStatus =
  | 'redeemed'
  | 'signed_out'
  | 'invalid_code'
  | 'not_found'
  | 'profile_missing'
  | 'self_referral'
  | 'already_redeemed'
  | 'cap_reached'
  | 'onboarding_incomplete'
  | 'error';

export interface ReferralRedemptionResult {
  status: ReferralRedemptionStatus;
  code: string;
  proGrantExpiresAtIso: string | null;
  storageKey: typeof REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY;
  successfulReferrals: number | null;
}

export interface ReferralRpcResponse {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

export interface ReferralSelectResponse {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

export interface ReferralProfileQuery {
  eq(column: string, value: unknown): ReferralProfileQuery;
  maybeSingle(): Promise<ReferralSelectResponse>;
  select(columns: string): ReferralProfileQuery;
}

export interface ReferralSupabaseClient {
  auth?: {
    getUser?: () => Promise<{ data?: { user?: { id?: string | null } | null }; error?: unknown }>;
  };
  from?: (table: string) => ReferralProfileQuery;
  rpc: (functionName: string, params?: Record<string, unknown>) => Promise<ReferralRpcResponse>;
}

const REFERRAL_REDEMPTION_STATUSES = new Set<ReferralRedemptionStatus>([
  'redeemed',
  'signed_out',
  'invalid_code',
  'not_found',
  'profile_missing',
  'self_referral',
  'already_redeemed',
  'cap_reached',
  'onboarding_incomplete',
  'error',
]);

function boundedStatus(value: unknown): ReferralRedemptionStatus {
  return typeof value === 'string' &&
    REFERRAL_REDEMPTION_STATUSES.has(value as ReferralRedemptionStatus)
    ? (value as ReferralRedemptionStatus)
    : 'error';
}

function firstRow(data: unknown): Record<string, unknown> | null {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toCanonicalIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  const epochMs = parsed.getTime();
  return Number.isFinite(epochMs) ? parsed.toISOString() : null;
}

function finiteReferralCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4
    ? value
    : null;
}

export async function redeemReferral(
  client: ReferralSupabaseClient,
  code: unknown,
): Promise<ReferralRedemptionResult> {
  const normalizedCode = normalizeReferralCode(code);

  if (!isReferralCode(normalizedCode)) {
    return {
      code: normalizedCode,
      proGrantExpiresAtIso: null,
      status: 'invalid_code',
      storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
      successfulReferrals: null,
    };
  }

  const response = await client.rpc('redeem_referral', { code: normalizedCode });
  if (response.error) {
    return {
      code: normalizedCode,
      proGrantExpiresAtIso: null,
      status: 'error',
      storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
      successfulReferrals: null,
    };
  }

  const row = firstRow(response.data);
  return {
    code: normalizedCode,
    proGrantExpiresAtIso: toCanonicalIso(row?.pro_grant_expires_at),
    status: boundedStatus(row?.status),
    storageKey: REFERRAL_PRO_GRANT_EXPIRES_AT_STORAGE_KEY,
    successfulReferrals: finiteReferralCount(row?.successful_referrals),
  };
}

export async function fetchReferralGrantSnapshot(
  client: ReferralSupabaseClient,
): Promise<ReferralGrantSnapshot | null> {
  const userResponse = await client.auth?.getUser?.();
  const userId = userResponse?.data?.user?.id;
  if (!userId || !client.from) return null;

  const response = await client
    .from('profiles')
    .select('pro_grant_expires_at')
    .eq('id', userId)
    .maybeSingle();
  if (response.error) return null;

  const row = firstRow(response.data);
  const expiresAtIso = toCanonicalIso(row?.pro_grant_expires_at);
  return expiresAtIso ? { expiresAtIso } : null;
}
