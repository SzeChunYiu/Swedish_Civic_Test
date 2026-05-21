import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test('learn flashcards require an explicit reveal without leaking answer state', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const cards = page.getByTestId('learn-flashcard');
  await expect(cards).toHaveCount(3);

  const firstCard = cards.nth(0);
  const secondCard = cards.nth(1);
  await expect(firstCard.getByText('Svara själv innan du visar svaret.')).toBeVisible();
  await expect(firstCard.getByText('Svar', { exact: true })).toHaveCount(0);
  await expect(secondCard.getByText('Svara själv innan du visar svaret.')).toBeVisible();
  await expect(secondCard.getByText('Svar', { exact: true })).toHaveCount(0);

  await firstCard.getByRole('button', { name: /^Visa svaret för övningskortet:/ }).click();

  await expect(firstCard.getByText('Svar', { exact: true })).toBeVisible();
  await expect(
    firstCard.getByRole('button', { name: /^Visa svaret för övningskortet:/ }),
  ).toHaveCount(0);
  await expect(secondCard.getByText('Svara själv innan du visar svaret.')).toBeVisible();
  await expect(secondCard.getByText('Svar', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
