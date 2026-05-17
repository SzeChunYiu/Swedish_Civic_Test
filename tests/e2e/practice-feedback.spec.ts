import { expect, test } from '@playwright/test';

test('practice flow answers a question, shows source feedback, and advances', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/practice', { waitUntil: 'networkidle' });

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByText('Var ligger Sverige?')).toBeVisible();
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer I Norden i norra Europa');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(page.getByText('I Norden i norra Europa — Rätt')).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByText('Explanation')).toBeVisible();
  await expect(page.getByText(/Sverige ligger i Norden/)).toBeVisible();
  await expect(page.getByText('UHR reference')).toBeVisible();
  await expect(page.getByText('Landet Sverige · Geografi, klimat och natur')).toBeVisible();
  await expect(page.getByText('Approx. page 5')).toBeVisible();

  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(
    page.getByText(
      'Sant eller falskt: Den nordligaste delen av Sverige ligger norr om polcirkeln.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice feedback reveals the correct option after a wrong answer', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/practice', { waitUntil: 'networkidle' });

  await page.getByLabel('Select answer I södra Europa').click();

  await expect(page.getByText('I södra Europa — Fel')).toBeVisible();
  await expect(page.getByText('I Norden i norra Europa — Rätt svar')).toBeVisible();
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sverige ligger i Norden/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
