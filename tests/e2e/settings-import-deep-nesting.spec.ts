import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

const importedStorageKeys = [
  'progress\\progressState',
  'mistake-review\\mistakeReviewState',
  'reviews\\learning.reviews.cards.v1',
  'settings\\dailyGoalAnswers',
  'citizenship-requirements\\citizenshipRequirementsChecklistState',
];

function deepSourcePayload(depth: number, leafJson: string): string {
  let nestedJson = leafJson;
  for (let index = depth - 1; index >= 0; index -= 1) {
    nestedJson = `{"level${index}":${nestedJson}}`;
  }
  return `{"version":1,"source":${nestedJson}}`;
}

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

async function expectNoImportWrites(page: Page) {
  const values = await page.evaluate((keys) => {
    return Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]));
  }, importedStorageKeys);

  expect(values).toEqual(Object.fromEntries(importedStorageKeys.map((key) => [key, null])));
}

test('settings import previews deeply nested empty JSON as recoverable feedback', async ({
  page,
}) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const importInput = page.getByLabel('Paste JSON export');
  const previewButton = page.getByRole('button', { name: 'Preview local study data import' });
  const resetButton = page.getByRole('button', { name: 'Reset import field' });
  const payload = deepSourcePayload(3200, '{"note":"safe"}');

  expect(payload.length).toBeLessThan(1024 * 1024);
  await forceTextInputValue(importInput, payload);
  await previewButton.click();

  await expect(page.getByRole('alert')).toContainText(
    'The import does not contain supported study data.',
  );
  await expect(page.getByRole('button', { name: 'Confirm local study data import' })).toHaveCount(
    0,
  );
  await expect(previewButton).toBeEnabled();
  await expect(resetButton).toBeEnabled();
  await expectNoImportWrites(page);

  await resetButton.click();
  await expect(importInput).toHaveValue('');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors.get()).toEqual([]);
});

test('settings import shows nested purchase-field detail before any writes', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const importInput = page.getByLabel('Klistra in JSON-export');
  const payload = deepSourcePayload(480, '{"removeAdsReceipt":"local-test-receipt"}');

  await forceTextInputValue(importInput, payload);
  await page.getByRole('button', { name: 'Förhandsgranska lokal studiedataimport' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Importen innehåller fält för köp i appen eller kvitton.');
  await expect(alert).toContainText('Fält: source.level0.level1.[...]');
  await expect(alert).toContainText('level479.removeAdsReceipt');
  await expect(alert).not.toContainText('level2.level3.level4');
  await expect(page.getByRole('button', { name: 'Bekräfta lokal studiedataimport' })).toHaveCount(
    0,
  );
  await expectNoImportWrites(page);
  expect(errors.get()).toEqual([]);
});

test('settings import shows English nested purchase-field detail before any writes', async ({
  page,
}) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const importInput = page.getByLabel('Paste JSON export');
  const payload = deepSourcePayload(480, '{"removeAdsReceipt":"local-test-receipt"}');

  await forceTextInputValue(importInput, payload);
  await page.getByRole('button', { name: 'Preview local study data import' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('The import contains purchase, receipt, or IAP fields.');
  await expect(alert).toContainText('Field: source.level0.level1.[...]');
  await expect(alert).toContainText('level479.removeAdsReceipt');
  await expect(alert).not.toContainText('level2.level3.level4');
  await expect(page.getByRole('button', { name: 'Confirm local study data import' })).toHaveCount(
    0,
  );
  await expectNoImportWrites(page);
  expect(errors.get()).toEqual([]);
});
