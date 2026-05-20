import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { dismissBlockingModals } from './browserLaunch';

const REMOVE_ADS_PRICE = '29 SEK';
const ENGLISH_BUY_REMOVE_ADS_LABEL = `Buy Remove Ads for ${REMOVE_ADS_PRICE}`;
const SWEDISH_BUY_REMOVE_ADS_LABEL = `Köp Ta bort annonser för ${REMOVE_ADS_PRICE}`;
const SWEDISH_PLACEMENT_CTA_BODY =
  'Döljer den här och andra studieannonser efter butikens bekräftelse. Tidsatta övningsprov är redan annonsfria.';
const SWEDISH_REMOVE_ADS_TITLES = {
  learn: 'Ta bort annonser vid annons i kapitellistan',
  mistakes: 'Ta bort annonser vid annons i resultat och misstag',
  practice: 'Ta bort annonser vid annons efter övning',
} as const;

async function useEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByRole('radio', {
      name: /Byt frågespråk till Engelskt stöd|Set question language to English support/,
    })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Set question language to English support' }),
  ).toHaveAttribute('aria-checked', 'true');
}

async function useDefaultSwedishUi(page: Page) {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem('remove-ads-placement-sv-e2e-reset')) return;

    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', 'sv');
    window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
    window.sessionStorage.setItem('remove-ads-placement-sv-e2e-reset', 'true');
  });
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
  body,
  buyAccessibilityName = ENGLISH_BUY_REMOVE_ADS_LABEL,
  buyText = `Buy ${REMOVE_ADS_PRICE}`,
  ctaTitle,
  page,
}: {
  ad: Locator;
  body?: string;
  buyAccessibilityName?: string;
  buyText?: string;
  ctaTitle: string;
  page: Page;
}) {
  await ad.scrollIntoViewIfNeeded();
  await expect(ad).toBeVisible();
  await expect(page.getByText(ctaTitle)).toBeVisible();
  if (body) {
    await expect(page.getByText(body)).toBeVisible();
  }
  await expectReachableButton(page.getByRole('button', { name: buyAccessibilityName }));
  await expect(page.getByText(buyText)).toBeVisible();
}

async function revealSwedishPracticeFeedback(page: Page) {
  const nextQuestion = page.getByRole('button', { name: 'Gå till nästa övningsfråga' }).first();
  if (await nextQuestion.isVisible().catch(() => false)) return;

  await page
    .getByLabel(/Välj svaret /)
    .first()
    .click();
  await expect(nextQuestion).toBeVisible();
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
      /(Test native ad: Sponsored study placement|Inbyggd testannons: Sponsrad studieplacering)\..*(Hidden after Remove Ads is active|Döljs när Ta bort annonser är aktivt)\./i,
    ),
  ).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.getByLabel(/Hidden after Remove Ads is active\./)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('remove-ads placement CTA uses default Swedish copy and purchase flow', async ({ page }) => {
  const consoleErrors: string[] = [];

  await useDefaultSwedishUi(page);

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Studieväg')).toBeVisible();
  const learnAd = page
    .getByLabel(/Google AdMob: Annons i kapitellistan\..*Döljs när Ta bort annonser är aktivt\./i)
    .first();
  await expectPlacementCta({
    ad: learnAd,
    body: SWEDISH_PLACEMENT_CTA_BODY,
    buyAccessibilityName: SWEDISH_BUY_REMOVE_ADS_LABEL,
    buyText: `Köp ${REMOVE_ADS_PRICE}`,
    ctaTitle: SWEDISH_REMOVE_ADS_TITLES.learn,
    page,
  });

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await revealSwedishPracticeFeedback(page);
  const practiceAd = page
    .getByLabel(/Google AdMob: Annons efter övning\..*Döljs när Ta bort annonser är aktivt\./i)
    .first();
  await expectPlacementCta({
    ad: practiceAd,
    body: SWEDISH_PLACEMENT_CTA_BODY,
    buyAccessibilityName: SWEDISH_BUY_REMOVE_ADS_LABEL,
    buyText: `Köp ${REMOVE_ADS_PRICE}`,
    ctaTitle: SWEDISH_REMOVE_ADS_TITLES.practice,
    page,
  });

  await page.goto('/mistakes', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  const mistakesAd = page
    .getByLabel(
      /Inbyggd testannons: AdMob-testplacering\..*Döljs när Ta bort annonser är aktivt\./i,
    )
    .first();
  await expectPlacementCta({
    ad: mistakesAd,
    body: SWEDISH_PLACEMENT_CTA_BODY,
    buyAccessibilityName: SWEDISH_BUY_REMOVE_ADS_LABEL,
    buyText: `Köp ${REMOVE_ADS_PRICE}`,
    ctaTitle: SWEDISH_REMOVE_ADS_TITLES.mistakes,
    page,
  });

  await page.getByRole('button', { name: SWEDISH_BUY_REMOVE_ADS_LABEL }).click();

  await expect(
    page.getByLabel(
      /Inbyggd testannons: AdMob-testplacering\..*Döljs när Ta bort annonser är aktivt\./i,
    ),
  ).toHaveCount(0);
  await expect(page.getByText(SWEDISH_REMOVE_ADS_TITLES.mistakes)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWEDISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Studieväg')).toBeVisible();
  await expect(
    page.getByLabel(
      /Google AdMob: Annons i kapitellistan\..*Döljs när Ta bort annonser är aktivt\./i,
    ),
  ).toHaveCount(0);
  await expect(page.getByText(SWEDISH_REMOVE_ADS_TITLES.learn)).toHaveCount(0);

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await revealSwedishPracticeFeedback(page);
  await expect(
    page.getByLabel(/Google AdMob: Annons efter övning\..*Döljs när Ta bort annonser är aktivt\./i),
  ).toHaveCount(0);
  await expect(page.getByText(SWEDISH_REMOVE_ADS_TITLES.practice)).toHaveCount(0);

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Annonsfri studie är aktiv')).toBeVisible();
  await expect(
    page.getByLabel(
      /Google AdMob: Annons på startsidan\..*Döljs när Ta bort annonser är aktivt\./i,
    ),
  ).toHaveCount(0);
  await expect(page.getByText(`Köp ${REMOVE_ADS_PRICE}`)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWEDISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByLabel(/Döljs när Ta bort annonser är aktivt\./i)).toHaveCount(0);
  await expect(page.getByText(/Ta bort annonser vid /)).toHaveCount(0);
  await expect(page.getByRole('button', { name: SWEDISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);

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
    .getByLabel(
      /Test native ad: AdMob test placement preview\..*Hidden after Remove Ads is active\./i,
    )
    .first();
  await expectPlacementCta({
    ad: mistakesAd,
    ctaTitle: 'Remove ads near results and mistakes ad',
    page,
  });

  await page.getByRole('button', { name: 'Buy Remove Ads for 29 SEK' }).click();

  await expect(
    page.getByLabel(
      /Test native ad: AdMob test placement preview\..*Hidden after Remove Ads is active\./i,
    ),
  ).toHaveCount(0);
  await expect(page.getByText('Remove ads near results and mistakes ad')).toHaveCount(0);
  await expect(page.getByRole('button', { name: ENGLISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);

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

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Ad-free study is active')).toBeVisible();
  await expect(
    page.getByText('Purchase confirmed. Study ads are disabled on this device'),
  ).toBeVisible();
  await expect(page.getByText(/Pay 29 SEK once/)).toHaveCount(0);
  await expect(page.getByText('Buy 29 SEK')).toHaveCount(0);
  await expect(page.getByRole('button', { name: ENGLISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);
  await expectReachableButton(page.getByRole('button', { name: 'Restore Remove Ads purchase' }));

  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Ad-free study is active')).toBeVisible();
  await expect(page.getByText(/Pay 29 SEK once/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: ENGLISH_BUY_REMOVE_ADS_LABEL })).toHaveCount(0);
  await expectReachableButton(page.getByRole('button', { name: 'Restore Remove Ads purchase' }));

  expect(consoleErrors).toEqual([]);
});
