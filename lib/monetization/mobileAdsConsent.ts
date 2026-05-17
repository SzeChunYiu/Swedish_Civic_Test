import { adsConfig } from './ads';
import {
  getAdSdkInitializationDecision,
  type AdConsentPlatform,
  type AdConsentRegion,
  type AdConsentState,
  type AdSdkInitializationDecision,
  type AppTrackingTransparencyStatus,
  type UmpConsentStatus,
} from './consent';
import type { PremiumEntitlements } from '../../types/monetization';

type TrackingTransparencyModule = typeof import('expo-tracking-transparency');
type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');

export interface TrackingPermissionResult {
  granted?: boolean;
  status?: string;
}

export interface UmpConsentResult {
  canRequestAds?: boolean;
  status?: string;
}

export interface MobileAdsConsentRuntime {
  getUmpConsentInfo?: () => Promise<UmpConsentResult>;
  gatherUmpConsent?: () => Promise<UmpConsentResult>;
  getTrackingPermissionsAsync?: () => Promise<TrackingPermissionResult>;
  initializeGoogleMobileAds?: () => Promise<unknown>;
  platform: AdConsentPlatform | string;
  requestTrackingPermissionsAsync?: () => Promise<TrackingPermissionResult>;
}

export interface MobileAdsConsentOptions {
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
  googleMobileAdsEnabled?: boolean;
  realAdsEnabled?: boolean;
  region?: AdConsentRegion;
  runtime: MobileAdsConsentRuntime;
}

export interface MobileAdsConsentInitializationResult {
  decision: AdSdkInitializationDecision;
  initialized: boolean;
  state: AdConsentState;
}

function normalizeStatus(value: string | undefined): string {
  return value?.trim().toLowerCase().replaceAll('-', '_') ?? '';
}

export function normalizeAdConsentPlatform(platform: string): AdConsentPlatform {
  if (platform === 'android' || platform === 'ios' || platform === 'web') return platform;
  return 'unknown';
}

export function mapTrackingTransparencyStatus(
  permission: TrackingPermissionResult | undefined,
  platform: AdConsentPlatform,
): AppTrackingTransparencyStatus {
  if (platform !== 'ios') return 'unavailable';
  if (permission?.granted) return 'authorized';

  const status = normalizeStatus(permission?.status);
  if (status === 'authorized' || status === 'granted') return 'authorized';
  if (status === 'denied') return 'denied';
  if (status === 'restricted') return 'restricted';
  if (status === 'undetermined' || status === 'not_determined') return 'not_determined';
  return 'unavailable';
}

export function mapUmpConsentStatus(consentInfo: UmpConsentResult | undefined): UmpConsentStatus {
  const status = normalizeStatus(consentInfo?.status);
  if (consentInfo?.canRequestAds === true) return 'obtained';
  if (status === 'obtained') return 'obtained';
  if (status === 'not_required') return 'not_required';
  if (status === 'required') return 'required';
  return 'unknown';
}

export function createInitialAdConsentState({
  entitlements,
  googleMobileAdsEnabled = adsConfig.googleMobileAdsEnabled,
  platform,
  realAdsEnabled = adsConfig.realAdsEnabled,
  region = 'unknown',
  trackingTransparencyStatus,
  umpConsentStatus,
}: Omit<AdConsentState, 'platform'> & {
  platform: AdConsentPlatform | string;
}): AdConsentState {
  return {
    entitlements,
    googleMobileAdsEnabled,
    platform: normalizeAdConsentPlatform(platform),
    realAdsEnabled,
    region,
    trackingTransparencyStatus,
    umpConsentStatus,
  };
}

async function resolveTrackingTransparencyStatus(
  runtime: MobileAdsConsentRuntime,
  platform: AdConsentPlatform,
  realAdsEnabled: boolean,
): Promise<AppTrackingTransparencyStatus> {
  if (platform !== 'ios' || !realAdsEnabled) return 'unavailable';

  const currentStatus = mapTrackingTransparencyStatus(
    await runtime.getTrackingPermissionsAsync?.(),
    platform,
  );

  if (currentStatus !== 'not_determined') return currentStatus;

  return mapTrackingTransparencyStatus(await runtime.requestTrackingPermissionsAsync?.(), platform);
}

async function resolveUmpConsentStatus(
  runtime: MobileAdsConsentRuntime,
  realAdsEnabled: boolean,
): Promise<UmpConsentStatus> {
  if (!realAdsEnabled) return 'not_required';
  try {
    return mapUmpConsentStatus(await runtime.gatherUmpConsent?.());
  } catch {
    return mapUmpConsentStatus(await runtime.getUmpConsentInfo?.());
  }
}

export async function collectMobileAdsConsentState({
  entitlements,
  googleMobileAdsEnabled = adsConfig.googleMobileAdsEnabled,
  realAdsEnabled = adsConfig.realAdsEnabled,
  region = 'unknown',
  runtime,
}: MobileAdsConsentOptions): Promise<AdConsentState> {
  const platform = normalizeAdConsentPlatform(runtime.platform);
  const shouldCollectConsent =
    googleMobileAdsEnabled && !entitlements.adsDisabled && realAdsEnabled;
  const [trackingTransparencyStatus, umpConsentStatus] = await Promise.all([
    resolveTrackingTransparencyStatus(runtime, platform, shouldCollectConsent),
    resolveUmpConsentStatus(runtime, shouldCollectConsent),
  ]);

  return {
    entitlements,
    googleMobileAdsEnabled,
    platform,
    realAdsEnabled,
    region,
    trackingTransparencyStatus,
    umpConsentStatus,
  };
}

export async function initializeGoogleMobileAdsAfterConsent(
  options: MobileAdsConsentOptions,
): Promise<MobileAdsConsentInitializationResult> {
  const state = await collectMobileAdsConsentState(options);
  const decision = getAdSdkInitializationDecision(state);

  if (!decision.canInitializeGoogleMobileAds) {
    return { decision, initialized: false, state };
  }

  await options.runtime.initializeGoogleMobileAds?.();
  return { decision, initialized: true, state };
}

export function createNativeMobileAdsConsentRuntime(platform: string): MobileAdsConsentRuntime {
  let trackingModulePromise: Promise<TrackingTransparencyModule> | undefined;
  let adsModulePromise: Promise<GoogleMobileAdsModule> | undefined;
  const getTrackingModule = () => {
    trackingModulePromise ??= import('expo-tracking-transparency');
    return trackingModulePromise;
  };
  const getAdsModule = () => {
    adsModulePromise ??= import('react-native-google-mobile-ads');
    return adsModulePromise;
  };

  return {
    async gatherUmpConsent() {
      const { AdsConsent } = await getAdsModule();
      return AdsConsent.gatherConsent();
    },
    async getUmpConsentInfo() {
      const { AdsConsent } = await getAdsModule();
      return AdsConsent.getConsentInfo();
    },
    async getTrackingPermissionsAsync() {
      const trackingTransparency = await getTrackingModule();
      return trackingTransparency.getTrackingPermissionsAsync();
    },
    async initializeGoogleMobileAds() {
      const { default: mobileAds } = await getAdsModule();
      return mobileAds().initialize();
    },
    platform,
    async requestTrackingPermissionsAsync() {
      const trackingTransparency = await getTrackingModule();
      return trackingTransparency.requestTrackingPermissionsAsync();
    },
  };
}
