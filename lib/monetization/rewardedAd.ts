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

export async function showRewardedExtraExamAd({
  confirmReward,
  entitlements = { adsDisabled: false },
  webConsentDecision = WEB_AD_FALLBACK_CONSENT_DECISION,
}: RewardedExtraExamAdOptions = {}): Promise<RewardedExtraExamAdResult> {
  if (!shouldShowAd(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements, webConsentDecision, 'web')) {
    return { status: 'unavailable' };
  }

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
