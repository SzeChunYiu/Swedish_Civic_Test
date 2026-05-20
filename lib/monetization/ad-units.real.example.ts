import type { AdPlacement } from '../../types/monetization';

type RealAdUnitOverrideValues = Partial<Record<AdPlacement, { android?: string; ios?: string }>>;

// Copy this file to lib/monetization/ad-units.real.ts for local/operator
// release builds. The real file is gitignored so production IDs never land.
export const REAL_AD_UNIT_OVERRIDES: RealAdUnitOverrideValues = {
  app_open_launch: {
    android: undefined,
    ios: undefined,
  },
  chapter_list_banner: {
    android: undefined,
    ios: undefined,
  },
  home_banner: {
    android: undefined,
    ios: undefined,
  },
  quiz_completed_interstitial: {
    android: undefined,
    ios: undefined,
  },
  results_native: {
    android: undefined,
    ios: undefined,
  },
  rewarded_extra_exam: {
    android: undefined,
    ios: undefined,
  },
};

export default REAL_AD_UNIT_OVERRIDES;
