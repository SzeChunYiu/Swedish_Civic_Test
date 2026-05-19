import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

import { CITIZENSHIP_TIMELINE_SOURCE_URLS } from '../../lib/learning/examDate';
import { dismissBlockingModals } from './browserLaunch';

type BoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

const expectedSources = [
  {
    label: 'Migrationsverket',
    url: CITIZENSHIP_TIMELINE_SOURCE_URLS.rulesEffectiveDate,
  },
  {
    label: 'UHR',
    url: CITIZENSHIP_TIMELINE_SOURCE_URLS.civicKnowledgeTestStart,
  },
  {
    label: 'Regeringen',
    url: CITIZENSHIP_TIMELINE_SOURCE_URLS.civicKnowledgeTestDeadline,
  },
] as const;

async function expectTargetSize(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} source link should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} source link width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} source link height`).toBeGreaterThanOrEqual(44);
}

function boxesOverlap(a: BoundingBox, b: BoundingBox) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

test('home countdown banner exposes official source links as mobile-safe targets', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const countdownBody = page.getByText(/Nya medborgarskapsregler gäller från/).first();
  const sourceLabel = page.getByText('Officiella datumkällor:', { exact: true });

  await expect(countdownBody).toBeVisible();
  await expect(sourceLabel).toBeVisible();

  const bodyBox = await countdownBody.boundingBox();
  expect(bodyBox, 'countdown body should have a rendered box').not.toBeNull();

  for (const source of expectedSources) {
    const link = page.getByRole('link', { name: source.label });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', source.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expectTargetSize(link, source.label);

    const linkBox = await link.boundingBox();
    expect(linkBox, `${source.label} link should have a rendered box`).not.toBeNull();
    expect(boxesOverlap(bodyBox!, linkBox!)).toBe(false);

    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(source.url);
    await popup.close();
  }

  expect(consoleErrors).toEqual([]);
});
