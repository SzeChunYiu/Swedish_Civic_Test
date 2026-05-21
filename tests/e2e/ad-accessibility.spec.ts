import { expect, test, type Locator } from '@playwright/test';

import { seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

const minimumTouchTargetPx = 44;

const launchCloseTargetRoutes = ['/home', '/profile', '/settings', '/search'] as const;

async function expectMinimumTouchTarget(locator: Locator, label: string) {
  await expect(locator, `${label} should be visible`).toBeVisible();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} target width`).toBeGreaterThanOrEqual(minimumTouchTargetPx);
  expect(box!.height, `${label} target height`).toBeGreaterThanOrEqual(minimumTouchTargetPx);
}

test('ad placements announce Remove Ads in web accessible names', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }

  await expect(
    page.getByLabel(
      /Google AdMob: (home banner|Annons på startsidan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await expect(
    page.getByLabel(
      /Google AdMob: (chapter list banner|Annons i kapitellistan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await expect(
    page.getByLabel(
      /(Test native ad: Sponsored study placement|Inbyggd testannons: Annons i resultatvyn)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.getByLabel(/Hidden after Remove Ads is active\./)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('placement Remove Ads CTA is disabled with mobile-app copy on public web', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/learn', { waitUntil: 'networkidle' });

  await expect(
    page.getByText('Remove Ads for 29 SEK is a mobile app store purchase.'),
  ).toBeVisible();
  await expect(page.getByText('Buy in mobile app')).toBeVisible();
  await expect(page.getByText('Restore in mobile app')).toBeVisible();
  await expect(
    page.getByText('Remove Ads can be bought or restored in the mobile app.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Restore Remove Ads purchase' })).toBeDisabled();

  expect(consoleErrors).toEqual([]);
});

for (const routePath of launchCloseTargetRoutes) {
  test(`launch sponsor close control keeps a 44px target on ${routePath}`, async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
    await page.goto(routePath, { waitUntil: 'networkidle' });

    const closeLaunchAd = page.getByRole('button', { name: 'Stäng startannons' });
    await expectMinimumTouchTarget(closeLaunchAd, `${routePath} launch close control`);

    await closeLaunchAd.click();
    await expect(closeLaunchAd).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
}
