import { expect, test, type Page } from '@playwright/test';

import { dismissBlockingModals, type AppLanguage } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type StreakFreezeCase = {
  badgeText: string;
  forbiddenVisibleCopy: RegExp;
  helperText: string;
  language: AppLanguage;
  rescuedCopy: RegExp;
};

const streakFreezeCases: StreakFreezeCase[] = [
  {
    badgeText: 'Svitskydd',
    forbiddenVisibleCopy: /\b(?:streak|freeze|freezes)\b|Strecket|fryser/i,
    helperText: '1 svitskydd redo',
    language: 'sv',
    rescuedCopy: /Sviten är räddad.*1 svitskydd kvar/i,
  },
  {
    badgeText: 'Streak freeze',
    forbiddenVisibleCopy: /svitskydd|Strecket|räddat|fryser/i,
    helperText: '1 streak freeze ready',
    language: 'en',
    rescuedCopy: /Streak protected.*1 freeze left/i,
  },
];

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function seedRescuedStreakState(page: Page, language: AppLanguage): Promise<void> {
  await page.addInitScript(
    ({ seededLanguage }: { seededLanguage: AppLanguage }) => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const dateKey = (offsetDays: number) => {
        const date = new Date(startOfToday);
        date.setDate(startOfToday.getDate() + offsetDays);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const isoAtNoon = (offsetDays: number) => {
        const date = new Date(startOfToday);
        date.setDate(startOfToday.getDate() + offsetDays);
        date.setHours(12, 0, 0, 0);
        return date.toISOString();
      };

      const today = dateKey(0);
      const twoDaysAgo = dateKey(-2);
      const answeredTodayAt = isoAtNoon(0);
      const answeredTwoDaysAgoAt = isoAtNoon(-2);

      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('settings\\language', seededLanguage);
      window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
      window.localStorage.setItem(
        'progress\\progressState',
        JSON.stringify({
          completedQuestionIds: ['q001', 'q002'],
          questionProgress: {
            q001: {
              questionId: 'q001',
              seenCount: 1,
              correctCount: 1,
              wrongCount: 0,
              correctStreak: 1,
              lastAnsweredAt: answeredTodayAt,
            },
            q002: {
              questionId: 'q002',
              seenCount: 1,
              correctCount: 1,
              wrongCount: 0,
              correctStreak: 1,
              lastAnsweredAt: answeredTwoDaysAgoAt,
            },
          },
          totalXp: 20,
          answerDates: [twoDaysAgo, today],
          answerHistory: [
            { questionId: 'q002', isCorrect: true, answeredAt: answeredTwoDaysAgoAt },
            { questionId: 'q001', isCorrect: true, answeredAt: answeredTodayAt },
          ],
          dailyChallengeCompletions: {},
          mockExamSessions: [],
          streakFreezeState: {
            available: 2,
            lastEarnedAt: today,
            lifetimeEarned: 2,
            lifetimeSpent: 0,
            rescuedDayKeys: [],
          },
        }),
      );
    },
    { seededLanguage: language },
  );
}

async function expectPersistedRescue(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const rawProgress = window.localStorage.getItem('progress\\progressState');
        if (!rawProgress) return null;
        const progress = JSON.parse(rawProgress);
        return {
          available: progress.streakFreezeState?.available,
          rescuedCount: progress.streakFreezeState?.rescuedDayKeys?.length,
        };
      }),
    )
    .toEqual({ available: 1, rescuedCount: 1 });
}

for (const scenario of streakFreezeCases) {
  test(`home renders a rescued streak-freeze state in ${scenario.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedRescuedStreakState(page, scenario.language);
    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByText(scenario.badgeText).first()).toBeVisible();
    await expect(page.getByText(scenario.helperText).first()).toBeVisible();
    await expect(page.getByText(scenario.rescuedCopy).first()).toBeVisible();
    await expectPersistedRescue(page);

    const visibleHomeCopy = await page.locator('body').innerText();
    expect(visibleHomeCopy).not.toMatch(scenario.forbiddenVisibleCopy);
    expect(consoleErrors).toEqual([]);
  });
}
