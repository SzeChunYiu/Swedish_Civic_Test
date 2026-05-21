import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

const progressStateKey = 'progress\\progressState';
const mistakeReviewStateKey = 'mistake-review\\mistakeReviewState';
const reviewStateKey = 'reviews\\learning.reviews.cards.v1';
const settingsLanguageKey = 'settings\\language';
const settingsAudioEnabledKey = 'settings\\audioEnabled';
const settingsDailyGoalKey = 'settings\\dailyGoalAnswers';
const settingsIncludeSupplementaryKey = 'settings\\includeSupplementaryQuestions';

type Scenario = {
  language: AppLanguage;
  importedLanguage: AppLanguage;
  inputLabel: string;
  previewName: string;
  confirmName: string;
  successText: string;
  summaryTexts: string[];
};

const scenarios: Scenario[] = [
  {
    language: 'sv',
    importedLanguage: 'en',
    inputLabel: 'Klistra in JSON-export',
    previewName: 'Förhandsgranska lokal studiedataimport',
    confirmName: 'Bekräfta lokal studiedataimport',
    successText: 'Importen är klar.',
    summaryTexts: [
      '2 frågor med sparad progression',
      '1 granskning av fel svar',
      '1 genomfört övningsprov',
      '1 repetitionskort',
      '5 sparade inställningar',
    ],
  },
  {
    language: 'en',
    importedLanguage: 'sv',
    inputLabel: 'Paste JSON export',
    previewName: 'Preview local study data import',
    confirmName: 'Confirm local study data import',
    successText: 'Import complete.',
    summaryTexts: [
      '2 questions with saved progress',
      '1 wrong-answer review',
      '1 completed mock exam',
      '1 FSRS review card',
      '5 saved settings',
    ],
  },
];

function buildValidImportPayload(importedLanguage: AppLanguage): string {
  return JSON.stringify({
    version: 1,
    progress: {
      completedQuestionIds: ['q001', 'q002'],
      questionProgress: {
        q001: {
          seenCount: 3,
          correctCount: 2,
          wrongCount: 1,
          correctStreak: 2,
          bookmarked: true,
          lastAnsweredAt: '2026-05-20T08:00:00.000Z',
          nextReviewAt: '2026-05-21T08:00:00.000Z',
        },
      },
      totalXp: 42,
      answerDates: ['2026-05-20'],
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 0.75,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 3,
          totalCount: 4,
        },
      ],
      streakFreezeState: {
        available: 2,
        lastEarnedAt: '2026-05-20',
        lifetimeEarned: 4,
        lifetimeSpent: 1,
        rescuedDayKeys: ['2026-05-19'],
      },
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
      byId: {
        q001: {
          questionId: 'q001',
          difficulty: 5,
          stability: 7,
          reps: 2,
          lapses: 0,
          state: 'review',
          lastReviewAt: null,
          dueAt: '2026-05-21T08:00:00.000Z',
        },
      },
      gradedPerDay: {
        '2026-05-20': 2,
      },
    },
    settings: {
      language: importedLanguage,
      audioEnabled: false,
      dailyGoalAnswers: 20,
      includeSupplementaryQuestions: true,
      hasSeenAboutTheTest: true,
    },
  });
}

async function readImportStorage(page: Page) {
  return page.evaluate(
    ({
      audioKey,
      dailyGoalKey,
      includeSupplementaryKey,
      languageKey,
      mistakeKey,
      progressKey,
      reviewKey,
    }) => ({
      progress: window.localStorage.getItem(progressKey),
      mistakeReview: window.localStorage.getItem(mistakeKey),
      reviews: window.localStorage.getItem(reviewKey),
      settings: {
        language: window.localStorage.getItem(languageKey),
        audioEnabled: window.localStorage.getItem(audioKey),
        dailyGoalAnswers: window.localStorage.getItem(dailyGoalKey),
        includeSupplementaryQuestions: window.localStorage.getItem(includeSupplementaryKey),
      },
    }),
    {
      audioKey: settingsAudioEnabledKey,
      dailyGoalKey: settingsDailyGoalKey,
      includeSupplementaryKey: settingsIncludeSupplementaryKey,
      languageKey: settingsLanguageKey,
      mistakeKey: mistakeReviewStateKey,
      progressKey: progressStateKey,
      reviewKey: reviewStateKey,
    },
  );
}

async function expectNoImportApplied(page: Page, language: AppLanguage) {
  await expect
    .poll(() => readImportStorage(page))
    .toEqual({
      progress: null,
      mistakeReview: null,
      reviews: null,
      settings: {
        language,
        audioEnabled: null,
        dailyGoalAnswers: null,
        includeSupplementaryQuestions: null,
      },
    });
}

async function expectImportApplied(page: Page, importedLanguage: AppLanguage) {
  await expect
    .poll(async () => {
      const storage = await readImportStorage(page);
      return {
        progress: storage.progress ? JSON.parse(storage.progress) : null,
        mistakeReview: storage.mistakeReview ? JSON.parse(storage.mistakeReview) : null,
        reviews: storage.reviews ? JSON.parse(storage.reviews) : null,
        settings: storage.settings,
      };
    })
    .toMatchObject({
      progress: {
        completedQuestionIds: ['q001', 'q002'],
        questionProgress: {
          q001: {
            bookmarked: true,
            correctCount: 2,
            wrongCount: 1,
          },
        },
        mockExamSessions: [
          {
            sessionId: 'mock-1',
            correctCount: 3,
            totalCount: 4,
          },
        ],
        streakFreezeState: {
          rescuedDayKeys: ['2026-05-19'],
        },
      },
      mistakeReview: {
        wrongAnswerReviews: {
          q001: {
            selectedOptionTextEn: 'Wrong answer',
            selectedOptionTextSv: 'Fel svar',
          },
        },
      },
      reviews: {
        byId: {
          q001: {
            state: 'review',
            dueAt: '2026-05-21T08:00:00.000Z',
          },
        },
        gradedPerDay: {
          '2026-05-20': 2,
        },
      },
      settings: {
        language: importedLanguage,
        audioEnabled: 'false',
        dailyGoalAnswers: '20',
        includeSupplementaryQuestions: 'true',
      },
    });
}

for (const scenario of scenarios) {
  test(`settings import previews and confirms valid study data in ${scenario.language}`, async ({
    page,
  }) => {
    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    const errors = collectConsoleAndPageErrors(page);

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectNoImportApplied(page, scenario.language);

    await page
      .getByLabel(scenario.inputLabel)
      .fill(buildValidImportPayload(scenario.importedLanguage));
    await page.getByRole('button', { name: scenario.previewName }).click();

    for (const summaryText of scenario.summaryTexts) {
      await expect(page.getByText(summaryText)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: scenario.confirmName })).toBeVisible();
    await expectNoImportApplied(page, scenario.language);

    await page.getByRole('button', { name: scenario.confirmName }).click();

    await expect(page.getByText(scenario.successText)).toBeVisible();
    await expect(page.getByText(scenario.summaryTexts[0])).toHaveCount(0);
    await expectImportApplied(page, scenario.importedLanguage);
    expect(errors.get()).toEqual([]);
  });
}
