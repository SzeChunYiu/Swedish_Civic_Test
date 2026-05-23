import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function expectTapTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function openPracticeRouteMode(page: Page, mode: 'challenge' | 'quick') {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto(`/practice?mode=${mode}`, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

function seededQuickProgressState(completedQuestionIds: string[]) {
  const answeredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const answerDate = answeredAt.slice(0, 10);
  const questionProgress = Object.fromEntries(
    completedQuestionIds.map((questionId) => [
      questionId,
      {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: answeredAt,
        questionId,
        seenCount: 1,
        wrongCount: 0,
      },
    ]),
  );

  return {
    answerDates: [answerDate],
    answerHistory: completedQuestionIds.map((questionId) => ({
      answeredAt,
      isCorrect: true,
      questionId,
    })),
    completedQuestionIds,
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    questionProgress,
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: completedQuestionIds.length * 10,
  };
}

async function openQuickRouteModeWithProgress(page: Page, completedQuestionIds: string[]) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(
        seededQuickProgressState(completedQuestionIds),
      ),
    },
  });
  await page.goto('/practice?mode=quick', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectQuestionMode(page: Page, mode: 'challenge' | 'quick') {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeRouteMode(page, mode);

  await expect(page).toHaveURL(new RegExp(`/practice\\?mode=${mode}`));
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toHaveCount(0);
  await expect(page.getByText('Practice hub', { exact: true })).toHaveCount(0);

  const firstOption = page.getByRole('radio').first();
  await expect(firstOption).toBeVisible();
  await expectTapTarget(firstOption, `${mode} first answer option`);
  await firstOption.click();

  const nextQuestion = page.getByRole('button', { name: 'Move to the next practice question' });
  await expect(nextQuestion).toBeVisible();
  await expectTapTarget(nextQuestion, `${mode} next-question action`);
  expect(consoleErrors).toEqual([]);
}

test('challenge route mode bypasses the Practice hub and opens the daily question set', async ({
  page,
}) => {
  await expectQuestionMode(page, 'challenge');
});

test('quick route mode bypasses the Practice hub and opens the ten-question set', async ({
  page,
}) => {
  await expectQuestionMode(page, 'quick');
});

test('quick route mode starts at the first unanswered question for progressed users', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openQuickRouteModeWithProgress(page, ['q001', 'q002']);

  await expect(page).toHaveURL(/\/practice\?mode=quick/);
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toHaveCount(0);
  await expect(page.getByText('Question 3', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where is Sweden located?' })).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: "Sweden's northernmost part lies north of the Arctic Circle.",
    }),
  ).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('quick route mode wraps to the first scoped question after the quick scope is complete', async ({
  page,
}) => {
  const quickQuestionIds = Array.from(
    { length: 10 },
    (_, index) => `q${String(index + 1).padStart(3, '0')}`,
  );

  await openQuickRouteModeWithProgress(page, quickQuestionIds);

  await expect(page).toHaveURL(/\/practice\?mode=quick/);
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where is Sweden located?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toHaveCount(0);
});

test('plain Practice route stays on the Practice hub', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(page.getByText('Practice hub', { exact: true })).toBeVisible();
  await expect(page.getByText('Question 1', { exact: true })).toHaveCount(0);

  const fullBank = page.getByRole('button', { name: 'Start practice with all visible questions' });
  await expect(fullBank).toBeVisible();
  await expectTapTarget(fullBank, 'plain Practice full-bank action');
});
