import { REMOVE_ADS_PRODUCT_ID, REMOVE_ADS_STORE_PRODUCT_IDS } from './purchases';

export const releaseMonetizationPolicy = {
  adSupportedByDefault: true,
  adMobAppRecordRequired: true,
  appAdsTxtReviewRequired: true,
  consentPromptsRequired: ['app_tracking_transparency', 'ump_consent_form'],
  noAdPlacements: ['exam_screen'],
  privacyReviewRequiresBinary: true,
  proRuntimeScopeDefaultEnabled: false,
  proRuntimeScopeEnvFlag: 'EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE',
  proRuntimeScopeOverrideGate: 'release-scope-v11',
  realAdsEnvFlag: 'EXPO_PUBLIC_REAL_ADS_ENABLED',
  removeAdsPriceLabel: '29 SEK',
  removeAdsProductId: REMOVE_ADS_PRODUCT_ID,
  removeAdsStoreProductIds: REMOVE_ADS_STORE_PRODUCT_IDS,
  storeDisclosureTopics: [
    'Google Mobile Ads',
    'Remove Ads in-app purchase',
    'App Tracking Transparency',
    'Google UMP consent',
  ],
} as const;

function readBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

type ReleasePolicyE2ERuntime = typeof globalThis & {
  __SMT_E2E__?: boolean;
  __SMT_ENABLE_PRO_RUNTIME_SCOPE__?: boolean;
};

export function isProRuntimeScopeEnabled(): boolean {
  const runtime = globalThis as ReleasePolicyE2ERuntime;
  if (runtime.__SMT_E2E__ && runtime.__SMT_ENABLE_PRO_RUNTIME_SCOPE__ === true) {
    return true;
  }

  return readBooleanFlag(
    process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE,
    releaseMonetizationPolicy.proRuntimeScopeDefaultEnabled,
  );
}

export function isReleaseMonetizationPolicyReady(): boolean {
  return (
    releaseMonetizationPolicy.adSupportedByDefault &&
    releaseMonetizationPolicy.adMobAppRecordRequired &&
    releaseMonetizationPolicy.appAdsTxtReviewRequired &&
    releaseMonetizationPolicy.consentPromptsRequired.length === 2 &&
    releaseMonetizationPolicy.noAdPlacements.includes('exam_screen') &&
    releaseMonetizationPolicy.privacyReviewRequiresBinary &&
    releaseMonetizationPolicy.removeAdsPriceLabel === '29 SEK' &&
    releaseMonetizationPolicy.removeAdsStoreProductIds.android === 'removeads' &&
    releaseMonetizationPolicy.removeAdsStoreProductIds.ios === REMOVE_ADS_PRODUCT_ID
  );
}
