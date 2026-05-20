import { expect, test } from '@playwright/test';

test('launch sponsor modal exposes one named dialog on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });

  const dialogs = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Startannons');
  await expect(page.getByRole('heading', { name: 'Startannons' })).toBeVisible();
  await expect(page.getByText('Testannons för appstart visas en gång per appstart.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Launch sponsor' })).toHaveCount(0);
  await expect(page.getByText('Continue studying')).toHaveCount(0);

  await page.getByRole('button', { name: 'Stäng startannons' }).click();

  await expect(dialogs).toHaveCount(0);
  await expect(page.getByText('Dagens mål')).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);

  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Förbered dig lugnt för samhällskunskapsprovet' }),
  ).toBeVisible();

  await page.goto('/about-the-test', { waitUntil: 'networkidle' });
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Vad är medborgarskapsprovet i samhällskunskap?' }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
