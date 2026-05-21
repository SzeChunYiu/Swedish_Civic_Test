import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

const learnerImportStorageKeys = [
  'progress\\progressState',
  'mistake-review\\mistakeReviewState',
  'reviews\\learning.reviews.cards.v1',
];

async function forceTextInputValue(locator: Locator, value: string) {
  await locator.evaluate((element, nextValue) => {
    const target = element as HTMLInputElement | HTMLTextAreaElement;
    const prototype =
      target instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    valueSetter?.call(target, nextValue);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function expectNoLearnerImportWrites(page: Page) {
  const writtenValues = await page.evaluate((keys) => {
    return Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]));
  }, learnerImportStorageKeys);

  expect(writtenValues).toEqual(
    Object.fromEntries(learnerImportStorageKeys.map((key) => [key, null])),
  );
}

test('settings import rejects oversized JSON with localized max-size feedback', async ({
  page,
}) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/under 1 MB/)).toBeVisible();
  const importInput = page.getByLabel('Paste JSON export');
  const maxLength = await importInput.evaluate(
    (element) => (element as HTMLInputElement | HTMLTextAreaElement).maxLength,
  );

  expect(maxLength).toBeGreaterThan(1024);
  await forceTextInputValue(importInput, 'x'.repeat(maxLength + 1));
  await page.getByRole('button', { name: 'Preview local study data import' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'The JSON export is larger than 1 MB. Choose a smaller export and try again.',
  );
  await expectNoLearnerImportWrites(page);
  expect(errors.get()).toEqual([]);
});

test('settings import rejects multibyte payloads that are under the character limit', async ({
  page,
}) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const importInput = page.getByLabel('Paste JSON export');
  const maxLength = await importInput.evaluate(
    (element) => (element as HTMLInputElement | HTMLTextAreaElement).maxLength,
  );
  const oversizedByBytes = 'å'.repeat(Math.floor(maxLength / 2) + 1);

  expect(oversizedByBytes.length).toBeLessThan(maxLength);
  await forceTextInputValue(importInput, oversizedByBytes);
  await page.getByRole('button', { name: 'Preview local study data import' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'The JSON export is larger than 1 MB. Choose a smaller export and try again.',
  );
  await expectNoLearnerImportWrites(page);
  expect(errors.get()).toEqual([]);
});

test('settings import keeps in-limit purchase fields rejected before writes', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/högst 1 MB/)).toBeVisible();
  await page.getByLabel('Klistra in JSON-export').fill(
    JSON.stringify({
      version: 1,
      progress: {
        completedQuestionIds: ['q001'],
      },
      purchase: {
        receipt: 'local-test-receipt',
      },
    }),
  );
  await page.getByRole('button', { name: 'Förhandsgranska lokal studiedataimport' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'Importen innehåller fält för köp i appen eller kvitton.',
  );
  await expect(page.getByRole('alert')).not.toContainText('JSON-exporten är större');
  await expectNoLearnerImportWrites(page);
  expect(errors.get()).toEqual([]);
});
