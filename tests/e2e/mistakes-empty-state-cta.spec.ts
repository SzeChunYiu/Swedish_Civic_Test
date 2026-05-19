import { expect, test } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

test('mistakes empty state CTA is a full-size route to practice', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('Inga misstag ännu', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Svara fel på en övningsfråga så visas den här.', { exact: true }),
  ).toBeVisible();

  const practiceCta = page.getByRole('button', { name: 'Öva svåra frågor' });
  await expect(practiceCta).toBeVisible();

  const practiceCtaBox = await practiceCta.boundingBox();
  expect(practiceCtaBox).not.toBeNull();
  expect(practiceCtaBox!.width).toBeGreaterThanOrEqual(44);
  expect(practiceCtaBox!.height).toBeGreaterThanOrEqual(44);

  await practiceCta.click();

  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByText('Fråga 1', { exact: true })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
