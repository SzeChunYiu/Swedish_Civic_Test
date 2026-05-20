import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { adsConfig } from './ads';
import { getAdSdkInitializationDecision, type AdConsentState } from './consent';
import {
  createInitialAdConsentState,
  createNativeMobileAdsConsentRuntime,
  initializeGoogleMobileAdsAfterConsent,
  type MobileAdsConsentInitializationResult,
} from './mobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';

let cachedInitialization: MobileAdsConsentInitializationResult | undefined;
let cachedInitializationPlatform: string | undefined;
let initializationPromise: Promise<MobileAdsConsentInitializationResult> | undefined;
let initializationPromisePlatform: string | undefined;

export function createInitialResult(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  platform: string,
): MobileAdsConsentInitializationResult {
  const shouldCollectConsent =
    adsConfig.googleMobileAdsEnabled && !entitlements.adsDisabled && adsConfig.realAdsEnabled;
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

export function selectMobileAdsConsentInitialResult({
  cachedInitializationPlatform,
  cachedInitializationResult,
  entitlements,
  platform,
}: {
  cachedInitializationPlatform: string | undefined;
  cachedInitializationResult: MobileAdsConsentInitializationResult | undefined;
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>;
  platform: string;
}): MobileAdsConsentInitializationResult {
  if (
    !entitlements.adsDisabled &&
    cachedInitializationResult &&
    cachedInitializationPlatform === platform
  ) {
    return cachedInitializationResult;
  }
  return createInitialResult(entitlements, platform);
}

function initializeOnce(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  platform: string,
): Promise<MobileAdsConsentInitializationResult> {
  if (entitlements.adsDisabled) {
    return initializeGoogleMobileAdsAfterConsent({
      entitlements,
      runtime: createNativeMobileAdsConsentRuntime(platform),
    });
  }

  if (initializationPromisePlatform && initializationPromisePlatform !== platform) {
    initializationPromise = undefined;
  }
  initializationPromisePlatform = platform;

  initializationPromise ??= initializeGoogleMobileAdsAfterConsent({
    entitlements,
    runtime: createNativeMobileAdsConsentRuntime(platform),
  })
    .then((result) => {
      cachedInitialization = result;
      cachedInitializationPlatform = platform;
      return result;
    })
    .catch((error: unknown) => {
      initializationPromise = undefined;
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
    return selectMobileAdsConsentInitialResult({
      cachedInitializationPlatform,
      cachedInitializationResult: cachedInitialization,
      entitlements,
      platform,
    });
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
