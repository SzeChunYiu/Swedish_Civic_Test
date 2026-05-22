import { expect, test, type Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

type RecapFixture = {
  language: AppLanguage;
  profileCta: string;
  profileCtaAccessibilityLabel: string;
  questionMetric: string;
  recapTitle: string;
  weakCta: RegExp;
};

const recapFixtures: RecapFixture[] = [
  {
    language: 'en',
    profileCta: 'View this week',
    profileCtaAccessibilityLabel: 'Open this week’s study recap',
    questionMetric: 'questions answered: 2',
    recapTitle: 'Your study week',
    weakCta: /Practise /,
  },
  {
    language: 'sv',
    profileCta: 'Visa veckan',
    profileCtaAccessibilityLabel: 'Öppna veckans studieöversikt',
    questionMetric: 'svarade frågor: 2',
    recapTitle: 'Din vecka i studierna',
    weakCta: /Öva /,
  },
];

function dateInCurrentLocalWeek(offsetDays: number, minuteOffset = 0) {
  const date = new Date();
  const offsetToMonday = (date.getDay() + 6) % 7;
  date.setHours(12, minuteOffset, 0, 0);
  date.setDate(date.getDate() - offsetToMonday + offsetDays);
  return date;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function progressSeed() {
  const firstAnswerAt = dateInCurrentLocalWeek(0);
  const secondAnswerAt = dateInCurrentLocalWeek(0, 2);
  const mockCompletedAt = dateInCurrentLocalWeek(1);

  return {
    answerDates: [localDateKey(firstAnswerAt)],
    answerHistory: [
      {
        answeredAt: firstAnswerAt.toISOString(),
        isCorrect: false,
        questionId: 'q001',
        timeSpentSeconds: 12,
      },
      {
        answeredAt: secondAnswerAt.toISOString(),
        isCorrect: true,
        questionId: 'q002',
        timeSpentSeconds: 9,
      },
    ],
    completedQuestionIds: ['q002'],
    dailyChallengeCompletions: {},
    mockExamSessions: [
      {
        completedAt: mockCompletedAt.toISOString(),
        correctCount: 14,
        questionTimings: [{ questionId: 'q001', timeSpentSeconds: 60 }],
        score: 0.7,
        sessionId: 'exam-weekly',
        totalCount: 20,
      },
    ],
    questionProgress: {
      q001: {
        correctCount: 0,
        correctStreak: 0,
        lastAnsweredAt: firstAnswerAt.toISOString(),
        questionId: 'q001',
        seenCount: 1,
        wrongCount: 1,
      },
      q002: {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: secondAnswerAt.toISOString(),
        questionId: 'q002',
        seenCount: 1,
        wrongCount: 0,
      },
    },
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 80,
  };
}

function readinessDeltaProgressSeed() {
  const previousAnswers = Array.from({ length: 30 }, (_, index) => ({
    answeredAt: dateInCurrentLocalWeek(-7, index).toISOString(),
    isCorrect: false,
    questionId: `q${String(index + 1).padStart(3, '0')}`,
    timeSpentSeconds: 10,
  }));
  const currentAnswers = Array.from({ length: 30 }, (_, index) => ({
    answeredAt: dateInCurrentLocalWeek(2, index).toISOString(),
    isCorrect: true,
    questionId: `q${String(index + 31).padStart(3, '0')}`,
    timeSpentSeconds: 10,
  }));

  return {
    answerDates: [localDateKey(dateInCurrentLocalWeek(2))],
    answerHistory: [...previousAnswers, ...currentAnswers],
    completedQuestionIds: currentAnswers.map((answer) => answer.questionId),
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    questionProgress: {},
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 300,
  };
}

async function openSeededProfile(page: Page, language: AppLanguage) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(progressSeed()),
    },
  });
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

for (const fixture of recapFixtures) {
  test(`Profile opens localized weekly recap in ${fixture.language}`, async ({ page }) => {
    await openSeededProfile(page, fixture.language);

    const profileRecapLink = page.getByRole('link', {
      name: fixture.profileCtaAccessibilityLabel,
    });
    await expect(profileRecapLink.getByText(fixture.profileCta)).toBeVisible();
    await profileRecapLink.click();
    await expect(page).toHaveURL(/\/recap/);
    await expect(page.getByRole('heading', { name: fixture.recapTitle })).toBeVisible();
    await expect(page.getByLabel(fixture.questionMetric)).toBeVisible();
    await expect(page.getByRole('link', { name: fixture.weakCta })).toBeVisible();
  });
}

test('Weekly recap surfaces readiness delta as a local preparation signal', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(readinessDeltaProgressSeed()),
    },
  });

  await page.goto('/recap', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByLabel(/readiness change: \+\d+/)).toBeVisible();
  await expect(
    page.getByText('local preparation signal, not an official prediction'),
  ).toBeVisible();
  await expect(page.getByText(/official pass|pass prediction|official outcome/i)).toHaveCount(0);
});

test('Weekly recap keeps quiet weeks encouraging and local-only', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify({
        answerDates: [],
        answerHistory: [],
        completedQuestionIds: [],
        dailyChallengeCompletions: {},
        mockExamSessions: [],
        questionProgress: {},
        streakFreezeState: {
          available: 0,
          lastEarnedAt: null,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          rescuedDayKeys: [],
        },
        totalXp: 0,
      }),
    },
  });

  await page.goto('/recap', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Quiet week' })).toBeVisible();
  await expect(page.getByText(/A quiet week still counts/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /\bPro\b|Remove Ads|\baccount\b/i })).toHaveCount(
    0,
  );
  await expect(page.getByRole('link', { name: /\bPro\b|Remove Ads|\baccount\b/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /\bPro\b|Remove Ads|\baccount\b/i })).toHaveCount(
    0,
  );
});
