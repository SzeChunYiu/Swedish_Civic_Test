import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const totalQuestions = 20;

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
}

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();
  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

test('mock exam requires all answers before showing Swedish score and source-backed review', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByText('Övningsprov')).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-baserade frågor`))).toBeVisible();
  await expect(page.getByText(`0/${totalQuestions} besvarade`)).toBeVisible();
  await expect(page.getByText(/^Källa: Sverige i fokus/).first()).toBeVisible();

  const submit = page.getByLabel('Skicka övningsprov');
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);
  await expect(page.getByText('Förklaring', { exact: true })).toHaveCount(0);
  await expect(page.getByText('UHR-källa', { exact: true })).toHaveCount(0);

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByLabel(new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`))
      .first()
      .click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} besvarade`)).toBeVisible();
  await expect(submit).toBeEnabled();

  await submit.click();

  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();
  await expect(page.getByText('Övningsresultat')).toBeVisible();
  await expect(page.getByText(new RegExp(`/${totalQuestions} rätt`))).toBeVisible();
  await expect(page.getByText('Kapitelöversikt')).toBeVisible();
  await expect(page.getByText('Frågegenomgång')).toBeVisible();
  await expect(page.getByText('Valt svar').first()).toBeVisible();
  await expect(page.getByText('Rätt svar').first()).toBeVisible();
  await expect(page.getByText('Förklaring', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR-källa', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Skickade resultat är slutgiltiga')).toBeVisible();
  await expect(page.getByLabel('Back to exam answers')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('mock exam review follows English support mode', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByText('Mock exam')).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-based questions`))).toBeVisible();
  await expect(page.getByText(`0/${totalQuestions} answered`)).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus/).first()).toBeVisible();
  await expect(page.getByText('Övningsprov')).toHaveCount(0);

  const submit = page.getByLabel('Submit mock exam');
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Question review')).toHaveCount(0);
  await expect(page.getByText('Explanation', { exact: true })).toHaveCount(0);
  await expect(page.getByText('UHR reference', { exact: true })).toHaveCount(0);

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
  await expect(page.getByText('The country of Sweden')).toBeVisible();
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR reference', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Submitted results are final')).toBeVisible();
  await expect(page.getByText('Kapitelöversikt')).toHaveCount(0);
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);
  await expect(page.getByText('Valt svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar')).toHaveCount(0);
  await expect(page.getByText('UHR-källa')).toHaveCount(0);
  await expect(page.getByLabel('Tillbaka till provsvar')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
