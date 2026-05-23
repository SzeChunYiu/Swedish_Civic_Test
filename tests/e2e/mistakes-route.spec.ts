import { expect, test } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';
import { startAllVisiblePractice } from './practiceHub';

test('Practice bookmark persists into Mistakes saved list after reload and clears on revisit', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, 'en');

  const bookmark = page.getByRole('button', { name: 'Bookmark this question' });
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await bookmark.click();

  const removeBookmark = page.getByRole('button', { name: 'Remove this question bookmark' });
  await expect(removeBookmark).toHaveAttribute('aria-pressed', 'true');
  await expect(removeBookmark).not.toHaveAttribute('aria-selected');
  await expect(page.getByText('Bookmarked', { exact: true })).toBeVisible();

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Bookmarked questions' })).toBeVisible();
  await expect(page.getByText('Saved for focused review', { exact: true })).toBeVisible();
  await expect(page.locator('[data-testid="mistakes-review-card"]')).toHaveCount(1);
  await expect(page.getByText('No saved or missed questions yet', { exact: true })).toHaveCount(0);

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, 'en');

  const persistedBookmark = page.getByRole('button', {
    name: 'Remove this question bookmark',
  });
  await expect(persistedBookmark).toHaveAttribute('aria-pressed', 'true');
  await persistedBookmark.click();
  await expect(page.getByRole('button', { name: 'Bookmark this question' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Bookmarked questions' })).toHaveCount(0);
  await expect(page.getByText('Saved for focused review', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-testid="mistakes-review-card"]')).toHaveCount(0);
  await expect(page.getByText('No saved or missed questions yet', { exact: true })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
