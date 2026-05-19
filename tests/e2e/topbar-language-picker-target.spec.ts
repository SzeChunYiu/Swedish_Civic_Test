import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

type BoundingBox = { x: number; y: number; width: number; height: number };

async function expectTopBarTarget(locator: Locator, label: string): Promise<BoundingBox> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();

  expect(box, `${label} should have measurable geometry`).not.toBeNull();
  expect(box!.width, `${label} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
  expect(box!.width, `${label} should remain a compact header target`).toBeLessThan(120);
  expect(box!.height, `${label} should remain a compact header target`).toBeLessThan(120);

  return box!;
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const gap = 0.5;

  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

function expectNoTargetOverlap(targets: Array<{ box: BoundingBox; label: string }>) {
  for (let index = 0; index < targets.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < targets.length; otherIndex += 1) {
      const current = targets[index];
      const other = targets[otherIndex];

      expect(
        boxesOverlap(current.box, other.box),
        `${current.label} and ${other.label} targets overlap`,
      ).toBe(false);
    }
  }
}

async function collectTopBarTargets(page: Page) {
  const language = page.getByRole('button', {
    name: /Nuvarande språk SV\. Öppna språkväljaren\.|Current language SV\. Open language picker\./,
  });
  const audio = page.getByRole('switch', {
    name: /Ljud är på, tryck för att stänga av|Audio enabled, tap to mute/,
  });
  const search = page.getByRole('link', { name: /Sök|Search/ });
  const saved = page.getByRole('link', { name: /Öppna sparade frågor|Open saved questions/ });
  const settings = page.getByRole('link', { name: /Öppna inställningar|Open settings/ });

  return [
    { locator: language, label: 'Language picker trigger' },
    { locator: audio, label: 'Audio toggle' },
    { locator: search, label: 'Search link' },
    { locator: saved, label: 'Saved questions link' },
    { locator: settings, label: 'Settings link' },
  ];
}

test('topbar language picker aligns with adjacent mobile header targets', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const targetBoxes = [];

  for (const target of await collectTopBarTargets(page)) {
    targetBoxes.push({
      box: await expectTopBarTarget(target.locator, target.label),
      label: target.label,
    });
  }

  expectNoTargetOverlap(targetBoxes);

  const languageTrigger = page.getByRole('button', {
    name: /Nuvarande språk SV\. Öppna språkväljaren\.|Current language SV\. Open language picker\./,
  });

  await expect(languageTrigger).toHaveAttribute('aria-expanded', 'false');
  await languageTrigger.click();
  await expect(languageTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menu', { name: /Språkväljare|Language picker/ })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Stäng språkväljaren|Close language picker/ }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
