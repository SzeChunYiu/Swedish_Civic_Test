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
let initializationPromise: Promise<MobileAdsConsentInitializationResult> | undefined;

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

function initializeOnce(
  entitlements: Pick<PremiumEntitlements, 'adsDisabled'>,
): Promise<MobileAdsConsentInitializationResult> {
  if (entitlements.adsDisabled) {
    return initializeGoogleMobileAdsAfterConsent({
      entitlements,
      runtime: createNativeMobileAdsConsentRuntime(Platform.OS),
    });
  }

  initializationPromise ??= initializeGoogleMobileAdsAfterConsent({
    entitlements,
    runtime: createNativeMobileAdsConsentRuntime(Platform.OS),
  })
    .then((result) => {
      cachedInitialization = result;
      return result;
    })
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

    void initializeOnce(entitlements)
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
