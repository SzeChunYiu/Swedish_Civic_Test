import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, selectQuestionLanguageInSettings } from './browserLaunch';

const totalQuestions = 20;
const minimumTargetSizePx = 44;

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

function englishAnswerLabel(questionNumber: number): RegExp {
  return new RegExp(`^Select answer .+ for question ${questionNumber}$`);
}

function swedishAnswerLabel(questionNumber: number): RegExp {
  return new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`);
}

async function expectMinimumTargetSize(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();

  expect(box, 'answer option should have a rendered target box').not.toBeNull();
  expect(box!.width, 'answer option target width').toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.height, 'answer option target height').toBeGreaterThanOrEqual(minimumTargetSizePx);
}

test('mock exam English answer options expose radio state through submit and review', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await selectQuestionLanguageInSettings(page, 'en');
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Mock exam' }).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-based questions`))).toBeVisible();
  await expect(page.getByText('Övningsprov')).toHaveCount(0);

  const activeCount = page.getByText(`0/${totalQuestions} answered`);
  if ((await activeCount.count()) === 0) {
    const start = page.getByLabel('Start mock exam');
    await expect(start).toBeEnabled();
    await start.click();
  }

  await expect(activeCount).toBeVisible();
  await expect(page.getByText(/^Time left/)).toBeVisible();

  const submit = page.getByRole('button', { name: 'Submit mock exam' });
  await expect(submit).toBeDisabled();

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    const englishOptions = page.getByRole('radio', { name: englishAnswerLabel(questionNumber) });
    const optionCount = await englishOptions.count();

    expect(
      optionCount,
      `question ${questionNumber} should expose answer radio options`,
    ).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('radio', { name: swedishAnswerLabel(questionNumber) })).toHaveCount(
      0,
    );

    for (let optionIndex = 0; optionIndex < optionCount; optionIndex += 1) {
      const option = englishOptions.nth(optionIndex);

      await expect(option).toHaveAttribute('aria-checked', 'false');
      await expectMinimumTargetSize(option);
    }

    const selectedOption = englishOptions.first();
    await selectedOption.click();
    await expect(selectedOption).toHaveAttribute('aria-checked', 'true');
    await expect(englishOptions.nth(1)).toHaveAttribute('aria-checked', 'false');
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} answered`)).toBeVisible();
  await expect(submit).toBeEnabled();

  await submit.click();

  await expect(page.getByText('Exam result', { exact: true })).toBeVisible();
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR reference', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Submitted results are final')).toBeVisible();

  await expect(page.getByRole('radio', { name: /^Välj svaret/ })).toHaveCount(0);
  await expect(page.getByText('Kapitelöversikt')).toHaveCount(0);
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);
  await expect(page.getByText('Valt svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar')).toHaveCount(0);
  await expect(page.getByText('UHR-källa')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
