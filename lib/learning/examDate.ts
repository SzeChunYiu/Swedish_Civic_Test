export const CITIZENSHIP_RULES_EFFECTIVE_DATE = new Date('2026-06-06T00:00:00Z');
export const EXAM_REFORM_DATE = CITIZENSHIP_RULES_EFFECTIVE_DATE;
export const CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE = new Date('2026-08-15T00:00:00Z');
export const CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE = new Date('2026-08-17T00:00:00Z');

export const CITIZENSHIP_TIMELINE_SOURCE_URLS = {
  rulesEffectiveDate:
    'https://www.migrationsverket.se/nyheter/news-archive/2026-05-06-new-rules-for-swedish-citizenship-from-6-june-2026.html',
  civicKnowledgeTestStart: 'https://www.uhr.se/medborgarskapsprovet/',
  civicKnowledgeTestFirstSitting: 'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  civicKnowledgeTestDeadline:
    'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
} as const;

function isFiniteDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  if (!isFiniteDate(target) || !isFiniteDate(now)) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

export type CitizenshipTimelineCountdownPhase = 'rules' | 'civicKnowledgeTest';

export type CitizenshipTimelineCountdown = {
  daysRemaining: number;
  phase: CitizenshipTimelineCountdownPhase;
  targetDate: Date;
};

export function getCitizenshipTimelineCountdown(
  now: Date = new Date(),
): CitizenshipTimelineCountdown | null {
  const rulesDaysRemaining = daysUntil(CITIZENSHIP_RULES_EFFECTIVE_DATE, now);
  if (rulesDaysRemaining > 0) {
    return {
      daysRemaining: rulesDaysRemaining,
      phase: 'rules',
      targetDate: CITIZENSHIP_RULES_EFFECTIVE_DATE,
    };
  }

  const civicTestDaysRemaining = daysUntil(CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE, now);
  if (civicTestDaysRemaining > 0) {
    return {
      daysRemaining: civicTestDaysRemaining,
      phase: 'civicKnowledgeTest',
      targetDate: CIVIC_KNOWLEDGE_TEST_FIRST_SITTING_DATE,
    };
  }

  return null;
}

export function formatExamDate(target: Date, language: 'sv' | 'en'): string {
  if (!isFiniteDate(target)) return language === 'sv' ? 'datum saknas' : 'date unavailable';

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

export interface StudyPlanDayBreakdown {
  dateIso: string;
  dayOffset: number;
  isToday: boolean;
  localDateKey: string;
  mockTarget: number;
  mockTargetMet: boolean;
  mocksCompleted: number;
  questionTarget: number;
  questionTargetMet: boolean;
  questionsCompleted: number;
}

export interface StudyPlanWeeklyBreakdownInput {
  mockCountsByLocalDate?: Record<string, number>;
  now?: Date;
  plan: StudyPlan;
  questionCountsByLocalDate?: Record<string, number>;
}

const MOCKS_GOAL = 6;
const MIN_DAILY = 5;
const MAX_DAILY = 80;
const MAX_WEEKLY_BREAKDOWN_DAYS = 7;

function normalizeStudyIntensity(value: unknown): StudyIntensity {
  if (value === 'casual' || value === 'regular' || value === 'serious') return value;
  return 'regular';
}

function normalizeNonNegativeInteger(value: unknown): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : 0;
}

function normalizeProgressCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

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
  const now = isFiniteDate(input.now) ? input.now : new Date();
  const testDate = isFiniteDate(input.testDate) ? input.testDate : now;
  const totalQuestions = normalizeNonNegativeInteger(input.totalQuestions);
  const masteredQuestions = Math.min(
    totalQuestions,
    normalizeNonNegativeInteger(input.masteredQuestions),
  );
  const mocksTaken = Math.min(MOCKS_GOAL, normalizeNonNegativeInteger(input.mocksTaken));
  const intensity = normalizeStudyIntensity(input.intensity);

  const daysRemaining = daysUntil(testDate, now);

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

function startOfLocalDay(date: Date): Date {
  const safeDate = isFiniteDate(date) ? date : new Date();
  return new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate());
}

function addLocalDays(date: Date, daysToAdd: number): Date {
  const localDate = startOfLocalDay(date);
  localDate.setDate(localDate.getDate() + daysToAdd);
  return localDate;
}

function localDateKey(date: Date): string {
  const localDate = startOfLocalDay(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function mockTargetForDay(dayOffset: number, weeklyMockTarget: number): number {
  if (weeklyMockTarget <= 0) return 0;
  if (weeklyMockTarget === 1) return dayOffset === 0 ? 1 : 0;
  return dayOffset === 0 || dayOffset === 3 ? 1 : 0;
}

export function generateStudyPlanWeeklyBreakdown({
  mockCountsByLocalDate = {},
  now = new Date(),
  plan,
  questionCountsByLocalDate = {},
}: StudyPlanWeeklyBreakdownInput): StudyPlanDayBreakdown[] {
  const safeNow = isFiniteDate(now) ? now : new Date();
  const daysToShow = Math.max(
    1,
    Math.min(MAX_WEEKLY_BREAKDOWN_DAYS, normalizeProgressCount(plan.daysRemaining) || 1),
  );

  return Array.from({ length: daysToShow }, (_, dayOffset) => {
    const date = addLocalDays(safeNow, dayOffset);
    const dateKey = localDateKey(date);
    const questionTarget = normalizeProgressCount(plan.dailyQuestionTarget);
    const mockTarget = mockTargetForDay(dayOffset, normalizeProgressCount(plan.weeklyMockTarget));
    const questionsCompleted = normalizeProgressCount(questionCountsByLocalDate[dateKey]);
    const mocksCompleted = normalizeProgressCount(mockCountsByLocalDate[dateKey]);

    return {
      dateIso: date.toISOString(),
      dayOffset,
      isToday: dayOffset === 0,
      localDateKey: dateKey,
      mockTarget,
      mockTargetMet: mockTarget > 0 && mocksCompleted >= mockTarget,
      mocksCompleted,
      questionTarget,
      questionTargetMet: questionTarget > 0 && questionsCompleted >= questionTarget,
      questionsCompleted,
    };
  });
}

export interface NoTestDatePlan {
  hasTestDate: false;
}

export type MaybeStudyPlan = StudyPlan | NoTestDatePlan;
