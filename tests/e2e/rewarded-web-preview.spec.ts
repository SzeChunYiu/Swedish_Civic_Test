import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

type Language = 'sv' | 'en';

const mockExamAccessStorageKey = 'monetization.mockExamAccess.v1';
const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const totalQuestions = 20;

const copy: Record<
  Language,
  {
    activeCount: string;
    forbiddenText: string[];
    heading: string;
    startButton: string;
    status: string;
    timeLeft: RegExp;
  }
> = {
  sv: {
    activeCount: `0/${totalQuestions} besvarade`,
    forbiddenText: [
      'Sponsrad förhandsvisning',
      'Slutför den korta förhandsvisningen',
      'Slutför förhandsvisning',
      'Lås upp extra prov',
    ],
    heading: 'Övningsprov',
    startButton: 'Starta övningsprov',
    status: 'Dagens kostnadsfria övningsprov är använt. Extra prov låses upp utanför provläget.',
    timeLeft: /^Tid kvar/,
  },
  en: {
    activeCount: `0/${totalQuestions} answered`,
    forbiddenText: [
      'Sponsored preview',
      'Complete the short preview',
      'Complete sponsor preview',
      'Unlock extra exam',
    ],
    heading: 'Mock exam',
    startButton: 'Start mock exam',
    status: 'Daily free mock exam used. Extra exams are unlocked outside exam mode.',
    timeLeft: /^Time left/,
  },
};

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectReachableTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function seedDailyFreeMockUsed(page: Page, language: Language) {
  await page.addInitScript(
    ({
      accessStorageKey,
      language: seededLanguage,
      languageKey,
      seenKey,
    }: {
      accessStorageKey: string;
      language: Language;
      languageKey: string;
      seenKey: string;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.setItem(seenKey, 'true');

      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(today.getDate()).padStart(2, '0')}`;

      window.localStorage.setItem(
        accessStorageKey,
        JSON.stringify({
          completedMockExamSessionIdsByDate: {
            [dateKey]: [`seeded-free-${dateKey}`],
          },
          completedMockExamsByDate: {
            [dateKey]: 1,
          },
          rewardedExtraExamCredits: 0,
        }),
      );
    },
    {
      accessStorageKey: mockExamAccessStorageKey,
      language,
      languageKey: settingsLanguageKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

async function readRewardedCredits(page: Page) {
  return page.evaluate((accessStorageKey) => {
    const raw = window.localStorage.getItem(accessStorageKey);
    if (!raw) return null;
    return JSON.parse(raw).rewardedExtraExamCredits;
  }, mockExamAccessStorageKey);
}

test.use({ viewport: { width: 390, height: 844 } });

for (const language of ['sv', 'en'] as const) {
  test(`exam route does not expose rewarded preview in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedDailyFreeMockUsed(page, language);

    await page.goto('/exam', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: t.heading }).first()).toBeVisible();
    await expect(page.getByText(t.status)).toBeVisible();
    await expect(page.getByText(t.activeCount)).toHaveCount(0);
    await expect(page.getByText(t.timeLeft)).toHaveCount(0);
    await expect(await readRewardedCredits(page)).toBe(0);

    for (const forbiddenText of t.forbiddenText) {
      await expect(page.getByText(forbiddenText)).toHaveCount(0);
    }

    const startButton = page.getByRole('button', { name: t.startButton });
    await expectReachableTarget(startButton);
    await expect(startButton).toBeDisabled();

    await expect(page.getByText(t.activeCount)).toHaveCount(0);
    await expect(page.getByText(t.timeLeft)).toHaveCount(0);
    await expect(await readRewardedCredits(page)).toBe(0);

    expect(consoleErrors).toEqual([]);
  });
}
