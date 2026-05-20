import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { markAboutTheTestSeen, seedSettingsLanguage, type AppLanguage } from './browserLaunch';

const removeAdsStorageKey = 'monetization.removeAds.adsDisabled.v1';
const removeAdsProductId = 'com.billyyiu.almostswedish.removeads';
const entitlementHydrationDelayMs = 4000;

type RemoveAdsDelayWindow = Window &
  typeof globalThis & {
    __SMT_E2E__?: boolean;
    __SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS?: number;
  };

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
  await page.addInitScript(
    ({
      delayMs,
      productId,
      storageKey,
    }: {
      delayMs: number;
      productId: string;
      storageKey: string;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();

      const now = '2026-05-19T00:00:00.000Z';
      const storedRecord: StoredRemoveAdsRecord = {
        grantedAt: now,
        productId,
        purchaseToken: 'e2e-profile-pending-token',
        receiptValidatedAt: now,
        receiptValidationStatus: 'valid',
        schemaVersion: 1,
        source: 'purchase',
        transactionId: 'e2e-profile-pending-transaction',
      };

      window.localStorage.setItem(storageKey, JSON.stringify(storedRecord));
      const e2eWindow = window as RemoveAdsDelayWindow;
      e2eWindow.__SMT_E2E__ = true;
      e2eWindow.__SMT_REMOVE_ADS_ENTITLEMENT_DELAY_MS = delayMs;
    },
    {
      delayMs: entitlementHydrationDelayMs,
      productId: removeAdsProductId,
      storageKey: removeAdsStorageKey,
    },
  );
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
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
  await expect(
    page.getByText('Purchase confirmed. Study ads are disabled on this device', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Remove Ads purchase' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' })).toHaveCount(0);
  await expect(page.getByText(/Pay 29 SEK once/)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
