import type { AdPlacement, AdUnitConfig, PremiumEntitlements } from '../../types/monetization';

export type SafeAdPlacement = AdPlacement | 'exam_screen';

export const REAL_ADS_ENABLED_FOR_V1 = false;

const GOOGLE_ADS_ENABLED = process.env.EXPO_PUBLIC_GOOGLE_ADS_ENABLED !== 'false';

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
  {
    placement: 'app_open_launch',
    iosUnitId: 'ca-app-pub-3940256099942544/5575463023',
    androidUnitId: 'ca-app-pub-3940256099942544/9257395921',
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
  if (!REAL_ADS_ENABLED_FOR_V1 || !GOOGLE_ADS_ENABLED) return false;
  if (placement === 'exam_screen') return false;
  if (entitlements.adsDisabled) return false;
  const unit = getAdUnit(placement);
  return Boolean(unit?.enabled);
}

export function shouldShowLaunchPopupAd({
  alreadyShownThisLaunch,
  entitlements,
}: {
  alreadyShownThisLaunch: boolean;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
}): boolean {
  return !alreadyShownThisLaunch && shouldShowAd('app_open_launch', entitlements);
}

export function getPlatformAdUnitId(
  placement: AdPlacement,
  platform: 'ios' | 'android' | 'web' | string,
): string | undefined {
  const unit = getAdUnit(placement);
  if (!unit) return undefined;
  if (platform === 'ios') return unit.iosUnitId;
  if (platform === 'android') return unit.androidUnitId;
  return unit.androidUnitId ?? unit.iosUnitId;
}

export const adsConfig = {
  googleMobileAdsEnabled: GOOGLE_ADS_ENABLED,
  realAdsEnabled: REAL_ADS_ENABLED_FOR_V1,
  units: TEST_AD_UNITS,
  safePlacements: [
    'home_banner',
    'chapter_list_banner',
    'quiz_completed_interstitial',
    'results_native',
    'app_open_launch',
  ],
  blockedPlacements: ['exam_screen'],
};
