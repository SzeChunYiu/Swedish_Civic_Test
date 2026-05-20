import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const siteRoot = path.resolve('site');
const googleFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

const contentTypeByExtension: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

type StaticSite = {
  baseUrl: string;
  close: () => Promise<void>;
};

async function startStaticSiteServer(): Promise<StaticSite> {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^\.\.(?:\/|$)/, '');
    const requestedPath = path.join(siteRoot, safePath === '/' ? 'index.html' : safePath);
    const filePath =
      requestedPath.startsWith(siteRoot) &&
      fs.existsSync(requestedPath) &&
      fs.statSync(requestedPath).isFile()
        ? requestedPath
        : path.join(siteRoot, 'index.html');
    const extension = path.extname(filePath);
    response.writeHead(200, {
      'content-type': contentTypeByExtension[extension] ?? 'application/octet-stream',
    });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Static site test server did not bind to a TCP port');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

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
  staticSite = await startStaticSiteServer();
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
