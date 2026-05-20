import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

type DashboardLocaleFixture = {
  activityTitle: string;
  dashboardLinkLabel: RegExp | string;
  language: AppLanguage;
  profilePath: string;
  summaryLine: string;
  title: string;
  chapterProgressTitle: string;
  streakXpTitle: string;
};

const dashboardLocales: DashboardLocaleFixture[] = [
  {
    activityTitle: 'Aktiva dagar',
    chapterProgressTitle: 'Kapitelframsteg',
    dashboardLinkLabel: /Öppna framstegsöversikten/,
    language: 'sv',
    profilePath: '/profile',
    streakXpTitle: 'Svit och XP',
    summaryLine: '0 svar den här veckan · 0 kapitel provade · 0 olösta misstag',
    title: 'Framstegsöversikt',
  },
  {
    activityTitle: 'Active days',
    chapterProgressTitle: 'Chapter progress',
    dashboardLinkLabel: /Open (?:the )?progress dashboard/,
    language: 'en',
    profilePath: '/profile',
    streakXpTitle: 'Streak and XP',
    summaryLine: '0 answers this week · 0 chapters tried · 0 unresolved mistakes',
    title: 'Progress dashboard',
  },
];

test.use({ viewport: { width: 390, height: 844 } });

async function seedCleanLanguage(page: Page, language: AppLanguage) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
}

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return {
      bodyScrollWidth: body.scrollWidth,
      clientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
    };
  });

  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectDashboardVisible(page: Page, fixture: DashboardLocaleFixture) {
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  await expect(page.getByRole('heading', { name: fixture.title }).last()).toBeVisible();
  await expect(page.getByText(fixture.summaryLine, { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('heading', { name: fixture.activityTitle }).last()).toBeVisible();
  await expect(
    page.getByRole('heading', { name: fixture.chapterProgressTitle }).last(),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: fixture.streakXpTitle }).last()).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

for (const fixture of dashboardLocales) {
  test(`dashboard route renders and stays linked in ${fixture.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    await seedCleanLanguage(page, fixture.language);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectDashboardVisible(page, fixture);

    await page.goto('/dashboard?from=home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectDashboardVisible(page, fixture);

    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await page.getByLabel(fixture.dashboardLinkLabel).first().click();
    await expectDashboardVisible(page, fixture);

    await page.goto(fixture.profilePath, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await page.getByLabel(fixture.dashboardLinkLabel).first().click();
    await expectDashboardVisible(page, fixture);

    expect(consoleErrors).toEqual([]);
  });
}
