import { expect, test, type Page } from '@playwright/test';
import { setStaticSiteLanguage, startStaticSiteServer, type StaticSite } from './staticSiteServer';

const googleFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function isGoogleFontRequest(url: string) {
  return googleFontHosts.has(new URL(url).hostname);
}

async function trapExternalRequests(
  page: Page,
  allowedOrigin: string,
  googleFontRequests: string[],
) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const parsedUrl = new URL(url);

    if (isGoogleFontRequest(url)) {
      googleFontRequests.push(url);
      await route.abort('blockedbyclient');
      return;
    }

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

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripExternalScripts: false });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static site first load and necessary-only consent do not request Google Fonts', async ({
  page,
}) => {
  const googleFontRequests: string[] = [];
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, googleFontRequests);

  await page.goto(staticSite.baseUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#consent')).toBeVisible();
  expect(googleFontRequests).toEqual([]);

  await page.locator('#consent-min').click();
  await page.waitForTimeout(250);
  expect(googleFontRequests).toEqual([]);
});

test('static system font fallback keeps primary routes inside mobile and desktop viewports', async ({
  page,
}) => {
  const routeHashes = ['#/', '#/practice', '#/mock', '#/ebook', '#/privacy', '#/support'];
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);

  for (const viewport of [
    { height: 844, width: 390 },
    { height: 900, width: 1280 },
  ]) {
    await page.setViewportSize(viewport);

    for (const hash of routeHashes) {
      await page.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#consent').evaluate((node) => {
        (node as HTMLElement).hidden = true;
      });
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('main.is-active')).toBeVisible();
    }
  }
});

test('privacy route renders localized plain-language callout labels', async ({ page }) => {
  await seedStaticPrivacyRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);

  await page.goto(`${staticSite.baseUrl}/#/privacy`, { waitUntil: 'domcontentloaded' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });

  await expect(page.getByText('In plain English:', { exact: true })).toBeVisible();
  await expect(page.getByText('In plain Swedish:', { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await setStaticSiteLanguage(page, 'sv');
  await expect(page.getByText('På klarspråk:', { exact: true })).toBeVisible();
  await expect(page.getByText('In plain English:', { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
