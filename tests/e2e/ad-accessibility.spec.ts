import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test('ad placements announce Remove Ads in web accessible names', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByLabel(
      /Google AdMob: (home banner|Annons på startsidan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(
    page.getByLabel(
      /Google AdMob: (chapter list banner|Annons i kapitellistan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(
    page.getByLabel(
      /(Test native ad: Sponsored study placement|Inbyggd testannons: Sponsrad studieplacering)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(/Hidden after Remove Ads is active\./)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
