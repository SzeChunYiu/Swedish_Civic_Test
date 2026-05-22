import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

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

test('static site lazy-loads the question bank only on study-data routes', async ({ browser }) => {
  const quietPage = await browser.newPage();
  const quietQuestionBankRequests: string[] = [];
  try {
    await seedStaticNetworkRun(quietPage);
    await trapExternalRequests(quietPage, new URL(staticSite.baseUrl).origin, []);
    quietPage.on('request', (request) => {
      if (new URL(request.url()).pathname.endsWith('/questions.js')) {
        quietQuestionBankRequests.push(request.url());
      }
    });

    for (const hash of ['#/', '#/privacy', '#/terms', '#/support']) {
      await quietPage.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
      await quietPage.waitForTimeout(150);
    }

    expect(quietQuestionBankRequests).toEqual([]);
  } finally {
    await quietPage.close();
  }

  for (const hash of ['#/practice', '#/mock', '#/sources', '#/dashboard']) {
    const page = await browser.newPage();
    const questionBankRequests: string[] = [];
    try {
      await seedStaticNetworkRun(page);
      await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);
      page.on('request', (request) => {
        if (new URL(request.url()).pathname.endsWith('/questions.js')) {
          questionBankRequests.push(request.url());
        }
      });

      await page.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() =>
        Array.isArray((window as unknown as { SMT_QUESTIONS?: unknown }).SMT_QUESTIONS),
      );

      expect(questionBankRequests.length, `${hash} should request questions.js`).toBeGreaterThan(0);
    } finally {
      await page.close();
    }
  }
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
