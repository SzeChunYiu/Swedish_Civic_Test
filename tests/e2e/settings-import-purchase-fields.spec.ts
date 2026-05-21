import { expect, test, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type ImportPurchaseFieldScenario = {
  alertText: string;
  confirmImportLabel: string;
  forbiddenAlertCopy?: RegExp;
  language: AppLanguage;
  pasteLabel: string;
  previewLabel: string;
  requiredAlertCopy: RegExp;
  summaryHeading: string;
};

const purchaseFieldsRejectedCode = 'purchase_fields_rejected';

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

const scenarios: ImportPurchaseFieldScenario[] = [
  {
    alertText:
      'Importen innehåller fält för köp i appen eller kvitton. Ta bort dem och återställ köp via appbutiken.',
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
