import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const dayMs = 24 * 60 * 60 * 1000;

type DashboardLocaleFixture = {
  activityTitle: string;
  chapterAccuracyText: string;
  dashboardLinkLabel: RegExp | string;
  language: AppLanguage;
  nonEmptyActivityHigh: string;
  nonEmptyActivityLegendTitle: string;
  nonEmptyActivityLow: string;
  nonEmptyActivityMedium: string;
  nonEmptyActivityNone: string;
  nonEmptyActivitySummary: string;
  nonEmptyChapterLinkLabel: string;
  nonEmptyChapterName: string;
  nonEmptyChapterProgressCoverageText: string;
  nonEmptyStreakSummary: string;
  nonEmptySummaryLine: string;
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

type DashboardProgressSeed = {
  activeDayKeys: string[];
  dayBeforeYesterdayKey: string;
  todayKey: string;
  yesterdayKey: string;
};

const dashboardLocales: DashboardLocaleFixture[] = [
  {
    activityTitle: 'Aktiva dagar',
    chapterAccuracyText: 'Rätt: 75%',
    chapterProgressTitle: 'Kapitelframsteg',
    dashboardLinkLabel: /Öppna framstegsöversikten/,
    language: 'sv',
    nonEmptyActivityHigh: 'Hög aktivitet',
    nonEmptyActivityLegendTitle: 'Aktivitetsskala',
    nonEmptyActivityLow: 'Låg aktivitet',
    nonEmptyActivityMedium: 'Medelaktivitet',
    nonEmptyActivityNone: 'Inga svar',
    nonEmptyActivitySummary: '4 svar under perioden. 3 aktiva dagar. Högsta dag: 2 svar.',
    nonEmptyChapterLinkLabel: 'Öppna Landet Sverige',
    nonEmptyChapterName: 'Landet Sverige',
    nonEmptyChapterProgressCoverageText: 'Täckning: 6%',
    nonEmptyStreakSummary: '30 XP de senaste 30 dagarna. 3 aktiva dagar. 3 dagars svit. Nivå 3.',
    nonEmptySummaryLine: '4 svar den här veckan · 1 kapitel provade · 1 olösta misstag',
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
    chapterAccuracyText: 'Accuracy: 75%',
    chapterProgressTitle: 'Chapter progress',
    dashboardLinkLabel: /Open (?:the )?progress dashboard/,
    language: 'en',
    nonEmptyActivityHigh: 'High activity',
    nonEmptyActivityLegendTitle: 'Activity scale',
    nonEmptyActivityLow: 'Low activity',
    nonEmptyActivityMedium: 'Medium activity',
    nonEmptyActivityNone: 'No answers',
    nonEmptyActivitySummary: '4 answers in this period. 3 active days. Highest day: 2 answers.',
    nonEmptyChapterLinkLabel: 'Open The country of Sweden',
    nonEmptyChapterName: 'The country of Sweden',
    nonEmptyChapterProgressCoverageText: 'Coverage: 6%',
    nonEmptyStreakSummary: '30 XP in the last 30 days. 3 active days. 3 day streak. Level 3.',
    nonEmptySummaryLine: '4 answers this week · 1 chapters tried · 1 unresolved mistakes',
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

function dateOffset(baseDate: Date, daysFromBase: number): Date {
  return new Date(baseDate.getTime() + daysFromBase * dayMs);
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoAtLocalHour(baseDate: Date, daysFromBase: number, hour: number): string {
  const date = dateOffset(baseDate, daysFromBase);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function buildNonEmptyDashboardProgressSeed() {
  const today = new Date();
  const dayBeforeYesterdayDate = dateOffset(today, -2);
  const yesterdayDate = dateOffset(today, -1);
  const seed: DashboardProgressSeed = {
    activeDayKeys: [
      localDateKey(dayBeforeYesterdayDate),
      localDateKey(yesterdayDate),
      localDateKey(today),
    ],
    dayBeforeYesterdayKey: localDateKey(dayBeforeYesterdayDate),
    todayKey: localDateKey(today),
    yesterdayKey: localDateKey(yesterdayDate),
  };
  const todayMorning = isoAtLocalHour(today, 0, 9);
  const todayLater = isoAtLocalHour(today, 0, 10);
  const yesterday = isoAtLocalHour(today, -1, 11);
  const dayBeforeYesterday = isoAtLocalHour(today, -2, 12);

  return {
    progress: {
      answerDates: seed.activeDayKeys,
      answerHistory: [
        {
          answeredAt: todayMorning,
          confidenceRating: 4,
          isCorrect: true,
          questionId: 'q001',
          timeSpentSeconds: 45,
        },
        {
          answeredAt: todayLater,
          confidenceRating: 2,
          isCorrect: false,
          questionId: 'q002',
          timeSpentSeconds: 70,
        },
        {
          answeredAt: yesterday,
          confidenceRating: 5,
          isCorrect: true,
          questionId: 'q003',
          timeSpentSeconds: 55,
        },
        {
          answeredAt: dayBeforeYesterday,
          confidenceRating: 4,
          isCorrect: true,
          questionId: 'q004',
          timeSpentSeconds: 60,
        },
      ],
      completedQuestionIds: ['q001', 'q003', 'q004'],
      dailyChallengeCompletions: {},
      mockExamSessions: [
        {
          completedAt: yesterday,
          correctCount: 41,
          questionTimings: [
            { questionId: 'q001', timeSpentSeconds: 720 },
            { questionId: 'q002', timeSpentSeconds: 540 },
          ],
          score: 0.82,
          sessionId: 'dashboard-nonempty-mock-1',
          totalCount: 50,
        },
      ],
      questionProgress: {
        q001: {
          correctCount: 1,
          correctStreak: 1,
          lastAnsweredAt: todayMorning,
          questionId: 'q001',
          seenCount: 1,
          wrongCount: 0,
        },
        q002: {
          correctCount: 0,
          correctStreak: 0,
          lastAnsweredAt: todayLater,
          questionId: 'q002',
          seenCount: 1,
          wrongCount: 1,
        },
        q003: {
          correctCount: 1,
          correctStreak: 1,
          lastAnsweredAt: yesterday,
          questionId: 'q003',
          seenCount: 1,
          wrongCount: 0,
        },
        q004: {
          correctCount: 1,
          correctStreak: 1,
          lastAnsweredAt: dayBeforeYesterday,
          questionId: 'q004',
          seenCount: 1,
          wrongCount: 0,
        },
      },
      streakFreezeState: {
        available: 1,
        lastEarnedAt: seed.dayBeforeYesterdayKey,
        lifetimeEarned: 1,
        lifetimeSpent: 0,
        rescuedDayKeys: [],
      },
      totalXp: 420,
    },
    seed,
  };
}

async function seedCleanLanguage(page: Page, language: AppLanguage) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
}

async function seedNonEmptyDashboardProgress(page: Page, language: AppLanguage) {
  const { progress, seed } = buildNonEmptyDashboardProgressSeed();

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(progress),
    },
  });

  return seed;
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

async function expectNonEmptyProgressVisible(
  page: Page,
  fixture: DashboardLocaleFixture,
  seed: DashboardProgressSeed,
) {
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  await expect(page.getByRole('heading', { name: fixture.title }).last()).toBeVisible();
  await expect(page.getByText(fixture.nonEmptyActivitySummary, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.nonEmptySummaryLine, { exact: true })).toBeVisible();

  await expect(page.getByText(fixture.nonEmptyActivityLegendTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.nonEmptyActivityNone, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.nonEmptyActivityLow, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.nonEmptyActivityMedium, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.nonEmptyActivityHigh, { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(
      fixture.language === 'sv' ? `${seed.todayKey}: 2 svar` : `${seed.todayKey}: 2 answers`,
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      fixture.language === 'sv'
        ? `${seed.yesterdayKey}: 1 svar`
        : `${seed.yesterdayKey}: 1 answers`,
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      fixture.language === 'sv'
        ? `${seed.dayBeforeYesterdayKey}: 1 svar`
        : `${seed.dayBeforeYesterdayKey}: 1 answers`,
    ),
  ).toBeVisible();

  const chapterLink = page.getByRole('link', { name: fixture.nonEmptyChapterLinkLabel }).last();
  await expect(chapterLink).toBeVisible();
  await expect(chapterLink).toContainText(fixture.nonEmptyChapterName);
  await expect(chapterLink).toContainText(fixture.chapterAccuracyText);
  await expect(chapterLink).toContainText(fixture.nonEmptyChapterProgressCoverageText);

  await expect(page.getByLabel(fixture.nonEmptyStreakSummary).first()).toBeVisible();
  await expect(page.getByLabel(`${seed.todayKey}: 10`).first()).toBeVisible();
  await expect(page.getByLabel(`${seed.yesterdayKey}: 10`).first()).toBeVisible();
  await expect(page.getByLabel(`${seed.dayBeforeYesterdayKey}: 10`).first()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryTitle, { exact: true }).last()).toBeVisible();
  await expect(page.getByText(fixture.mockHistoryEmptyState, { exact: true })).toHaveCount(0);
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

  test(`dashboard route renders non-empty progress in ${fixture.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    const seed = await seedNonEmptyDashboardProgress(page, fixture.language);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectNonEmptyProgressVisible(page, fixture, seed);

    expect(consoleErrors).toEqual([]);
  });
}
