import type { PremiumEntitlements } from '../../types/monetization';
import { REAL_ADS_ENABLED, shouldShowAd } from './ads';
import type { AdConsentDecision } from './consent';

export const REWARDED_EXTRA_EXAM_PLACEMENT = 'rewarded_extra_exam' as const;

export type MockExamAccessReason =
  | 'free_exam_available'
  | 'premium_unlimited_mock_exams'
  | 'rewarded_exam_credit'
  | 'rewarded_ad_available'
  | 'remove_ads_active'
  | 'consent_required'
  | 'ads_unavailable';

export type MockExamAccessState = {
  completedMockExamsToday: number;
  consentDecision?: Pick<AdConsentDecision, 'adServingAllowed'>;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled' | 'unlimitedMockExams'>;
  freeMockExamLimit: number;
  rewardedExtraExamCredits?: number;
};

export type MockExamAccessDecision = {
  canOfferRewardedAd: boolean;
  canStartExam: boolean;
  freeExamsRemaining: number;
  placement: typeof REWARDED_EXTRA_EXAM_PLACEMENT;
  reason: MockExamAccessReason;
  rewardedExtraExamCredits: number;
};

function toNonNegativeInteger(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

export function grantRewardedExtraExamCredit(currentCredits = 0): number {
  return toNonNegativeInteger(currentCredits) + 1;
}

export function consumeRewardedExtraExamCredit(currentCredits = 0): number {
  return Math.max(0, toNonNegativeInteger(currentCredits) - 1);
}

export function getMockExamAccessDecision({
  completedMockExamsToday,
  consentDecision,
  entitlements,
  freeMockExamLimit,
  rewardedExtraExamCredits,
}: MockExamAccessState): MockExamAccessDecision {
  const completedExams = toNonNegativeInteger(completedMockExamsToday);
  const freeLimit = toNonNegativeInteger(freeMockExamLimit);
  const freeExamsRemaining = Math.max(0, freeLimit - completedExams);
  const credits = toNonNegativeInteger(rewardedExtraExamCredits);
  const baseDecision = {
    freeExamsRemaining,
    placement: REWARDED_EXTRA_EXAM_PLACEMENT,
    rewardedExtraExamCredits: credits,
  };

  if (entitlements.unlimitedMockExams) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'premium_unlimited_mock_exams',
    };
  }

  if (freeExamsRemaining > 0) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'free_exam_available',
    };
  }

  if (credits > 0) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: true,
      reason: 'rewarded_exam_credit',
    };
  }

  if (entitlements.adsDisabled) {
    return {
      ...baseDecision,
      canOfferRewardedAd: false,
      canStartExam: false,
      reason: 'remove_ads_active',
    };
  }

  const canOfferRewardedAd = shouldShowAd(
    REWARDED_EXTRA_EXAM_PLACEMENT,
    entitlements,
    consentDecision,
  );
  const reason: MockExamAccessReason = canOfferRewardedAd
    ? 'rewarded_ad_available'
    : REAL_ADS_ENABLED && consentDecision?.adServingAllowed !== true
      ? 'consent_required'
      : 'ads_unavailable';

  return {
    ...baseDecision,
    canOfferRewardedAd,
    canStartExam: false,
    reason,
  };
}
