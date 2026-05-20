export const CITIZENSHIP_RULES_EFFECTIVE_DATE = new Date('2026-06-06T00:00:00Z');
export const CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE = new Date('2026-08-17T00:00:00Z');
export const CIVIC_KNOWLEDGE_TEST_START_MONTH = 'August 2026';

export const CITIZENSHIP_RULES_SOURCE_URL =
  'https://www.migrationsverket.se/nyheter/news-archive/2026-05-06-new-rules-for-swedish-citizenship-from-6-june-2026.html';
export const CIVIC_KNOWLEDGE_TEST_SOURCE_URL = 'https://www.uhr.se/medborgarskapsprovet/';
export const CIVIC_KNOWLEDGE_TEST_ASSIGNMENT_SOURCE_URL =
  'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/';

export const CITIZENSHIP_TIMELINE_SOURCE_URLS = {
  rulesEffectiveDate: CITIZENSHIP_RULES_SOURCE_URL,
  civicKnowledgeTestStart: CIVIC_KNOWLEDGE_TEST_SOURCE_URL,
  civicKnowledgeTestDeadline: CIVIC_KNOWLEDGE_TEST_ASSIGNMENT_SOURCE_URL,
} as const;

export const EXAM_REFORM_DATE = CITIZENSHIP_RULES_EFFECTIVE_DATE;

export function daysUntil(target: Date, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

export function formatExamDate(target: Date, language: 'sv' | 'en'): string {
  return target.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// --- Personal study plan (blueprint 18) -------------------------------------
//
// generateStudyPlan is a pure function: given the user's personal test date,
// current mastery state, mocks already taken, and chosen intensity, produce a
// daily question target + weekly mock target.
//
// Deterministic — no Math.random, no I/O. Worker lane wires it to onboarding,
// home hero, and settings.

export type StudyIntensity = 'casual' | 'regular' | 'serious';

export interface StudyPlanInput {
  testDate: Date;
  now?: Date;
  totalQuestions: number; // size of the question bank
  masteredQuestions: number; // questions the user has mastered
  mocksTaken: number; // total mocks completed so far
  intensity?: StudyIntensity;
}

export interface StudyPlan {
  testDateIso: string;
  daysRemaining: number;
  /** Recommended questions per day for the remaining days. >=5, <= 80. */
  dailyQuestionTarget: number;
  /** Mocks per remaining week, integer 1..2. */
  weeklyMockTarget: number;
  /** Mocks left to hit the 6-mock goal. */
  mocksRemaining: number;
  /** Intensity used to compute the plan. */
  intensity: StudyIntensity;
  /** Set when there is not enough time to comfortably hit targets. */
  isCrunch: boolean;
  /** True when the user has not entered a test date. */
  hasTestDate: true;
  generatedAt: string;
}

const MOCKS_GOAL = 6;
const MIN_DAILY = 5;
const MAX_DAILY = 80;

function intensityFloor(intensity: StudyIntensity): number {
  switch (intensity) {
    case 'casual':
      return 10;
    case 'regular':
      return 20;
    case 'serious':
      return 40;
  }
}

export function generateStudyPlan(input: StudyPlanInput): StudyPlan {
  const {
    testDate,
    now = new Date(),
    totalQuestions,
    masteredQuestions,
    mocksTaken,
    intensity = 'regular',
  } = input;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.ceil((testDate.getTime() - now.getTime()) / msPerDay));

  const remainingQuestions = Math.max(0, totalQuestions - masteredQuestions);
  const mocksRemaining = Math.max(0, MOCKS_GOAL - mocksTaken);

  // Reserve the final 2 days for full-format mocks + light review.
  const studyDays = Math.max(1, daysRemaining - 2);

  const rawDaily = Math.ceil(remainingQuestions / studyDays);
  const dailyQuestionTarget = Math.min(
    MAX_DAILY,
    Math.max(MIN_DAILY, intensityFloor(intensity), rawDaily),
  );

  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const weeklyMockTarget = Math.min(2, Math.max(1, Math.ceil(mocksRemaining / weeksRemaining)));

  // Crunch flag: would need > 60 questions/day OR < 7 days remaining with
  // unmastered questions still to cover.
  const isCrunch = rawDaily > 60 || (daysRemaining < 7 && remainingQuestions > 0);

  return {
    testDateIso: testDate.toISOString(),
    daysRemaining,
    dailyQuestionTarget,
    weeklyMockTarget,
    mocksRemaining,
    intensity,
    isCrunch,
    hasTestDate: true,
    generatedAt: now.toISOString(),
  };
}

export interface NoTestDatePlan {
  hasTestDate: false;
}

export type MaybeStudyPlan = StudyPlan | NoTestDatePlan;
