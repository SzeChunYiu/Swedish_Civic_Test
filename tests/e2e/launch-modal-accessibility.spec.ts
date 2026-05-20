import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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

  const closeButton = dialogs.first().getByRole('button').first();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(dialogs).toHaveCount(0);
  await expect(page.getByText('Dagens mål')).toBeVisible();

  const searchLink = page.getByRole('link', { name: 'Sök' }).first();
  await expect(searchLink).toBeVisible();
  await expect(searchLink).toBeFocused();
  const searchLinkBox = await searchLink.boundingBox();
  expect(searchLinkBox).not.toBeNull();
  expect(searchLinkBox?.width).toBeGreaterThanOrEqual(44);
  expect(searchLinkBox?.height).toBeGreaterThanOrEqual(44);
  const hitTest = await page.evaluate(
    ({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      const actionableTarget = target?.closest('a,button,[role="link"],[role="button"]');

      return {
        ariaLabel: actionableTarget?.getAttribute('aria-label') ?? null,
        role: actionableTarget?.getAttribute('role') ?? null,
        tagName: actionableTarget?.tagName ?? null,
      };
    },
    {
      x: (searchLinkBox?.x ?? 0) + (searchLinkBox?.width ?? 0) / 2,
      y: (searchLinkBox?.y ?? 0) + (searchLinkBox?.height ?? 0) / 2,
    },
  );
  expect(hitTest).toMatchObject({
    ariaLabel: 'Sök',
    tagName: 'A',
  });

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('launch sponsor dismissal stays centralized in browserLaunch helpers', async () => {
  const specDir = path.resolve('tests/e2e');
  const launchCloseEnglish = ['Close launch', ' sponsor ad'].join('');
  const launchCloseSwedish = ['Stäng start', 'annons'].join('');

  for (const file of fs.readdirSync(specDir).filter((name) => name.endsWith('.spec.ts'))) {
    const source = fs.readFileSync(path.join(specDir, file), 'utf8');

    expect(source, `${file} must not declare a local launch-ad dismissal helper`).not.toMatch(
      /function\s+closeLaunchAdIfPresent/,
    );
    expect(source, `${file} must not query the launch close button directly`).not.toContain(
      launchCloseEnglish,
    );
    expect(source, `${file} must not query the launch close button directly`).not.toContain(
      launchCloseSwedish,
    );
  }
});

test('first-run about modal exposes only real guide actions on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/practice', { waitUntil: 'networkidle' });

  const dialogs = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Vad är medborgarskapsprovet?');
  await expect(page.getByRole('heading', { name: 'Vad är medborgarskapsprovet?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Öppna om-provet-guiden' })).toHaveCount(1);

  const skipGuideButtons = page.getByRole('button', { name: 'Hoppa över guiden' });
  await expect(skipGuideButtons).toHaveCount(1);
  const skipGuideBox = await skipGuideButtons.first().boundingBox();
  expect(skipGuideBox).not.toBeNull();
  expect(skipGuideBox?.width).toBeLessThan(220);
  expect(skipGuideBox?.height).toBeLessThan(96);

  await page.mouse.click(8, 8);
  await expect(dialogs).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
