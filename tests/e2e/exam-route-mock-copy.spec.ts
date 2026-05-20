import { expect, test, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedFreshFirstRunSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const totalQuestions = 20;

type MockExamCopyContract = {
  accessTitle: string;
  answerLabel: (questionNumber: number) => RegExp;
  forbiddenButtonLabels: string[];
  forbiddenVisibleText: string[];
  language: AppLanguage;
  resultTitle: string;
  startLabel: string;
  submitLabel: string;
};

const contracts: MockExamCopyContract[] = [
  {
    accessTitle: 'Åtkomst till övningsprov',
    answerLabel: (questionNumber) => new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`),
    forbiddenButtonLabels: ['Skicka prov'],
    forbiddenVisibleText: ['Provåtkomst', 'Skicka prov'],
    language: 'sv',
    resultTitle: 'Resultat från övningsprov',
    startLabel: 'Starta övningsprov',
    submitLabel: 'Skicka in övningsprovet',
  },
  {
    accessTitle: 'Mock exam access',
    answerLabel: (questionNumber) =>
      new RegExp(`^Select answer .+ for question ${questionNumber}$`),
    forbiddenButtonLabels: ['Submit exam'],
    forbiddenVisibleText: ['Exam access', 'Submit exam', 'Exam result'],
    language: 'en',
    resultTitle: 'Mock exam result',
    startLabel: 'Start mock exam',
    submitLabel: 'Submit the mock exam',
  },
];

test.use({ viewport: { width: 390, height: 844 } });

function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

async function openExam(page: Page, language: AppLanguage) {
  await seedFreshFirstRunSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function answerEveryQuestion(page: Page, answerLabel: MockExamCopyContract['answerLabel']) {
  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByRole('radio', {
        name: answerLabel(questionNumber),
      })
      .first()
      .click();
  }
}

async function expectForbiddenCopyAbsent(page: Page, contract: MockExamCopyContract) {
  for (const forbiddenText of contract.forbiddenVisibleText) {
    await expect(page.getByText(forbiddenText, { exact: true })).toHaveCount(0);
  }

  for (const forbiddenLabel of contract.forbiddenButtonLabels) {
    await expect(page.getByRole('button', { name: forbiddenLabel, exact: true })).toHaveCount(0);
  }
}

for (const contract of contracts) {
  test(`exam route renders ${contract.language} mock-exam copy without bare exam labels`, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await openExam(page, contract.language);

    await expect(page.getByRole('heading', { name: contract.accessTitle })).toBeVisible();
    await expect(page.getByRole('button', { name: contract.startLabel })).toBeEnabled();
    await expectForbiddenCopyAbsent(page, contract);

    await page.getByRole('button', { name: contract.startLabel }).click();

    const submit = page.getByRole('button', { name: contract.submitLabel });
    await expect(submit).toBeDisabled();
    await expectForbiddenCopyAbsent(page, contract);

    await answerEveryQuestion(page, contract.answerLabel);
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole('heading', { name: contract.resultTitle })).toBeVisible();
    await expectForbiddenCopyAbsent(page, contract);
    expect(pageErrors).toEqual([]);
  });
}
