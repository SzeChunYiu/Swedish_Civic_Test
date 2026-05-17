import type { PremiumEntitlements } from '../../types/monetization';
import { shouldShowAd } from './ads';
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

export type RewardedExtraExamAdOptions = {
  entitlements?: Pick<PremiumEntitlements, 'adsDisabled'>;
  requestNonPersonalizedAdsOnly?: boolean;
  timeoutMs?: number;
};

export async function showRewardedExtraExamAd({
  entitlements = { adsDisabled: false },
}: RewardedExtraExamAdOptions = {}): Promise<RewardedExtraExamAdResult> {
  if (!shouldShowAd(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements)) {
    return { status: 'unavailable' };
  }

  return {
    reward: {
      amount: 1,
      type: 'extra_mock_exam',
    },
    status: 'earned_reward',
  };
}
