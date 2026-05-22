import type { PremiumEntitlements } from '../../types/monetization';
import { isStrictEntitlementFlag } from './premium';

export type AdConsentPlatform = 'android' | 'ios' | 'web' | 'unknown';
export type AdConsentRegion = 'eea' | 'uk' | 'us' | 'other' | 'unknown';
export type AppTrackingTransparencyStatus =
  | 'authorized'
  | 'denied'
  | 'not_determined'
  | 'restricted'
  | 'unavailable';
export type UmpConsentStatus = 'obtained' | 'not_required' | 'required' | 'unknown';
export type AdConsentPrompt = 'app_tracking_transparency' | 'ump_consent_form';

export interface AdConsentState {
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
  googleMobileAdsEnabled: boolean;
  platform: AdConsentPlatform;
  realAdsEnabled: boolean;
  region: AdConsentRegion;
  trackingTransparencyStatus: AppTrackingTransparencyStatus;
  umpConsentStatus: UmpConsentStatus;
}

export interface AdConsentDecision {
  adServingAllowed: boolean;
  canRequestNonPersonalizedAds: boolean;
  canRequestPersonalizedAds: boolean;
  pendingPrompts: AdConsentPrompt[];
}

export type AdSdkInitializationBlockReason =
  | 'google_ads_disabled'
  | 'remove_ads_entitlement'
  | 'pending_consent_prompts'
  | 'consent_required';

export interface AdSdkInitializationDecision {
  blockReason?: AdSdkInitializationBlockReason;
  canInitializeGoogleMobileAds: boolean;
  consentDecision: AdConsentDecision;
  requestNonPersonalizedAdsOnly: boolean;
}

export function normalizeAdConsentRegion(region: unknown): AdConsentRegion {
  if (
    region === 'eea' ||
    region === 'uk' ||
    region === 'us' ||
    region === 'other' ||
    region === 'unknown'
  ) {
    return region;
  }
  return 'unknown';
}

export function regionRequiresUmpConsent(region: unknown): boolean {
  const normalizedRegion = normalizeAdConsentRegion(region);
  return normalizedRegion === 'eea' || normalizedRegion === 'uk' || normalizedRegion === 'unknown';
}

function shouldRequestAttPrompt(state: AdConsentState): boolean {
  return (
    state.platform === 'ios' &&
    state.realAdsEnabled &&
    state.trackingTransparencyStatus === 'not_determined'
  );
}

function shouldRequestUmpConsentForm(state: AdConsentState): boolean {
  return (
    state.realAdsEnabled &&
    regionRequiresUmpConsent(state.region) &&
    (state.umpConsentStatus === 'required' || state.umpConsentStatus === 'unknown')
  );
}

function hasSatisfiedUmpRequirement(state: AdConsentState): boolean {
  if (!state.realAdsEnabled) return true;
  if (!regionRequiresUmpConsent(state.region)) return true;
  return state.umpConsentStatus === 'obtained' || state.umpConsentStatus === 'not_required';
}

export function getAdConsentDecision(state: AdConsentState): AdConsentDecision {
  if (!state.googleMobileAdsEnabled || isStrictEntitlementFlag(state.entitlements.adsDisabled)) {
    return {
      adServingAllowed: false,
      canRequestNonPersonalizedAds: false,
      canRequestPersonalizedAds: false,
      pendingPrompts: [],
    };
  }

  const pendingPrompts: AdConsentPrompt[] = [];
  if (shouldRequestAttPrompt(state)) pendingPrompts.push('app_tracking_transparency');
  if (shouldRequestUmpConsentForm(state)) pendingPrompts.push('ump_consent_form');

  const attAllowsPersonalizedAds =
    state.platform !== 'ios' || state.trackingTransparencyStatus === 'authorized';
  const umpAllowsAds = hasSatisfiedUmpRequirement(state);
  const adServingAllowed = pendingPrompts.length === 0 && umpAllowsAds;

  return {
    adServingAllowed,
    canRequestNonPersonalizedAds: adServingAllowed,
    canRequestPersonalizedAds: adServingAllowed && attAllowsPersonalizedAds,
    pendingPrompts,
  };
}

export function getAdSdkInitializationDecision(state: AdConsentState): AdSdkInitializationDecision {
  const consentDecision = getAdConsentDecision(state);

  if (!state.googleMobileAdsEnabled) {
    return {
      blockReason: 'google_ads_disabled',
      canInitializeGoogleMobileAds: false,
      consentDecision,
      requestNonPersonalizedAdsOnly: false,
    };
  }

  if (isStrictEntitlementFlag(state.entitlements.adsDisabled)) {
    return {
      blockReason: 'remove_ads_entitlement',
      canInitializeGoogleMobileAds: false,
      consentDecision,
      requestNonPersonalizedAdsOnly: false,
    };
  }

  if (consentDecision.pendingPrompts.length > 0) {
    return {
      blockReason: 'pending_consent_prompts',
      canInitializeGoogleMobileAds: false,
      consentDecision,
      requestNonPersonalizedAdsOnly: false,
    };
  }

  if (state.realAdsEnabled && !consentDecision.adServingAllowed) {
    return {
      blockReason: 'consent_required',
      canInitializeGoogleMobileAds: false,
      consentDecision,
      requestNonPersonalizedAdsOnly: false,
    };
  }

  return {
    canInitializeGoogleMobileAds: true,
    consentDecision,
    requestNonPersonalizedAdsOnly:
      consentDecision.canRequestNonPersonalizedAds && !consentDecision.canRequestPersonalizedAds,
  };
}

export const consentConfig = {
  prompts: ['app_tracking_transparency', 'ump_consent_form'],
  sdkInitRequiresConsentDecision: true,
  storeDisclosureLabels: ['App Tracking Transparency', 'Google UMP consent'],
};
