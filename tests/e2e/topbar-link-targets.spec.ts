import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen } from './browserLaunch';

const topBarLinks = [
  { href: /\/search$/, label: 'Sök' },
  { href: /\/mistakes$/, label: 'Öppna sparade och missade frågor' },
  { href: /\/settings$/, label: 'Öppna inställningar' },
] as const;

async function getBox(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a measurable web target`).not.toBeNull();
  return box as NonNullable<typeof box>;
}

async function getComputedInteractionStyle(locator: Locator) {
  return locator.evaluate((node) => {
    const style = window.getComputedStyle(node);

    return {
      backgroundColor: style.backgroundColor,
      display: style.display,
      transform: style.transform,
    };
  });
}

test('top bar route links keep 44px web targets and token feedback', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  for (const { href, label } of topBarLinks) {
    const link = page.getByRole('link', { name: label }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);

    const box = await getBox(link, label);
    expect(box.width, `${label} should keep a 44px minimum width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${label} should keep a 44px minimum height`).toBeGreaterThanOrEqual(44);

    const style = await getComputedInteractionStyle(link);
    expect(style.display, `${label} anchor should size as a flex target`).toBe('flex');
  }

  await dismissBlockingModals(page);

  const searchLink = page.getByRole('link', { name: 'Sök' }).first();
  const idleStyle = await getComputedInteractionStyle(searchLink);

  await searchLink.hover();
  const hoverStyle = await getComputedInteractionStyle(searchLink);
  expect(hoverStyle.backgroundColor).not.toBe(idleStyle.backgroundColor);
  expect(hoverStyle.transform).not.toBe('none');

  const hoverBox = await getBox(searchLink, 'Sök hover');
  await page.mouse.move(hoverBox.x + hoverBox.width / 2, hoverBox.y + hoverBox.height / 2);
  await page.mouse.down();
  const pressedStyle = await getComputedInteractionStyle(searchLink);
  expect(pressedStyle.backgroundColor).toBe(hoverStyle.backgroundColor);
  expect(pressedStyle.transform).not.toBe(hoverStyle.transform);
  expect(pressedStyle.transform).not.toBe('none');
  await page.mouse.move(2, 2);
  await page.mouse.up();

  await expect(page).toHaveURL(/\/home$/);
  expect(consoleErrors).toEqual([]);
});
