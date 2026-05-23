import { chapters } from '../../data/chapters';
import type { ReferralSupabaseClient } from './redeemReferral';

export type ReferralOnboardingEligibilityStatus =
  | 'completed'
  | 'already_completed'
  | 'insufficient_chapters'
  | 'signed_out'
  | 'profile_missing'
  | 'error';

export interface ReferralOnboardingEligibilityResult {
  status: ReferralOnboardingEligibilityStatus;
  openedChapterIds: string[];
  referralOnboardingCompletedAtIso: string | null;
  distinctChapters: number;
}

export const REFERRAL_ONBOARDING_REQUIRED_DISTINCT_CHAPTERS = 3;
export const KNOWN_REFERRAL_ONBOARDING_CHAPTER_IDS = chapters.map((chapter) => chapter.id);

const KNOWN_REFERRAL_ONBOARDING_CHAPTER_ID_SET = new Set(KNOWN_REFERRAL_ONBOARDING_CHAPTER_IDS);
const REFERRAL_ONBOARDING_ELIGIBILITY_STATUSES = new Set<ReferralOnboardingEligibilityStatus>([
  'completed',
  'already_completed',
  'insufficient_chapters',
  'signed_out',
  'profile_missing',
  'error',
]);

function normalizeChapterId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const chapterId = value.trim().toLowerCase();
  return KNOWN_REFERRAL_ONBOARDING_CHAPTER_ID_SET.has(chapterId) ? chapterId : null;
}

export function referralOnboardingChapterIds(openedChapterIds: unknown): string[] {
  if (!Array.isArray(openedChapterIds)) return [];

  const seen = new Set<string>();
  const chapterIds: string[] = [];
  for (const value of openedChapterIds) {
    const chapterId = normalizeChapterId(value);
    if (!chapterId || seen.has(chapterId)) continue;
    seen.add(chapterId);
    chapterIds.push(chapterId);
  }

  return chapterIds;
}

function boundedStatus(value: unknown): ReferralOnboardingEligibilityStatus {
  return typeof value === 'string' &&
    REFERRAL_ONBOARDING_ELIGIBILITY_STATUSES.has(value as ReferralOnboardingEligibilityStatus)
    ? (value as ReferralOnboardingEligibilityStatus)
    : 'error';
}

function firstRow(data: unknown): Record<string, unknown> | null {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toCanonicalIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  const epochMs = parsed.getTime();
  return Number.isFinite(epochMs) ? parsed.toISOString() : null;
}

function boundedDistinctChapters(value: unknown): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= KNOWN_REFERRAL_ONBOARDING_CHAPTER_IDS.length
    ? value
    : 0;
}

export async function markReferralOnboardingComplete(
  client: Pick<ReferralSupabaseClient, 'rpc'>,
  openedChapterIds: unknown,
): Promise<ReferralOnboardingEligibilityResult> {
  const normalizedChapterIds = referralOnboardingChapterIds(openedChapterIds);
  const fallback = {
    distinctChapters: normalizedChapterIds.length,
    openedChapterIds: normalizedChapterIds,
    referralOnboardingCompletedAtIso: null,
  };

  const response = await client.rpc('mark_referral_onboarding_complete', {
    opened_chapter_ids: normalizedChapterIds,
  });

  if (response.error) {
    return {
      ...fallback,
      status: 'error',
    };
  }

  const row = firstRow(response.data);
  return {
    ...fallback,
    distinctChapters: boundedDistinctChapters(row?.distinct_chapters),
    referralOnboardingCompletedAtIso: toCanonicalIso(row?.referral_onboarding_completed_at),
    status: boundedStatus(row?.status),
  };
}
