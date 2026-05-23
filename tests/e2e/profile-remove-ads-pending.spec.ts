import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

const removeAdsStorageKey = 'monetization.removeAds.adsDisabled.v1';
const removeAdsProductId = 'com.billyyiu.almostswedish.removeads';
const mockedRestoreTransactionId = 'restore-com-billyyiu-almostswedish-removeads';
const mockedRestorePurchaseToken = `mock-token-${mockedRestoreTransactionId}`;
const entitlementHydrationDelayMs = 4000;

type StoredRemoveAdsRecord = {
  grantedAt: string;
  productId: string;
  purchaseToken: string;
  receiptValidatedAt: string;
  receiptValidationStatus: 'valid';
  schemaVersion: 1;
  source: 'purchase';
  transactionId: string;
};

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
  const storedRecord: StoredRemoveAdsRecord = {
    grantedAt: now,
    productId: removeAdsProductId,
    purchaseToken: mockedRestorePurchaseToken,
    receiptValidatedAt: now,
    receiptValidationStatus: 'valid',
    schemaVersion: 1,
    source: 'purchase',
    transactionId: mockedRestoreTransactionId,
  };

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: {
      [removeAdsStorageKey]: JSON.stringify(storedRecord),
    },
    windowValues: {
      __SMT_E2E__: true,
      __SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS: entitlementHydrationDelayMs,
      __SMT_REMOVE_ADS_MOCK_OWNED__: true,
    },
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test('profile hides Remove Ads paywall while stored entitlement hydration is pending', async ({
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
