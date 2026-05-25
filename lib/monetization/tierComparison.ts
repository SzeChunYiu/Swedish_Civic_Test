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

export type TierColumnId = 'free' | 'adFree' | 'pro';

const TIER_PRICE_COPY = {
  free: {
    sv: 'Gratis för alltid',
    en: 'Free forever',
  },
  adFree: {
    sv: '29 kr · engångsköp',
    en: '29 SEK · one-time',
  },
  pro: {
    sv: '59 kr · engångsköp',
    en: '59 SEK · one-time',
  },
} as const satisfies Record<TierColumnId, { sv: string; en: string }>;

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
    priceSv: TIER_PRICE_COPY.free.sv,
    priceEn: TIER_PRICE_COPY.free.en,
  },
  {
    id: 'adFree',
    labelSv: 'Annonsfri',
    labelEn: 'Ad-Free',
    priceSv: TIER_PRICE_COPY.adFree.sv,
    priceEn: TIER_PRICE_COPY.adFree.en,
  },
  {
    id: 'pro',
    labelSv: 'Pro',
    labelEn: 'Pro',
    priceSv: TIER_PRICE_COPY.pro.sv,
    priceEn: TIER_PRICE_COPY.pro.en,
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
    labelSv: 'Felgranskning',
    labelEn: 'Mistake review',
    flag: 'fullMistakeReview',
    free: { kind: 'text', sv: 'senaste 20', en: 'last 20' },
    adFree: { kind: 'text', sv: 'senaste 20', en: 'last 20' },
    pro: { kind: 'text', sv: 'hela historiken', en: 'full history' },
  },
  {
    id: 'spacedRepetition',
    labelSv: 'Distribuerad repetition',
    labelEn: 'Spaced repetition',
    flag: 'spacedRepetition',
    free: { kind: 'text', sv: '3 kort / dag', en: '3 cards / day' },
    adFree: { kind: 'text', sv: '3 kort / dag', en: '3 cards / day' },
    pro: { kind: 'text', sv: 'obegränsat', en: 'unlimited' },
  },
  {
    id: 'highlights',
    labelSv: 'Markeringar i e-bok',
    labelEn: 'Ebook highlights',
    flag: 'multiColorHighlights',
    free: { kind: 'text', sv: 'endast gult', en: 'yellow only' },
    adFree: { kind: 'text', sv: 'endast gult', en: 'yellow only' },
    pro: { kind: 'text', sv: '4 färger + anteckningar', en: '4 colors + notes' },
  },
  {
    id: 'notesExport',
    labelSv: 'Exportera anteckningar (PDF / MD)',
    labelEn: 'Notes export (PDF / MD)',
    flag: 'notesExport',
    free: CROSS,
    adFree: CROSS,
    pro: CHECK,
  },
  {
    id: 'customStudyPlan',
    labelSv: 'Anpassad studieplan (provdatum)',
    labelEn: 'Custom study plan (test date)',
    flag: 'customStudyPlan',
    free: { kind: 'text', sv: 'endast nedräkning', en: 'countdown only' },
    adFree: { kind: 'text', sv: 'endast nedräkning', en: 'countdown only' },
    pro: CHECK,
  },
  {
    id: 'confidenceSlider',
    labelSv: 'Säkerhetsskala + kalibrering',
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
    labelSv: 'Lättläst typsnitt / textstorlek / mörkt läge',
    labelEn: 'Easy-read font / text size / dark mode',
    free: CHECK,
    adFree: CHECK,
    pro: CHECK,
  },
  {
    id: 'price',
    labelSv: 'Pris',
    labelEn: 'Price',
    free: { kind: 'text', sv: TIER_PRICE_COPY.free.sv, en: TIER_PRICE_COPY.free.en },
    adFree: { kind: 'text', sv: TIER_PRICE_COPY.adFree.sv, en: TIER_PRICE_COPY.adFree.en },
    pro: { kind: 'text', sv: TIER_PRICE_COPY.pro.sv, en: TIER_PRICE_COPY.pro.en },
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
    primarySv: 'Köp Pro · 59 kr',
    primaryEn: 'Buy Pro · 59 SEK',
    secondarySv: alreadyAdFree ? 'Uppgradera till Pro' : 'Bara ta bort annonser · 29 kr',
    secondaryEn: alreadyAdFree ? 'Upgrade to Pro' : 'Just remove ads · 29 SEK',
  };
}
