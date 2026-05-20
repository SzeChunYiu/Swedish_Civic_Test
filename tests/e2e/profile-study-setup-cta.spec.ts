import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const minimumTargetSizePx = 44;

const copy: Record<
  AppLanguage,
  {
    cta: string;
    dailyGoalBadge: string;
    dailyGoalHeading: string;
    languageBadge: string;
    profileTitle: string;
    settingsHeading: string;
    studySetupHeading: string;
  }
> = {
  sv: {
    cta: 'Ändra mål, språk och ljud',
    dailyGoalBadge: '10 svar/dag',
    dailyGoalHeading: 'Dagligt mål',
    languageBadge: 'Svenska',
    profileTitle: 'Framsteg utan konto',
    settingsHeading: 'Inställningar',
    studySetupHeading: 'Studieinställningar',
  },
  en: {
    cta: 'Edit goal, language, and audio',
    dailyGoalBadge: '10 answers/day',
    dailyGoalHeading: 'Daily goal',
    languageBadge: 'English support',
    profileTitle: 'Progress without an account',
    settingsHeading: 'Settings',
    studySetupHeading: 'Study setup',
  },
};

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectMobileTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should have a rendered target box`).not.toBeNull();
  expect(
    box!.width,
    `${label} should be at least ${minimumTargetSizePx}px wide`,
  ).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(
    box!.height,
    `${label} should be at least ${minimumTargetSizePx}px tall`,
  ).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.x, `${label} should stay inside the mobile viewport`).toBeGreaterThanOrEqual(0);
  expect(
    box!.x + box!.width,
    `${label} should not overflow the mobile viewport horizontally`,
  ).toBeLessThanOrEqual(390);
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  expect(hasHorizontalOverflow).toBe(false);
}

test.use({ viewport: { width: 390, height: 844 } });

for (const language of ['sv', 'en'] as const satisfies readonly AppLanguage[]) {
  test(`Profile Study setup CTA is a mobile-safe Settings link in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedSettingsLanguage(page, language);
    await markAboutTheTestSeen(page);
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: t.profileTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.studySetupHeading })).toBeVisible();
    await expect(page.getByText(t.dailyGoalBadge, { exact: true })).toBeVisible();
    await expect(page.getByText(t.languageBadge, { exact: true })).toBeVisible();

    const settingsCta = page.getByRole('link', { exact: true, name: t.cta });
    await expect(settingsCta).toHaveCount(1);
    await expectMobileTarget(settingsCta, `${language} Profile Study setup CTA`);
    await expectNoHorizontalOverflow(page);

    await settingsCta.click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: t.settingsHeading })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.dailyGoalHeading })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
}
