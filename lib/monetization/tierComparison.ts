// Single source of truth for the Free / Ad-Free / Pro paywall comparison
// table — referenced from <ProPaywall /> and validated by
// tests/content-tier-comparison-parity.test.js (worker lane).
//
// Every row corresponds to either a real entitlement flag on
// `ProTierEntitlements` or a documented invariant (e.g. "audio TTS is
// always free"). When a row maps to a flag, the `flag` field MUST match
// the field name on ProTierEntitlements so a parity test can catch
// drift between marketing copy and code.

import type { ProTierEntitlements } from '../../types/monetization';
import { PRO_LIFETIME_PRICE_LABEL } from './proLifetimePurchase';
import { REMOVE_ADS_PRICE_LABEL } from './purchases';

export type TierColumnId = 'free' | 'adFree' | 'pro';

export interface TierColumn {
  id: TierColumnId;
  // copy is intentionally short — column header, not body text
  labelSv: string;
  labelEn: string;
  priceSv: string;
  priceEn: string;
}

export const TIER_COLUMNS: readonly TierColumn[] = [
  {
    id: 'free',
    labelSv: 'Gratis',
    labelEn: 'Free',
    priceSv: 'Gratis för alltid',
    priceEn: 'Free forever',
  },
  {
    id: 'adFree',
    labelSv: 'Annonsfri',
    labelEn: 'Ad-Free',
    priceSv: `${REMOVE_ADS_PRICE_LABEL} · engångsköp`,
    priceEn: `${REMOVE_ADS_PRICE_LABEL} · one-time`,
  },
  {
    id: 'pro',
    labelSv: 'Pro',
    labelEn: 'Pro',
    priceSv: `${PRO_LIFETIME_PRICE_LABEL} · engångsköp`,
    priceEn: `${PRO_LIFETIME_PRICE_LABEL} · one-time`,
  },
];

// A row's value per column is one of:
//   { kind: 'check' }         — fully included, no qualifier
//   { kind: 'cross' }         — not included
//   { kind: 'text', sv, en }  — limit text ("3/week"), feature description, etc.
export type TierCell =
  | { kind: 'check' }
  | { kind: 'cross' }
  | { kind: 'text'; sv: string; en: string };

export interface TierRow {
  id: string;
  labelSv: string;
  labelEn: string;
  // If set, the (Pro) column of this row corresponds to this entitlement flag
  // on ProTierEntitlements. Parity test checks the value matches.
  flag?: keyof ProTierEntitlements;
  free: TierCell;
  adFree: TierCell;
  pro: TierCell;
}

const CHECK: TierCell = { kind: 'check' };
const CROSS: TierCell = { kind: 'cross' };

export const TIER_ROWS: readonly TierRow[] = [
  {
    id: 'ads',
    labelSv: 'Annonser',
    labelEn: 'Ads',
    flag: 'adsDisabled',
    free: { kind: 'text', sv: 'vid sessionsskifte', en: 'at session boundaries' },
    adFree: { kind: 'text', sv: 'inga', en: 'none' },
    pro: { kind: 'text', sv: 'inga', en: 'none' },
  },
  {
    id: 'chapterPractice',
    labelSv: 'Kapitelövning',
    labelEn: 'Chapter practice',
    free: { kind: 'text', sv: 'obegränsad', en: 'unlimited' },
    adFree: { kind: 'text', sv: 'obegränsad', en: 'unlimited' },
    pro: { kind: 'text', sv: 'obegränsad', en: 'unlimited' },
  },
  {
    id: 'mockExams',
    labelSv: 'Övningsprov',
    labelEn: 'Mock exams',
    flag: 'unlimitedMockExams',
    free: { kind: 'text', sv: '3 / vecka', en: '3 / week' },
    adFree: { kind: 'text', sv: '3 / vecka', en: '3 / week' },
    pro: { kind: 'text', sv: 'obegränsat', en: 'unlimited' },
  },
  {
    id: 'mistakeReview',
    labelSv: 'Öva missade frågor',
    labelEn: 'Mistake review',
    flag: 'fullMistakeReview',
    free: { kind: 'text', sv: 'senaste 20', en: 'last 20' },
    adFree: { kind: 'text', sv: 'senaste 20', en: 'last 20' },
    pro: { kind: 'text', sv: 'hela historiken', en: 'full history' },
  },
  {
    id: 'spacedRepetition',
    labelSv: 'Repetition med intervall',
    labelEn: 'Spaced repetition',
    flag: 'spacedRepetition',
    free: { kind: 'text', sv: '3 kort / dag', en: '3 cards / day' },
    adFree: { kind: 'text', sv: '3 kort / dag', en: '3 cards / day' },
    pro: { kind: 'text', sv: 'obegränsat', en: 'unlimited' },
  },
  {
    id: 'nativeLangExplanations',
    labelSv: 'Förklaringar på modersmål',
    labelEn: 'Native-language explanations',
    flag: 'nativeLangExplanations',
    free: { kind: 'text', sv: 'sv / en', en: 'sv / en' },
    adFree: { kind: 'text', sv: 'sv / en', en: 'sv / en' },
    pro: { kind: 'text', sv: '+ zh / ar / fa / so / ti / uk', en: '+ zh / ar / fa / so / ti / uk' },
  },
  {
    id: 'customStudyPlan',
    labelSv: 'Studieplan efter provdatum',
    labelEn: 'Custom study plan (test date)',
    flag: 'customStudyPlan',
    free: { kind: 'text', sv: 'endast nedräkning', en: 'countdown only' },
    adFree: { kind: 'text', sv: 'endast nedräkning', en: 'countdown only' },
    pro: CHECK,
  },
  {
    id: 'predictedPass',
    labelSv: 'Beräknad provberedskap',
    labelEn: 'Predicted pass probability',
    flag: 'predictedPassProbability',
    free: CROSS,
    adFree: CROSS,
    pro: CHECK,
  },
  {
    id: 'confidenceSlider',
    labelSv: 'Säkerhetsskala och kalibrering',
    labelEn: 'Confidence rating + calibration',
    flag: 'confidenceSlider',
    free: CROSS,
    adFree: CROSS,
    pro: CHECK,
  },
  {
    id: 'audioTts',
    labelSv: 'Uppläsning på svenska',
    labelEn: 'Audio question playback (TTS)',
    free: CHECK,
    adFree: CHECK,
    pro: CHECK,
  },
  {
    id: 'accessibility',
    labelSv: 'Lättläst typsnitt, textstorlek och mörkt läge',
    labelEn: 'Easy-read font / text size / dark mode',
    free: CHECK,
    adFree: CHECK,
    pro: CHECK,
  },
];

// Helper for the parity test: every row whose Pro column claims a benefit must
// have a corresponding flag whose value in PRO_LIFETIME_ENTITLEMENTS is true.
export function rowsRequiringProFlag(): readonly TierRow[] {
  return TIER_ROWS.filter((row) => row.flag !== undefined);
}

// Returns the CTA label pair for the secondary "Remove Ads" button, switched
// for users who already own Ad-Free.
export interface PaywallCtaLabels {
  primarySv: string;
  primaryEn: string;
  secondarySv: string;
  secondaryEn: string;
}

export function paywallCtaLabels({ alreadyAdFree }: { alreadyAdFree: boolean }): PaywallCtaLabels {
  return {
    primarySv: `Köp Pro · ${PRO_LIFETIME_PRICE_LABEL}`,
    primaryEn: `Buy Pro · ${PRO_LIFETIME_PRICE_LABEL}`,
    secondarySv: alreadyAdFree
      ? 'Uppgradera till Pro'
      : `Bara ta bort annonser · ${REMOVE_ADS_PRICE_LABEL}`,
    secondaryEn: alreadyAdFree ? 'Upgrade to Pro' : `Just remove ads · ${REMOVE_ADS_PRICE_LABEL}`,
  };
}
