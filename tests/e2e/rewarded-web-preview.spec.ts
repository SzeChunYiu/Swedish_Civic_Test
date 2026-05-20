import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

type Language = 'sv' | 'en';

const mockExamAccessStorageKey = 'monetization.mockExamAccess.v1';
const totalQuestions = 20;

const copy: Record<
  Language,
  {
    activeCount: string;
    heading: string;
    previewBody: string;
    previewButton: string;
    previewTitle: string;
    status: string;
    timeLeft: RegExp;
    unlockButton: string;
  }
> = {
  sv: {
    activeCount: `0/${totalQuestions} besvarade`,
    heading: 'Övningsprov',
    previewBody:
      'Slutför den korta förhandsvisningen innan du låser upp ett extra övningsprov. Det här är inte ett riktigt prov och ger ingen officiell fördel.',
    previewButton: 'Slutför förhandsvisning',
    previewTitle: 'Sponsrad förhandsvisning',
    status: 'Dagens kostnadsfria övningsprov är använt. Extra prov är tillgängligt.',
    timeLeft: /^Tid kvar/,
    unlockButton: 'Lås upp extra prov',
  },
  en: {
    activeCount: `0/${totalQuestions} answered`,
    heading: 'Mock exam',
    previewBody:
      'Complete the short preview before unlocking an extra mock exam. This is not a real exam and does not provide any official advantage.',
    previewButton: 'Complete sponsor preview',
    previewTitle: 'Sponsored preview',
    status: 'Daily free mock exam used. Extra exam available.',
    timeLeft: /^Time left/,
    unlockButton: 'Unlock extra exam',
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
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.addInitScript(
    ({ accessStorageKey }: { accessStorageKey: string }) => {
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
  test(`web rewarded preview unlocks an extra mock exam in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedDailyFreeMockUsed(page, language);

    await page.goto('/exam', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: t.heading }).first()).toBeVisible();
    await expect(page.getByText(t.status)).toBeVisible();
    await expect(page.getByText(t.previewTitle)).toBeVisible();
    await expect(page.getByText(t.previewBody)).toBeVisible();
    await expect(page.getByText(t.activeCount)).toHaveCount(0);
    await expect(page.getByText(t.timeLeft)).toHaveCount(0);
    await expect(await readRewardedCredits(page)).toBe(0);

    const completionButton = page.getByRole('button', { name: t.previewButton });
    await expectReachableTarget(completionButton);
    await completionButton.click();
    await expect(completionButton).toBeDisabled();

    const unlockButton = page.getByRole('button', { name: t.unlockButton });
    await expectReachableTarget(unlockButton);
    await unlockButton.click();

    await expect(page.getByText(t.activeCount)).toBeVisible();
    await expect(page.getByText(t.timeLeft)).toBeVisible();
    await expect(page.getByText(t.previewTitle)).toHaveCount(0);
    await expect(await readRewardedCredits(page)).toBe(0);

    expect(consoleErrors).toEqual([]);
  });
}
