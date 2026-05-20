import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const totalQuestions = 20;

type MockExamTestWindow = Window & {
  __SMT_TEST_FAIL_MOCK_EXAM_COMPLETION_ONCE__?: boolean;
};

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

test('mock exam completion retry keeps next exam locked without an exam-screen ad preview', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.addInitScript(() => {
    const testWindow = window as MockExamTestWindow;
    testWindow.__SMT_TEST_FAIL_MOCK_EXAM_COMPLETION_ONCE__ = true;
  });

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByRole('heading', { name: 'Övningsprov' }).first()).toBeVisible();
  const start = page.getByLabel('Starta övningsprov');
  await expect(start).toBeEnabled();
  await start.click();

  await answerEveryMockExamQuestion(page);

  const submit = page.getByLabel('Skicka övningsprov');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Provresultatet kunde inte sparas på den här enheten.'),
  ).toBeVisible();
  await expect(page.getByText('Sparfel')).toBeVisible();

  const nextExam = page.getByRole('button', { name: 'Starta övningsprov' });
  await expect(nextExam).toBeDisabled();

  const retrySave = page.getByRole('button', {
    name: 'Försök spara övningsprovresultatet igen',
  });
  await expect(retrySave).toBeVisible();
  await retrySave.click();

  await expect(page.getByText('Provresultatet kunde inte sparas på den här enheten.')).toHaveCount(
    0,
  );
  await expect(page.getByText('Sparat')).toBeVisible();
  await expect(
    page.getByText(
      'Dagens kostnadsfria övningsprov är använt. Extra prov låses upp utanför provläget.',
    ),
  ).toBeVisible();

  await expect(page.getByText('Sponsrad förhandsvisning')).toHaveCount(0);
  await expect(page.getByText('Slutför förhandsvisning')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lås upp extra prov' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Starta övningsprov' })).toBeDisabled();
  await expect(page.getByText(`${totalQuestions}/${totalQuestions} besvarade`)).toHaveCount(0);
  await expect(page.getByText(`0/${totalQuestions} besvarade`)).toHaveCount(0);
  await expect(page.getByText('Provresultat', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
