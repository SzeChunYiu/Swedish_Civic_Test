import type { AppLanguage } from '../storage/settingsStore';
import type { AdPlacement } from '../../types/monetization';

type AdBannerCopy = {
  accessibilityLabel: (placementLabel: string, statusLabel: string) => string;
  liveStatus: string;
  placementLabels: Record<AdPlacement, string>;
  previewHint: string;
  removeAdsHint: string;
  testStatus: string;
};

type NativeAdCardStatusCopy = {
  accessibilityLabel: string;
  ctaAccessibilityLabel: (callToAction: string) => string;
  ctaHint: string;
  eyebrow: string;
  hint: string;
  meta: string;
  title: string;
};

type NativeAdCardCopy = NativeAdCardStatusCopy & Record<'live' | 'test', NativeAdCardStatusCopy>;

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
      rewarded_extra_exam: 'Annons för extra prov',
    },
    previewHint: 'Sponsrad annonsförhandsvisning.',
    removeAdsHint: 'Döljs när Ta bort annonser är aktivt.',
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
    previewHint: 'Sponsored ad preview.',
    removeAdsHint: 'Hidden after Remove Ads is active.',
    testStatus: 'AdMob test unit active - web preview',
  },
};

export const nativeAdCardCopy: Record<AppLanguage, NativeAdCardCopy> = {
  sv: {
    accessibilityLabel:
      'Inbyggd testannons: Annons i resultatvyn. Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov. Döljs när Ta bort annonser är aktivt.',
    ctaAccessibilityLabel: (callToAction) => `Annonsåtgärd: ${callToAction}`,
    ctaHint: 'Öppnar annonsörens erbjudande.',
    eyebrow: 'Inbyggd testannons',
    hint: 'Annonsförhandsvisning. Döljs när Ta bort annonser är aktivt.',
    meta: 'Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov.',
    title: 'Annons i resultatvyn',
    live: {
      accessibilityLabel:
        'Annons: Annons i resultatvyn. AdMob-placering aktiv. Visas inte i tidsatta prov. Döljs när Ta bort annonser är aktivt.',
      ctaAccessibilityLabel: (callToAction) => `Annonsåtgärd: ${callToAction}`,
      ctaHint: 'Öppnar annonsörens erbjudande.',
      eyebrow: 'Annons',
      hint: 'Annons. Döljs när Ta bort annonser är aktivt.',
      meta: 'AdMob-placering aktiv. Visas inte i tidsatta prov.',
      title: 'Annons i resultatvyn',
    },
    test: {
      accessibilityLabel:
        'Inbyggd testannons: Annons i resultatvyn. Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov. Döljs när Ta bort annonser är aktivt.',
      ctaAccessibilityLabel: (callToAction) => `Annonsåtgärd: ${callToAction}`,
      ctaHint: 'Öppnar annonsörens erbjudande.',
      eyebrow: 'Inbyggd testannons',
      hint: 'Annonsförhandsvisning. Döljs när Ta bort annonser är aktivt.',
      meta: 'Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov.',
      title: 'Annons i resultatvyn',
    },
  },
  en: {
    accessibilityLabel:
      'Test native ad: Results ad. AdMob test placement preview. Kept out of timed exams. Hidden after Remove Ads is active.',
    ctaAccessibilityLabel: (callToAction) => `Ad action: ${callToAction}`,
    ctaHint: 'Opens the advertiser offer.',
    eyebrow: 'Test native ad',
    hint: 'Ad preview. Hidden after Remove Ads is active.',
    meta: 'AdMob test placement preview. Kept out of timed exams.',
    title: 'Results ad',
    live: {
      accessibilityLabel:
        'Ad: Results ad. AdMob placement active. Kept out of timed exams. Hidden after Remove Ads is active.',
      ctaAccessibilityLabel: (callToAction) => `Ad action: ${callToAction}`,
      ctaHint: 'Opens the advertiser offer.',
      eyebrow: 'Ad',
      hint: 'Ad. Hidden after Remove Ads is active.',
      meta: 'AdMob placement active. Kept out of timed exams.',
      title: 'Results ad',
    },
    test: {
      accessibilityLabel:
        'Test native ad: Results ad. AdMob test placement preview. Kept out of timed exams. Hidden after Remove Ads is active.',
      ctaAccessibilityLabel: (callToAction) => `Ad action: ${callToAction}`,
      ctaHint: 'Opens the advertiser offer.',
      eyebrow: 'Test native ad',
      hint: 'Ad preview. Hidden after Remove Ads is active.',
      meta: 'AdMob test placement preview. Kept out of timed exams.',
      title: 'Results ad',
    },
  },
};

export function getNativeAdCardCopy(
  language: AppLanguage,
  status: 'live' | 'test' = 'test',
): NativeAdCardStatusCopy {
  return nativeAdCardCopy[language][status];
}
