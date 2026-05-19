import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

async function useEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();
  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

async function expectReachableButton(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectPlacementCta({
  ad,
  ctaTitle,
  page,
}: {
  ad: Locator;
  ctaTitle: string;
  page: Page;
}) {
  await ad.scrollIntoViewIfNeeded();
  await expect(ad).toBeVisible();
  await expect(page.getByText(ctaTitle)).toBeVisible();
  await expectReachableButton(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' }));
  await expect(page.getByText('Buy 29 SEK')).toBeVisible();
}

test('ad placements announce Remove Ads in web accessible names', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByLabel(
      /Google AdMob: (home banner|Annons på startsidan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(
    page.getByLabel(
      /Google AdMob: (chapter list banner|Annons i kapitellistan)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(
    page.getByLabel(
      /(Test native ad: Sponsored study placement|Inbyggd testannons: Sponsrad studieplacering)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(/Hidden after Remove Ads is active\./)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('remove-ads placement CTA buys once and hides study ads', async ({ page }) => {
  const consoleErrors: string[] = [];

  await page.addInitScript(() => {
    if (window.sessionStorage.getItem('remove-ads-placement-e2e-reset')) return;

    window.localStorage.clear();
    window.sessionStorage.setItem('remove-ads-placement-e2e-reset', 'true');
  });

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await useEnglishSupport(page);

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  const learnAd = page
    .getByLabel(/Google AdMob: Chapter list banner\..*Hidden after Remove Ads is active\./i)
    .first();
  await expectPlacementCta({
    ad: learnAd,
    ctaTitle: 'Remove ads near chapter list banner',
    page,
  });

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Select answer /)
    .first()
    .click();
  const practiceAd = page
    .getByLabel(/Google AdMob: Practice completion ad\..*Hidden after Remove Ads is active\./i)
    .first();
  await expectPlacementCta({
    ad: practiceAd,
    ctaTitle: 'Remove ads near practice completion ad',
    page,
  });

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  const mistakesAd = page
    .getByLabel(/Test native ad: Sponsored study placement\..*Hidden after Remove Ads is active\./i)
    .first();
  await expectPlacementCta({
    ad: mistakesAd,
    ctaTitle: 'Remove ads near results and mistakes ad',
    page,
  });

  await page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' }).click();

  await expect(
    page.getByLabel(
      /Test native ad: Sponsored study placement\..*Hidden after Remove Ads is active\./i,
    ),
  ).toHaveCount(0);
  await expect(page.getByText('Remove ads near results and mistakes ad')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' })).toHaveCount(0);

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await expect(page.getByText('Learning path')).toBeVisible();
  await expect(
    page.getByLabel(/Google AdMob: Chapter list banner\..*Hidden after Remove Ads is active\./i),
  ).toHaveCount(0);
  await expect(page.getByText('Remove ads near chapter list banner')).toHaveCount(0);

  await page.goto('/practice', { waitUntil: 'networkidle' });
  const answer = page.getByLabel(/Select answer /).first();
  if ((await answer.isVisible()) && (await answer.isEnabled())) {
    await answer.click();
  }
  await expect(
    page.getByLabel(/Google AdMob: Practice completion ad\..*Hidden after Remove Ads is active\./i),
  ).toHaveCount(0);
  await expect(page.getByText('Remove ads near practice completion ad')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
