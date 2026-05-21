import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

const importedStorageKeys = [
  'progress\\progressState',
  'mistake-review\\mistakeReviewState',
  'reviews\\learning.reviews.cards.v1',
  'settings\\dailyGoalAnswers',
  'citizenship-requirements\\citizenshipRequirementsChecklistState',
];

function reviewCard(questionId: string) {
  return {
    questionId,
    difficulty: 5,
    stability: 7,
    reps: 1,
    lapses: 0,
    state: 'review',
    lastReviewAt: null,
    dueAt: '2026-05-21T08:00:00.000Z',
  };
}

async function expectImportStorageWrites(page: Page, expectedWritten: boolean) {
  const values = await page.evaluate((keys) => {
    return Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]));
  }, importedStorageKeys);

  for (const key of importedStorageKeys) {
    if (expectedWritten) {
      expect(values[key], `${key} should be written after confirmed import`).not.toBeNull();
    } else {
      expect(values[key], `${key} should stay untouched before confirmed import`).toBeNull();
    }
  }
}

async function previewImport(page: Page, language: AppLanguage, payload: unknown) {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(language === 'sv' ? 'Klistra in JSON-export' : 'Paste JSON export')
    .fill(JSON.stringify(payload));
  await page
    .getByRole('button', {
      name:
        language === 'sv'
          ? 'Förhandsgranska lokal studiedataimport'
          : 'Preview local study data import',
    })
    .click();

  await expectImportStorageWrites(page, false);

  return errors;
}

test('settings import preview uses singular English summary copy before confirmed apply', async ({
  page,
}) => {
  const errors = await previewImport(page, 'en', {
    version: 1,
    progress: {
      completedQuestionIds: ['q001'],
      questionProgress: {
        q001: {
          seenCount: 1,
          correctCount: 1,
          wrongCount: 0,
          correctStreak: 1,
          bookmarked: true,
          lastAnsweredAt: '2026-05-20T08:00:00.000Z',
          nextReviewAt: '2026-05-21T08:00:00.000Z',
        },
      },
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 1,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 1,
          totalCount: 1,
        },
      ],
    },
    mistakeReview: {
      wrongAnswerReviews: {
        q001: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
      },
    },
    reviews: {
      byId: { q001: reviewCard('q001') },
      gradedPerDay: { '2026-05-20': 1 },
    },
    settings: {
      dailyGoalAnswers: 20,
    },
    citizenshipRequirements: {
      checkedAreaIds: ['identity'],
    },
  });

  for (const line of [
    '1 question with saved progress',
    '1 bookmark',
    '1 wrong-answer review',
    '1 mock exam history entry',
    '1 FSRS review card',
    '1 FSRS review day',
    '1 saved setting',
    '1 marked requirement',
  ]) {
    await expect(page.getByText(line)).toBeVisible();
  }

  await page.getByRole('button', { name: 'Confirm local study data import' }).click();
  await expect(page.getByText('Import complete.')).toBeVisible();
  await expectImportStorageWrites(page, true);
  expect(errors.get()).toEqual([]);
});

test('settings import preview uses plural Swedish summary copy before confirmed apply', async ({
  page,
}) => {
  const errors = await previewImport(page, 'sv', {
    version: 1,
    progress: {
      completedQuestionIds: ['q001', 'q002'],
      questionProgress: {
        q001: {
          seenCount: 1,
          correctCount: 1,
          wrongCount: 0,
          correctStreak: 1,
          bookmarked: true,
          lastAnsweredAt: '2026-05-20T08:00:00.000Z',
          nextReviewAt: '2026-05-21T08:00:00.000Z',
        },
        q002: {
          seenCount: 1,
          correctCount: 0,
          wrongCount: 1,
          correctStreak: 0,
          bookmarked: true,
          lastAnsweredAt: '2026-05-21T08:00:00.000Z',
          nextReviewAt: '2026-05-22T08:00:00.000Z',
        },
      },
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 1,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 1,
          totalCount: 1,
        },
        {
          sessionId: 'mock-2',
          score: 0.5,
          completedAt: '2026-05-21T09:00:00.000Z',
          correctCount: 1,
          totalCount: 2,
        },
      ],
    },
    mistakeReview: {
      wrongAnswerReviews: {
        q001: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        q002: {
          answeredAt: '2026-05-21T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
      },
    },
    reviews: {
      byId: { q001: reviewCard('q001'), q002: reviewCard('q002') },
      gradedPerDay: { '2026-05-20': 1, '2026-05-21': 1 },
    },
    settings: {
      audioEnabled: false,
      dailyGoalAnswers: 20,
    },
    citizenshipRequirements: {
      checkedAreaIds: ['identity', 'civicKnowledge'],
    },
  });

  for (const line of [
    '2 frågor med sparad progression',
    '2 bokmärken',
    '2 granskningar av fel svar',
    '2 provhistorikposter',
    '2 repetitionskort',
    '2 repetitionsdagar',
    '2 sparade inställningar',
    '2 markerade kravområden',
  ]) {
    await expect(page.getByText(line)).toBeVisible();
  }

  await page.getByRole('button', { name: 'Bekräfta lokal studiedataimport' }).click();
  await expect(page.getByText('Importen är klar.')).toBeVisible();
  await expectImportStorageWrites(page, true);
  expect(errors.get()).toEqual([]);
});
