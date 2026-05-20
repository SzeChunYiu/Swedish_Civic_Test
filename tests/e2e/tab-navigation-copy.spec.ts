import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function expectBottomTabText(page: Page, label: string) {
  const labelLocator = page.getByText(label, { exact: true });
  await expect(labelLocator).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const boxes = await labelLocator.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        height: box.height,
        width: box.width,
        x: box.x,
        y: box.y,
      };
    }),
  );

  expect(
    boxes.some(
      (box) =>
        box.width > 0 &&
        box.height > 0 &&
        box.y > viewport!.height - 120 &&
        box.x >= 0 &&
        box.x < viewport!.width,
    ),
  ).toBe(true);
}

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();
  await expect(
    page.getByRole('radio', { name: 'Set question language to English support' }),
  ).toHaveAttribute('aria-checked', 'true');
}

test('bottom exam tab renders safe Swedish and English labels on mobile web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectBottomTabText(page, 'Övningsprov');
  await expect(page.getByText('Prov', { exact: true })).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectBottomTabText(page, 'Exam');
  await expect(page.getByText('Övningsprov', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Prov', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
