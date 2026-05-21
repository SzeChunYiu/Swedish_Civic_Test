import { expect, test, type Page } from '@playwright/test';
import { setStaticSiteLanguage, startStaticSiteServer, type StaticSite } from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

const internalMonetizationCopyPatterns = [
  /\badsDisabled(?:\s*=\s*(?:true|false))?\b/i,
  /\bmonetization\.removeAds\.adsDisabled\.v\d+\b/i,
  /\bremove[_-]ads[_-]entitlement\b/i,
  /\bpurchase_fields_rejected\b/i,
  /\bentitlement flag\b/i,
];
const adSenseCurrentUseCopyPatterns = [
  /This website\s+uses\s+Google AdSense/i,
  /We use\s+Google AdSense to show/i,
  /Den h[aä]r webbplatsen anv[aä]nder\s+Google AdSense/i,
  /Vi anv[aä]nder\s+Google AdSense f[oö]r att visa/i,
];

const preparedAdSenseCopy = {
  en: {
    consent: /When reviewed web ad slots are configured, Google AdSense can set cookies/i,
    summary:
      /AdSense-ready ad slots, but they stay disabled until reviewed slot IDs are configured/i,
    web: /prepared for Google AdSense[\s\S]*does not load AdSense until reviewed web slot IDs are configured/i,
  },
  sv: {
    consent:
      /När granskade webbaserade annonsytor är konfigurerade kan Google AdSense sätta cookies/i,
    summary:
      /annonsytor förberedda för Google AdSense, men de är avstängda tills granskade annonsplats-ID:n är konfigurerade/i,
    web: /förberedd för Google AdSense[\s\S]*laddar inte AdSense förrän granskade annonsplats-ID:n är konfigurerade/i,
  },
} as const;

async function seedStaticPrivacyRun(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('smt_consent');
    localStorage.setItem('smt_buddy_hidden', '1');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      bodyScrollWidth: body.scrollWidth,
      clientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
    };
  });

  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectNoVisibleInternalMonetizationCopy(page: Page) {
  const visibleText = await page.locator('body').innerText();

  for (const pattern of internalMonetizationCopyPatterns) {
    expect(visibleText).not.toMatch(pattern);
  }
}

async function expectAdSenseSlotsRemainUnconfigured(page: Page) {
  const slotState = await page.evaluate(() =>
    Array.from(document.querySelectorAll('ins.adsbygoogle[data-smt-ad-placement]')).map((node) => ({
      client: node.getAttribute('data-ad-client'),
      placement: node.getAttribute('data-smt-ad-placement'),
      slot: node.getAttribute('data-ad-slot'),
    })),
  );

  expect(slotState).toEqual([
    { client: null, placement: 'inline', slot: null },
    { client: null, placement: 'anchor', slot: null },
  ]);
}

async function expectPreparedAdSenseCopy(page: Page, language: keyof typeof preparedAdSenseCopy) {
  const copy = preparedAdSenseCopy[language];
  const privacyPage = page.locator('[data-page="/privacy"].is-active');
  const consent = page.locator('#consent');

  await expect(privacyPage.locator('[data-i18n="privacy.s5.p"]')).toContainText(copy.summary);
  await expect(privacyPage.locator('[data-i18n="privacy.s5.web.p"]')).toContainText(copy.web);
  await expect(consent.locator('[data-i18n="consent.body"]')).toContainText(copy.consent);

  const renderedCopy = `${await privacyPage.innerText()}\n${await consent.innerText()}`;
  for (const pattern of adSenseCurrentUseCopyPatterns) {
    expect(renderedCopy).not.toMatch(pattern);
  }

  await expectAdSenseSlotsRemainUnconfigured(page);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripExternalScripts: false });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('privacy route renders localized plain-language callout labels', async ({ page }) => {
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin);

  await page.goto(`${staticSite.baseUrl}/#/privacy`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('In plain English:', { exact: true })).toBeVisible();
  await expect(page.getByText('In plain Swedish:', { exact: true })).toHaveCount(0);
  await expect(page.locator('#consent')).toBeVisible();
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);

  await setStaticSiteLanguage(page, 'sv');
  await expect(page.getByText('På klarspråk:', { exact: true })).toBeVisible();
  await expect(page.getByText('In plain English:', { exact: true })).toHaveCount(0);
  await expect(page.locator('#consent')).toBeVisible();
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);
});

test('privacy and consent copy describe unconfigured AdSense slots in both languages', async ({
  page,
}) => {
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin);

  await page.goto(`${staticSite.baseUrl}/#/privacy`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-page="/privacy"].is-active')).toBeVisible();
  await expect(page.locator('#consent')).toBeVisible();

  await expectPreparedAdSenseCopy(page, 'en');
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);

  await setStaticSiteLanguage(page, 'sv');
  await expectPreparedAdSenseCopy(page, 'sv');
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);
});
