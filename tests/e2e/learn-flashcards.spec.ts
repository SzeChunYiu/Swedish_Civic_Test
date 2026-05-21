import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test('learn flashcards show the study disclaimer and source citation in Swedish', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const body = page.locator('body');
  await expect(body).toContainText('Snabba flashkort');
  await expect(body).toContainText('Studieinformation');
  await expect(body).toContainText('Oberoende studieverktyg');
  await expect(body).toContainText('Källhänvisning');
  await expect(body).toContainText('Sverige i fokus, Landet Sverige, Geografi, klimat och natur');
  await expect(body).toContainText('s. 5');
  await expect(
    page.getByRole('region', {
      name: /Övningskort\. Fråga: Var ligger Sverige\?.*Källhänvisning: Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s\. 5\./,
    }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('learn flashcards keep source labels in English support mode', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt studiespråk till Engelskt stöd|Set study language to English support/)
    .click();
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const body = page.locator('body');
  await expect(body).toContainText('Quick flashcards');
  await expect(body).toContainText('Study disclaimer');
  await expect(body).toContainText('Independent study tool');
  await expect(body).toContainText('Source citation');
  await expect(body).toContainText('Sverige i fokus, Landet Sverige, Geografi, klimat och natur');
  await expect(body).toContainText('p. 5');
  await expect(
    page.getByRole('region', {
      name: /Study flashcard\. Prompt: Where is Sweden located\?.*Source citation: Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p\. 5\./,
    }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
