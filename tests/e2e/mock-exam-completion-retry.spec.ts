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

async function answerEveryMockExamQuestion(page: Page) {
  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByLabel(new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`))
      .first()
      .click();
  }
}

test('mock exam completion keeps next exam locked without rewarded UI on exam', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByRole('heading', { name: 'Övningsprov' }).first()).toBeVisible();
  await answerEveryMockExamQuestion(page);

  const submit = page.getByLabel('Skicka övningsprov');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();
  await expect(page.getByText('Sparat')).toBeVisible();
  await expect(
    page.getByText(
      'Dagens kostnadsfria övningsprov är använt. Extra prov låses inte upp på provskärmen.',
    ),
  ).toBeVisible();

  await expect(page.getByText(/Sponsrad förhandsvisning|Sponsored preview/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lås upp extra prov' })).toHaveCount(0);
  const nextExam = page.getByRole('button', { name: 'Starta övningsprov' });
  await expect(nextExam).toBeDisabled();
  await expect(page.getByText(`${totalQuestions}/${totalQuestions} besvarade`)).toHaveCount(0);
  await expect(page.getByText(`0/${totalQuestions} besvarade`)).toHaveCount(0);
  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
