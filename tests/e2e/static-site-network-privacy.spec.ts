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
const autoAdSenseCopy = {
  en: {
    consent: /Google AdSense can set cookies after you choose/i,
    summary: /website uses Google AdSense auto ads after your cookie choice/i,
    web: /uses Google AdSense auto ads after your cookie choice[\s\S]*Manual in-content panels in Practice and Ebook stay as reserved spaces until reviewed slot IDs are configured/i,
  },
  sv: {
    consent: /Google AdSense kan sätta cookies efter ditt val/i,
    summary: /webbplatsen använder automatiska Google AdSense-annonser efter ditt cookieval/i,
    web: /använder automatiska Google AdSense-annonser efter ditt cookieval[\s\S]*Manuella annonsytor i övning och e-bok visas som reserverade ytor tills granskade annonsplats-ID:n är konfigurerade/i,
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

async function expectAdSenseWaitsForConsent(page: Page) {
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

function expectNoUnexpectedExternalRequests(unexpectedExternalRequests: string[]) {
  expect(
    unexpectedExternalRequests,
    'privacy checks should not hide blocked third-party requests',
  ).toEqual([]);
}

async function expectAutoAdSenseCopy(page: Page, language: keyof typeof autoAdSenseCopy) {
  const copy = autoAdSenseCopy[language];
  const privacyPage = page.locator('[data-page="/privacy"].is-active');
  const consent = page.locator('#consent');

  await expect(privacyPage.locator('[data-i18n="privacy.s5.p"]')).toContainText(copy.summary);
  await expect(privacyPage.locator('[data-i18n="privacy.s5.web.p"]')).toContainText(copy.web);
  await expect(consent.locator('[data-i18n="consent.body"]')).toContainText(copy.consent);

  await expectAdSenseWaitsForConsent(page);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripExternalScripts: false });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('privacy route renders localized plain-language callout labels', async ({ page }) => {
  const unexpectedExternalRequests: string[] = [];
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, {
    unexpectedExternalRequests,
  });

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
  expectNoUnexpectedExternalRequests(unexpectedExternalRequests);
});

test('privacy and consent copy describe AdSense auto ads in both languages', async ({ page }) => {
  const unexpectedExternalRequests: string[] = [];
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, {
    unexpectedExternalRequests,
  });

  await page.goto(`${staticSite.baseUrl}/#/privacy`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-page="/privacy"].is-active')).toBeVisible();
  await expect(page.locator('#consent')).toBeVisible();

  await expectAutoAdSenseCopy(page, 'en');
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);

  await setStaticSiteLanguage(page, 'sv');
  await expectAutoAdSenseCopy(page, 'sv');
  await expectNoVisibleInternalMonetizationCopy(page);
  await expectNoHorizontalOverflow(page);
  expectNoUnexpectedExternalRequests(unexpectedExternalRequests);
});
