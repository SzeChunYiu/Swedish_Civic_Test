import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

type TargetBox = {
  height: number;
  label: string;
  width: number;
  x: number;
  y: number;
};

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
}

async function skipGuideIfPresent(page: Page) {
  const skipGuide = page.getByRole('button', { name: /Hoppa över guiden|Skip the guide/ }).last();
  if (await skipGuide.isVisible()) {
    await skipGuide.click();
  }
}

async function dismissBlockingUi(page: Page) {
  await closeLaunchAdIfPresent(page);
  await skipGuideIfPresent(page);
}

async function expectStableTouchTarget(locator: Locator, label: string): Promise<TargetBox> {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();

  const box = await locator.boundingBox();
  expect(box, `${label} should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} should be at least 44 CSS px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} should be at least 44 CSS px tall`).toBeGreaterThanOrEqual(44);

  return { ...box!, label };
}

function expectTargetsNotToOverlap(targets: TargetBox[]) {
  for (let index = 0; index < targets.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < targets.length; nextIndex += 1) {
      const current = targets[index];
      const next = targets[nextIndex];
      const horizontalOverlap =
        Math.min(current.x + current.width, next.x + next.width) - Math.max(current.x, next.x);
      const verticalOverlap =
        Math.min(current.y + current.height, next.y + next.height) - Math.max(current.y, next.y);

      expect(
        horizontalOverlap > 0.5 && verticalOverlap > 0.5,
        `${current.label} should not overlap ${next.label}`,
      ).toBe(false);
    }
  }
}

test('practice header controls keep mobile targets readable and interactive', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingUi(page);

  const bookmark = page.getByRole('button', { name: 'Bokmärk den här frågan' });
  const supplementary = page.getByRole('switch', { name: 'Bara UHR-frågor' });
  const aboutSources = page.getByRole('button', { name: 'Om källorna' });
  const targetBoxes = await Promise.all([
    expectStableTouchTarget(bookmark, 'Bookmark control'),
    expectStableTouchTarget(supplementary, 'Supplementary-source switch'),
    expectStableTouchTarget(aboutSources, 'About sources toggle'),
  ]);

  expectTargetsNotToOverlap(targetBoxes);
  await expect(bookmark).toHaveAttribute('aria-selected', 'false');
  await expect(supplementary).toHaveAttribute('aria-checked', 'false');
  await expect(aboutSources).toHaveAttribute('aria-expanded', 'false');

  await bookmark.click();
  const bookmarked = page.getByRole('button', { name: 'Ta bort bokmärket från den här frågan' });
  await expect(bookmarked).toHaveAttribute('aria-selected', 'true');

  await supplementary.click();
  const supplementaryEnabled = page.getByRole('switch', { name: 'Inkludera tilläggsfrågor' });
  await expect(supplementaryEnabled).toHaveAttribute('aria-checked', 'true');

  await aboutSources.click();
  const aboutSourcesExpanded = page.getByRole('button', { name: 'Stäng om källorna' });
  await expect(aboutSourcesExpanded).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Variant som genererats utifrån en UHR-fråga')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
