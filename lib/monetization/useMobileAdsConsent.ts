import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { adsConfig } from './ads';
import { getAdSdkInitializationDecision, type AdConsentState } from './consent';
import {
  createInitialAdConsentState,
  createNativeMobileAdsConsentRuntime,
  initializeGoogleMobileAdsAfterConsent,
  type MobileAdsConsentInitializationResult,
  type MobileAdsConsentRuntime,
} from './mobileAdsConsent';
import type { PremiumEntitlements } from '../../types/monetization';

let cachedInitialization: MobileAdsConsentInitializationResult | undefined;
let initializationPromise: Promise<MobileAdsConsentInitializationResult> | undefined;

interface MobileAdsConsentInitializeOptions {
  platform?: string;
  runtime?: MobileAdsConsentRuntime;
}

function createInitialResult(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
): MobileAdsConsentInitializationResult {
  const shouldCollectConsent =
    adsConfig.googleMobileAdsEnabled && !entitlements.adsDisabled && adsConfig.realAdsEnabled;
  const state: AdConsentState = createInitialAdConsentState({
    entitlements,
    googleMobileAdsEnabled: adsConfig.googleMobileAdsEnabled,
    platform: Platform.OS,
    realAdsEnabled: adsConfig.realAdsEnabled,
    region: 'unknown',
    trackingTransparencyStatus:
      Platform.OS === 'ios' && shouldCollectConsent ? 'not_determined' : 'unavailable',
    umpConsentStatus: shouldCollectConsent ? 'unknown' : 'not_required',
  });

  return {
    decision: getAdSdkInitializationDecision(state),
    initialized: false,
    state,
  };
}

function rememberInitializationResult(
  result: MobileAdsConsentInitializationResult,
): MobileAdsConsentInitializationResult {
  if (result.initialized) {
    cachedInitialization = result;
  }

  if (!result.initialized) {
    initializationPromise = undefined;
  }

  return result;
}

export function resetMobileAdsConsentInitializationCache() {
  cachedInitialization = undefined;
  initializationPromise = undefined;
}

export function initializeMobileAdsConsentOnce(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
  options: MobileAdsConsentInitializeOptions = {},
): Promise<MobileAdsConsentInitializationResult> {
  const platform = options.platform ?? Platform.OS;
  const runtime = options.runtime ?? createNativeMobileAdsConsentRuntime(platform);

  if (entitlements.adsDisabled) {
    return initializeGoogleMobileAdsAfterConsent({
      entitlements,
      runtime,
    });
  }

  initializationPromise ??= initializeGoogleMobileAdsAfterConsent({
    entitlements,
    runtime,
  })
    .then(rememberInitializationResult)
    .catch((error: unknown) => {
      initializationPromise = undefined;
      throw error;
    });

  return initializationPromise;
}

export function useMobileAdsConsent(entitlements: Pick<PremiumEntitlements, 'adsDisabled'>) {
  const initialResult = useMemo(() => {
    if (!entitlements.adsDisabled && cachedInitialization) return cachedInitialization;
    return createInitialResult(entitlements);
  }, [entitlements]);
  const [result, setResult] = useState(initialResult);

  useEffect(() => {
    let isMounted = true;
    setResult(initialResult);

    void initializeMobileAdsConsentOnce(entitlements)
      .then((nextResult) => {
        if (isMounted) setResult(nextResult);
      })
      .catch(() => {
        if (isMounted) setResult(createInitialResult(entitlements));
      });

    return () => {
      isMounted = false;
    };
  }, [entitlements, initialResult]);

  return result;
}
