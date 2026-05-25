import { expect, test, type Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

const settingsStudyPlanIntensityKey = 'settings\\studyPlanIntensity';
const settingsStudyPlanTestDateIsoKey = 'settings\\studyPlanTestDateIso';
const proLifetimeStorageKey = 'monetization.proLifetime.entitled.v1';
const dayMs = 24 * 60 * 60 * 1000;

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function futureTestDateIso() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setTime(date.getTime() + 35 * dayMs);
  return date.toISOString();
}

function expiredTestDateIso() {
  return '2026-05-20T00:00:00.000Z';
}

function buildProgressSeed() {
  const now = new Date();
  now.setHours(10, 0, 0, 0);
  const todayKey = localDateKey(now);
  const answers = Array.from({ length: 45 }, (_, index) => ({
    answeredAt: new Date(now.getTime() + index * 60_000).toISOString(),
    confidenceRating: 4,
    isCorrect: true,
    questionId: `q${String(index + 1).padStart(3, '0')}`,
    timeSpentSeconds: 20,
  }));

  return {
    answerDates: [todayKey],
    answerHistory: answers,
    completedQuestionIds: answers.map((answer) => answer.questionId),
    dailyChallengeCompletions: {},
    mockExamSessions: [
      {
        completedAt: now.toISOString(),
        correctCount: 42,
        questionTimings: [{ questionId: 'q001', timeSpentSeconds: 300 }],
        score: 0.84,
        sessionId: 'study-plan-detail-mock-1',
        totalCount: 50,
      },
    ],
    questionProgress: Object.fromEntries(
      answers.slice(0, 24).map((answer) => [
        answer.questionId,
        {
          correctCount: 2,
          correctStreak: 2,
          lastAnsweredAt: answer.answeredAt,
          questionId: answer.questionId,
          seenCount: 2,
          wrongCount: 0,
        },
      ]),
    ),
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 540,
  };
}

function proLifetimeRecord() {
  const nowIso = new Date().toISOString();

  return {
    grantedAt: nowIso,
    productId: 'com.billyyiu.almostswedish.prolifetime',
    purchaseToken: 'e2e-pro-lifetime-token',
    receiptValidatedAt: nowIso,
    receiptValidationStatus: 'valid',
    schemaVersion: 1,
    source: 'purchase',
    transactionId: 'e2e-pro-lifetime-transaction',
  };
}

async function seedStudyPlan(
  page: Page,
  { pro = false, testDateIso = futureTestDateIso() }: { pro?: boolean; testDateIso?: string } = {},
) {
  const localStorageValues: Record<string, string> = {
    [currentProgressStateStorageKey]: JSON.stringify(buildProgressSeed()),
    [settingsStudyPlanIntensityKey]: 'regular',
    [settingsStudyPlanTestDateIsoKey]: testDateIso,
  };

  if (pro) {
    localStorageValues[proLifetimeStorageKey] = JSON.stringify(proLifetimeRecord());
  }

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues,
    windowValues: {
      __SMT_E2E__: true,
      __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
    },
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test('Pro study plan detail shows weekly local completion checkmarks', async ({ page }) => {
  await seedStudyPlan(page, { pro: true });

  await page.goto('/study-plan', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Your study plan' })).toBeVisible();
  await expect(page.getByText('This week')).toBeVisible();
  await expect(page.getByText(/questions/).first()).toBeVisible();
  await expect(page.getByText(/mock exams/).first()).toBeVisible();
  await expect(page.getByText(/✓ Done/).first()).toBeVisible();
  await expect(page.getByText(/behind|missed days|guilt/i)).toHaveCount(0);
});

test('Free study plan detail keeps countdown and upgrade copy', async ({ page }) => {
  await seedStudyPlan(page);

  await page.goto('/study-plan', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', { name: 'The weekly plan is included in Pro' }),
  ).toBeVisible();
  await expect(page.getByText(/days until/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Pro' })).toBeVisible();
  await expect(page.getByText('This week')).toHaveCount(0);
});

test('Expired study plan date asks for an updated date without weekly targets', async ({
  page,
}) => {
  await seedStudyPlan(page, { pro: true, testDateIso: expiredTestDateIso() });

  await page.goto('/study-plan', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Test date has passed' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Update test date' })).toBeVisible();
  await expect(page.getByText(/0 days until|80 questions per day|This week/)).toHaveCount(0);
});

test('Home and Dashboard plan cards navigate to the study plan detail route', async ({ page }) => {
  await seedStudyPlan(page);

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page.getByRole('link', { name: /Open study plan/ }).click();
  await expect(page).toHaveURL(/\/study-plan/);

  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page.getByRole('link', { name: /Open study plan/ }).click();
  await expect(page).toHaveURL(/\/study-plan/);
});
