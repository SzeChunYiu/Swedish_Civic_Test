import type { PremiumEntitlements } from '../../types/monetization';
import type { AdConsentDecision } from './consent';
import { shouldShowAd, WEB_AD_FALLBACK_CONSENT_DECISION } from './ads';
import { REWARDED_EXTRA_EXAM_PLACEMENT } from './rewardedExam';

export type RewardedExtraExamAdStatus =
  | 'closed_without_reward'
  | 'earned_reward'
  | 'failed_to_load'
  | 'show_failed'
  | 'timed_out'
  | 'unavailable';

export type RewardedExtraExamReward = {
  amount: number;
  type: string;
};

export type RewardedExtraExamAdResult = {
  reward?: RewardedExtraExamReward;
  status: RewardedExtraExamAdStatus;
};

export type RewardedExtraExamRewardConfirmation = () => boolean | Promise<boolean>;

export type RewardedExtraExamWebConsentDecision = Pick<AdConsentDecision, 'adServingAllowed'>;

export type RewardedExtraExamAdOptions = {
  confirmReward?: RewardedExtraExamRewardConfirmation;
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  requestNonPersonalizedAdsOnly?: boolean;
  timeoutMs?: number;
  webConsentDecision?: RewardedExtraExamWebConsentDecision;
};

type RewardedExtraExamRuntime = typeof globalThis & {
  __SMT_E2E__?: boolean;
  __SMT_REWARDED_EXTRA_EXAM_DELAY_MS?: number;
};

function rewardedExtraExamE2EDelayMs(): number {
  const runtime = globalThis as RewardedExtraExamRuntime;
  if (runtime.__SMT_E2E__ !== true) return 0;

  const delayMs = runtime.__SMT_REWARDED_EXTRA_EXAM_DELAY_MS;
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) return 0;

  return Math.min(delayMs, 5_000);
}

function delayForRewardedExtraExamE2E(): Promise<void> {
  const delayMs = rewardedExtraExamE2EDelayMs();
  if (delayMs <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function showRewardedExtraExamAd({
  confirmReward,
  entitlements = { adsDisabled: false },
  webConsentDecision = WEB_AD_FALLBACK_CONSENT_DECISION,
}: RewardedExtraExamAdOptions = {}): Promise<RewardedExtraExamAdResult> {
  if (!shouldShowAd(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements, webConsentDecision, 'web')) {
    return { status: 'unavailable' };
  }

  await delayForRewardedExtraExamE2E();

  let rewardConfirmed = false;
  try {
    rewardConfirmed = (await confirmReward?.()) === true;
  } catch {
    rewardConfirmed = false;
  }

  if (!rewardConfirmed) {
    return { status: 'closed_without_reward' };
  }

  return {
    reward: {
      amount: 1,
      type: 'extra_mock_exam',
    },
    status: 'earned_reward',
  };
}
