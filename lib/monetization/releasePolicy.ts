export const releaseMonetizationPolicy = {
  adSupportedByDefault: true,
  consentPromptsRequired: ['app_tracking_transparency', 'ump_consent_form'],
  noAdPlacements: ['exam_screen'],
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

export function isReleaseMonetizationPolicyReady(): boolean {
  return (
    releaseMonetizationPolicy.adSupportedByDefault &&
    releaseMonetizationPolicy.consentPromptsRequired.length === 2 &&
    releaseMonetizationPolicy.noAdPlacements.includes('exam_screen') &&
    releaseMonetizationPolicy.removeAdsPriceLabel === '29 SEK'
  );
}
