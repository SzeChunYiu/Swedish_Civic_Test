import { expect, test } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function completedDailyChallengeProgressState(dayKey: string) {
  return {
    answerDates: [],
    answerHistory: [],
    completedQuestionIds: [],
    dailyChallengeCompletions: {
      [dayKey]: {
        completedAt: `${dayKey}T12:00:00.000Z`,
        correctCount: 5,
        dayKey,
        questionIds: ['q001', 'q002', 'q003', 'q004', 'q005'],
        score: 1,
        timeSpentSeconds: 45,
        totalCount: 5,
      },
    },
    mockExamSessions: [],
    questionProgress: {},
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 0,
  };
}

test('completed daily challenge retry relaunches Practice with a fresh launch token', async ({
  page,
}) => {
  const todayKey = localDateKey();

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(
        completedDailyChallengeProgressState(todayKey),
      ),
    },
    reseedOnNavigation: false,
  });

  await page.goto('/practice?mode=challenge&launch=already-consumed', {
    waitUntil: 'networkidle',
  });
  await dismissBlockingModals(page);
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();

  await page.goto('/', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText("Today's challenge done", { exact: true })).toBeVisible();

  await page.getByRole('link', { name: /Today's challenge done/i }).click();

  await expect(page).toHaveURL(/\/practice\?/);
  const retryUrl = new URL(page.url());
  expect(retryUrl.searchParams.get('mode')).toBe('challenge');
  expect(retryUrl.searchParams.get('launch')).toMatch(new RegExp(`^${todayKey}-retry-\\d+$`));
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();

  const progressState = await page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, currentProgressStateStorageKey);

  expect(progressState.dailyChallengeCompletions[todayKey]).toMatchObject({
    completedAt: `${todayKey}T12:00:00.000Z`,
    questionIds: ['q001', 'q002', 'q003', 'q004', 'q005'],
    score: 1,
  });
});
