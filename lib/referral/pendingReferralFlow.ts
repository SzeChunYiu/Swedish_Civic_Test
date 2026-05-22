import {
  clearReferralGrantSnapshot,
  persistReferralGrantSnapshot,
  type ReferralGrantStorage,
} from '../monetization/referralGrantStore';
import {
  redeemReferral,
  type ReferralRedemptionResult,
  type ReferralRedemptionStatus,
  type ReferralSupabaseClient,
} from './redeemReferral';
import { consumePendingReferralCode, type ReferralCodeStorage } from './pendingReferralStore';

export type PendingReferralGrantFlowStatus =
  | ReferralRedemptionStatus
  | 'no_pending_code'
  | 'storage_unavailable';

export interface PendingReferralGrantFlowResult {
  code: string | null;
  proGrantExpiresAtIso: string | null;
  redemption: ReferralRedemptionResult | null;
  status: PendingReferralGrantFlowStatus;
}

export async function consumePendingReferralGrant({
  client,
  grantStorage,
  pendingStorage,
  redeem = redeemReferral,
}: {
  client: ReferralSupabaseClient;
  grantStorage?: ReferralGrantStorage | null;
  pendingStorage?: ReferralCodeStorage | null;
  redeem?: (client: ReferralSupabaseClient, code: string) => Promise<ReferralRedemptionResult>;
}): Promise<PendingReferralGrantFlowResult> {
  let code: string | null = null;

  try {
    code = await consumePendingReferralCode({ storage: pendingStorage });
  } catch {
    return {
      code: null,
      proGrantExpiresAtIso: null,
      redemption: null,
      status: 'storage_unavailable',
    };
  }

  if (!code) {
    return {
      code: null,
      proGrantExpiresAtIso: null,
      redemption: null,
      status: 'no_pending_code',
    };
  }

  const redemption = await redeem(client, code);
  if (redemption.status === 'redeemed' && redemption.proGrantExpiresAtIso) {
    const grant = await persistReferralGrantSnapshot(redemption.proGrantExpiresAtIso, {
      storage: grantStorage,
    });

    return {
      code,
      proGrantExpiresAtIso: grant?.expiresAtIso ?? null,
      redemption,
      status: grant ? 'redeemed' : 'storage_unavailable',
    };
  }

  await clearReferralGrantSnapshot({ storage: grantStorage });

  return {
    code,
    proGrantExpiresAtIso: null,
    redemption,
    status: redemption.status,
  };
}
