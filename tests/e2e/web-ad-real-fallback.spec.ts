import { expect, test } from '@playwright/test';

import { collectConsoleAndPageErrors, dismissBlockingModals } from './browserLaunch';

const homeBannerLabel =
  /Google AdMob: (Home banner|Annons på startsidan)\. (AdMob placement active|AdMob-placering aktiv)\. (Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i;

const chapterListBannerLabel =
  /Google AdMob: (Chapter list banner|Annons i kapitellistan)\. (AdMob placement active|AdMob-placering aktiv)\. (Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i;

const practiceCompletionBannerLabel =
  /Google AdMob: (Practice completion ad|Annons efter övning)\. (AdMob placement active|AdMob-placering aktiv)\. (Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i;

const nativeFallbackLabel =
  /(Test native ad: Sponsored study placement|Inbyggd testannons: Sponsrad studieplacering)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i;

test.use({
  viewport: { width: 390, height: 844 },
});

test('real-enabled web export renders fallback ad cards and keeps exam ad-free', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(homeBannerLabel)).toBeVisible();

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(chapterListBannerLabel)).toBeVisible();

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(
      /Välj svaret I Norden i norra Europa|Select answer In the Nordic region in northern Europe/,
    )
    .click();
  await expect(page.getByLabel(practiceCompletionBannerLabel)).toBeVisible();

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(nativeFallbackLabel)).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(/Google AdMob:/i)).toHaveCount(0);
  await expect(page.getByLabel(nativeFallbackLabel)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
