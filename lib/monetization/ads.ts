import type { AdPlacement, AdUnitConfig, PremiumEntitlements } from '../../types/monetization';
import type { AdConsentDecision } from './consent';
import {
  REAL_AD_UNITS_JSON_ENV,
  readRealAdUnitOverrides,
  type RealAdUnitOverride,
} from './adUnitsReal';
import { isStrictEntitlementFlag } from './premium';

export type SafeAdPlacement = AdPlacement | 'exam_screen';
export type AdRuntimePlatform = 'ios' | 'android';
export type RealAdUnitSource = 'env' | 'json' | 'none';
type AdUnitEnvKeys = Record<AdPlacement, Record<AdRuntimePlatform, string>>;
type AdUnitSources = Record<AdPlacement, Record<AdRuntimePlatform, RealAdUnitSource>>;
type AdConsentGate = Pick<AdConsentDecision, 'adServingAllowed'>;

// Web placeholders do not initialize the native ad SDK; this keeps real-unit web exports previewable.
export const WEB_AD_FALLBACK_CONSENT_DECISION = { adServingAllowed: true } as const;

export const LAUNCH_POPUP_AD_ELIGIBLE_ROUTES = [
  '/',
  '/home',
  '/learn',
  '/mistakes',
  '/profile',
] as const;

export const LAUNCH_POPUP_AD_SUPPRESSED_ROUTES = [
  '/exam',
  '/practice',
  '/quiz',
  '/about-the-test',
  '/chapter',
  '/citizenship-requirements',
  '/disclaimer',
  '/onboarding',
  '/privacy',
  '/search',
  '/settings',
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

function readEnvString(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export const REAL_ADS_ENABLED = readBooleanFlag(process.env.EXPO_PUBLIC_REAL_ADS_ENABLED, false);
const MOBILE_ADS_TEST_UNIT_CONSENT_ENABLED = readBooleanFlag(
  process.env.EXPO_PUBLIC_MOBILE_ADS_TEST_UNIT_CONSENT_ENABLED,
  false,
);

const GOOGLE_ADS_ENABLED = readBooleanFlag(process.env.EXPO_PUBLIC_GOOGLE_ADS_ENABLED, true);
const REAL_AD_UNIT_OVERRIDES = readRealAdUnitOverrides();

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

function readRealAdUnitForPlatform(
  placement: AdPlacement,
  platform: AdRuntimePlatform,
  override?: RealAdUnitOverride,
): { source: RealAdUnitSource; unitId?: string } {
  const envUnitId = readEnvString(REAL_AD_UNIT_ENV_KEYS[placement][platform]);
  if (envUnitId) return { source: 'env', unitId: envUnitId };

  const overrideUnitId = platform === 'android' ? override?.androidUnitId : override?.iosUnitId;
  if (overrideUnitId) return { source: 'json', unitId: overrideUnitId };

  return { source: 'none' };
}

export const REAL_AD_UNITS: AdUnitConfig[] = TEST_AD_UNITS.map((unit) => {
  const override = REAL_AD_UNIT_OVERRIDES[unit.placement];
  const android = readRealAdUnitForPlatform(unit.placement, 'android', override);
  const ios = readRealAdUnitForPlatform(unit.placement, 'ios', override);

  return {
    ...unit,
    androidUnitId: android.unitId,
    enabled: Boolean(android.unitId || ios.unitId),
    iosUnitId: ios.unitId,
    testOnly: false,
  };
});

export const REAL_AD_UNIT_SOURCES: AdUnitSources = Object.fromEntries(
  TEST_AD_UNITS.map((unit) => {
    const override = REAL_AD_UNIT_OVERRIDES[unit.placement];
    return [
      unit.placement,
      {
        android: readRealAdUnitForPlatform(unit.placement, 'android', override).source,
        ios: readRealAdUnitForPlatform(unit.placement, 'ios', override).source,
      },
    ];
  }),
) as AdUnitSources;

export function getConfiguredAdUnits(): AdUnitConfig[] {
  return REAL_ADS_ENABLED ? REAL_AD_UNITS : TEST_AD_UNITS;
}

export function getAdUnit(placement: AdPlacement): AdUnitConfig | undefined {
  return getConfiguredAdUnits().find((unit) => unit.placement === placement);
}

export function isAdPlacementAvailableOnPlatform(
  placement: AdPlacement,
  platform?: AdRuntimePlatform | 'web' | string,
): boolean {
  const unit = getAdUnit(placement);
  if (!unit?.enabled) return false;
  if (platform === 'ios') return Boolean(unit.iosUnitId);
  if (platform === 'android') return Boolean(unit.androidUnitId);
  return Boolean(unit.androidUnitId || unit.iosUnitId);
}

export function shouldShowAd(
  placement: SafeAdPlacement,
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  consentDecision?: AdConsentGate,
  platform?: AdRuntimePlatform | 'web' | string,
): boolean {
  if (!GOOGLE_ADS_ENABLED) return false;
  if (placement === 'exam_screen') return false;
  if (isStrictEntitlementFlag(entitlements.adsDisabled)) return false;
  if (REAL_ADS_ENABLED && consentDecision?.adServingAllowed !== true) return false;
  return isAdPlacementAvailableOnPlatform(placement, platform);
}

export function shouldShowLaunchPopupAd({
  alreadyShownThisLaunch,
  consentDecision,
  entitlements,
  platform,
}: {
  alreadyShownThisLaunch: boolean;
  consentDecision?: AdConsentGate;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
  platform?: AdRuntimePlatform | 'web' | string;
}): boolean {
  return (
    !alreadyShownThisLaunch &&
    shouldShowAd('app_open_launch', entitlements, consentDecision, platform)
  );
}

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/)[0] || '/';
  return pathOnly.length > 1 ? pathOnly.replace(/\/+$/, '') : pathOnly;
}

function pathMatchesExactRoute(pathname: string, route: string): boolean {
  return normalizePathname(pathname) === route;
}

export function isLaunchPopupAdEligibleForPath(pathname: string): boolean {
  return LAUNCH_POPUP_AD_ELIGIBLE_ROUTES.some((route) => pathMatchesExactRoute(pathname, route));
}

export function shouldSuppressLaunchPopupAdForPath(pathname: string): boolean {
  return !isLaunchPopupAdEligibleForPath(pathname);
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
  mobileAdsTestUnitConsentEnabled: MOBILE_ADS_TEST_UNIT_CONSENT_ENABLED,
  realAdsEnabled: REAL_ADS_ENABLED,
  realAdsRequireConsentDecision: true,
  realUnitJsonEnvKey: REAL_AD_UNITS_JSON_ENV,
  realUnitEnvKeys: REAL_AD_UNIT_ENV_KEYS,
  realUnitSources: REAL_AD_UNIT_SOURCES,
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
  eligibleLaunchPopupRoutes: LAUNCH_POPUP_AD_ELIGIBLE_ROUTES,
  suppressedLaunchPopupRoutes: LAUNCH_POPUP_AD_SUPPRESSED_ROUTES,
};
