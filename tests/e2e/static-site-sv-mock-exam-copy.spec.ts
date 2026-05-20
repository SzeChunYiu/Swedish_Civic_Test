import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const siteRoot = path.resolve('site');

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

type Language = 'en' | 'sv';

function sanitizedIndexHtml() {
  return fs
    .readFileSync(path.join(siteRoot, 'index.html'), 'utf8')
    .replace(/\s*<script[\s\S]*?src="https:\/\/unpkg\.com\/[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/\s*<script\s+type="text\/babel"\s+src="[^"]+"><\/script>\s*/g, '\n');
}

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
    response.end(
      filePath.endsWith('index.html') ? sanitizedIndexHtml() : fs.readFileSync(filePath),
    );
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

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function openStaticPage(page: Page, baseUrl: string, language: Language, hash = '#/') {
  await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'load' });
  await page.evaluate((nextLanguage) => {
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_buddy_hidden', '1');
    localStorage.setItem('smt_lang', nextLanguage);
    const staticWindow = window as typeof window & {
      smtSetLanguage?: (language: string) => void;
    };
    staticWindow.smtSetLanguage?.(nextLanguage);
  }, language);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const documentClientWidth = document.documentElement.clientWidth;
          return (
            document.body.scrollWidth <= documentClientWidth + 1 &&
            document.documentElement.scrollWidth <= documentClientWidth + 1
          );
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

async function expectReachableLink(link: Locator, label: string) {
  await link.scrollIntoViewIfNeeded();
  await expect(link, `${label} should be visible`).toBeVisible();
  const box = await link.boundingBox();
  expect(box, `${label} should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} should have width`).toBeGreaterThan(0);
  expect(box!.height, `${label} should have height`).toBeGreaterThan(0);
  expect(box!.x, `${label} should not start off-screen`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${label} should fit inside the viewport`).toBeLessThanOrEqual(390);
}

async function expectMockRouteActive(page: Page, expectedHeading: RegExp | string) {
  await expect(page).toHaveURL(/#\/mock$/);
  await expect(page.locator('[data-page="/mock"]')).toHaveClass(/is-active/);
  await expect(page.locator('#mock-stage')).toContainText(expectedHeading);
  await expectNoHorizontalOverflow(page, 'mock route');
}

async function expectMobileNavMockLink(page: Page, expectedName: string) {
  await expectNoHorizontalOverflow(page, 'closed mobile nav');
  await page.getByRole('button', { name: /Open navigation|Öppna navigering/ }).click();
  await expectNoHorizontalOverflow(page, 'open mobile nav');
  const link = page.locator('.nav a[href="#/mock"]');
  await expect(link).toHaveText(expectedName);
  await expectReachableLink(link, 'mobile nav mock-exam link');
  await link.click();
}

async function expectFooterMockLink(page: Page, expectedName: string) {
  const link = page.locator('footer a[href="#/mock"]');
  await expect(link).toHaveText(expectedName);
  await expectReachableLink(link, 'footer mock-exam link');
  await link.click();
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Swedish and English surfaces render mock-exam wording and reachable links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticPage(page, staticSite.baseUrl, 'sv');
  await expect(page.locator('.hero')).toContainText('tidsatt övningsprov');
  await expect(page.locator('.faq')).toContainText('inte kopplade till UHR');
  await expect(page.locator('.footer')).toContainText('Inofficiell. Fristående.');
  await expect(page.locator('body')).toContainText('Övningsprov');
  await expect(page.locator('body')).not.toContainText(/provexempel/i);
  await expectMobileNavMockLink(page, 'Övningsprov');
  await expectMockRouteActive(page, 'Övningsprov');

  await openStaticPage(page, staticSite.baseUrl, 'sv');
  await expectFooterMockLink(page, 'Övningsprov');
  await expectMockRouteActive(page, 'Övningsprov');

  await openStaticPage(page, staticSite.baseUrl, 'sv', '#/support');
  await expect(page.locator('[data-page="/support"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-page="/support"].is-active .doc__main')).toContainText(
    'ett övningsprov som inte går att avsluta',
  );
  await expect(page.locator('.footer')).toContainText('Inte kopplad till UHR');
  await expect(page.locator('body')).not.toContainText(/provexempel/i);
  await expectNoHorizontalOverflow(page, 'Swedish support');

  await openStaticPage(page, staticSite.baseUrl, 'en');
  await expect(page.locator('.hero')).toContainText('mock exam');
  await expect(page.locator('.faq')).toContainText('take mock exams');
  await expect(page.locator('.footer')).toContainText('Unofficial. Independent.');
  await expect(page.locator('body')).toContainText('Mock exam');
  await expect(page.locator('body')).toContainText('mock exams');
  await expectMobileNavMockLink(page, 'Mock exam');
  await expectMockRouteActive(page, 'Mock exam');

  await openStaticPage(page, staticSite.baseUrl, 'en');
  await expectFooterMockLink(page, 'Mock exam');
  await expectMockRouteActive(page, 'Mock exam');

  await openStaticPage(page, staticSite.baseUrl, 'en', '#/support');
  await expect(page.locator('[data-page="/support"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-page="/support"].is-active .doc__main')).toContainText(
    'unfinishable mock exam',
  );
  await expect(page.locator('.footer')).toContainText('Not affiliated with UHR');
  await expectNoHorizontalOverflow(page, 'English support');

  expect(pageErrors).toEqual([]);
});
