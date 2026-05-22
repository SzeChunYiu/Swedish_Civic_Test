import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

type PurchaseCallKey =
  | 'proLifetime.buy'
  | 'proLifetime.restore'
  | 'removeAds.buy'
  | 'removeAds.restore';

const purchaseDelayMs = 1200;

async function seedPurchaseHarness(
  page: Page,
  {
    proOwned = true,
    removeAdsOwned = true,
  }: {
    proOwned?: boolean;
    removeAdsOwned?: boolean;
  } = {},
) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    windowValues: {
      __SMT_E2E__: true,
      __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
      __SMT_PRO_LIFETIME_MOCK_OWNED__: proOwned,
      __SMT_PURCHASE_INFLIGHT_DELAY_MS: purchaseDelayMs,
      __SMT_REMOVE_ADS_MOCK_OWNED__: removeAdsOwned,
    },
  });
}

async function openProfile(page: Page) {
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByRole('heading', { name: 'Progress without an account' })).toBeVisible();
}

async function dispatchRapidClicks(action: Locator) {
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeVisible();
  await action.evaluate((node) => {
    const target = node as HTMLElement;
    const eventOptions = { bubbles: true, cancelable: true, view: window };
    target.dispatchEvent(new MouseEvent('click', eventOptions));
    target.dispatchEvent(new MouseEvent('click', eventOptions));
  });
}

async function dispatchRapidKeyboardActivations(
  page: Page,
  action: Locator,
  key: 'Enter' | 'Space',
) {
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeVisible();
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press(key);
  await page.keyboard.press(key);
}

async function purchaseCallCount(page: Page, key: PurchaseCallKey): Promise<number> {
  return page.evaluate((callKey) => {
    const runtime = window as typeof window & {
      __SMT_PURCHASE_INFLIGHT_CALLS__?: Partial<Record<PurchaseCallKey, number>>;
    };
    return runtime.__SMT_PURCHASE_INFLIGHT_CALLS__?.[callKey] ?? 0;
  }, key);
}

async function expectSingleStoreCall(page: Page, key: PurchaseCallKey) {
  await expect.poll(() => purchaseCallCount(page, key)).toBe(1);
}

async function expectBusyButton(action: Locator) {
  await expect(action).toHaveAttribute('aria-busy', 'true');
  await expect(action).toHaveAttribute('aria-disabled', 'true');
}

test.use({ viewport: { width: 390, height: 844 } });

test('PremiumBanner buy suppresses rapid duplicate Remove Ads store calls', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { removeAdsOwned: false });
  await openProfile(page);

  const buyButton = page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' });
  await dispatchRapidClicks(buyButton);

  await expectSingleStoreCall(page, 'removeAds.buy');
  await expectBusyButton(buyButton);
  await expect(page.getByLabel('Remove Ads status: Ads are disabled on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'removeAds.buy');
  expect(consoleErrors.get()).toEqual([]);
});

test('PremiumBanner buy suppresses rapid Enter keyboard purchase in-flight calls', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { removeAdsOwned: false });
  await openProfile(page);

  const buyButton = page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' });
  await dispatchRapidKeyboardActivations(page, buyButton, 'Enter');

  await expectSingleStoreCall(page, 'removeAds.buy');
  await expectBusyButton(buyButton);
  await expect(page.getByLabel('Remove Ads status: Ads are disabled on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'removeAds.buy');
  expect(consoleErrors.get()).toEqual([]);
});

test('PremiumBanner restore suppresses rapid duplicate Remove Ads store calls', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { removeAdsOwned: true });
  await openProfile(page);

  const restoreButton = page.getByRole('button', { name: 'Restore Remove Ads purchase' });
  await dispatchRapidClicks(restoreButton);

  await expectSingleStoreCall(page, 'removeAds.restore');
  await expectBusyButton(restoreButton);
  await expect(page.getByLabel('Remove Ads status: Ads are disabled on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'removeAds.restore');
  expect(consoleErrors.get()).toEqual([]);
});

test('PremiumBanner restore suppresses rapid Space keyboard purchase in-flight calls', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { removeAdsOwned: true });
  await openProfile(page);

  const restoreButton = page.getByRole('button', { name: 'Restore Remove Ads purchase' });
  await dispatchRapidKeyboardActivations(page, restoreButton, 'Space');

  await expectSingleStoreCall(page, 'removeAds.restore');
  await expectBusyButton(restoreButton);
  await expect(page.getByLabel('Remove Ads status: Ads are disabled on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'removeAds.restore');
  expect(consoleErrors.get()).toEqual([]);
});

test('ProPaywall buy suppresses rapid duplicate Pro Lifetime store calls', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { proOwned: false, removeAdsOwned: false });
  await openProfile(page);

  const buyButton = page.getByRole('button', { name: /Buy Pro.*59 SEK/ });
  await dispatchRapidClicks(buyButton);

  await expectSingleStoreCall(page, 'proLifetime.buy');
  await expectBusyButton(buyButton);
  await expect(page.getByLabel('Pro status: Pro is active on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'proLifetime.buy');
  expect(consoleErrors.get()).toEqual([]);
});

test('ProPaywall default web runtime disables mobile-app-only Pro purchases', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    windowValues: {
      __SMT_E2E__: true,
      __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
    },
  });
  await openProfile(page);

  await expect(
    page.getByText('Pro Lifetime for 59 SEK is a mobile app store purchase.'),
  ).toBeVisible();
  const proBuyButton = page.getByRole('button', { name: /Buy Pro.*59 SEK/ });
  const proRestoreButton = page.getByRole('button', { name: 'Restore Pro purchase' });

  await expect(proBuyButton).toContainText('Buy in mobile app');
  await expect(proRestoreButton).toContainText('Restore in mobile app');
  await expect(
    page.getByLabel('Pro status: Pro Lifetime can be bought or restored in the mobile app.'),
  ).toBeVisible();
  await expect(proBuyButton).toBeDisabled();
  await expect(proRestoreButton).toBeDisabled();
  expect(await purchaseCallCount(page, 'proLifetime.buy')).toBe(0);
  expect(await purchaseCallCount(page, 'proLifetime.restore')).toBe(0);
  expect(consoleErrors.get()).toEqual([]);
});

test('ProPaywall buy suppresses rapid Enter keyboard purchase in-flight calls', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { proOwned: false, removeAdsOwned: false });
  await openProfile(page);

  const buyButton = page.getByRole('button', { name: /Buy Pro.*59 SEK/ });
  await dispatchRapidKeyboardActivations(page, buyButton, 'Enter');

  await expectSingleStoreCall(page, 'proLifetime.buy');
  await expectBusyButton(buyButton);
  await expect(page.getByLabel('Pro status: Pro is active on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'proLifetime.buy');
  expect(consoleErrors.get()).toEqual([]);
});

test('ProPaywall restore suppresses rapid duplicate Pro Lifetime store calls', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { proOwned: true, removeAdsOwned: false });
  await openProfile(page);

  const restoreButton = page.getByRole('button', { name: 'Restore Pro purchase' });
  await dispatchRapidClicks(restoreButton);

  await expectSingleStoreCall(page, 'proLifetime.restore');
  await expectBusyButton(restoreButton);
  await expect(page.getByLabel('Pro status: Pro has been restored on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'proLifetime.restore');
  expect(consoleErrors.get()).toEqual([]);
});

test('ProPaywall restore suppresses rapid Space keyboard purchase in-flight calls', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);
  await seedPurchaseHarness(page, { proOwned: true, removeAdsOwned: false });
  await openProfile(page);

  const restoreButton = page.getByRole('button', { name: 'Restore Pro purchase' });
  await dispatchRapidKeyboardActivations(page, restoreButton, 'Space');

  await expectSingleStoreCall(page, 'proLifetime.restore');
  await expectBusyButton(restoreButton);
  await expect(page.getByLabel('Pro status: Pro has been restored on this device.')).toBeVisible({
    timeout: purchaseDelayMs + 5000,
  });
  await expectSingleStoreCall(page, 'proLifetime.restore');
  expect(consoleErrors.get()).toEqual([]);
});
