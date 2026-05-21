import { expect, test, type Page } from '@playwright/test';
import { setStaticSiteLanguage, startStaticSiteServer, type StaticSite } from './staticSiteServer';

const internalMonetizationCopyPatterns = [
  /\badsDisabled(?:\s*=\s*(?:true|false))?\b/i,
  /\bmonetization\.removeAds\.adsDisabled\.v\d+\b/i,
  /\bremove[_-]ads[_-]entitlement\b/i,
  /\bpurchase_fields_rejected\b/i,
  /\bentitlement flag\b/i,
];

async function trapExternalRequests(page: Page, allowedOrigin: string) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const parsedUrl = new URL(url);

    if (parsedUrl.origin !== allowedOrigin) {
      await route.abort('blockedbyclient');
      return;
    }

    await route.continue();
  });
}

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
