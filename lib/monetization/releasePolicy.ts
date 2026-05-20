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
  removeAdsProductId: 'com.billyyiu.swedishcivictest.removeads',
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

export function isProRuntimeScopeEnabled(): boolean {
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
    releaseMonetizationPolicy.proRuntimeScopeDefaultEnabled === false &&
    releaseMonetizationPolicy.proRuntimeScopeEnvFlag === 'EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE' &&
    releaseMonetizationPolicy.proRuntimeScopeOverrideGate === 'release-scope-v11' &&
    releaseMonetizationPolicy.removeAdsPriceLabel === '29 SEK'
  );
}
