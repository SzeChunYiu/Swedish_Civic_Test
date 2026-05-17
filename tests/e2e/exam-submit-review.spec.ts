import { expect, test } from '@playwright/test';

const totalQuestions = 20;

test('mock exam requires all answers before showing score and source-backed review', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/exam', { waitUntil: 'networkidle' });

  await expect(page.getByText('Mock exam')).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-based questions`))).toBeVisible();
  await expect(page.getByText(`0/${totalQuestions} answered`)).toBeVisible();

  const submit = page.getByLabel('Submit mock exam');
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Explanation')).toHaveCount(0);

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByLabel(new RegExp(`^Select answer .+ for question ${questionNumber}$`))
      .first()
      .click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} answered`)).toBeVisible();
  await expect(submit).toBeEnabled();

  await submit.click();

  await expect(page.getByText('Exam result', { exact: true })).toBeVisible();
  await expect(page.getByText('Mock exam result')).toBeVisible();
  await expect(page.getByText(new RegExp(`/${totalQuestions} correct`))).toBeVisible();
  await expect(page.getByText('Chapter breakdown')).toBeVisible();
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation').first()).toBeVisible();
  await expect(page.getByText('UHR reference').first()).toBeVisible();
  await expect(page.getByText('Submitted results are final')).toBeVisible();
  await expect(page.getByLabel('Back to exam answers')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
