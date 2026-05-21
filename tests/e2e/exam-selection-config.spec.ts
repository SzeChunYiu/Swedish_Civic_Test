import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const libraryQuestionCount = 25;
const customQuestionCount = 5;
const customDurationMinutes = 5;
const mockExamAccessStorageKey = 'monetization.mockExamAccess.v1';
const settingsLanguageKey = 'settings\\language';
const legacySettingsLanguageKey = 'language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const legacySettingsSeenAboutKey = 'hasSeenAboutTheTest';

async function openExamWithLanguage(page: Page, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function seedDailyFreeMockUsed(page: Page, language: AppLanguage) {
  await page.addInitScript(
    ({
      accessStorageKey,
      language: seededLanguage,
      languageKey,
      legacyLanguageKey,
      legacySeenKey,
      seenKey,
    }: {
      accessStorageKey: string;
      language: AppLanguage;
      languageKey: string;
      legacyLanguageKey: string;
      legacySeenKey: string;
      seenKey: string;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.setItem(legacyLanguageKey, seededLanguage);
      window.localStorage.setItem(seenKey, 'true');
      window.localStorage.setItem(legacySeenKey, 'true');

      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(today.getDate()).padStart(2, '0')}`;

      window.localStorage.setItem(
        accessStorageKey,
        JSON.stringify({
          completedMockExamSessionIdsByDate: {
            [dateKey]: [`seeded-free-${dateKey}`],
          },
          completedMockExamsByDate: {
            [dateKey]: 1,
          },
          rewardedExtraExamCredits: 0,
        }),
      );
    },
    {
      accessStorageKey: mockExamAccessStorageKey,
      language,
      languageKey: settingsLanguageKey,
      legacyLanguageKey: legacySettingsLanguageKey,
      legacySeenKey: legacySettingsSeenAboutKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

async function clickButtonRepeatedly(page: Page, label: string, count: number) {
  const button = page.getByRole('button', { name: label });

  for (let index = 0; index < count; index += 1) {
    if (await button.isDisabled()) break;
    await button.click();
  }
}

async function answerVisibleExamQuestions(page: Page, questionCount: number) {
  for (let questionNumber = 1; questionNumber <= questionCount; questionNumber += 1) {
    await page
      .getByRole('radio', {
        name: new RegExp(`^Select answer .+ for question ${questionNumber}$`),
      })
      .first()
      .click();
  }
}

test('named mock selection starts a no-ads 25-question library snapshot', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await openExamWithLanguage(page, 'en');

  await expect(page.getByRole('heading', { name: 'Choose exam' })).toBeVisible();
  await expect(page.getByText('Daily free mock exam available.')).toBeVisible();
  await expect(page.getByText(/25 UHR-based questions .* no ads during exam/)).toBeVisible();
  await expect(
    page.getByRole('radio', { name: 'Mock Exam 1 – Gentle start. Selected exam.' }),
  ).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('radio', { name: 'Mock Exam 2 – Standard. Choose exam.' }).click();

  await expect(
    page.getByRole('radio', { name: 'Mock Exam 2 – Standard. Selected exam.' }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(
    page.getByText(`${libraryQuestionCount} questions · 30 minutes`).first(),
  ).toBeVisible();

  const start = page.getByRole('button', { name: 'Start mock exam' });
  await expect(start).toBeEnabled();
  await start.click();

  await expect(page.getByText(`0/${libraryQuestionCount} answered`)).toBeVisible();
  await expect(page.getByText(/^Time left/)).toBeVisible();
  await expect(page.getByText(/25 UHR-based questions .* no ads during exam/)).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus/).first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true })).toHaveCount(0);

  expect(consoleErrors.get()).toEqual([]);
});

test('random mock selection keeps the rewarded preview gate before starting', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedDailyFreeMockUsed(page, 'en');
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('Daily free mock exam used. Extra exam available.')).toBeVisible();
  await expect(page.getByText('Sponsored preview')).toBeVisible();
  await page.getByRole('radio', { name: 'Random mock exam. Choose exam.' }).click();
  await expect(
    page.getByRole('radio', { name: 'Random mock exam. Selected exam.' }),
  ).toHaveAttribute('aria-checked', 'true');

  const unlock = page.getByRole('button', { name: 'Unlock extra exam' });
  await expect(unlock).toBeDisabled();
  await expect(page.getByText(`0/${libraryQuestionCount} answered`)).toHaveCount(0);

  await page.getByRole('button', { name: 'Complete sponsor preview' }).click();
  await expect(unlock).toBeEnabled();
  await unlock.click();

  await expect(page.getByText(`0/${libraryQuestionCount} answered`)).toBeVisible();
  await expect(page.getByText(/^Time left/)).toBeVisible();
  await expect(page.getByText(/25 UHR-based questions .* no ads during exam/)).toBeVisible();
  await expect(page.getByText('Sponsored preview')).toHaveCount(0);

  expect(consoleErrors.get()).toEqual([]);
});

test('custom exam selection snapshots chapter, count, time, and source-backed review', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await openExamWithLanguage(page, 'en');

  await page.getByRole('button', { name: 'None' }).click();
  await expect(page.getByRole('button', { name: 'Start custom mock exam' })).toBeDisabled();

  await page.getByRole('checkbox', { name: 'The country of Sweden' }).click();
  await clickButtonRepeatedly(page, 'Decrease question count', 15);
  await clickButtonRepeatedly(page, 'Decrease exam duration', 25);

  await expect(
    page.getByRole('region', {
      name: `Custom mock exam. Questions: ${customQuestionCount}. Time: ${customDurationMinutes} min. Chapters: 1 selected.`,
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Start custom mock exam' }).click();

  await expect(page.getByText(`0/${customQuestionCount} answered`)).toBeVisible();
  await expect(
    page.getByText(new RegExp(`${customQuestionCount} UHR-based questions .* no ads during exam`)),
  ).toBeVisible();
  await expect(page.getByText(/^Time left 0[45]:/)).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus/).first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true })).toHaveCount(0);

  await answerVisibleExamQuestions(page, customQuestionCount);
  await expect(
    page.getByText(`${customQuestionCount}/${customQuestionCount} answered`),
  ).toBeVisible();

  const submit = page.getByRole('button', { name: 'Submit the mock exam' });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('Mock exam result', { exact: true })).toBeVisible();
  await expect(page.getByText(new RegExp(`\\d+/${customQuestionCount} correct`))).toBeVisible();
  await expect(page.getByText('Chapter breakdown')).toBeVisible();
  await expect(page.getByText('The country of Sweden')).toBeVisible();
  await expect(page.getByText("Sweden's democratic system")).toHaveCount(0);
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR reference', { exact: true }).first()).toBeVisible();

  expect(consoleErrors.get()).toEqual([]);
});
