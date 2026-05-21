import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

const removeAdsProductId = 'com.billyyiu.almostswedish.removeads';
const proLifetimeProductId = 'com.billyyiu.almostswedish.prolifetime';
const purchaseDelayMs = 700;

type PurchaseAction = 'request' | 'restore';

async function seedPurchaseRuntime(
  page: Page,
  {
    proOwned = false,
    removeAdsOwned = false,
  }: {
    proOwned?: boolean;
    removeAdsOwned?: boolean;
  } = {},
) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    windowValues: {
      __SMT_E2E__: true,
      __SMT_E2E_PRO_RUNTIME_SCOPE__: true,
      __SMT_E2E_PURCHASE_DELAY_MS: purchaseDelayMs,
      __SMT_PRO_LIFETIME_MOCK_OWNED__: proOwned,
      __SMT_REMOVE_ADS_MOCK_OWNED__: removeAdsOwned,
    },
  });
}

async function openProfile(page: Page) {
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Progress without an account', { exact: true })).toBeVisible();
}

async function resetPurchaseActionCounts(page: Page) {
  await page.evaluate(() => {
    (
      window as typeof window & {
        __SMT_E2E_PURCHASE_ACTION_COUNTS__?: Record<string, number>;
      }
    ).__SMT_E2E_PURCHASE_ACTION_COUNTS__ = {};
  });
}

async function purchaseActionCount(
  page: Page,
  action: PurchaseAction,
  productId: string,
): Promise<number> {
  return page.evaluate(
    ({ actionName, countedProductId }) => {
      const runtime = window as typeof window & {
        __SMT_E2E_PURCHASE_ACTION_COUNTS__?: Record<string, number>;
      };
      return runtime.__SMT_E2E_PURCHASE_ACTION_COUNTS__?.[`${actionName}:${countedProductId}`] ?? 0;
    },
    { actionName: action, countedProductId: productId },
  );
}

async function doubleActivateButton(page: Page, name: RegExp | string) {
  const button = page.getByRole('button', { name });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();

  await button.evaluate((node) => {
    const element = node as HTMLElement;
    element.click();
    element.click();
  });
}

async function expectSingleStoreCall(page: Page, action: PurchaseAction, productId: string) {
  await expect
    .poll(() => purchaseActionCount(page, action, productId), { timeout: purchaseDelayMs + 3000 })
    .toBe(1);
  await page.waitForTimeout(purchaseDelayMs + 100);
  await expect.poll(() => purchaseActionCount(page, action, productId)).toBe(1);
}

test.use({ viewport: { width: 390, height: 844 } });

test('PremiumBanner buy suppresses rapid duplicate Remove Ads purchase calls', async ({ page }) => {
  await seedPurchaseRuntime(page, { removeAdsOwned: false });
  await openProfile(page);
  await resetPurchaseActionCounts(page);

  await doubleActivateButton(page, 'Buy Remove Ads for 29 SEK');
  await expectSingleStoreCall(page, 'request', removeAdsProductId);
  await expect(page.getByText('Ads are disabled on this device.', { exact: true })).toBeVisible();
});

test('PremiumBanner restore suppresses rapid duplicate Remove Ads restore calls', async ({
  page,
}) => {
  await seedPurchaseRuntime(page, { removeAdsOwned: true });
  await openProfile(page);
  await resetPurchaseActionCounts(page);

  await doubleActivateButton(page, 'Restore Remove Ads purchase');
  await expectSingleStoreCall(page, 'restore', removeAdsProductId);
  await expect(page.getByText('Ads are disabled on this device.', { exact: true })).toBeVisible();
});

test('ProPaywall buy suppresses rapid duplicate Pro Lifetime purchase calls', async ({ page }) => {
  await seedPurchaseRuntime(page, { proOwned: false, removeAdsOwned: false });
  await openProfile(page);
  await resetPurchaseActionCounts(page);

  await doubleActivateButton(page, /Buy Pro .*59 SEK/);
  await expectSingleStoreCall(page, 'request', proLifetimeProductId);
  await expect(page.getByText('Pro is active on this device.', { exact: true })).toBeVisible();
});

test('ProPaywall restore suppresses rapid duplicate Pro Lifetime restore calls', async ({
  page,
}) => {
  await seedPurchaseRuntime(page, { proOwned: true, removeAdsOwned: false });
  await openProfile(page);
  await resetPurchaseActionCounts(page);

  await doubleActivateButton(page, 'Restore Pro purchase');
  await expectSingleStoreCall(page, 'restore', proLifetimeProductId);
  await expect(
    page.getByText('Pro has been restored on this device.', { exact: true }),
  ).toBeVisible();
});
