import { AdBanner as NativeAdBanner } from '../components/monetization/AdBanner.native';
import { AdBanner } from '../components/monetization/AdBanner';
import type { BannerAdPlacement } from '../types/monetization';

const homeBanner: BannerAdPlacement = 'home_banner';
const chapterListBanner: BannerAdPlacement = 'chapter_list_banner';
const removeAdsEntitlements = { adsDisabled: false };

export const validAdBannerPlacements = [
  <AdBanner key="web-default" />,
  <AdBanner
    key="web-home"
    entitlements={removeAdsEntitlements}
    placement={homeBanner}
  />,
  <AdBanner key="web-chapter" placement={chapterListBanner} />,
  <NativeAdBanner key="native-default" />,
  <NativeAdBanner
    key="native-home"
    entitlements={removeAdsEntitlements}
    placement={homeBanner}
  />,
  <NativeAdBanner key="native-chapter" placement={chapterListBanner} />,
];

export const invalidAdBannerPlacements = [
  // @ts-expect-error Interstitial ads must use PracticeInterstitialAd, not AdBanner.
  <AdBanner key="web-interstitial" placement="quiz_completed_interstitial" />,
  // @ts-expect-error Native results ads must use NativeAdCard, not AdBanner.
  <NativeAdBanner key="native-results" placement="results_native" />,
  // @ts-expect-error Rewarded ads are not banner placements.
  <AdBanner key="web-rewarded" placement="rewarded_extra_exam" />,
];
