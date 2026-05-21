import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type Language = 'sv' | 'en';

const mockExamAccessStorageKey = 'monetization.mockExamAccess.v1';
const totalQuestions = 20;

const copy: Record<
  Language,
  {
    activeCount: string;
    examHeading: string;
    homeHeading: string;
    previewBody: string;
    previewButton: string;
    previewButtonLabel: string;
    unlockedCta: string;
    unlockedCtaLabel: string;
    unlockedStatus: string;
    timeLeft: RegExp;
    unlockButton: string;
    unlockButtonLabel: string;
  }
> = {
  sv: {
    activeCount: `0/${totalQuestions} besvarade`,
    examHeading: 'Övningsprov',
    homeHeading: 'Lås upp ett extra övningsprov',
    previewBody:
      'När dagens kostnadsfria övningsprov är använt kan du låsa upp ett extra från startsidan. Krediten sparas först när den sponsrade förhandsvisningen är slutförd.',
    previewButton: 'Slutför förhandsvisning',
    previewButtonLabel: 'Slutför sponsrad förhandsvisning för ett extra övningsprov',
    unlockedCta: 'Starta upplåst övningsprov',
    unlockedCtaLabel: 'Starta det upplåsta extra övningsprovet',
    unlockedStatus: 'Extra övningsprov upplåst.',
    timeLeft: /^Tid kvar/,
    unlockButton: 'Lås upp extra övningsprov',
    unlockButtonLabel: 'Lås upp ett extra övningsprov efter förhandsvisningen',
  },
  en: {
    activeCount: `0/${totalQuestions} answered`,
    examHeading: 'Mock exam',
    homeHeading: 'Unlock an extra mock exam',
    previewBody:
      'When the daily free mock exam is used, unlock one extra from Home. The credit is stored only after the sponsored preview is completed.',
    previewButton: 'Complete sponsor preview',
    previewButtonLabel: 'Complete the sponsored preview for an extra mock exam',
    unlockedCta: 'Start unlocked mock exam',
    unlockedCtaLabel: 'Start the unlocked extra mock exam',
    unlockedStatus: 'Extra mock exam unlocked.',
    timeLeft: /^Time left/,
    unlockButton: 'Unlock extra mock exam',
    unlockButtonLabel: 'Unlock an extra mock exam after the preview',
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
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);

  await page.addInitScript(
    ({ accessStorageKey }: { accessStorageKey: string }) => {
      window.sessionStorage.clear();
      const existingAccess = window.localStorage.getItem(accessStorageKey);
      if (existingAccess) {
        try {
          const parsedAccess = JSON.parse(existingAccess);
          if (Number(parsedAccess?.rewardedExtraExamCredits) > 0) return;
        } catch {
          // Replace malformed test state with the deterministic daily-free-used fixture below.
        }
      }

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
  test(`Home rewarded preview stores an extra mock exam credit in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedDailyFreeMockUsed(page, language);

    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: t.homeHeading })).toBeVisible();
    await expect(page.getByText(t.previewBody)).toBeVisible();
    await expect(page.getByText(t.activeCount)).toHaveCount(0);
    await expect(page.getByText(t.timeLeft)).toHaveCount(0);
    await expect(await readRewardedCredits(page)).toBe(0);

    const completionButton = page.getByRole('button', { name: t.previewButtonLabel });
    await expectReachableTarget(completionButton);
    await completionButton.click();
    await expect(completionButton).toBeDisabled();

    const unlockButton = page.getByRole('button', { name: t.unlockButtonLabel });
    await expectReachableTarget(unlockButton);
    await unlockButton.click();

    await expect(page.getByText(t.unlockedStatus)).toBeVisible();
    await expect(page.getByRole('link', { name: t.unlockedCtaLabel })).toBeVisible();
    await expect(await readRewardedCredits(page)).toBe(1);

    await page.goto('/exam', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: t.examHeading }).first()).toBeVisible();
    await expect(page.getByText(t.previewBody)).toHaveCount(0);
    await expect(page.getByText(t.previewButton)).toHaveCount(0);
    const startUnlocked = page.getByRole('button', { name: t.unlockedCta });
    await expectReachableTarget(startUnlocked);
    await startUnlocked.click();

    await expect(page.getByText(t.activeCount)).toBeVisible();
    await expect(page.getByText(t.timeLeft)).toBeVisible();
    await expect(await readRewardedCredits(page)).toBe(0);

    expect(consoleErrors).toEqual([]);
  });
}
