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

type NativeAdCardCopy = {
  accessibilityLabel: string;
  eyebrow: string;
  hint: string;
  meta: string;
  title: string;
};

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
      'Inbyggd testannons: Sponsrad studieplacering. Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov. Döljs när Ta bort annonser är aktivt.',
    eyebrow: 'Inbyggd testannons',
    hint: 'Sponsrad annonsförhandsvisning. Döljs när Ta bort annonser är aktivt.',
    meta: 'Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov.',
    title: 'Sponsrad studieplacering',
  },
  en: {
    accessibilityLabel:
      'Test native ad: Sponsored study placement. AdMob test placement preview. Keep out of timed exams. Hidden after Remove Ads is active.',
    eyebrow: 'Test native ad',
    hint: 'Sponsored ad preview. Hidden after Remove Ads is active.',
    meta: 'AdMob test placement preview. Keep out of timed exams.',
    title: 'Sponsored study placement',
  },
};
