import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  mockBrowserDate,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

const fixedNow = '2026-05-21T12:00:00.000Z';

type LocaleFixture = {
  defaultPracticeLink: string;
  language: AppLanguage;
  profileLinkLabel: string;
  profileTitle: string;
  quietBody: string;
  quietTitle: string;
  recapTitle: string;
};

const localeFixtures: LocaleFixture[] = [
  {
    defaultPracticeLink: 'Starta en kort övning',
    language: 'sv',
    profileLinkLabel: 'Öppna veckans översikt',
    profileTitle: 'Framsteg utan konto',
    quietBody:
      'En lugn vecka är okej. Börja med en kort övning när det passar, så byggs nästa översikt automatiskt.',
    quietTitle: 'Ingen aktivitet den här veckan',
    recapTitle: 'Veckans översikt',
  },
  {
    defaultPracticeLink: 'Start a short practice',
    language: 'en',
    profileLinkLabel: 'Open weekly recap',
    profileTitle: 'Progress without an account',
    quietBody:
      'A quiet week is fine. Start with a short practice when it fits, and the next recap will build automatically.',
    quietTitle: 'No activity this week',
    recapTitle: 'Weekly recap',
  },
];

test.use({ viewport: { width: 390, height: 844 } });

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

function buildWeeklyRecapProgressState() {
  return {
    answerDates: ['2026-05-20', '2026-05-21'],
    answerHistory: [
      {
        answeredAt: '2026-05-14T09:00:00.000Z',
        confidenceRating: 2,
        isCorrect: false,
        questionId: 'q003',
        timeSpentSeconds: 50,
      },
      {
        answeredAt: '2026-05-14T09:10:00.000Z',
        confidenceRating: 2,
        isCorrect: false,
        questionId: 'q013',
        timeSpentSeconds: 55,
      },
      {
        answeredAt: '2026-05-20T09:00:00.000Z',
        confidenceRating: 4,
        isCorrect: true,
        questionId: 'q001',
        timeSpentSeconds: 40,
      },
      {
        answeredAt: '2026-05-20T09:04:00.000Z',
        confidenceRating: 5,
        isCorrect: true,
        questionId: 'q002',
        timeSpentSeconds: 35,
      },
      {
        answeredAt: '2026-05-20T09:08:00.000Z',
        confidenceRating: 2,
        isCorrect: false,
        questionId: 'q011',
        timeSpentSeconds: 65,
      },
      {
        answeredAt: '2026-05-21T09:12:00.000Z',
        confidenceRating: 2,
        isCorrect: false,
        questionId: 'q012',
        timeSpentSeconds: 70,
      },
    ],
    completedQuestionIds: ['q001', 'q002'],
    dailyChallengeCompletions: {},
    mockExamSessions: [
      {
        completedAt: '2026-05-20T15:00:00.000Z',
        correctCount: 42,
        questionTimings: [
          { questionId: 'q001', timeSpentSeconds: 800 },
          { questionId: 'q011', timeSpentSeconds: 640 },
        ],
        score: 0.84,
        sessionId: 'weekly-recap-mock-1',
        totalCount: 50,
      },
    ],
    questionProgress: {
      q001: {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-20T09:00:00.000Z',
        questionId: 'q001',
        seenCount: 1,
        wrongCount: 0,
      },
      q002: {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-20T09:04:00.000Z',
        questionId: 'q002',
        seenCount: 1,
        wrongCount: 0,
      },
      q011: {
        correctCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-20T09:08:00.000Z',
        questionId: 'q011',
        seenCount: 1,
        wrongCount: 1,
      },
      q012: {
        correctCount: 0,
        correctStreak: 0,
        lastAnsweredAt: '2026-05-21T09:12:00.000Z',
        questionId: 'q012',
        seenCount: 1,
        wrongCount: 1,
      },
      q013: {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: '2026-05-21T10:00:00.000Z',
        questionId: 'q013',
        seenCount: 2,
        wrongCount: 1,
      },
    },
    streakFreezeState: {
      available: 0,
      lastEarnedAt: '2026-05-20',
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 120,
  };
}

async function seedQuietProfile(page: Page, language: AppLanguage) {
  await mockBrowserDate(page, fixedNow);
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language);
}

async function seedWeeklyRecapProgress(page: Page, language: AppLanguage) {
  await mockBrowserDate(page, fixedNow);
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(buildWeeklyRecapProgressState()),
    },
  });
}

for (const fixture of localeFixtures) {
  test(`profile opens quiet weekly recap in ${fixture.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    await seedQuietProfile(page, fixture.language);

    await page.goto('/profile', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.profileTitle }).last()).toBeVisible();
    await page.getByRole('link', { name: fixture.profileLinkLabel }).click();

    await expect(page).toHaveURL(/\/recap(?:\?|$)/);
    await expect(page.getByRole('heading', { name: fixture.recapTitle }).last()).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.quietTitle }).last()).toBeVisible();
    await expect(page.getByText(fixture.quietBody, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: fixture.defaultPracticeLink })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
}

test('weekly recap summarizes progress and routes the weak chapter CTA', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await seedWeeklyRecapProgress(page, 'en');

  await page.goto('/recap', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Weekly recap' }).last()).toBeVisible();
  await expect(
    page
      .getByText(
        'Weekly recap: 4 answers, 50% accuracy, 2 chapters, 1 mistake fixed, and 1 mock exam.',
        { exact: true },
      )
      .last(),
  ).toBeVisible();
  await expect(page.getByLabel('answers: 4')).toBeVisible();
  await expect(page.getByLabel('accuracy: 50%. 50 points up from last week')).toBeVisible();
  await expect(page.getByLabel('chapters: 2')).toBeVisible();
  await expect(page.getByLabel('mistakes fixed: 1')).toBeVisible();
  await expect(page.getByLabel('mock exams: 1')).toBeVisible();
  await expect(page.getByLabel('best mock: 84%')).toBeVisible();
  await expect(
    page.getByText("The country of Sweden, Sweden's democratic system", { exact: true }),
  ).toBeVisible();

  const weakChapterLink = page.getByRole('link', {
    name: "Practise weak chapter: Sweden's democratic system",
  });
  await expect(weakChapterLink).toBeVisible();
  await expect(page.getByText('Weakest chapter you touched this week: 0% accuracy.')).toBeVisible();
  await weakChapterLink.click();
  await expect(page).toHaveURL(/\/quiz\/q011\?chapterId=ch02$/);

  expect(consoleErrors).toEqual([]);
});
