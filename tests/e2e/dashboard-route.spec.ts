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
  mockHistoryAverage: string;
  mockHistoryEmptyState: string;
  mockHistoryExamLink: string;
  mockHistoryLatest: string;
  mockHistoryRecent: string;
  mockHistoryTimeUsed: string;
  mockHistoryTitle: string;
  mockHistoryTrendLabel: string;
  mockHistoryTrendPoint: string;
  mockHistoryTrendSummary: string;
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
    mockHistoryAverage: 'Snitt',
    mockHistoryEmptyState:
      'Genomför ett övningsprov så visas tidigare resultat, tempo och bästa försök här.',
    mockHistoryExamLink: 'Öppna övningsprovet',
    mockHistoryLatest: 'Senast',
    mockHistoryRecent: 'Senaste övningsprov',
    mockHistoryTimeUsed: 'Tid: 24m',
    mockHistoryTitle: 'Övningsprov över tid',
    mockHistoryTrendLabel: 'Resultattrend',
    mockHistoryTrendPoint: 'Trendpunkt 2 av 2: 84% den 2026-05-20.',
    mockHistoryTrendSummary:
      'Resultattrend för 2 senaste bedömda prov: senast 84%, 12 procentenheter högre än äldsta som visas.',
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
    mockHistoryAverage: 'Average',
    mockHistoryEmptyState:
      'Finish a mock exam and your past scores, pacing, and best attempt will appear here.',
    mockHistoryExamLink: 'Open the mock exam',
    mockHistoryLatest: 'Latest',
    mockHistoryRecent: 'Recent mock exams',
    mockHistoryTimeUsed: 'Time: 24m',
    mockHistoryTitle: 'Mock exam history',
    mockHistoryTrendLabel: 'Score trend',
    mockHistoryTrendPoint: 'Trend point 2 of 2: 84% on 2026-05-20.',
    mockHistoryTrendSummary:
      'Score trend across 2 recent scored exams: latest 84%, 12 points higher than the oldest shown.',
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

async function seedMockExamHistory(page: Page, language: AppLanguage) {
  await page.addInitScript((seededLanguage) => {
    const completedAt = '2026-05-20T12:00:00.000Z';
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', seededLanguage);
    window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
    window.localStorage.setItem(
      'progress\\progressState',
      JSON.stringify({
        completedQuestionIds: [],
        questionProgress: {},
        totalXp: 0,
        answerDates: [],
        answerHistory: [],
        dailyChallengeCompletions: {},
        mockExamSessions: [
          {
            sessionId: 'dashboard-mock-history-1',
            score: 0.72,
            completedAt: '2026-05-18T12:00:00.000Z',
            correctCount: 36,
            totalCount: 50,
            questionTimings: [
              { questionId: 'q001', timeSpentSeconds: 600 },
              { questionId: 'q002', timeSpentSeconds: 480 },
            ],
          },
          {
            sessionId: 'dashboard-mock-history-2',
            score: 0.84,
            completedAt,
            correctCount: 42,
            totalCount: 50,
            questionTimings: [
              { questionId: 'q003', timeSpentSeconds: 900 },
              { questionId: 'q004', timeSpentSeconds: 540 },
            ],
          },
        ],
        streakFreezeState: {
          available: 0,
          lastEarnedAt: '2026-05-20',
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          rescuedDayKeys: [],
        },
      }),
    );
  }, language);
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
  await expect(page.getByRole('heading', { name: fixture.mockHistoryTitle }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryEmptyState, { exact: true }).last()).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

async function expectMockHistoryVisible(page: Page, fixture: DashboardLocaleFixture) {
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  await expect(page.getByRole('heading', { name: fixture.mockHistoryTitle }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryLatest, { exact: true }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryAverage, { exact: true }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryTrendLabel, { exact: true }).last()).toBeVisible();
  await expect(
    page.getByText(fixture.mockHistoryTrendSummary, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByLabel(fixture.mockHistoryTrendPoint).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryRecent, { exact: true }).last()).toBeVisible();
  await expect(page.getByText('84%', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('78%', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('72%', { exact: true }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryTimeUsed, { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: fixture.mockHistoryExamLink }).last()).toBeVisible();
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

  test(`dashboard route renders mock exam history in ${fixture.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    await seedMockExamHistory(page, fixture.language);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectMockHistoryVisible(page, fixture);

    expect(consoleErrors).toEqual([]);
  });
}
