import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';
import { startAllVisiblePractice } from './practiceHub';

type BoundingBox = { x: number; y: number; width: number; height: number };

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt studiespråk till Engelskt stöd|Set study language to English support/)
    .click();
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );
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

async function expectHeaderControlsDoNotOverlap({
  bookmark,
  label,
  sources,
  supplementary,
}: {
  bookmark: Locator;
  label: string;
  sources: Locator;
  supplementary: Locator;
}) {
  const bookmarkBox = await expectStableTarget(bookmark, `${label} bookmark control`);
  const supplementaryBox = await expectStableTarget(supplementary, `${label} supplementary switch`);
  const sourcesBox = await expectStableTarget(sources, `${label} sources control`);

  expect(
    boxesOverlap(bookmarkBox, supplementaryBox),
    `${label} bookmark and switch targets overlap`,
  ).toBe(false);
  expect(
    boxesOverlap(bookmarkBox, sourcesBox),
    `${label} bookmark and source targets overlap`,
  ).toBe(false);
  expect(
    boxesOverlap(supplementaryBox, sourcesBox),
    `${label} switch and source targets overlap`,
  ).toBe(false);
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
  await startAllVisiblePractice(page, 'en');

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

  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await expect(bookmark).not.toHaveAttribute('aria-selected');
  await bookmark.click();
  await expect(page.getByRole('button', { name: 'Remove this question bookmark' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Remove this question bookmark' }),
  ).not.toHaveAttribute('aria-selected');
  await expect(page.getByText('Bookmarked', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove this question bookmark' }).click();
  await expect(page.getByRole('button', { name: 'Bookmark this question' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('button', { name: 'Bookmark this question' })).not.toHaveAttribute(
    'aria-selected',
  );

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
      "Questions written from UHR's study material Sverige i fokus. The mock exam uses only UHR-referenced questions.",
    ),
  ).toBeVisible();
  await expect(page.getByText('Supplementary', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Variant of an app-authored, UHR-referenced practice question to practise the same knowledge from another angle. Only shown when you turn supplementary questions on.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Editorial', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Hand-written by us to give context the UHR material does not cover directly. Never part of the mock exam.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Frågor skrivna utifrån UHR:s studiematerial')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice header controls keep Swedish labels, states, and mobile targets without overlap', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await seedSettingsLanguage(page, 'sv');
  await markAboutTheTestSeen(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, 'sv');

  const bookmark = page.getByRole('button', { name: 'Bokmärk den här frågan' });
  const supplementary = page.getByRole('switch', { name: 'Bara UHR-frågor' });
  const sources = page.getByRole('button', { name: 'Om källorna' });

  await expectHeaderControlsDoNotOverlap({
    bookmark,
    label: 'Swedish initial',
    sources,
    supplementary,
  });

  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await expect(bookmark).not.toHaveAttribute('aria-selected');
  await bookmark.click();

  const removeBookmark = page.getByRole('button', {
    name: 'Ta bort bokmärket från den här frågan',
  });
  await expect(removeBookmark).toHaveAttribute('aria-pressed', 'true');
  await expect(removeBookmark).not.toHaveAttribute('aria-selected');
  await expect(page.getByText('Bokmärkt', { exact: true })).toBeVisible();
  await expectHeaderControlsDoNotOverlap({
    bookmark: removeBookmark,
    label: 'Swedish bookmarked',
    sources,
    supplementary,
  });

  await removeBookmark.click();
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await expect(bookmark).not.toHaveAttribute('aria-selected');

  await expect(supplementary).toHaveAttribute('aria-checked', 'false');
  await supplementary.click();
  const supplementaryOn = page.getByRole('switch', { name: 'Inkludera tilläggsfrågor' });
  await expect(supplementaryOn).toHaveAttribute('aria-checked', 'true');
  await expectHeaderControlsDoNotOverlap({
    bookmark,
    label: 'Swedish supplementary enabled',
    sources,
    supplementary: supplementaryOn,
  });

  await expect(sources).toHaveAttribute('aria-expanded', 'false');
  await sources.click();

  const closeSources = page.getByRole('button', { name: 'Stäng om källorna' });
  await expect(closeSources).toHaveAttribute('aria-expanded', 'true');
  await expectHeaderControlsDoNotOverlap({
    bookmark,
    label: 'Swedish source details expanded',
    sources: closeSources,
    supplementary: supplementaryOn,
  });

  await expect(page.getByText('UHR-källa', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Frågor skrivna utifrån UHR:s studiematerial Sverige i fokus. Övningsprovet använder bara UHR-hänvisade frågor.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Tilläggsfråga', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Variant av en appskriven, UHR-hänvisad övningsfråga för att öva samma kunskap från en annan vinkel. Visas bara om du slår på tilläggsfrågor.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Redaktionell', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(
      'Skriven av oss för att förklara sammanhang som inte täcks direkt av UHR-materialet. Aldrig en del av övningsprovet.',
    ),
  ).toBeVisible();
  await expect(page.getByText("Questions written from UHR's study material")).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
