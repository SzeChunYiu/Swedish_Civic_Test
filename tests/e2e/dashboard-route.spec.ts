import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals, type AppLanguage } from './browserLaunch';

type DashboardLocaleFixture = {
  activityLegendLabels: string[];
  activityLegendTitle: string;
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
    activityLegendLabels: ['Inga svar', 'Låg aktivitet', 'Medelaktivitet', 'Hög aktivitet'],
    activityLegendTitle: 'Aktivitetsskala',
    activityTitle: 'Aktiva dagar',
    chapterProgressTitle: 'Kapitelframsteg',
    dashboardLinkLabel: /Öppna framstegsöversikten/,
    language: 'sv',
    profilePath: '/profile',
    streakXpTitle: 'Svit och XP',
    summaryLine: '2 svar den här veckan · 1 kapitel provade · 0 olösta misstag',
    title: 'Framstegsöversikt',
  },
  {
    activityLegendLabels: ['No answers', 'Low activity', 'Medium activity', 'High activity'],
    activityLegendTitle: 'Activity scale',
    activityTitle: 'Active days',
    chapterProgressTitle: 'Chapter progress',
    dashboardLinkLabel: /Open (?:the )?progress dashboard/,
    language: 'en',
    profilePath: '/profile',
    streakXpTitle: 'Streak and XP',
    summaryLine: '2 answers this week · 1 chapters tried · 0 unresolved mistakes',
    title: 'Progress dashboard',
  },
];

test.use({ viewport: { width: 390, height: 844 } });

function createDashboardProgressState() {
  const now = new Date();
  const answerDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const answeredAt = now.toISOString();

  return {
    completedQuestionIds: ['q001'],
    questionProgress: {
      q001: {
        questionId: 'q001',
        seenCount: 2,
        correctCount: 2,
        wrongCount: 0,
        correctStreak: 2,
        lastAnsweredAt: answeredAt,
      },
    },
    totalXp: 20,
    answerDates: [answerDate],
    mockExamSessions: [],
    streakFreezeState: {
      available: 0,
      lastEarnedAt: answerDate,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  };
}

async function seedCleanLanguage(page: Page, language: AppLanguage) {
  await page.addInitScript(
    ({
      language: seededLanguage,
      progressState,
    }: {
      language: AppLanguage;
      progressState: ReturnType<typeof createDashboardProgressState>;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('settings\\language', seededLanguage);
      window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
      window.localStorage.setItem('progress\\progressState', JSON.stringify(progressState));
    },
    { language, progressState: createDashboardProgressState() },
  );
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
  await expect(page.getByText(fixture.activityLegendTitle, { exact: true }).last()).toBeVisible();
  for (const label of fixture.activityLegendLabels) {
    await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
  }
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
