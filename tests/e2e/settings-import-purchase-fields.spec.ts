import { Buffer } from 'node:buffer';

import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type ImportPurchaseFieldScenario = {
  alertText: string;
  byteLimitHelper: RegExp;
  confirmImportLabel: string;
  forbiddenAlertCopy?: RegExp;
  language: AppLanguage;
  pasteLabel: string;
  previewLabel: string;
  requiredAlertCopy: RegExp;
  summaryHeading: string;
};

const importMaxBytes = 1024 * 1024;
const purchaseFieldsRejectedCode = 'purchase_fields_rejected';
const oversizedMultibytePayload = 'å'.repeat(Math.floor(importMaxBytes / 2) + 1);

const rejectedStudyDataPayload = JSON.stringify(
  {
    version: 1,
    progress: {
      completedQuestionIds: ['q001'],
      questionProgress: {
        q001: {
          bookmarked: true,
          correctCount: 1,
          correctStreak: 1,
          questionId: 'q001',
          seenCount: 1,
          wrongCount: 0,
        },
      },
      removeAdsReceipt: {
        productId: 'remove-ads',
        transactionId: 'tx-settings-import-test',
      },
    },
    settings: {
      dailyGoalAnswers: 40,
      language: 'en',
    },
  },
  null,
  2,
);
const validStudyDataPayload = JSON.stringify(
  {
    version: 1,
    settings: {
      dailyGoalAnswers: 10,
      language: 'sv',
    },
  },
  null,
  2,
);

const scenarios: ImportPurchaseFieldScenario[] = [
  {
    alertText:
      'Importen innehåller fält för köp i appen eller kvitton. Ta bort dem och återställ köp via appbutiken.',
    byteLimitHelper:
      /Importen är .* byte\. Gränsen är 1 MB; klistra in en mindre export innan du förhandsgranskar\./,
    confirmImportLabel: 'Bekräfta lokal studiedataimport',
    forbiddenAlertCopy: /\b(?:IAP|purchase|receipt)\b/i,
    language: 'sv',
    pasteLabel: 'Klistra in JSON-export',
    previewLabel: 'Förhandsgranska lokal studiedataimport',
    requiredAlertCopy: /köp i appen.*kvitton/i,
    summaryHeading: 'Sammanfattning före import',
  },
  {
    alertText:
      'The import contains purchase, receipt, or IAP fields. Remove them and restore purchases through the app store.',
    byteLimitHelper:
      /The import is .* bytes\. The limit is 1 MB; paste a smaller export before previewing\./,
    confirmImportLabel: 'Confirm local study data import',
    language: 'en',
    pasteLabel: 'Paste JSON export',
    previewLabel: 'Preview local study data import',
    requiredAlertCopy: /\bpurchase\b.*\breceipt\b.*\bIAP\b/i,
    summaryHeading: 'Summary before import',
  },
];

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function forceTextInputValue(locator: Locator, value: string): Promise<void> {
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

async function expectNoLocalStudyDataStoresWritten(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        importedDailyGoal: window.localStorage.getItem('settings\\dailyGoalAnswers'),
        importedProgress: window.localStorage.getItem('progress\\progressState'),
        importedReviews: window.localStorage.getItem('reviews\\learning.reviews.cards.v1'),
        importedWrongAnswers: window.localStorage.getItem('mistake-review\\mistakeReviewState'),
      })),
    )
    .toEqual({
      importedDailyGoal: null,
      importedProgress: null,
      importedReviews: null,
      importedWrongAnswers: null,
    });
}

for (const scenario of scenarios) {
  test(`Settings import byte limit disables preview before parsing multibyte text in ${scenario.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    expect(oversizedMultibytePayload.length).toBeLessThan(importMaxBytes);
    expect(Buffer.byteLength(oversizedMultibytePayload, 'utf8')).toBeGreaterThan(importMaxBytes);

    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const importInput = page.getByLabel(scenario.pasteLabel);
    const previewButton = page.getByLabel(scenario.previewLabel);
    await importInput.scrollIntoViewIfNeeded();
    await forceTextInputValue(importInput, oversizedMultibytePayload);

    await expect(page.getByText(scenario.byteLimitHelper)).toBeVisible();
    await expect(previewButton).toHaveAttribute('aria-disabled', 'true');
    await expect(previewButton).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: scenario.summaryHeading })).toHaveCount(0);
    await expect(page.getByLabel(scenario.confirmImportLabel)).toHaveCount(0);
    await expectNoLocalStudyDataStoresWritten(page);

    await forceTextInputValue(importInput, validStudyDataPayload);
    await expect(page.getByText(scenario.byteLimitHelper)).toHaveCount(0);
    await expect(previewButton).toBeEnabled();
    await previewButton.click();

    await expect(page.getByRole('heading', { name: scenario.summaryHeading })).toBeVisible();
    await expect(page.getByLabel(scenario.confirmImportLabel)).toBeVisible();
    await expectNoLocalStudyDataStoresWritten(page);
    expect(consoleErrors).toEqual([]);
  });

  test(`Settings import ${purchaseFieldsRejectedCode} keeps purchase-field rejection copy safe in ${scenario.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const importInput = page.getByLabel(scenario.pasteLabel);
    await importInput.scrollIntoViewIfNeeded();
    await importInput.fill(rejectedStudyDataPayload);
    await page.getByLabel(scenario.previewLabel).click();

    const alert = page.getByRole('alert').filter({ hasText: scenario.alertText });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(scenario.requiredAlertCopy);
    if (scenario.forbiddenAlertCopy) {
      await expect(alert).not.toContainText(scenario.forbiddenAlertCopy);
    }

    await expect(page.getByRole('heading', { name: scenario.summaryHeading })).toHaveCount(0);
    await expect(page.getByLabel(scenario.confirmImportLabel)).toHaveCount(0);
    await expectNoLocalStudyDataStoresWritten(page);

    expect(consoleErrors).toEqual([]);
  });
}
