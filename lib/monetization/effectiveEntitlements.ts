// Effective entitlement resolver.
//
// The app accumulates entitlement signals from multiple sources:
//   1. Remove-Ads IAP (v1.0)        → just `adsDisabled`
//   2. Pro Lifetime IAP (v1.1)      → full Pro flag set
//   3. Future: referral grant       → time-bounded Pro flag set
//   4. Future: Pro 7-day free trial → time-bounded Pro flag set
//
// This module is the single resolver consumers should call to get the
// gating-ready ProTierEntitlements. Pure function, no I/O — the caller
// fetches each input from its respective source (purchase storage,
// secure local storage, or the optional remote account backend) and
// passes it in.

import { PRO_LIFETIME_ENTITLEMENTS, unionEntitlements } from './premium';
import type { PremiumEntitlements, ProTierEntitlements } from '../../types/monetization';

/** v1.0 entitlements (adsDisabled / unlimitedMockExams / fullMistakeReview). */
export interface RemoveAdsEntitlementSnapshot extends PremiumEntitlements {
  /** Marker; ignored by the resolver. */
  __source?: 'remove-ads';
}

export interface ProLifetimeEntitlementSnapshot extends ProTierEntitlements {
  __source?: 'pro-lifetime';
}

export interface ReferralGrantSnapshot {
  /** ISO8601 expiry; null/undefined means no active grant. */
  expiresAtIso?: string | null;
}

export interface ProTrialSnapshot {
  expiresAtIso?: string | null;
}

export interface EffectiveEntitlementInput {
  removeAds?: RemoveAdsEntitlementSnapshot | null;
  proLifetime?: ProLifetimeEntitlementSnapshot | null;
  referralGrant?: ReferralGrantSnapshot | null;
  proTrial?: ProTrialSnapshot | null;
  now?: Date;
}

export type EffectiveSource =
  | 'pro-lifetime'
  | 'pro-trial-active'
  | 'referral-grant-active'
  | 'remove-ads'
  | 'free';

export interface EffectiveEntitlement {
  entitlements: ProTierEntitlements;
  /** Best (highest-tier) source contributing to the entitlement. */
  primarySource: EffectiveSource;
  /** All sources whose grants are currently active, in priority order. */
  activeSources: EffectiveSource[];
  /** When the active *time-bounded* grant expires (referral or trial). Null when no expiry. */
  nextExpiryIso: string | null;
}

const FREE_ENTITLEMENT: ProTierEntitlements = {
  adsDisabled: false,
  unlimitedMockExams: false,
  fullMistakeReview: false,
  spacedRepetition: false,
  nativeLangExplanations: false,
  customStudyPlan: false,
  notesExport: false,
  predictedPassProbability: false,
  confidenceSlider: false,
  multiColorHighlights: false,
};

function parseIsoTimestamp(iso: string): number | null {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function isUnexpired(iso: string | null | undefined, now: Date): boolean {
  if (!iso) return false;
  const t = parseIsoTimestamp(iso);
  if (t === null) return false;
  return t > now.getTime();
}

function isProActive(snap: ProTierEntitlements | null | undefined): boolean {
  return Boolean(snap && snap.spacedRepetition === true);
}

function isRemoveAdsActive(snap: PremiumEntitlements | null | undefined): boolean {
  return Boolean(snap && snap.adsDisabled);
}

/**
 * Combine all entitlement sources into a single ProTierEntitlements.
 * Time-bounded grants (referral, trial) confer the full Pro set while
 * unexpired, and contribute nothing once expired.
 */
export function resolveEffectiveEntitlement(
  input: EffectiveEntitlementInput,
): EffectiveEntitlement {
  const now = input.now ?? new Date();
  const activeSources: EffectiveSource[] = [];
  let entitlements: ProTierEntitlements = { ...FREE_ENTITLEMENT };
  let nextExpiryIso: string | null = null;

  if (isProActive(input.proLifetime)) {
    entitlements = unionEntitlements(entitlements, input.proLifetime!);
    activeSources.push('pro-lifetime');
  }

  if (isUnexpired(input.proTrial?.expiresAtIso, now)) {
    entitlements = unionEntitlements(entitlements, PRO_LIFETIME_ENTITLEMENTS);
    activeSources.push('pro-trial-active');
    if (input.proTrial?.expiresAtIso) {
      nextExpiryIso = earlierIso(nextExpiryIso, input.proTrial.expiresAtIso);
    }
  }

  if (isUnexpired(input.referralGrant?.expiresAtIso, now)) {
    entitlements = unionEntitlements(entitlements, PRO_LIFETIME_ENTITLEMENTS);
    activeSources.push('referral-grant-active');
    if (input.referralGrant?.expiresAtIso) {
      nextExpiryIso = earlierIso(nextExpiryIso, input.referralGrant.expiresAtIso);
    }
  }

  if (isRemoveAdsActive(input.removeAds)) {
    entitlements = unionEntitlements(entitlements, { ...input.removeAds! });
    activeSources.push('remove-ads');
  }

  const primarySource: EffectiveSource = activeSources[0] ?? 'free';

  return { entitlements, primarySource, activeSources, nextExpiryIso };
}

function earlierIso(a: string | null, b: string): string {
  if (!a) return b;
  const aTime = parseIsoTimestamp(a);
  const bTime = parseIsoTimestamp(b);

  if (aTime === null) return b;
  if (bTime === null) return a;

  return bTime < aTime ? b : a;
}

/**
 * Convenience predicate — common gate question, "does this user have
 * the Pro feature set right now, from any source?"
 */
export function hasProRightNow(input: EffectiveEntitlementInput): boolean {
  const { entitlements } = resolveEffectiveEntitlement(input);
  return entitlements.spacedRepetition === true;
}

/**
 * For the "Pro active until X — keep it after that?" banner. Returns the
 * earliest active time-bounded expiry, or null when only the (eternal)
 * Pro Lifetime + Remove Ads grants are in play.
 */
export function timeBoundedExpiry(input: EffectiveEntitlementInput): string | null {
  return resolveEffectiveEntitlement(input).nextExpiryIso;
}
