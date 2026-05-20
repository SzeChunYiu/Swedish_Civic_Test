import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

const mobileViewport = { width: 390, height: 844 };
const seededBookmarkCount = 200;
const seededWrongAnswerCount = 200;
const lateWrongAnswerIndex = seededBookmarkCount + 20;
const lateWrongAnswerQuestionId = questionIdAt(lateWrongAnswerIndex);
const lateWrongAnswerCardId = `mistakes-review-card-${lateWrongAnswerQuestionId}`;
const lateWrongAnswerText = `Seeded wrong answer EN ${lateWrongAnswerIndex}`;

function questionIdAt(index: number): string {
  return `q${String(index).padStart(3, '0')}`;
}

function buildLargeMistakesSeed() {
  const questionProgress: Record<string, unknown> = {};
  const wrongAnswerReviews: Record<string, unknown> = {};
  const completedQuestionIds: string[] = [];
  const answeredAt = '2025-01-01T12:00:00.000Z';

  for (let index = 1; index <= seededBookmarkCount + seededWrongAnswerCount; index += 1) {
    const questionId = questionIdAt(index);
    completedQuestionIds.push(questionId);

    if (index <= seededBookmarkCount) {
      questionProgress[questionId] = {
        bookmarked: true,
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: answeredAt,
        questionId,
        seenCount: 1,
        wrongCount: 0,
      };
      continue;
    }

    questionProgress[questionId] = {
      bookmarked: false,
      correctCount: 1,
      correctStreak: 0,
      lastAnsweredAt: answeredAt,
      questionId,
      seenCount: 2,
      wrongCount: 1,
    };
    wrongAnswerReviews[questionId] = {
      answeredAt,
      questionId,
      selectedOptionTextEn: `Seeded wrong answer EN ${index}`,
      selectedOptionTextSv: `Seedat felsvar ${index}`,
    };
  }

  return {
    mistakeReviewState: {
      wrongAnswerReviews,
    },
    progressState: {
      answerDates: ['2025-01-01'],
      completedQuestionIds,
      mockExamSessions: [],
      questionProgress,
      streakFreezeState: {
        available: 1,
        lastEarnedAt: '2024-12-30',
        lifetimeEarned: 1,
        lifetimeSpent: 0,
        rescuedDayKeys: [],
      },
      totalXp: 0,
    },
  };
}

async function seedLargeMistakesState(page: Page) {
  const seed = buildLargeMistakesSeed();

  await page.addInitScript(
    ({ seededState }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('settings\\language', 'en');
      window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
      window.localStorage.setItem(
        'progress\\progressState',
        JSON.stringify(seededState.progressState),
      );
      window.localStorage.setItem(
        'mistake-review\\mistakeReviewState',
        JSON.stringify(seededState.mistakeReviewState),
      );
    },
    { seededState: seed },
  );
}

async function scrollUntilVisible(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await target.isVisible().catch(() => false)) {
      await page.waitForTimeout(100);
      if (await target.isVisible().catch(() => false)) return;
    }
    await page.evaluate(() => {
      const scrollables = [
        document.scrollingElement,
        ...Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
          (node) => node.scrollHeight > node.clientHeight,
        ),
      ].filter((node): node is Element => Boolean(node));

      scrollables.forEach((node) => {
        node.scrollTop = node.scrollHeight;
        node.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(50);
  }

  await expect(target).toBeVisible();
}

test.use({ viewport: mobileViewport });

test('mistakes review list virtualizes large saved and wrong-answer sets', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedLargeMistakesState(page);
  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Bookmarked questions' })).toBeVisible();

  const reviewCards = page.locator('[data-testid="mistakes-review-card"]');
  await expect(reviewCards.first()).toBeVisible();
  const initialRenderedCards = await reviewCards.count();
  expect(initialRenderedCards).toBeGreaterThan(0);
  expect(initialRenderedCards).toBeLessThan(80);

  await scrollUntilVisible(page, page.getByRole('heading', { name: 'Wrong answers to revisit' }));
  await expect(page.getByRole('heading', { name: 'Wrong answers to revisit' })).toBeVisible();

  const lateCard = page.locator(`[id="${lateWrongAnswerCardId}"]`);
  await scrollUntilVisible(page, lateCard);
  await expect(lateCard).toBeVisible();
  await expect(lateCard.getByText('Your latest wrong answer', { exact: true })).toBeVisible();
  await expect(lateCard.getByText(lateWrongAnswerText, { exact: true })).toBeVisible();
  await expect(lateCard.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(lateCard.getByText('UHR reference', { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(
      new RegExp(
        `^Answers to review\\. Your latest wrong answer: ${lateWrongAnswerText}\\. Correct answer:`,
      ),
    ),
  ).toBeVisible();

  const scrolledRenderedCards = await reviewCards.count();
  expect(scrolledRenderedCards).toBeGreaterThan(0);
  expect(scrolledRenderedCards).toBeLessThan(100);
  expect(consoleErrors).toEqual([]);
});
