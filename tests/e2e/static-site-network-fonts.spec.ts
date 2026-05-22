import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

test.use({ serviceWorkers: 'block' });

async function seedStaticNetworkRun(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('smt_consent');
    localStorage.setItem('smt_buddy_hidden', '1');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
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
  await seedStaticNetworkRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, googleFontRequests);

  await page.goto(staticSite.baseUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#consent')).toBeVisible();
  expect(googleFontRequests).toEqual([]);

  await page.locator('#consent-min').click();
  await page.waitForTimeout(250);
  expect(googleFontRequests).toEqual([]);
});

test('static Home defers ebook route bundles until ebook route demand', async ({ page }) => {
  await seedStaticNetworkRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);

  await page.goto(`${staticSite.baseUrl}/#/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#consent')).toBeVisible();
  await expect(page.locator('[data-page="/"]')).toHaveClass(/is-active/);

  await expect
    .poll(() =>
      page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .map((entry) => new URL(entry.name).pathname.replace(/^\//, '')),
      ),
    )
    .not.toContain('ebook.js');
  await expect
    .poll(() =>
      page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .map((entry) => new URL(entry.name).pathname.replace(/^\//, '')),
      ),
    )
    .not.toContain('ebook-tools.js');

  await page.evaluate(() => {
    window.location.hash = '#/privacy';
  });
  await expect(page.locator('[data-page="/privacy"]')).toHaveClass(/is-active/);
  const nonEbookRouteResources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname.replace(/^\//, '')),
  );
  expect(nonEbookRouteResources).not.toContain('ebook.js');
  expect(nonEbookRouteResources).not.toContain('ebook-tools.js');

  await page.evaluate(() => {
    window.location.hash = '#/ebook?c=1';
  });
  await expect(page.locator('#ebook-reader .ebook__h1')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="1"]')).toHaveClass(/is-active/);

  const ebookRouteResources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname.replace(/^\//, '')),
  );
  expect(ebookRouteResources.filter((asset) => asset === 'ebook-tools.js')).toHaveLength(1);
  expect(ebookRouteResources.filter((asset) => asset === 'ebook.js')).toHaveLength(1);
});

test('static system font fallback keeps primary routes inside mobile and desktop viewports', async ({
  page,
}) => {
  const routeHashes = ['#/', '#/practice', '#/mock', '#/ebook', '#/privacy', '#/support'];
  await seedStaticNetworkRun(page);
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
      await expectNoHorizontalOverflow(page, hash);
      await expect(page.locator('main.is-active')).toBeVisible();
    }
  }
});
