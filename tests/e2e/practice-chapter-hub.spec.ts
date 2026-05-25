import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  seedSettingsLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function seedEnglishHub(page: Page) {
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);
}

function seededProgressState(entries: { isCorrect: boolean; questionId: string }[]) {
  const answeredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const answerDate = answeredAt.slice(0, 10);

  return {
    answerDates: [answerDate],
    answerHistory: entries.map((entry) => ({ ...entry, answeredAt })),
    completedQuestionIds: entries.map((entry) => entry.questionId),
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    questionProgress: Object.fromEntries(
      entries.map((entry) => [
        entry.questionId,
        {
          correctCount: entry.isCorrect ? 1 : 0,
          correctStreak: entry.isCorrect ? 1 : 0,
          lastAnsweredAt: answeredAt,
          questionId: entry.questionId,
          seenCount: 1,
          wrongCount: entry.isCorrect ? 0 : 1,
        },
      ]),
    ),
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 20,
  };
}

function seededChapterProgressState() {
  return seededProgressState([
    { isCorrect: true, questionId: 'q011' },
    { isCorrect: false, questionId: 'q012' },
  ]);
}

function seededVisiblePracticeProgressState() {
  return seededProgressState([
    { isCorrect: true, questionId: 'q001' },
    { isCorrect: true, questionId: 'q002' },
  ]);
}

async function seedEnglishHubWithChapterProgress(page: Page) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(seededChapterProgressState()),
    },
  });
}

async function seedEnglishHubWithVisibleProgress(page: Page) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify(seededVisiblePracticeProgressState()),
    },
  });
}

async function expectTapTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

test('practice opens on a localized hub with chapter cards and mock exam link', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(page.getByText('Practice hub', { exact: true })).toBeVisible();
  await expect(page.getByText(/You have answered 0 of \d+ visible questions\./)).toBeVisible();
  await expect(page.getByText('Question 1')).toHaveCount(0);

  const allPractice = page.getByRole('button', {
    name: 'Start practice with all visible questions',
  });
  const quickRound = page.getByRole('button', { name: 'Start a quick round with 10 questions' });
  const mockExam = page.getByRole('link', { name: 'Go to the mock exam' });
  const chapterCard = page.getByRole('button', {
    name: /Sweden's democratic system: 0 of \d+ questions answered, 0% accuracy\. Practise this chapter\./,
  });

  await expectTapTarget(allPractice, 'all-practice CTA');
  await expectTapTarget(quickRound, 'quick-round CTA');
  await expectTapTarget(mockExam, 'mock exam link');
  await expectTapTarget(chapterCard, 'chapter practice card');
  expect(consoleErrors).toEqual([]);
});

test('all-practice CTA starts the first unanswered visible question', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHubWithVisibleProgress(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/You have answered 2 of \d+ visible questions\./)).toBeVisible();
  await page.getByRole('button', { name: 'Start practice with all visible questions' }).click();

  await expect(page.getByText('Question 3', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where is Sweden located?' })).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: "Sweden's northernmost part lies north of the Arctic Circle.",
    }),
  ).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('quick-round CTA starts the first unanswered quick question', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHubWithVisibleProgress(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page.getByRole('button', { name: 'Start a quick round with 10 questions' }).click();

  await expect(page.getByText('Question 3', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where is Sweden located?' })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('chapter selection starts a chapter-scoped practice loop', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page
    .getByRole('button', {
      name: /Sweden's democratic system: 0 of \d+ questions answered, 0% accuracy\. Practise this chapter\./,
    })
    .click();

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What does democracy mean?' })).toBeVisible();
  await expect(page.getByText('Choose how to practise')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('chapterId route param starts only a valid visible chapter practice loop', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/practice?chapterId=__proto__', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/practice\?chapterId=__proto__/);
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(page.getByText('Question 1')).toHaveCount(0);

  await page.goto('/practice?chapterId=ch02', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/practice\?chapterId=ch02/);
  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What does democracy mean?' })).toBeVisible();
  await expect(page.getByText('Choose how to practise')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('practice hub reflects chapter progress and starts the next unanswered chapter question', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHubWithChapterProgress(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/You have answered 2 of \d+ visible questions\./)).toBeVisible();

  const chapterCard = page.getByRole('button', {
    name: /Sweden's democratic system: 2 of \d+ questions answered, 50% accuracy\. Practise this chapter\./,
  });
  await expect(chapterCard).toBeVisible();
  await expect(chapterCard.getByText(/2 of \d+ questions answered/)).toBeVisible();
  await expect(chapterCard.getByText('50% accuracy')).toBeVisible();

  await chapterCard.click();

  await expect(page.getByText('Question 3', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'How can people influence society and participate in democracy?',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What does democracy mean?' })).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: 'Which of the following is part of free elections in a democracy?',
    }),
  ).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('chapter reader report link opens source context without selected answer', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/chapter/ch02', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const reportLink = page.getByRole('link', { name: /Report question q\d+/ }).first();
  await expect(reportLink).toBeVisible();
  await expectTapTarget(reportLink, 'chapter question report link');
  await reportLink.click();

  await expect(page).toHaveURL(/\/support\?/);
  await expect(page).toHaveURL(/reportScreen=chapter/);
  await expect(page).not.toHaveURL(/selectedAnswer=/);
  const reportContext = page.getByLabel(/Report context for question q\d+/);
  await expect(reportContext.getByText('Question report context')).toBeVisible();
  await expect(reportContext.getByText('Question ID')).toBeVisible();
  await expect(reportContext.getByText('Source', { exact: true })).toBeVisible();
  await expect(reportContext.getByText(/Source: Sverige i fokus/)).toBeVisible();
  await expect(reportContext.getByText('Active language')).toBeVisible();
  await expect(reportContext.getByText('en', { exact: true })).toBeVisible();
  await expect(reportContext.getByText('Screen')).toBeVisible();
  await expect(reportContext.getByText('Chapter', { exact: true })).toBeVisible();
  await expect(reportContext.getByText('Selected answer')).toHaveCount(0);
  await expect(
    page.getByText(/Do not add names, personal identity numbers, case numbers/),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
