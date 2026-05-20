import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen } from './browserLaunch';

const totalQuestions = 20;
const viewport = { width: 390, height: 844 };

function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

async function enableEnglishSupportFromSettings(page: Page) {
  await page.setViewportSize(viewport);
  await markAboutTheTestSeen(page);
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();

  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

async function expectReachableRadioTarget(option: Locator, label: string) {
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await expect(option).toHaveAttribute('role', 'radio');
  await expect(option).toHaveAttribute('aria-checked', 'false');

  const box = await option.boundingBox();
  expect(box, `${label} should have measurable geometry`).not.toBeNull();
  expect(box!.width, `${label} should keep a 44px minimum width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} should keep a 44px minimum height`).toBeGreaterThanOrEqual(44);
}

test('mock exam answer options keep English radio labels and checked state', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await enableEnglishSupportFromSettings(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Mock exam' }).first()).toBeVisible();
  const start = page.getByLabel('Start mock exam');
  await expect(start).toBeEnabled();
  await start.click();

  await expect(page.getByText(`0/${totalQuestions} answered`)).toBeVisible();
  await expect(page.getByLabel(/^Välj svaret /)).toHaveCount(0);

  const questionOneOptions = page.getByRole('radio', {
    name: /^Select answer .+ for question 1$/,
  });
  await expect(questionOneOptions).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    await expectReachableRadioTarget(
      questionOneOptions.nth(index),
      `question 1 option ${index + 1}`,
    );
  }

  const selectedOption = questionOneOptions.first();
  await selectedOption.click();
  await expect(selectedOption).toHaveAttribute('aria-checked', 'true');

  for (let index = 1; index < 4; index += 1) {
    await expect(questionOneOptions.nth(index)).toHaveAttribute('aria-checked', 'false');
  }

  for (let questionNumber = 2; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByRole('radio', { name: new RegExp(`^Select answer .+ for question ${questionNumber}$`) })
      .first()
      .click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} answered`)).toBeVisible();
  await expect(page.getByLabel('Submit mock exam')).toBeEnabled();
  await page.getByLabel('Submit mock exam').click();

  await expect(page.getByText('Exam result', { exact: true })).toBeVisible();
  await expect(page.getByText('Mock exam result')).toBeVisible();
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR reference', { exact: true }).first()).toBeVisible();

  await expect(page.getByLabel(/^Välj svaret /)).toHaveCount(0);
  await expect(page.getByText('Valt svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
