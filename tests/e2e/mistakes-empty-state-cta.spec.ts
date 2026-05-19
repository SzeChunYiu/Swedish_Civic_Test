import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

async function dismissBlockingModals(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });

  if (
    await closeLaunchAd
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await closeLaunchAd.first().click();
  }

  const skipAboutGuide = page.getByRole('button', {
    name: /Skip the guide|Hoppa över guiden/,
  });

  if (
    await skipAboutGuide
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await skipAboutGuide.first().click();
  }

  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
}

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
