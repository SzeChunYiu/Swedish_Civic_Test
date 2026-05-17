import { Platform } from 'react-native';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  type RewardedAdReward,
} from 'react-native-google-mobile-ads';

import { getPlatformAdUnitId } from './ads';
import {
  createNativeMobileAdsConsentRuntime,
  initializeGoogleMobileAdsAfterConsent,
} from './mobileAdsConsent';
import { REWARDED_EXTRA_EXAM_PLACEMENT } from './rewardedExam';
import type { RewardedExtraExamAdOptions, RewardedExtraExamAdResult } from './rewardedAd';

const DEFAULT_REWARDED_AD_TIMEOUT_MS = 45_000;

function toReward(reward: RewardedAdReward | undefined) {
  return reward
    ? {
        amount: reward.amount,
        type: reward.type,
      }
    : undefined;
}

export async function showRewardedExtraExamAd({
  entitlements = { adsDisabled: false },
  requestNonPersonalizedAdsOnly = false,
  timeoutMs = DEFAULT_REWARDED_AD_TIMEOUT_MS,
}: RewardedExtraExamAdOptions = {}): Promise<RewardedExtraExamAdResult> {
  const consentInitialization = await initializeGoogleMobileAdsAfterConsent({
    entitlements,
    runtime: createNativeMobileAdsConsentRuntime(Platform.OS),
  });
  const unitId = getPlatformAdUnitId(REWARDED_EXTRA_EXAM_PLACEMENT, Platform.OS);

  if (!consentInitialization.initialized) return { status: 'unavailable' };
  if (!unitId) return { status: 'unavailable' };

  return new Promise((resolve) => {
    const cleanups: Array<() => void> = [];
    let earnedReward: RewardedAdReward | undefined;
    let hasShown = false;
    let isSettled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: RewardedExtraExamAdResult) => {
      if (isSettled) return;
      isSettled = true;
      if (timeout) clearTimeout(timeout);
      for (const cleanup of cleanups.splice(0)) cleanup();
      resolve(result);
    };

    timeout = setTimeout(() => {
      finish({ status: 'timed_out' });
    }, timeoutMs);

    try {
      const rewardedAd = RewardedAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly:
          requestNonPersonalizedAdsOnly ||
          consentInitialization.decision.requestNonPersonalizedAdsOnly,
      });

      cleanups.push(
        rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
          hasShown = true;
          void rewardedAd.show().catch(() => {
            finish({ status: 'show_failed' });
          });
        }),
        rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          earnedReward = reward;
        }),
        rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          finish(
            earnedReward
              ? {
                  reward: toReward(earnedReward),
                  status: 'earned_reward',
                }
              : { status: 'closed_without_reward' },
          );
        }),
        rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
          finish({ status: hasShown ? 'show_failed' : 'failed_to_load' });
        }),
      );

      rewardedAd.load();
    } catch {
      finish({ status: hasShown ? 'show_failed' : 'failed_to_load' });
    }
  });
}
