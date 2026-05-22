import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

type HomePreparationCopy = {
  caveat: RegExp;
  ctaAccessibleName: RegExp;
  detail: RegExp;
  heading: RegExp;
  metric: RegExp;
  oldCopy: RegExp;
  timedPracticeCta: RegExp;
};

const preparationCopy: Record<AppLanguage, HomePreparationCopy> = {
  sv: {
    caveat: /Bygger bara på dina svar och övningsprov i appen, inte en officiell prognos/i,
    ctaAccessibleName: /Starta ett tidsatt övningsprov från kortet Förberedelsesignal/i,
    detail: /\d+ % rätt i appen · \d+ % av kapitlen provade/i,
    heading: /Förberedelsesignal/i,
    metric: /^lokalt$/i,
    oldCopy: /Redoindikator|Provredo|Nästan redo/i,
    timedPracticeCta: /Gör ett tidsatt övningsprov/i,
  },
  en: {
    caveat: /Based only on your in-app answers and mock practice, not an official result forecast/i,
    ctaAccessibleName: /Start a timed practice exam from the Preparation signal card/i,
    detail: /\d+% in-app accuracy · \d+% chapters tried/i,
    heading: /Preparation signal/i,
    metric: /^local$/i,
    oldCopy: /Readiness indicator|Exam readiness|Almost ready/i,
    timedPracticeCta: /Take a timed practice exam/i,
  },
};

test.use({ viewport: { width: 390, height: 844 } });

async function expectHomeWithoutHorizontalOverflow(page: Page) {
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

function buildHomePreparationProgressState() {
  const now = new Date();
  const answeredAt = now.toISOString();
  const today = answeredAt.slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const questionIds = Array.from(
    { length: 32 },
    (_, index) => `q${String(index + 1).padStart(3, '0')}`,
  );
  const questionProgress = Object.fromEntries(
    questionIds.map((questionId, index) => [
      questionId,
      {
        questionId,
        seenCount: 1,
        correctCount: index % 5 === 0 ? 0 : 1,
        wrongCount: index % 5 === 0 ? 1 : 0,
        correctStreak: index % 5 === 0 ? 0 : 1,
        lastAnsweredAt: answeredAt,
      },
    ]),
  );
  const mockAnswers = questionIds.slice(0, 20).map((questionId, index) => ({
    questionId,
    isCorrect: index < 16,
    timeSpentSeconds: 18,
  }));

  return {
    completedQuestionIds: questionIds,
    questionProgress,
    totalXp: 640,
    answerDates: [yesterday, today],
    mockExamSessions: [
      {
        sessionId: 'home-preparation-signal-seed',
        score: 0.8,
        completedAt: answeredAt,
        correctCount: 16,
        totalCount: 20,
        answers: mockAnswers,
      },
    ],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: today,
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  };
}

async function seedHomePreparationState(page: Page, language: AppLanguage) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      'progress\\progressState': JSON.stringify(buildHomePreparationProgressState()),
    },
  });
}

for (const language of ['sv', 'en'] as const) {
  test(`home preparation signal copy stays local and mobile-safe in ${language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);
    const copy = preparationCopy[language];

    await seedHomePreparationState(page, language);
    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByText(copy.heading).first()).toBeVisible();
    await expect(page.getByText(copy.metric).first()).toBeVisible();
    await expect(page.getByText(copy.detail).first()).toBeVisible();
    await expect(page.getByText(copy.caveat).first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(copy.oldCopy);
    await expectHomeWithoutHorizontalOverflow(page);

    const timedPracticeLink = page.getByRole('link', { name: copy.ctaAccessibleName }).first();
    await expect(timedPracticeLink).toBeVisible();
    await expect(page.getByText(copy.timedPracticeCta).first()).toBeVisible();
    await timedPracticeLink.click();
    await expect(page).toHaveURL(/\/exam(?:$|[?#])/);
    expect(consoleErrors.get()).toEqual([]);
  });
}
