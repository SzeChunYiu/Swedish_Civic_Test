import {
  REMOVE_ADS_ANDROID_PRODUCT_ID,
  REMOVE_ADS_IOS_PRODUCT_ID,
  REMOVE_ADS_PRICE_LABEL,
  REMOVE_ADS_PRODUCT_ID,
} from './purchases';

export const releaseMonetizationPolicy = {
  adSupportedByDefault: true,
  adMobAppRecordRequired: true,
  appAdsTxtReviewRequired: true,
  consentPromptsRequired: ['app_tracking_transparency', 'ump_consent_form'],
  noAdPlacements: ['exam_screen'],
  privacyReviewRequiresBinary: true,
  realAdsEnvFlag: 'EXPO_PUBLIC_REAL_ADS_ENABLED',
  removeAdsPriceLabel: REMOVE_ADS_PRICE_LABEL,
  removeAdsProductId: REMOVE_ADS_PRODUCT_ID,
  removeAdsStoreProductIds: {
    android: REMOVE_ADS_ANDROID_PRODUCT_ID,
    ios: REMOVE_ADS_IOS_PRODUCT_ID,
  },
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
    releaseMonetizationPolicy.removeAdsPriceLabel === '29 SEK' &&
    releaseMonetizationPolicy.removeAdsStoreProductIds.android === 'removeads' &&
    releaseMonetizationPolicy.removeAdsStoreProductIds.ios ===
      'com.billyyiu.swedishcivictest.removeads'
  );
}
