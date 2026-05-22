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
const citizenshipRequirementsCheckedAreaIdsKey =
  'citizenship-requirements\\citizenshipRequirements.checkedAreaIds.v1';
const citizenshipRequirementsLegacyStateKey =
  'citizenship-requirements\\citizenshipRequirementsChecklistState';
const highlightsStateKey = 'highlights\\ebook.highlights.v1';

type ImportExpectation = {
  completedQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  wrongAnswerReviewIds: string[];
  mockExamSessionIds: string[];
  rescuedDayKeys: string[];
  reviewIds: string[];
  gradedPerDay: Record<string, number>;
  checkedAreaIds: string[];
  highlightIds: string[];
};

type ImportPayloadCase = {
  name: 'singular' | 'plural';
  buildPayload: (importedLanguage: AppLanguage) => string;
  expected: ImportExpectation;
  absentSummaryTexts: Record<AppLanguage, string[]>;
  summaryTexts: Record<AppLanguage, string[]>;
};

type Scenario = {
  language: AppLanguage;
  importedLanguage: AppLanguage;
  inputLabel: string;
  previewName: string;
  confirmName: string;
  resetName: string;
  invalidJsonText: string;
  persistenceWarningText: RegExp;
  successText: string;
};

const scenarios: Scenario[] = [
  {
    language: 'sv',
    importedLanguage: 'en',
    inputLabel: 'Klistra in JSON-export',
    previewName: 'Förhandsgranska lokal studiedataimport',
    confirmName: 'Bekräfta lokal studiedataimport',
    resetName: 'Återställ importfält',
    invalidJsonText: 'JSON kunde inte läsas.',
    persistenceWarningText:
      /Importen lades in, men kunde inte sparas varaktigt för: progression\. Den datan finns bara i minnet tills appen stängs\./,
    successText: 'Importen är klar.',
  },
  {
    language: 'en',
    importedLanguage: 'sv',
    inputLabel: 'Paste JSON export',
    previewName: 'Preview local study data import',
    confirmName: 'Confirm local study data import',
    resetName: 'Reset import field',
    invalidJsonText: 'JSON could not be read.',
    persistenceWarningText:
      /Import applied, but durable storage failed for: progress\. That data is only in memory until the app closes\./,
    successText: 'Import complete.',
  },
];

const importPayloadCases: ImportPayloadCase[] = [
  {
    name: 'singular',
    buildPayload: buildSingularImportPayload,
    expected: {
      completedQuestionIds: ['q001', 'q002'],
      bookmarkedQuestionIds: ['q001'],
      wrongAnswerReviewIds: ['q001'],
      mockExamSessionIds: ['mock-1'],
      rescuedDayKeys: ['2026-05-19'],
      reviewIds: ['q001'],
      gradedPerDay: { '2026-05-20': 2 },
      checkedAreaIds: [],
      highlightIds: ['hl-e2e-singular'],
    },
    summaryTexts: {
      sv: [
        '2 frågor med sparad progression',
        '1 bokmärke',
        '1 granskning av fel svar',
        '1 genomfört övningsprov',
        '1 repetitionskort',
        '1 repetitionsdag',
        '1 markering i e-boken',
        '5 sparade inställningar',
        'Studiesvit och svitskydd ingår',
      ],
      en: [
        '2 questions with saved progress',
        '1 bookmark',
        '1 wrong-answer review',
        '1 completed mock exam',
        '1 FSRS review card',
        '1 FSRS review day',
        '1 ebook highlight',
        '5 saved settings',
        'Study streak and freeze status included',
      ],
    },
    absentSummaryTexts: {
      sv: ['0 markerade kravområden'],
      en: ['0 marked requirements'],
    },
  },
  {
    name: 'plural',
    buildPayload: buildPluralImportPayload,
    expected: {
      completedQuestionIds: ['q001', 'q002', 'q003'],
      bookmarkedQuestionIds: ['q001', 'q002'],
      wrongAnswerReviewIds: ['q001', 'q002'],
      mockExamSessionIds: ['mock-1', 'mock-2'],
      rescuedDayKeys: ['2026-05-19', '2026-05-20'],
      reviewIds: ['q001', 'q002'],
      gradedPerDay: { '2026-05-20': 2, '2026-05-21': 1 },
      checkedAreaIds: ['identity', 'residenceStatus', 'conduct'],
      highlightIds: ['hl-e2e-plural-1', 'hl-e2e-plural-2'],
    },
    summaryTexts: {
      sv: [
        '3 frågor med sparad progression',
        '2 bokmärken',
        '2 granskningar av fel svar',
        '2 genomförda övningsprov',
        '2 repetitionskort',
        '2 repetitionsdagar',
        '2 markeringar i e-boken',
        '5 sparade inställningar',
        '3 markerade kravområden',
        'Studiesvit och svitskydd ingår',
      ],
      en: [
        '3 questions with saved progress',
        '2 bookmarks',
        '2 wrong-answer reviews',
        '2 completed mock exams',
        '2 FSRS review cards',
        '2 FSRS review days',
        '2 ebook highlights',
        '5 saved settings',
        '3 marked requirements',
        'Study streak and freeze status included',
      ],
    },
    absentSummaryTexts: {
      sv: ['0 markeringar i e-boken'],
      en: ['0 ebook highlights'],
    },
  },
];

function createHighlight(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    chapterId: 'ch01',
    blockId: 'intro-1',
    startOffset: 4,
    endOffset: 18,
    color: 'yellow',
    note: 'Portable browser highlight',
    createdAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:05:00.000Z',
    ...overrides,
  };
}

function buildSingularImportPayload(importedLanguage: AppLanguage): string {
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
    highlights: {
      byChapter: {
        ch01: [createHighlight('hl-e2e-singular')],
      },
    },
  });
}

function buildPluralImportPayload(importedLanguage: AppLanguage): string {
  return JSON.stringify({
    version: 1,
    progress: {
      completedQuestionIds: ['q001', 'q002', 'q003'],
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
        q002: {
          seenCount: 2,
          correctCount: 1,
          wrongCount: 1,
          correctStreak: 1,
          bookmarked: true,
          lastAnsweredAt: '2026-05-21T08:00:00.000Z',
          nextReviewAt: '2026-05-22T08:00:00.000Z',
        },
      },
      totalXp: 84,
      answerDates: ['2026-05-20', '2026-05-21'],
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 0.75,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 3,
          totalCount: 4,
        },
        {
          sessionId: 'mock-2',
          score: 0.8,
          completedAt: '2026-05-21T09:00:00.000Z',
          correctCount: 4,
          totalCount: 5,
        },
      ],
      streakFreezeState: {
        available: 2,
        lastEarnedAt: '2026-05-21',
        lifetimeEarned: 5,
        lifetimeSpent: 1,
        rescuedDayKeys: ['2026-05-19', '2026-05-20'],
      },
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
          selectedOptionTextEn: 'Another wrong answer',
          selectedOptionTextSv: 'Ännu ett fel svar',
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
        q002: {
          questionId: 'q002',
          difficulty: 4,
          stability: 6,
          reps: 3,
          lapses: 1,
          state: 'review',
          lastReviewAt: '2026-05-21T08:00:00.000Z',
          dueAt: '2026-05-22T08:00:00.000Z',
        },
      },
      gradedPerDay: {
        '2026-05-20': 2,
        '2026-05-21': 1,
      },
    },
    settings: {
      language: importedLanguage,
      audioEnabled: false,
      dailyGoalAnswers: 20,
      includeSupplementaryQuestions: true,
      hasSeenAboutTheTest: true,
    },
    citizenshipRequirements: {
      checkedAreaIds: ['conduct', 'identity', 'residenceStatus', 'identity'],
    },
    highlights: {
      byChapter: {
        ch01: [createHighlight('hl-e2e-plural-1')],
        ch02: [
          createHighlight('hl-e2e-plural-2', {
            chapterId: 'ch02',
            blockId: 'democracy-1',
            startOffset: 8,
            endOffset: 24,
            color: 'blue',
            note: 'Second portable browser highlight',
          }),
        ],
      },
    },
  });
}

async function readImportStorage(page: Page) {
  return page.evaluate(
    ({
      audioKey,
      citizenshipRequirementsCheckedKey,
      citizenshipRequirementsLegacyKey,
      dailyGoalKey,
      includeSupplementaryKey,
      languageKey,
      highlightsKey,
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
      citizenshipRequirements: {
        checkedAreaIds: window.localStorage.getItem(citizenshipRequirementsCheckedKey),
        legacyState: window.localStorage.getItem(citizenshipRequirementsLegacyKey),
      },
      highlights: window.localStorage.getItem(highlightsKey),
    }),
    {
      audioKey: settingsAudioEnabledKey,
      citizenshipRequirementsCheckedKey: citizenshipRequirementsCheckedAreaIdsKey,
      citizenshipRequirementsLegacyKey: citizenshipRequirementsLegacyStateKey,
      dailyGoalKey: settingsDailyGoalKey,
      highlightsKey: highlightsStateKey,
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
      citizenshipRequirements: {
        checkedAreaIds: null,
        legacyState: null,
      },
      highlights: null,
    });
}

async function expectImportFormCleared(
  page: Page,
  scenario: Scenario,
  clearedTexts: readonly string[],
) {
  await expect(page.getByLabel(scenario.inputLabel)).toHaveValue('');
  await expect(page.getByRole('button', { name: scenario.confirmName })).toHaveCount(0);

  for (const text of clearedTexts) {
    await expect(page.getByText(text)).toHaveCount(0);
  }
}

async function expectImportApplied(
  page: Page,
  importedLanguage: AppLanguage,
  expected: ImportExpectation,
) {
  await expect
    .poll(async () => {
      const storage = await readImportStorage(page);
      const progress = storage.progress ? JSON.parse(storage.progress) : null;
      const mistakeReview = storage.mistakeReview ? JSON.parse(storage.mistakeReview) : null;
      const reviews = storage.reviews ? JSON.parse(storage.reviews) : null;
      const checkedAreaIds = storage.citizenshipRequirements.checkedAreaIds
        ? JSON.parse(storage.citizenshipRequirements.checkedAreaIds)
        : [];
      const legacyState = storage.citizenshipRequirements.legacyState
        ? JSON.parse(storage.citizenshipRequirements.legacyState)
        : null;
      const highlights = storage.highlights ? JSON.parse(storage.highlights) : null;
      const questionProgress = (progress?.questionProgress ?? {}) as Record<
        string,
        { bookmarked?: boolean }
      >;
      const mockExamSessions = (progress?.mockExamSessions ?? []) as Array<{
        sessionId: string;
      }>;

      return {
        completedQuestionIds: progress?.completedQuestionIds ?? [],
        bookmarkedQuestionIds: Object.entries(questionProgress)
          .filter(([, value]) => value.bookmarked === true)
          .map(([questionId]) => questionId)
          .sort(),
        wrongAnswerReviewIds: Object.keys(mistakeReview?.wrongAnswerReviews ?? {}).sort(),
        mockExamSessionIds: mockExamSessions.map((session) => session.sessionId).sort(),
        rescuedDayKeys: progress?.streakFreezeState?.rescuedDayKeys ?? [],
        reviewIds: Object.keys(reviews?.byId ?? {}).sort(),
        gradedPerDay: reviews?.gradedPerDay ?? {},
        checkedAreaIds,
        legacyCheckedAreaIds: legacyState?.checkedAreaIds ?? [],
        highlightIds: Object.values(highlights?.byChapter ?? {})
          .flatMap((list) =>
            Array.isArray(list)
              ? list.map((highlight) => (typeof highlight?.id === 'string' ? highlight.id : ''))
              : [],
          )
          .filter(Boolean)
          .sort(),
        settings: storage.settings,
      };
    })
    .toEqual({
      ...expected,
      legacyCheckedAreaIds: expected.checkedAreaIds,
      settings: {
        language: importedLanguage,
        audioEnabled: 'false',
        dailyGoalAnswers: '20',
        includeSupplementaryQuestions: 'true',
      },
    });
}

async function installProgressImportWriteFailure(page: Page) {
  await page.addInitScript((progressKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      const runtime = window as typeof window & { __SMT_IMPORT_WRITE_FAIL__?: boolean };
      if (runtime.__SMT_IMPORT_WRITE_FAIL__ && key === progressKey) {
        throw new Error('progress import write failed');
      }
      return originalSetItem.call(this, key, value);
    };
  }, progressStateKey);
}

for (const scenario of scenarios) {
  for (const payloadCase of importPayloadCases) {
    test(`settings import previews and confirms ${payloadCase.name} study data in ${scenario.language}`, async ({
      page,
    }) => {
      await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
      const errors = collectConsoleAndPageErrors(page);

      await page.goto('/settings', { waitUntil: 'networkidle' });
      await dismissBlockingModals(page);
      await expectNoImportApplied(page, scenario.language);

      await page
        .getByLabel(scenario.inputLabel)
        .fill(payloadCase.buildPayload(scenario.importedLanguage));
      await page.getByRole('button', { name: scenario.previewName }).click();

      for (const summaryText of payloadCase.summaryTexts[scenario.language]) {
        await expect(page.getByText(summaryText)).toBeVisible();
      }
      for (const absentSummaryText of payloadCase.absentSummaryTexts[scenario.language]) {
        await expect(page.getByText(absentSummaryText)).toHaveCount(0);
      }
      await expect(page.getByRole('button', { name: scenario.confirmName })).toBeVisible();
      await expectNoImportApplied(page, scenario.language);

      await page.getByRole('button', { name: scenario.confirmName }).click();

      await expect(page.getByText(scenario.successText)).toBeVisible();
      await expect(page.getByText(payloadCase.summaryTexts[scenario.language][0])).toHaveCount(0);
      await expectImportApplied(page, scenario.importedLanguage, payloadCase.expected);
      expect(errors.get()).toEqual([]);
    });
  }
}

for (const scenario of scenarios) {
  test(`settings import warns instead of showing success when progress storage fails in ${scenario.language}`, async ({
    page,
  }) => {
    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await installProgressImportWriteFailure(page);
    const errors = collectConsoleAndPageErrors(page);
    const payloadCase = importPayloadCases.find((candidate) => candidate.name === 'singular');
    expect(payloadCase).toBeDefined();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectNoImportApplied(page, scenario.language);

    await page
      .getByLabel(scenario.inputLabel)
      .fill(payloadCase!.buildPayload(scenario.importedLanguage));
    await page.getByRole('button', { name: scenario.previewName }).click();
    await expect(page.getByRole('button', { name: scenario.confirmName })).toBeVisible();

    await page.evaluate(() => {
      (
        window as typeof window & { __SMT_IMPORT_WRITE_FAIL__?: boolean }
      ).__SMT_IMPORT_WRITE_FAIL__ = true;
    });
    await page.getByRole('button', { name: scenario.confirmName }).click();

    await expect(page.getByText(scenario.persistenceWarningText)).toBeVisible();
    await expect(page.getByText(scenario.successText)).toHaveCount(0);
    await expect
      .poll(async () => {
        const storage = await readImportStorage(page);
        return {
          progress: storage.progress,
          language: storage.settings.language,
        };
      })
      .toEqual({
        progress: null,
        language: scenario.importedLanguage,
      });
    expect(errors.get()).toEqual([]);
  });
}

for (const scenario of scenarios) {
  test(`settings import reset clears preview and feedback without writes in ${scenario.language}`, async ({
    page,
  }) => {
    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    const errors = collectConsoleAndPageErrors(page);

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectNoImportApplied(page, scenario.language);

    const input = page.getByLabel(scenario.inputLabel);
    const resetButton = page.getByRole('button', { name: scenario.resetName });

    await input.fill('{');
    await page.getByRole('button', { name: scenario.previewName }).click();
    await expect(page.getByText(scenario.invalidJsonText)).toBeVisible();
    await expectNoImportApplied(page, scenario.language);

    await resetButton.click();
    await expectImportFormCleared(page, scenario, [scenario.invalidJsonText]);
    await expectNoImportApplied(page, scenario.language);

    const payloadCase = importPayloadCases.find((candidate) => candidate.name === 'plural');
    expect(payloadCase).toBeDefined();
    const summaryTexts = payloadCase!.summaryTexts[scenario.language];

    await input.fill(payloadCase!.buildPayload(scenario.importedLanguage));
    await page.getByRole('button', { name: scenario.previewName }).click();

    for (const summaryText of summaryTexts) {
      await expect(page.getByText(summaryText)).toBeVisible();
    }
    for (const absentSummaryText of payloadCase!.absentSummaryTexts[scenario.language]) {
      await expect(page.getByText(absentSummaryText)).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: scenario.confirmName })).toBeVisible();
    await expectNoImportApplied(page, scenario.language);

    await resetButton.click();
    await expectImportFormCleared(page, scenario, [...summaryTexts, scenario.successText]);
    await expectNoImportApplied(page, scenario.language);
    expect(errors.get()).toEqual([]);
  });
}
