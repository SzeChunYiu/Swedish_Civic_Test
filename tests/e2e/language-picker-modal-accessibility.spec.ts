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
  const trigger = page.getByRole('button', {
    name: /Nuvarande språk SV\. Öppna språkväljaren\.|Current language SV\. Open language picker\./,
  });

  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toBeVisible();

  return trigger;
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

  const trigger = await openLanguagePicker(page);

  const menu = page.getByRole('menu', { name: 'Språkväljare' });
  const closeButtons = page.getByRole('button', { name: 'Stäng språkväljaren' });

  await expect(menu).toBeVisible();
  await expect(closeButtons).toHaveCount(1);
  await expectCompactTarget(closeButtons.first(), 'language picker close button');

  const swedishRow = page.getByRole('menuitem', { name: 'Swedish' });
  const englishRow = page.getByRole('menuitem', { name: 'English' });
  const arabicRow = page.getByRole('menuitem', { name: 'Arabic, kommer snart' });

  await expect(swedishRow).toHaveAttribute('aria-selected', 'true');
  await expect(englishRow).toHaveAttribute('aria-selected', 'false');
  await expect(arabicRow).toHaveAttribute('aria-disabled', 'true');
  await expect(arabicRow).toHaveAttribute('aria-selected', 'false');
  await arabicRow.click({ force: true });
  await expect(menu).toBeVisible();

  await page.mouse.click(8, 8);
  await expect(menu).toHaveCount(0);
  await expect(closeButtons).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await openLanguagePicker(page);
  await closeButtons.first().click();
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  expect(consoleErrors).toEqual([]);
});

test('topbar language picker supports keyboard menu navigation', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const trigger = await openLanguagePicker(page);
  const menu = page.getByRole('menu', { name: 'Språkväljare' });
  const swedishRow = page.getByRole('menuitem', { name: 'Swedish' });
  const englishRow = page.getByRole('menuitem', { name: 'English' });
  const arabicRow = page.getByRole('menuitem', { name: 'Arabic, kommer snart' });

  await expect(menu).toBeVisible();
  await expect(swedishRow).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(englishRow).toBeFocused();
  await expect(arabicRow).not.toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(swedishRow).toBeFocused();

  await page.keyboard.press('End');
  await expect(englishRow).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);

  const englishTrigger = page.getByRole('button', {
    name: 'Current language EN. Open language picker.',
  });
  await expect(englishTrigger).toBeFocused();
  await expect(englishTrigger).toHaveAttribute('aria-expanded', 'false');

  await englishTrigger.click();
  await expect(page.getByRole('menu', { name: 'Language picker' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'English' })).toBeFocused();

  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: 'Swedish' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('menu', { name: /Language picker|Språkväljare/ })).toHaveCount(0);

  const swedishTrigger = page.getByRole('button', {
    name: 'Nuvarande språk SV. Öppna språkväljaren.',
  });
  await expect(swedishTrigger).toBeFocused();

  await swedishTrigger.click();
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'Språkväljare' })).toHaveCount(0);
  await expect(swedishTrigger).toBeFocused();
  await expect(swedishTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  expect(consoleErrors).toEqual([]);
});

test('topbar language picker traps Tab focus inside the open menu', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const trigger = await openLanguagePicker(page);
  const menu = page.getByRole('menu', { name: 'Språkväljare' });
  const closeButton = page.getByRole('button', { name: 'Stäng språkväljaren' });
  const swedishRow = page.getByRole('menuitem', { name: 'Swedish' });
  const englishRow = page.getByRole('menuitem', { name: 'English' });
  const arabicRow = page.getByRole('menuitem', { name: 'Arabic, kommer snart' });

  await expect(menu).toBeVisible();
  await expect(swedishRow).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(closeButton).toBeFocused();
  await expect(trigger).not.toBeFocused();

  await page.keyboard.press('Tab');
  await expect(swedishRow).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(englishRow).toBeFocused();
  await expect(arabicRow).not.toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await expect(trigger).not.toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(englishRow).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  expect(consoleErrors).toEqual([]);
});
