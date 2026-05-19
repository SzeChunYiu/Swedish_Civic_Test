import type { AdPlacement, AdUnitConfig, PremiumEntitlements } from '../../types/monetization';
import type { AdConsentDecision } from './consent';

export type SafeAdPlacement = AdPlacement | 'exam_screen';

type AdUnitEnvKeys = Record<AdPlacement, { android: string; ios: string }>;
type AdUnitEnvValues = Record<
  AdPlacement,
  { android: string | undefined; ios: string | undefined }
>;
type AdConsentGate = Pick<AdConsentDecision, 'adServingAllowed'>;

export const LAUNCH_POPUP_AD_SUPPRESSED_ROUTES = [
  '/exam',
  '/practice',
  '/quiz',
  '/disclaimer',
  '/privacy',
  '/sources',
  '/support',
  '/terms',
] as const;

function readBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function readEnvString(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

export const REAL_AD_UNIT_ENV_VALUES: AdUnitEnvValues = {
  app_open_launch: {
    android: readEnvString(process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_LAUNCH_UNIT_ID),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN_LAUNCH_UNIT_ID),
  },
  chapter_list_banner: {
    android: readEnvString(process.env.EXPO_PUBLIC_ADMOB_ANDROID_CHAPTER_LIST_BANNER_UNIT_ID),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_CHAPTER_LIST_BANNER_UNIT_ID),
  },
  home_banner: {
    android: readEnvString(process.env.EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER_UNIT_ID),
  },
  quiz_completed_interstitial: {
    android: readEnvString(
      process.env.EXPO_PUBLIC_ADMOB_ANDROID_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID,
    ),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID),
  },
  results_native: {
    android: readEnvString(process.env.EXPO_PUBLIC_ADMOB_ANDROID_RESULTS_NATIVE_UNIT_ID),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_RESULTS_NATIVE_UNIT_ID),
  },
  rewarded_extra_exam: {
    android: readEnvString(process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID),
    ios: readEnvString(process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID),
  },
};

function getRealAdUnitEnvValue(placement: AdPlacement, platform: 'android' | 'ios') {
  const value = REAL_AD_UNIT_ENV_VALUES[placement][platform];
  return value ? value : undefined;
}

export const REAL_ADS_ENABLED = readBooleanFlag(process.env.EXPO_PUBLIC_REAL_ADS_ENABLED, false);

const GOOGLE_ADS_ENABLED = readBooleanFlag(process.env.EXPO_PUBLIC_GOOGLE_ADS_ENABLED, true);

const REAL_AD_UNIT_ENV_KEYS: AdUnitEnvKeys = {
  app_open_launch: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_LAUNCH_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_APP_OPEN_LAUNCH_UNIT_ID',
  },
  chapter_list_banner: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_CHAPTER_LIST_BANNER_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_CHAPTER_LIST_BANNER_UNIT_ID',
  },
  home_banner: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER_UNIT_ID',
  },
  quiz_completed_interstitial: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID',
  },
  results_native: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_RESULTS_NATIVE_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_RESULTS_NATIVE_UNIT_ID',
  },
  rewarded_extra_exam: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID',
  },
};

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
    placement: 'rewarded_extra_exam',
    iosUnitId: 'ca-app-pub-3940256099942544/1712485313',
    androidUnitId: 'ca-app-pub-3940256099942544/5224354917',
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

export const REAL_AD_UNITS: AdUnitConfig[] = TEST_AD_UNITS.map((unit) => {
  const androidUnitId = getRealAdUnitEnvValue(unit.placement, 'android');
  const iosUnitId = getRealAdUnitEnvValue(unit.placement, 'ios');

  return {
    ...unit,
    androidUnitId,
    enabled: Boolean(androidUnitId || iosUnitId),
    iosUnitId,
    testOnly: false,
  };
});

export function getConfiguredAdUnits(): AdUnitConfig[] {
  return REAL_ADS_ENABLED ? REAL_AD_UNITS : TEST_AD_UNITS;
}

export function getAdUnit(placement: AdPlacement): AdUnitConfig | undefined {
  return getConfiguredAdUnits().find((unit) => unit.placement === placement);
}

export function shouldShowAd(
  placement: SafeAdPlacement,
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  consentDecision?: AdConsentGate,
): boolean {
  if (!GOOGLE_ADS_ENABLED) return false;
  if (placement === 'exam_screen') return false;
  if (entitlements.adsDisabled) return false;
  if (REAL_ADS_ENABLED && consentDecision?.adServingAllowed !== true) return false;
  const unit = getAdUnit(placement);
  return Boolean(unit?.enabled);
}

export function shouldShowLaunchPopupAd({
  alreadyShownThisLaunch,
  consentDecision,
  entitlements,
}: {
  alreadyShownThisLaunch: boolean;
  consentDecision?: AdConsentGate;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
}): boolean {
  return !alreadyShownThisLaunch && shouldShowAd('app_open_launch', entitlements, consentDecision);
}

function pathMatchesRoute(pathname: string, route: string): boolean {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return normalizedPath === route || normalizedPath.startsWith(`${route}/`);
}

export function shouldSuppressLaunchPopupAdForPath(pathname: string): boolean {
  return LAUNCH_POPUP_AD_SUPPRESSED_ROUTES.some((route) => pathMatchesRoute(pathname, route));
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
  realAdsEnabled: REAL_ADS_ENABLED,
  realAdsRequireConsentDecision: true,
  realUnitEnvKeys: REAL_AD_UNIT_ENV_KEYS,
  realUnitEnvValues: REAL_AD_UNIT_ENV_VALUES,
  realUnits: REAL_AD_UNITS,
  testUnits: TEST_AD_UNITS,
  units: getConfiguredAdUnits(),
  safePlacements: [
    'home_banner',
    'chapter_list_banner',
    'quiz_completed_interstitial',
    'results_native',
    'rewarded_extra_exam',
    'app_open_launch',
  ],
  blockedPlacements: ['exam_screen'],
  suppressedLaunchPopupRoutes: LAUNCH_POPUP_AD_SUPPRESSED_ROUTES,
};
