export type AdPlacement =
  | 'home_banner'
  | 'chapter_list_banner'
  | 'quiz_completed_interstitial'
  | 'results_native'
  | 'rewarded_extra_exam'
  | 'app_open_launch';

export interface AdUnitConfig {
  placement: AdPlacement;
  iosUnitId?: string;
  androidUnitId?: string;
  enabled: boolean;
  testOnly: boolean;
}

// v1.0 entitlement surface. Pinned by scripts/validate-content.js — adding
// fields here will break the schema parity test. v1.1 Pro flags live on
// ProTierEntitlements below.
export interface PremiumEntitlements {
  adsDisabled: boolean;
  unlimitedMockExams: boolean;
  fullMistakeReview: boolean;
}

// v1.1 Pro-tier entitlement extension (59 SEK lifetime).
// Carries the new optional flags so v1.0 schema validators stay green.
export interface ProTierEntitlements extends PremiumEntitlements {
  spacedRepetition?: boolean;
  nativeLangExplanations?: boolean;
  customStudyPlan?: boolean;
  notesExport?: boolean;
  predictedPassProbability?: boolean;
  confidenceSlider?: boolean;
  multiColorHighlights?: boolean;
}

export interface MonetizationState {
  premium: PremiumEntitlements;
  adUnits: AdUnitConfig[];
}
