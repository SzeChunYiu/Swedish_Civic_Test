import type { PremiumEntitlements, ProTierEntitlements } from '../../types/monetization';

// v1.0 entitlement states — shape pinned by
// tests/content-premium-entitlements-parity.test.js + scripts/validate-content.js.
// Do NOT add fields to these three literals; the validator demands exact key parity.
// New v1.1 Pro flags are carried by PRO_LIFETIME_ENTITLEMENTS below.
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

// v1.1 Pro Lifetime (59 SEK) — includes the ad-free entitlement plus the
// advanced study feature set. Remove Ads remains a separate lower-cost path.
// Distinct constant so v1.0 schema validators stay green.
export const PRO_LIFETIME_ENTITLEMENTS: ProTierEntitlements = {
  adsDisabled: true,
  unlimitedMockExams: true,
  fullMistakeReview: true,
  spacedRepetition: true,
  // Deferred until a production explanation-language selector exists.
  nativeLangExplanations: false,
  customStudyPlan: true,
  notesExport: true,
  // Fail closed until a production route renders a real local pass-readiness projection.
  predictedPassProbability: false,
  confidenceSlider: true,
  multiColorHighlights: true,
};

export function hasAdsDisabled(entitlements: Pick<PremiumEntitlements, 'adsDisabled'>): boolean {
  return isStrictEntitlementFlag(entitlements.adsDisabled);
}

// Legacy gate — preserved verbatim so the pinned parity test
// (tests/content-premium-entitlements-parity.test.js) keeps passing.
// New gating code should call hasProEntitlement() instead.
export function isPremiumUser(entitlements: PremiumEntitlements): boolean {
  return (
    isStrictEntitlementFlag(entitlements.unlimitedMockExams) &&
    isStrictEntitlementFlag(entitlements.fullMistakeReview)
  );
}

// Pro-tier gate. Distinct from isPremiumUser so we can evolve the gate-set
// without disturbing the legacy contract. v1.1 ties Pro to the spacedRepetition
// flag — Remove-Ads buyers do NOT pass this gate.
export function hasProEntitlement(entitlements: ProTierEntitlements): boolean {
  return (
    isStrictEntitlementFlag(entitlements.unlimitedMockExams) &&
    isStrictEntitlementFlag(entitlements.fullMistakeReview) &&
    entitlements.spacedRepetition === true
  );
}

export function isStrictEntitlementFlag(value: unknown): value is true {
  return value === true;
}

// Merge two Pro-tier entitlement records by OR-ing every flag. Used when
// combining the IAP-derived entitlement with an unexpired referral grant.
export function unionEntitlements(
  a: ProTierEntitlements,
  b: ProTierEntitlements,
): ProTierEntitlements {
  return {
    adsDisabled: isStrictEntitlementFlag(a.adsDisabled) || isStrictEntitlementFlag(b.adsDisabled),
    unlimitedMockExams:
      isStrictEntitlementFlag(a.unlimitedMockExams) ||
      isStrictEntitlementFlag(b.unlimitedMockExams),
    fullMistakeReview:
      isStrictEntitlementFlag(a.fullMistakeReview) || isStrictEntitlementFlag(b.fullMistakeReview),
    spacedRepetition:
      isStrictEntitlementFlag(a.spacedRepetition) || isStrictEntitlementFlag(b.spacedRepetition),
    // The optional schema field exists for the planned feature, but no shipped route
    // fulfills it yet, so stale stored/referral inputs must not re-enable it.
    nativeLangExplanations: false,
    customStudyPlan:
      isStrictEntitlementFlag(a.customStudyPlan) || isStrictEntitlementFlag(b.customStudyPlan),
    notesExport: isStrictEntitlementFlag(a.notesExport) || isStrictEntitlementFlag(b.notesExport),
    // The optional schema field exists for the planned feature, but no shipped route
    // fulfills it yet, so stale stored/referral inputs must not re-enable it.
    predictedPassProbability: false,
    confidenceSlider:
      isStrictEntitlementFlag(a.confidenceSlider) || isStrictEntitlementFlag(b.confidenceSlider),
    multiColorHighlights:
      isStrictEntitlementFlag(a.multiColorHighlights) ||
      isStrictEntitlementFlag(b.multiColorHighlights),
  };
}

export const premiumConfig = {
  free: FREE_ENTITLEMENTS,
  premium: PREMIUM_ENTITLEMENTS,
  removeAds: REMOVE_ADS_ENTITLEMENTS,
  proLifetime: PRO_LIFETIME_ENTITLEMENTS,
};
