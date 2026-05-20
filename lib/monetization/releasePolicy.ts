export const releaseMonetizationPolicy = {
  adSupportedByDefault: true,
  adMobAppRecordRequired: true,
  appAdsTxtReviewRequired: true,
  consentPromptsRequired: ['app_tracking_transparency', 'ump_consent_form'],
  noAdPlacements: ['exam_screen'],
  privacyReviewRequiresBinary: true,
  realAdsEnvFlag: 'EXPO_PUBLIC_REAL_ADS_ENABLED',
  removeAdsPriceLabel: '29 SEK',
  removeAdsProductId: 'com.billyyiu.almostswedish.removeads',
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
    releaseMonetizationPolicy.adMobAppRecordRequired &&
    releaseMonetizationPolicy.appAdsTxtReviewRequired &&
    releaseMonetizationPolicy.consentPromptsRequired.length === 2 &&
    releaseMonetizationPolicy.noAdPlacements.includes('exam_screen') &&
    releaseMonetizationPolicy.privacyReviewRequiresBinary &&
    releaseMonetizationPolicy.removeAdsPriceLabel === '29 SEK'
  );
}
