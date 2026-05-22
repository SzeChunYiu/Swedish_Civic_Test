import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

const reviewStorageKey = 'reviews\\learning.reviews.cards.v1';
const proLifetimeStorageKey = 'monetization.proLifetime.entitled.v1';
const proLifetimeProductId = 'com.billyyiu.almostswedish.prolifetime';
const dueAt = '2026-05-01T08:00:00.000Z';
const lastReviewAt = '2026-04-28T08:00:00.000Z';

function reviewCard(questionId: string) {
  return {
    difficulty: 5,
    dueAt,
    lapses: 0,
    lastReviewAt,
    questionId,
    reps: 2,
    stability: 4,
    state: 'review',
  };
}

function buildReviewState(questionIds: string[], gradedPerDay: Record<string, number> = {}) {
  return {
    byId: Object.fromEntries(questionIds.map((questionId) => [questionId, reviewCard(questionId)])),
    gradedPerDay,
  };
}

function buildProLifetimeRecord() {
  return {
    grantedAt: '2026-05-01T08:00:00.000Z',
    productId: proLifetimeProductId,
    purchaseToken: 'mock-token-pro-lifetime',
    receiptValidatedAt: '2026-05-01T08:00:00.000Z',
    receiptValidationStatus: 'valid',
    schemaVersion: 1,
    source: 'purchase',
    transactionId: 'mock-transaction-pro-lifetime',
  };
}

async function seedReviewQueue(
  page: Page,
  {
    pro = false,
    questionIds = ['q001', 'q002', 'q003', 'q004'],
  }: {
    pro?: boolean;
    questionIds?: string[];
  } = {},
) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [reviewStorageKey]: JSON.stringify(buildReviewState(questionIds)),
      ...(pro ? { [proLifetimeStorageKey]: JSON.stringify(buildProLifetimeRecord()) } : {}),
    },
    windowValues: pro
      ? {
          __SMT_E2E__: true,
          __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
          __SMT_PRO_LIFETIME_MOCK_OWNED__: true,
        }
      : {},
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test('Home review banner opens the FSRS queue and Free users stop at the daily cap', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedReviewQueue(page);

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('4 reviews due today')).toBeVisible();
  await page.getByRole('link', { name: /Open today's review\. 4 review cards are due\./ }).click();
  await expect(page).toHaveURL(/\/review(?:$|[?#])/);
  await expect(page.getByRole('heading', { name: "Today's review" })).toBeVisible();
  await expect(page.getByText('Card 1 of 3')).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: /Good\. Normal pace\./ }).click();
  }

  await expect(page.getByText("Today's free review is complete")).toBeVisible();
  await expect(page.getByText('More cards are waiting with Pro')).toBeVisible();
  expect(consoleErrors.get()).toEqual([]);
});

test('Pro review flow grades beyond the Free daily cap', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedReviewQueue(page, { pro: true });

  await page.goto('/review', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('Card 1 of 4')).toBeVisible();
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: /Easy\. Longer interval\./ }).click();
  }

  await expect(page.getByText('No review cards are due right now')).toBeVisible();
  await expect(page.locator('body')).not.toContainText("Today's free review is complete");
  expect(consoleErrors.get()).toEqual([]);
});

test('Home hides the review banner when no FSRS cards are due', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedReviewQueue(page, { questionIds: [] });

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.locator('body')).not.toContainText(/reviews due today/i);
  await expect(page.getByRole('link', { name: /Review now/ })).toHaveCount(0);
  expect(consoleErrors.get()).toEqual([]);
});
