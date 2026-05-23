import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

test.use({ serviceWorkers: 'block' });

async function seedStaticNetworkRun(page: Page, language = 'en') {
  await page.addInitScript((nextLanguage) => {
    localStorage.removeItem('smt_consent');
    localStorage.setItem('smt_buddy_hidden', '1');
    localStorage.setItem('smt_lang', nextLanguage);
    sessionStorage.setItem('smt_buddy_greeted', '1');
  }, language);
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

test('static question-data routes fail closed when the lazy question bank is unavailable', async ({
  browser,
}) => {
  const failedStaticSite = await startStaticSiteServer({
    failAssetPaths: ['/questions.js'],
    stripExternalScripts: false,
  });
  const routeCases = [
    {
      hash: '#/practice?c=mix',
      missingSelector: '#quiz-stage .qopt',
      message: 'Questions could not be loaded. Refresh the page and try again.',
    },
    {
      hash: '#/mock',
      missingText: 'Start timed practice',
      message: 'Questions could not be loaded. Refresh the page and try again.',
    },
    {
      hash: '#/sources',
      missingSelector: '[data-source-claims="current-question-bank"]:visible',
      message: 'Questions could not be loaded. Refresh the page and try again.',
    },
    {
      hash: '#/dashboard',
      missingText: 'Answer more questions for a steadier local signal',
      message: 'Dashboard data could not be loaded. Refresh the page and try again.',
    },
  ];

  try {
    for (const { hash, message, missingSelector, missingText } of routeCases) {
      const page = await browser.newPage();
      const pageErrors: string[] = [];
      const questionBankRequests: string[] = [];

      try {
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await seedStaticNetworkRun(page);
        await trapExternalRequests(page, new URL(failedStaticSite.baseUrl).origin, []);
        page.on('request', (request) => {
          if (new URL(request.url()).pathname.endsWith('/questions.js')) {
            questionBankRequests.push(request.url());
          }
        });

        await page.goto(`${failedStaticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(message, { exact: true })).toBeVisible();
        expect(questionBankRequests.length, `${hash} should request questions.js`).toBeGreaterThan(
          0,
        );
        expect(pageErrors, `${hash} should not emit page errors`).toEqual([]);
        await expect
          .poll(() =>
            page.evaluate(() =>
              Array.isArray((window as unknown as { SMT_QUESTIONS?: unknown }).SMT_QUESTIONS),
            ),
          )
          .toBe(false);

        if (missingSelector) {
          await expect(page.locator(missingSelector)).toHaveCount(0);
        }
        if (missingText) {
          await expect(page.getByText(missingText, { exact: true })).toHaveCount(0);
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await failedStaticSite.close();
  }
});

test('static question-bank failure shells stay localized in an extra locale', async ({
  browser,
}) => {
  const failedStaticSite = await startStaticSiteServer({
    failAssetPaths: ['/questions.js'],
    stripExternalScripts: false,
  });
  const routeCases = [
    {
      hash: '#/practice?c=mix',
      localizedMessage: 'تعذر تحميل الأسئلة. حدّث الصفحة وحاول مرة أخرى.',
      missingSelector: '#quiz-stage .qopt',
    },
    {
      hash: '#/mock',
      localizedMessage: 'تعذر تحميل الأسئلة. حدّث الصفحة وحاول مرة أخرى.',
      missingText: 'Start timed practice',
    },
    {
      hash: '#/sources',
      localizedMessage: 'تعذر تحميل الأسئلة. حدّث الصفحة وحاول مرة أخرى.',
      missingSelector: '[data-source-claims="current-question-bank"]:visible',
    },
    {
      hash: '#/dashboard',
      localizedMessage: 'تعذر تحميل بيانات لوحة المعلومات. حدّث الصفحة وحاول مرة أخرى.',
      missingText: 'Answer more questions for a steadier local signal',
    },
  ];

  try {
    for (const { hash, localizedMessage, missingSelector, missingText } of routeCases) {
      const page = await browser.newPage();
      const pageErrors: string[] = [];
      const questionBankRequests: string[] = [];

      try {
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await seedStaticNetworkRun(page, 'ar');
        await trapExternalRequests(page, new URL(failedStaticSite.baseUrl).origin, []);
        page.on('request', (request) => {
          if (new URL(request.url()).pathname.endsWith('/questions.js')) {
            questionBankRequests.push(request.url());
          }
        });

        await page.goto(`${failedStaticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
        await expect(page.getByText(localizedMessage, { exact: true })).toBeVisible();
        await expect(
          page.getByText('Questions could not be loaded. Refresh the page and try again.', {
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          page.getByText('Dashboard data could not be loaded. Refresh the page and try again.', {
            exact: true,
          }),
        ).toHaveCount(0);
        expect(questionBankRequests.length, `${hash} should request questions.js`).toBeGreaterThan(
          0,
        );
        expect(pageErrors, `${hash} should not emit page errors`).toEqual([]);
        await expect
          .poll(() =>
            page.evaluate(() =>
              Array.isArray((window as unknown as { SMT_QUESTIONS?: unknown }).SMT_QUESTIONS),
            ),
          )
          .toBe(false);

        if (missingSelector) {
          await expect(page.locator(missingSelector)).toHaveCount(0);
        }
        if (missingText) {
          await expect(page.getByText(missingText, { exact: true })).toHaveCount(0);
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await failedStaticSite.close();
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
