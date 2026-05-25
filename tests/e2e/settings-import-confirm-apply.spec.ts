import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

const progressStateKey = 'progress\\progressState';
const mistakeReviewStateKey = 'mistake-review\\mistakeReviewState';
const reviewStateKey = 'reviews\\learning.reviews.cards.v1';
const settingsLanguageKey = 'settings\\language';
const settingsAudioEnabledKey = 'settings\\audioEnabled';
const settingsDailyGoalKey = 'settings\\dailyGoalAnswers';
const settingsIncludeSupplementaryKey = 'settings\\includeSupplementaryQuestions';
const accessibilityEasyReadFontKey = 'accessibility\\a11y.easyReadFont.v1';
const accessibilityFontSizeStepKey = 'accessibility\\a11y.fontSizeStep.v1';
const accessibilityAudioPlaybackRateKey = 'accessibility\\a11y.audioPlaybackRate.v1';
const accessibilityListenFirstAudioKey = 'accessibility\\a11y.listenFirstAudio.v1';
const accessibilityThemeModeKey = 'accessibility\\a11y.themeMode.v1';
const companionSelectedIdKey = 'companion\\companion.selectedId.v1';
const citizenshipRequirementsCheckedAreaIdsKey =
  'citizenship-requirements\\citizenshipRequirements.checkedAreaIds.v1';
const citizenshipRequirementsLegacyStateKey =
  'citizenship-requirements\\citizenshipRequirementsChecklistState';

type ImportExpectation = {
  completedQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  wrongAnswerReviewIds: string[];
  mockExamSessionIds: string[];
  rescuedDayKeys: string[];
  reviewIds: string[];
  gradedPerDay: Record<string, number>;
  accessibilityPreferences: {
    easyReadFont: string | null;
    fontSizeStep: string | null;
    audioPlaybackRate: string | null;
    listenFirstAudioEnabled: string | null;
    themeMode: string | null;
  };
  companionSelectedId: string | null;
  checkedAreaIds: string[];
};

type ImportPayloadCase = {
  name: 'singular' | 'plural';
  payload: Record<AppLanguage, unknown>;
  expectedStorageIds: ImportExpectation;
  absentSummaryTexts: Record<AppLanguage, string[]>;
  citizenshipRequirements: {
    currentCheckedAreaIds: string[];
    legacyCheckedAreaIds: string[];
  };
  summaryCounts: Record<string, boolean | number>;
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

function loadImportPayloadCases(): ImportPayloadCase[] {
  const fixtureDir = path.join(process.cwd(), 'tests/fixtures/local-study-data-import');
  return fs
    .readdirSync(fixtureDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => {
      const fixture = JSON.parse(
        fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'),
      ) as ImportPayloadCase;
      return fixture;
    })
    .sort(
      (a, b) => ['singular', 'plural'].indexOf(a.name) - ['singular', 'plural'].indexOf(b.name),
    );
}

const importPayloadCases = loadImportPayloadCases();

async function readImportStorage(page: Page) {
  return page.evaluate(
    ({
      audioKey,
      citizenshipRequirementsCheckedKey,
      citizenshipRequirementsLegacyKey,
      dailyGoalKey,
      includeSupplementaryKey,
      languageKey,
      mistakeKey,
      progressKey,
      reviewKey,
      accessibilityEasyReadFontKey,
      accessibilityFontSizeStepKey,
      accessibilityAudioPlaybackRateKey,
      accessibilityListenFirstAudioKey,
      accessibilityThemeModeKey,
      companionSelectedIdKey,
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
      accessibilityPreferences: {
        easyReadFont: window.localStorage.getItem(accessibilityEasyReadFontKey),
        fontSizeStep: window.localStorage.getItem(accessibilityFontSizeStepKey),
        audioPlaybackRate: window.localStorage.getItem(accessibilityAudioPlaybackRateKey),
        listenFirstAudioEnabled: window.localStorage.getItem(accessibilityListenFirstAudioKey),
        themeMode: window.localStorage.getItem(accessibilityThemeModeKey),
      },
      companionSelectedId: window.localStorage.getItem(companionSelectedIdKey),
      citizenshipRequirements: {
        checkedAreaIds: window.localStorage.getItem(citizenshipRequirementsCheckedKey),
        legacyState: window.localStorage.getItem(citizenshipRequirementsLegacyKey),
      },
    }),
    {
      audioKey: settingsAudioEnabledKey,
      citizenshipRequirementsCheckedKey: citizenshipRequirementsCheckedAreaIdsKey,
      citizenshipRequirementsLegacyKey: citizenshipRequirementsLegacyStateKey,
      dailyGoalKey: settingsDailyGoalKey,
      includeSupplementaryKey: settingsIncludeSupplementaryKey,
      languageKey: settingsLanguageKey,
      mistakeKey: mistakeReviewStateKey,
      progressKey: progressStateKey,
      reviewKey: reviewStateKey,
      accessibilityEasyReadFontKey,
      accessibilityFontSizeStepKey,
      accessibilityAudioPlaybackRateKey,
      accessibilityListenFirstAudioKey,
      accessibilityThemeModeKey,
      companionSelectedIdKey,
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
      accessibilityPreferences: {
        easyReadFont: null,
        fontSizeStep: null,
        audioPlaybackRate: null,
        listenFirstAudioEnabled: null,
        themeMode: null,
      },
      companionSelectedId: null,
      citizenshipRequirements: {
        checkedAreaIds: null,
        legacyState: null,
      },
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
        settings: storage.settings,
        accessibilityPreferences: storage.accessibilityPreferences,
        companionSelectedId: storage.companionSelectedId,
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
      accessibilityPreferences: expected.accessibilityPreferences,
      companionSelectedId: expected.companionSelectedId,
    });
}

async function expectImportedSettingsControlsPersistAfterReload(
  page: Page,
  importedLanguage: AppLanguage,
  expected: ImportExpectation,
) {
  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const themeLabel = importedLanguage === 'sv' ? 'Välj tema: Mörkt' : 'Choose theme: Dark';
  await expect(page.getByLabel(themeLabel)).toHaveAttribute('aria-checked', 'true');

  if (expected.accessibilityPreferences.listenFirstAudioEnabled === 'true') {
    const listenFirstName =
      importedLanguage === 'sv'
        ? 'Stäng av automatisk uppläsning av nya frågor'
        : 'Disable automatic playback for new questions';
    await expect(page.getByRole('switch', { name: listenFirstName })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  }

  if (expected.companionSelectedId === 'dala-horse') {
    const companionGroupName =
      importedLanguage === 'sv' ? 'Välj studiekompis' : 'Choose study companion';
    const selectedDalaHorseName =
      importedLanguage === 'sv'
        ? /Dalahäst är vald som studiekompis\. Folksymbol från Dalarna\./
        : /Dala horse is selected as study companion\. Folk symbol from Dalarna\./;
    await expect(page.getByRole('radiogroup', { name: companionGroupName })).toBeVisible();
    await expect(page.getByRole('radio', { name: selectedDalaHorseName })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  }

  const storage = await readImportStorage(page);
  expect(storage.accessibilityPreferences).toEqual(expected.accessibilityPreferences);
  expect(storage.companionSelectedId).toBe(expected.companionSelectedId);
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
      await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, scenario.language, {
        reseedOnNavigation: false,
      });
      const errors = collectConsoleAndPageErrors(page);

      await page.goto('/settings', { waitUntil: 'networkidle' });
      await dismissBlockingModals(page);
      await expectNoImportApplied(page, scenario.language);

      await page
        .getByLabel(scenario.inputLabel)
        .fill(JSON.stringify(payloadCase.payload[scenario.importedLanguage]));
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
      await expectImportApplied(page, scenario.importedLanguage, payloadCase.expectedStorageIds);
      await expectImportedSettingsControlsPersistAfterReload(
        page,
        scenario.importedLanguage,
        payloadCase.expectedStorageIds,
      );
      expect(errors.get()).toEqual([]);
    });
  }
}

for (const scenario of scenarios) {
  test(`settings import warns instead of showing success when progress storage fails in ${scenario.language}`, async ({
    page,
  }) => {
    await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, scenario.language, {
      reseedOnNavigation: false,
    });
    await installProgressImportWriteFailure(page);
    const errors = collectConsoleAndPageErrors(page);
    const payloadCase = importPayloadCases.find((candidate) => candidate.name === 'singular');
    expect(payloadCase).toBeDefined();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectNoImportApplied(page, scenario.language);

    await page
      .getByLabel(scenario.inputLabel)
      .fill(JSON.stringify(payloadCase!.payload[scenario.importedLanguage]));
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
    await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, scenario.language, {
      reseedOnNavigation: false,
    });
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

    await input.fill(JSON.stringify(payloadCase!.payload[scenario.importedLanguage]));
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
