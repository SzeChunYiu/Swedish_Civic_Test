import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  createStoredRemoveAdsE2ERestoreEntitlement,
  E2E_REMOVE_ADS_STORAGE_KEY,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

const entitlementHydrationDelayMs = 4000;

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function seedDelayedPurchasedProfile(page: Page, language: AppLanguage) {
  const now = '2026-05-19T00:00:00.000Z';
  const storedRecord = createStoredRemoveAdsE2ERestoreEntitlement({ nowIso: now });

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      [E2E_REMOVE_ADS_STORAGE_KEY]: JSON.stringify(storedRecord),
    },
    windowValues: {
      __SMT_E2E__: true,
      __SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS: entitlementHydrationDelayMs,
      __SMT_REMOVE_ADS_MOCK_OWNED__: true,
    },
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test('profile Remove Ads hydration hides paywall while stored entitlement is pending', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);
  await seedDelayedPurchasedProfile(page, 'en');

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Progress without an account', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Restore Remove Ads purchase' })).toHaveCount(0);
  await expect(page.getByText('One-time purchase. Restore is available')).toHaveCount(0);
  await expect(page.getByText('Remove Ads', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ad-free study is active', { exact: true })).toHaveCount(0);

  await expect(page.getByText('Ad-free study is active', { exact: true })).toBeVisible({
    timeout: entitlementHydrationDelayMs + 5000,
  });
  await expect(page.getByText('Ads are disabled on this device.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Remove Ads purchase' })).toBeVisible();
  const buyButton = page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' });
  await expect(buyButton).toBeVisible();
  await expect(buyButton).toBeDisabled();
  await expect(page.getByText(/Pay 29 SEK once/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
