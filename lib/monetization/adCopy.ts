import type { AppLanguage } from '../storage/settingsStore';
import type { AdPlacement, AdUnitConfig } from '../../types/monetization';

type AdBannerCopy = {
  accessibilityLabel: (placementLabel: string, statusLabel: string) => string;
  liveHint: string;
  liveStatus: string;
  placementLabels: Record<AdPlacement, string>;
  removeAdsHint: string;
  testHint: string;
  testStatus: string;
};

type NativeAdCardVariantCopy = {
  accessibilityLabel: string;
  eyebrow: string;
  hint: string;
  meta: string;
  title: string;
};

type NativeAdCardSharedCopy = {
  ctaAccessibilityLabel: (callToAction: string) => string;
  ctaHint: string;
};

type NativeAdCardCopy = NativeAdCardSharedCopy & {
  live: NativeAdCardVariantCopy;
  test: NativeAdCardVariantCopy;
};

type NativeAdCardResolvedCopy = NativeAdCardSharedCopy & NativeAdCardVariantCopy;

export const adBannerCopy: Record<AppLanguage, AdBannerCopy> = {
  sv: {
    accessibilityLabel: (placementLabel, statusLabel) =>
      `Google AdMob: ${placementLabel}. ${statusLabel}. Döljs när Ta bort annonser är aktivt.`,
    liveStatus: 'AdMob-placering aktiv',
    placementLabels: {
      app_open_launch: 'Startannons',
      chapter_list_banner: 'Annons i kapitellistan',
      home_banner: 'Annons på startsidan',
      quiz_completed_interstitial: 'Annons efter övning',
      results_native: 'Annons i resultat och misstag',
      rewarded_extra_exam: 'Annons för extra övningsprov',
    },
    liveHint: 'Sponsrad annons från Google AdMob.',
    removeAdsHint: 'Döljs när Ta bort annonser är aktivt.',
    testHint: 'Sponsrad annonsförhandsvisning med AdMob-testenhet.',
    testStatus: 'AdMob-testannons aktiv - webbförhandsvisning',
  },
  en: {
    accessibilityLabel: (placementLabel, statusLabel) =>
      `Google AdMob: ${placementLabel}. ${statusLabel}. Hidden after Remove Ads is active.`,
    liveStatus: 'AdMob placement active',
    placementLabels: {
      app_open_launch: 'Launch ad',
      chapter_list_banner: 'Chapter list banner',
      home_banner: 'Home banner',
      quiz_completed_interstitial: 'Practice completion ad',
      results_native: 'Results and mistakes ad',
      rewarded_extra_exam: 'Extra exam ad',
    },
    liveHint: 'Sponsored ad from Google AdMob.',
    removeAdsHint: 'Hidden after Remove Ads is active.',
    testHint: 'Sponsored ad preview with an AdMob test unit.',
    testStatus: 'AdMob test unit active - web preview',
  },
};

export const nativeAdCardCopy: Record<AppLanguage, NativeAdCardCopy> = {
  sv: {
    ctaAccessibilityLabel: (callToAction) => `Annonsåtgärd: ${callToAction}`,
    ctaHint: 'Aktiverar annonsens åtgärd.',
    live: {
      accessibilityLabel:
        'Annons: Google AdMob-placering. Visas inte i tidsatta övningsprov. Döljs när Ta bort annonser är aktivt.',
      eyebrow: 'Annons',
      hint: 'Annons från Google AdMob. Döljs när Ta bort annonser är aktivt.',
      meta: 'Google AdMob-placering. Visas inte i tidsatta övningsprov.',
      title: 'Annons från Google AdMob',
    },
    test: {
      accessibilityLabel:
        'Inbyggd testannons: AdMob-testplacering. Förhandsvisning som inte visas i tidsatta övningsprov. Döljs när Ta bort annonser är aktivt.',
      eyebrow: 'Inbyggd testannons',
      hint: 'Testannonsförhandsvisning. Döljs när Ta bort annonser är aktivt.',
      meta: 'AdMob-testplacering. Visas inte i tidsatta övningsprov.',
      title: 'AdMob-testannons',
    },
  },
  en: {
    ctaAccessibilityLabel: (callToAction) => `Ad action: ${callToAction}`,
    ctaHint: 'Activates the ad action.',
    live: {
      accessibilityLabel:
        'Ad: Google AdMob placement. Kept out of timed mock exams. Hidden after Remove Ads is active.',
      eyebrow: 'Ad',
      hint: 'Google AdMob ad. Hidden after Remove Ads is active.',
      meta: 'Google AdMob placement. Kept out of timed mock exams.',
      title: 'Google AdMob ad',
    },
    test: {
      accessibilityLabel:
        'Test native ad: AdMob test placement preview. Kept out of timed mock exams. Hidden after Remove Ads is active.',
      eyebrow: 'Test native ad',
      hint: 'Test ad preview. Hidden after Remove Ads is active.',
      meta: 'AdMob test placement preview. Kept out of timed mock exams.',
      title: 'AdMob test ad',
    },
  },
};

export function getNativeAdCardCopy(
  language: AppLanguage,
  unit: Pick<AdUnitConfig, 'testOnly'> | undefined,
): NativeAdCardResolvedCopy {
  const copy = nativeAdCardCopy[language];
  const variant = unit?.testOnly ? copy.test : copy.live;

  return {
    ...variant,
    ctaAccessibilityLabel: copy.ctaAccessibilityLabel,
    ctaHint: copy.ctaHint,
  };
}
