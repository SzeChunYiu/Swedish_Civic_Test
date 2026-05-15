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

export interface PremiumEntitlements {
  adsDisabled: boolean;
  unlimitedMockExams: boolean;
  fullMistakeReview: boolean;
}

export interface MonetizationState {
  premium: PremiumEntitlements;
  adUnits: AdUnitConfig[];
}
