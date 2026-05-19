import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

async function expectCompactTarget(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
  expect(box!.width, `${label} should not be a full-screen backdrop`).toBeLessThan(120);
  expect(box!.height, `${label} should not be a full-screen backdrop`).toBeLessThan(120);
}

async function openLanguagePicker(page: Page) {
  await page
    .getByRole('button', {
      name: /Nuvarande språk SV\. Öppna språkväljaren\.|Current language SV\. Open language picker\./,
    })
    .click();
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toBeVisible();
}

test('topbar language picker exposes one compact close target and keeps disabled rows open', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await openLanguagePicker(page);

  const menu = page.getByRole('menu', { name: 'Språkväljare' });
  const closeButtons = page.getByRole('button', { name: 'Stäng språkväljaren' });

  await expect(menu).toBeVisible();
  await expect(closeButtons).toHaveCount(1);
  await expectCompactTarget(closeButtons.first(), 'language picker close button');

  const arabicRow = page.getByRole('button', { name: 'Arabic, kommer snart' });
  await expect(arabicRow).toHaveAttribute('aria-disabled', 'true');
  await arabicRow.click({ force: true });
  await expect(menu).toBeVisible();

  await page.mouse.click(8, 8);
  await expect(menu).toHaveCount(0);
  await expect(closeButtons).toHaveCount(0);

  await openLanguagePicker(page);
  await closeButtons.first().click();
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
