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

export const REMOVE_ADS_ENTITLEMENTS: PremiumEntitlements = {
  adsDisabled: true,
  unlimitedMockExams: false,
  fullMistakeReview: false,
};

export function hasAdsDisabled(entitlements: Pick<PremiumEntitlements, 'adsDisabled'>): boolean {
  return entitlements.adsDisabled;
}

export function isPremiumUser(entitlements: PremiumEntitlements): boolean {
  return entitlements.unlimitedMockExams && entitlements.fullMistakeReview;
}

export const premiumConfig = {
  free: FREE_ENTITLEMENTS,
  premium: PREMIUM_ENTITLEMENTS,
  removeAds: REMOVE_ADS_ENTITLEMENTS,
};
