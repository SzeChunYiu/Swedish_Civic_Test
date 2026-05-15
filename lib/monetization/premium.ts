import type { PremiumEntitlements } from '../../types/monetization';

export const FREE_ENTITLEMENTS: PremiumEntitlements = {
  adsDisabled: false,
  unlimitedMockExams: false,
  fullMistakeReview: false,
};

export const PREMIUM_ENTITLEMENTS: PremiumEntitlements = {
  adsDisabled: true,
  unlimitedMockExams: true,
  fullMistakeReview: true,
};

export function isPremiumUser(entitlements: PremiumEntitlements): boolean {
  return (
    entitlements.adsDisabled && entitlements.unlimitedMockExams && entitlements.fullMistakeReview
  );
}

export const premiumConfig = {
  free: FREE_ENTITLEMENTS,
  premium: PREMIUM_ENTITLEMENTS,
};
