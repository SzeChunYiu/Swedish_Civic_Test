import type { AdPlacement, AdUnitConfig, PremiumEntitlements } from '../../types/monetization';

export type SafeAdPlacement = AdPlacement | 'exam_screen';

export const REAL_ADS_ENABLED_FOR_V1 = false;

export const TEST_AD_UNITS: AdUnitConfig[] = [
  {
    placement: 'home_banner',
    iosUnitId: 'ca-app-pub-3940256099942544/2934735716',
    androidUnitId: 'ca-app-pub-3940256099942544/6300978111',
    enabled: true,
    testOnly: true,
  },
  {
    placement: 'chapter_list_banner',
    iosUnitId: 'ca-app-pub-3940256099942544/2934735716',
    androidUnitId: 'ca-app-pub-3940256099942544/6300978111',
    enabled: true,
    testOnly: true,
  },
  {
    placement: 'quiz_completed_interstitial',
    iosUnitId: 'ca-app-pub-3940256099942544/4411468910',
    androidUnitId: 'ca-app-pub-3940256099942544/1033173712',
    enabled: true,
    testOnly: true,
  },
  {
    placement: 'results_native',
    iosUnitId: 'ca-app-pub-3940256099942544/3986624511',
    androidUnitId: 'ca-app-pub-3940256099942544/2247696110',
    enabled: true,
    testOnly: true,
  },
];

export function getAdUnit(placement: AdPlacement): AdUnitConfig | undefined {
  return TEST_AD_UNITS.find((unit) => unit.placement === placement);
}

export function shouldShowAd(
  placement: SafeAdPlacement,
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
): boolean {
  if (!REAL_ADS_ENABLED_FOR_V1) return false;
  if (placement === 'exam_screen') return false;
  if (entitlements.adsDisabled) return false;
  const unit = getAdUnit(placement);
  return Boolean(unit?.enabled);
}

export const adsConfig = {
  realAdsEnabled: REAL_ADS_ENABLED_FOR_V1,
  units: TEST_AD_UNITS,
  safePlacements: [
    'home_banner',
    'chapter_list_banner',
    'quiz_completed_interstitial',
    'results_native',
  ],
  blockedPlacements: ['exam_screen'],
};
