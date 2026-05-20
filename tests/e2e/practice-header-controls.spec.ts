import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

type BoundingBox = { x: number; y: number; width: number; height: number };

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByRole('radio', {
      name: /Byt frågespråk till Engelskt stöd|Set question language to English support/,
    })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Set question language to English support' }),
  ).toHaveAttribute('aria-checked', 'true');
}

async function expectStableTarget(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();

  expect(box, `${name} should have measurable geometry`).not.toBeNull();
  expect(box!.width, `${name} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${name} should be at least 44px tall`).toBeGreaterThanOrEqual(44);

  return box!;
}

function boxesOverlap(a: BoundingBox, b: BoundingBox) {
  const gap = 0.5;
  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

test('practice header controls keep English labels, states, and mobile targets', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('Question 1')).toBeVisible();

  const bookmark = page.getByRole('button', { name: 'Bookmark this question' });
  const supplementary = page.getByRole('switch', { name: 'UHR questions only' });
  const sources = page.getByRole('button', { name: 'About the sources' });

  const bookmarkBox = await expectStableTarget(bookmark, 'Bookmark control');
  const supplementaryBox = await expectStableTarget(supplementary, 'UHR-only switch');
  const sourcesBox = await expectStableTarget(sources, 'About sources control');

  expect(boxesOverlap(bookmarkBox, supplementaryBox), 'bookmark and switch targets overlap').toBe(
    false,
  );
  expect(boxesOverlap(bookmarkBox, sourcesBox), 'bookmark and source targets overlap').toBe(false);
  expect(boxesOverlap(supplementaryBox, sourcesBox), 'switch and source targets overlap').toBe(
    false,
  );

  await expect(bookmark).toHaveAttribute('aria-selected', 'false');
  await bookmark.click();
  await expect(page.getByRole('button', { name: 'Remove this question bookmark' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Bookmarked', { exact: true })).toBeVisible();

  await expect(supplementary).toHaveAttribute('aria-checked', 'false');
  await supplementary.click();
  await expect(
    page.getByRole('switch', { name: 'Include supplementary questions' }),
  ).toHaveAttribute('aria-checked', 'true');

  await expect(sources).toHaveAttribute('aria-expanded', 'false');
  await sources.click();

  const closeSources = page.getByRole('button', { name: 'Close source details' });
  await expect(closeSources).toHaveAttribute('aria-expanded', 'true');
  await expectStableTarget(closeSources, 'Close source details control');

  await expect(page.getByText('UHR source', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      "Questions traced directly to UHR's study material Sverige i fokus. The mock exam is always UHR-only.",
    ),
  ).toBeVisible();
  await expect(page.getByText('Supplementary', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Variant generated from a UHR question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Editorial', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Frågor som kommer direkt från UHR:s utbildningsmaterial'),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
