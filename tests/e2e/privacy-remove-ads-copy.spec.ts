import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type PrivacyRemoveAdsScenario = {
  adConsentCopy: RegExp[];
  adConsentSectionTitle: string;
  adsAndPurchasesCopy: RegExp[];
  backLinkLabel: string;
  forbiddenVisibleCopy: RegExp;
  language: AppLanguage;
  providerProcessingCopy: RegExp[];
  sectionTitle: string;
  title: string;
};

const englishSupportLanguageControl =
  /Byt studiespråk till Engelskt stöd|Set study language to English support/;

const scenarios: PrivacyRemoveAdsScenario[] = [
  {
    adConsentCopy: [
      /På iOS begärs App Tracking Transparency innan spårningsbaserad annonsering/i,
      /Där det krävs visas Google UMP-samtyckesformuläret innan riktiga AdMob-annonser visas/i,
      /Annonser kan blockeras eller begäras som icke-personanpassade annonser/i,
      /samtyckesbeslutet inte tillåter personanpassad annonsering/i,
    ],
    adConsentSectionTitle: 'Annonssamtycke',
    adsAndPurchasesCopy: [
      /Gratisappen finansieras med annonser på studieskärmar via Google Mobile Ads/i,
      /Tidsatta provskärmar är annonsfria/i,
      /Ta bort annonser är ett engångsköp för 29 SEK som inte förbrukas/i,
      /köpet gör att annonser inte visas på den här enheten/i,
      /kan återställas via appbutiken/i,
      /köptoken eller transaktions-id/i,
      /tidpunkten när kvittot kontrollerades/i,
    ],
    backLinkLabel: 'Tillbaka till profil',
    forbiddenVisibleCopy: /\badsDisabled\b|entitlement flag/i,
    language: 'sv',
    providerProcessingCopy: [
      /Google Mobile Ads och appbutikerna kan behandla/i,
      /annonserings-, samtyckes- och köpstatusinformation/i,
      /tillämpa Ta bort annonser och återställa köp/i,
    ],
    sectionTitle: 'Annonser och köp',
    title: 'Integritetspolicy',
  },
  {
    adConsentCopy: [
      /On iOS, App Tracking Transparency is requested before tracking-based advertising/i,
      /Where required, the Google UMP consent form is shown before real AdMob serving/i,
      /Ads may be blocked or requested as non-personalized ads/i,
      /consent decision does not allow personalized ad serving/i,
    ],
    adConsentSectionTitle: 'Ad consent',
    adsAndPurchasesCopy: [
      /The free app is ad-supported on study screens through Google Mobile Ads/i,
      /Timed mock exam screens stay ad-free/i,
      /Remove Ads is a one-time, non-consumable purchase for 29 SEK/i,
      /turns off ads on this device/i,
      /can be restored through the app store/i,
      /purchase token or transaction ID/i,
      /receipt-validation timestamp/i,
    ],
    backLinkLabel: 'Back to profile',
    forbiddenVisibleCopy: /\badsDisabled\b|entitlement flag/i,
    language: 'en',
    providerProcessingCopy: [
      /Google Mobile Ads and the app stores may process/i,
      /advertising, consent, and purchase status information/i,
      /apply Remove Ads, and restore purchases/i,
    ],
    sectionTitle: 'Ads and purchases',
    title: 'Privacy policy',
  },
];

async function expectMinimumTargetSize(locator: Locator, label: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;

          return (
            document.documentElement.scrollWidth <= viewportWidth + 1 &&
            document.body.scrollWidth <= viewportWidth + 1
          );
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

async function expectVisibleCopy(page: Page, patterns: readonly RegExp[]): Promise<void> {
  const body = page.locator('body');

  for (const pattern of patterns) {
    await expect(body).toContainText(pattern);
  }
}

async function seedOneTimeSwedishLanguageSwitchRun(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const markerKey = 'privacy-remove-ads-language-switch-seeded';
    if (window.sessionStorage.getItem(markerKey) === '1') return;

    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('language', 'sv');
    window.localStorage.setItem('settings\\language', 'sv');
    window.localStorage.setItem('hasSeenAboutTheTest', 'true');
    window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
    window.sessionStorage.setItem(markerKey, '1');
  });
}

async function expectPrivacyRouteCopy(
  page: Page,
  scenario: PrivacyRemoveAdsScenario,
): Promise<void> {
  await expect(page.getByRole('heading', { name: scenario.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: scenario.sectionTitle })).toBeVisible();
  await expect(page.getByRole('heading', { name: scenario.adConsentSectionTitle })).toBeVisible();
  await expectVisibleCopy(page, scenario.adsAndPurchasesCopy);
  await expectVisibleCopy(page, scenario.adConsentCopy);
  await expectVisibleCopy(page, scenario.providerProcessingCopy);
  await expect(page.locator('body')).not.toContainText(scenario.forbiddenVisibleCopy);

  await expectMinimumTargetSize(
    page.getByRole('link', { name: scenario.backLinkLabel }),
    `${scenario.language} privacy back link`,
  );
  await expectNoHorizontalOverflow(page, `${scenario.language} privacy route`);
}

for (const scenario of scenarios) {
  test(`/privacy renders natural Remove Ads and ad consent legal copy in ${scenario.language}`, async ({
    page,
  }) => {
    const errors = collectConsoleAndPageErrors(page);

    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await page.goto('/privacy', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expectPrivacyRouteCopy(page, scenario);

    expect(errors.get()).toEqual([]);
  });
}

test('/privacy refreshes Remove Ads and ad consent legal copy after language selection changes', async ({
  page,
}) => {
  const errors = collectConsoleAndPageErrors(page);
  const swedish = scenarios[0];
  const english = scenarios[1];

  await seedOneTimeSwedishLanguageSwitchRun(page);
  await page.goto('/privacy', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expectPrivacyRouteCopy(page, swedish);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page.getByRole('radio', { name: englishSupportLanguageControl }).click();
  await expect(page.getByRole('radio', { name: englishSupportLanguageControl })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('settings\\language')))
    .toBe('en');

  await page.goto('/privacy', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expectPrivacyRouteCopy(page, english);
  await expect(page.getByRole('heading', { name: swedish.title })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(
    /Ta bort annonser är ett engångsköp för 29 SEK/i,
  );
  await expect(page.locator('body')).not.toContainText(/Annonssamtycke/i);
  await expect(page.locator('body')).not.toContainText(/Google UMP-samtyckesformuläret/i);

  expect(errors.get()).toEqual([]);
});
