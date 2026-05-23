import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function seedProRuntimeScope(page: Page) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    windowValues: {
      __SMT_E2E__: true,
      __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
      __SMT_PRO_LIFETIME_MOCK_OWNED__: false,
      __SMT_REMOVE_ADS_MOCK_OWNED__: false,
    },
  });
}

test('Pro comparison shows prices without urgency copy or Remove Ads conflation', async ({
  page,
}) => {
  const errors = collectConsoleAndPageErrors(page);

  await seedProRuntimeScope(page);
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const proHeading = page.getByRole('heading', { name: 'Compare Free, Ad-Free, and Pro' });
  await proHeading.scrollIntoViewIfNeeded();
  await expect(proHeading).toBeVisible();
  await expect(page.getByText('Pro Lifetime', { exact: true })).toBeVisible();

  const priceRow = page.getByLabel(
    'Price. Free: Free forever. Ad-Free: 29 SEK · one-time. Pro: 59 SEK · one-time',
  );
  await expect(priceRow).toBeVisible();
  await expect(priceRow.getByText('Price', { exact: true })).toBeVisible();
  await expect(priceRow.getByText('Free forever', { exact: true })).toBeVisible();
  await expect(priceRow.getByText('29 SEK · one-time', { exact: true })).toBeVisible();
  await expect(priceRow.getByText('59 SEK · one-time', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Buy Pro · 59 SEK' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Pro purchase' })).toBeVisible();
  await expect(page.getByText(/Remove Ads for 29 SEK stays available/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remove Ads' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Remove Ads purchase' })).toBeVisible();

  await expect(page.getByText(/best value/i)).toHaveCount(0);
  await expect(page.getByText(/limited[- ]time/i)).toHaveCount(0);
  await expect(page.getByText(/hurry|sale|discount/i)).toHaveCount(0);

  expect(errors.get()).toEqual([]);
});
