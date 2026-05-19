import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });

  if (
    await closeLaunchAd
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await closeLaunchAd.first().click();
  }

  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
}

function homeBannerAd(page: Page) {
  return page.getByLabel(
    /Google AdMob: (home banner|Annons på startsidan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
  );
}

function chapterListAd(page: Page) {
  return page.getByLabel(
    /Google AdMob: (chapter list banner|Annons i kapitellistan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
  );
}

function nativeStudyAd(page: Page) {
  return page.getByLabel(
    /(Test native ad: Sponsored study placement|Inbyggd testannons: Sponsrad studieplacering)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
  );
}

test('Remove Ads purchase hides exported web ad stubs by entitlement', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(homeBannerAd(page)).toBeVisible();

  await page
    .getByRole('button', {
      name: /Buy Remove Ads for 29 SEK|Köp Ta bort annonser för 29 SEK/,
    })
    .click();

  await expect(
    page.getByLabel(
      /Remove Ads status: Ads are disabled on this device\.|Status för Ta bort annonser: Annonser är avstängda på den här enheten\./,
    ),
  ).toBeVisible();
  await expect(homeBannerAd(page)).toHaveCount(0);

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await expect(chapterListAd(page)).toHaveCount(0);

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await expect(nativeStudyAd(page)).toHaveCount(0);

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.getByLabel(/Hidden after Remove Ads is active\./)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
