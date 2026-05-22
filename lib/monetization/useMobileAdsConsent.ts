import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { adsConfig } from './ads';
import { getAdSdkInitializationDecision, type AdConsentState } from './consent';
import { isStrictEntitlementFlag } from './premium';
import {
  createInitialAdConsentState,
  createNativeMobileAdsConsentRuntime,
  initializeGoogleMobileAdsAfterConsent,
  shouldCollectMobileAdsConsent,
  type MobileAdsConsentInitializationResult,
} from './mobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';

let cachedInitialization: MobileAdsConsentInitializationResult | undefined;
let cachedInitializationPlatform: string | undefined;
let initializationPromise: Promise<MobileAdsConsentInitializationResult> | undefined;
let initializationPromisePlatform: string | undefined;

function resetInitializationPromise() {
  initializationPromise = undefined;
  initializationPromisePlatform = undefined;
}

function createInitialResult(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  platform: string,
): MobileAdsConsentInitializationResult {
  const shouldCollectConsent = shouldCollectMobileAdsConsent({
    entitlements,
    googleMobileAdsEnabled: adsConfig.googleMobileAdsEnabled,
    mobileAdsTestUnitConsentEnabled: adsConfig.mobileAdsTestUnitConsentEnabled,
    platform,
    realAdsEnabled: adsConfig.realAdsEnabled,
  });
  const state: AdConsentState = createInitialAdConsentState({
    entitlements,
    googleMobileAdsEnabled: adsConfig.googleMobileAdsEnabled,
    platform,
    realAdsEnabled: adsConfig.realAdsEnabled,
    region: 'unknown',
    trackingTransparencyStatus:
      platform === 'ios' && shouldCollectConsent ? 'not_determined' : 'unavailable',
    umpConsentStatus: shouldCollectConsent ? 'unknown' : 'not_required',
  });

  return {
    decision: getAdSdkInitializationDecision(state),
    initialized: false,
    state,
  };
}

function resolveInitializationResult(
  result: MobileAdsConsentInitializationResult,
  platform: string,
): MobileAdsConsentInitializationResult {
  if (!result.initialized) {
    resetInitializationPromise();
    return result;
  }

  cachedInitialization = result;
  cachedInitializationPlatform = platform;
  return result;
}

function initializeOnce(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  platform: string,
): Promise<MobileAdsConsentInitializationResult> {
  if (isStrictEntitlementFlag(entitlements.adsDisabled)) {
    return initializeGoogleMobileAdsAfterConsent({
      entitlements,
      runtime: createNativeMobileAdsConsentRuntime(platform),
    });
  }

  if (initializationPromisePlatform && initializationPromisePlatform !== platform) {
    resetInitializationPromise();
  }
  initializationPromisePlatform = platform;

  initializationPromise ??= initializeGoogleMobileAdsAfterConsent({
    entitlements,
    runtime: createNativeMobileAdsConsentRuntime(platform),
  })
    .then((result) => resolveInitializationResult(result, platform))
    .catch((error: unknown) => {
      resetInitializationPromise();
      throw error;
    });

  return initializationPromise;
}

export function useMobileAdsConsent(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  options: { platform?: string } = {},
) {
  const platform = options.platform ?? Platform.OS;
  const initialResult = useMemo(() => {
    if (
      !isStrictEntitlementFlag(entitlements.adsDisabled) &&
      cachedInitialization &&
      cachedInitializationPlatform === platform
    ) {
      return cachedInitialization;
    }
    return createInitialResult(entitlements, platform);
  }, [entitlements, platform]);
  const [result, setResult] = useState(initialResult);

  useEffect(() => {
    let isMounted = true;
    setResult(initialResult);

    void initializeOnce(entitlements, platform)
      .then((nextResult) => {
        if (isMounted) setResult(nextResult);
      })
      .catch(() => {
        if (isMounted) setResult(createInitialResult(entitlements, platform));
      });

    return () => {
      isMounted = false;
    };
  }, [entitlements, initialResult, platform]);

  return result;
}
