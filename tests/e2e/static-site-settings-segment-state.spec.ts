import { expect, test, type Page } from '@playwright/test';
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

function sanitizedIndexHtml() {
  return fs
    .readFileSync(path.join(siteRoot, 'index.html'), 'utf8')
    .replace(/\s*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.[^>]+>\s*/g, '\n')
    .replace(
      /\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]+rel="stylesheet"\s*\/>\s*/g,
      '\n',
    )
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

async function openSettings(page: Page, baseUrl?: string) {
  if (baseUrl) {
    await page.addInitScript(() => {
      localStorage.removeItem('smt_consent');
      localStorage.setItem('smt_buddy_hidden', '1');
    });
    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.locator('#consent').evaluate((node) => {
      (node as HTMLElement).hidden = true;
    });
  }
  await page.locator('#settings-open').click();
  await expect(page.locator('#settings-modal')).toBeVisible();
}

async function expectPressed(page: Page, selector: string, pressed: boolean) {
  await expect(page.locator(selector)).toHaveAttribute('aria-pressed', pressed ? 'true' : 'false');
}

async function expectVisualStateMirrorsAriaPressed(page: Page) {
  const mismatches = await page.locator('#settings-modal').evaluate(() =>
    Array.from(
      document.querySelectorAll(
        '.set-segment button[data-val], .set-palette, #buddy-picker .buddy-card',
      ),
    )
      .map((button) => ({
        isOn: button.classList.contains('is-on'),
        pressed: button.getAttribute('aria-pressed'),
        value: button.getAttribute('data-val') || button.getAttribute('data-buddy') || '',
      }))
      .filter((button) => button.pressed !== (button.isOn ? 'true' : 'false')),
  );

  expect(mismatches).toEqual([]);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Settings selected controls mirror aria-pressed state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openSettings(page, staticSite.baseUrl);

  await expectPressed(page, '[data-set="theme"] button[data-val="auto"]', true);
  await page.locator('[data-set="theme"] button[data-val="dark"]').click();
  await expectPressed(page, '[data-set="theme"] button[data-val="dark"]', true);
  await expectPressed(page, '[data-set="theme"] button[data-val="auto"]', false);

  await expectPressed(page, '.set-palette[data-val="flag"]', true);
  await page.locator('.set-palette[data-val="midsommar"]').click();
  await expectPressed(page, '.set-palette[data-val="midsommar"]', true);
  await expectPressed(page, '.set-palette[data-val="flag"]', false);

  await expectPressed(page, '[data-set="language"] button[data-val="en"]', true);
  await page.locator('[data-set="language"] button[data-val="sv"]').click();
  await expectPressed(page, '[data-set="language"] button[data-val="sv"]', true);
  await expectPressed(page, '[data-set="language"] button[data-val="en"]', false);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');

  await expectPressed(page, '[data-set="textsize"] button[data-val="100"]', true);
  await page.locator('[data-set="textsize"] button[data-val="115"]').click();
  await expectPressed(page, '[data-set="textsize"] button[data-val="115"]', true);
  await expectPressed(page, '[data-set="textsize"] button[data-val="100"]', false);

  const buddyCards = page.locator('#buddy-picker .buddy-card');
  await expect(buddyCards.first()).toBeVisible();
  expect(await buddyCards.count()).toBeGreaterThan(1);
  await expect(buddyCards.first()).toHaveAttribute('aria-pressed', 'true');
  await buddyCards.nth(1).click();
  await expect(buddyCards.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(buddyCards.first()).toHaveAttribute('aria-pressed', 'false');

  await expectVisualStateMirrorsAriaPressed(page);

  await page.reload({ waitUntil: 'load' });
  await openSettings(page);
  await expectPressed(page, '[data-set="theme"] button[data-val="dark"]', true);
  await expectPressed(page, '.set-palette[data-val="midsommar"]', true);
  await expectPressed(page, '[data-set="language"] button[data-val="sv"]', true);
  await expectPressed(page, '[data-set="textsize"] button[data-val="115"]', true);
  await expect(buddyCards.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expectVisualStateMirrorsAriaPressed(page);

  expect(pageErrors).toEqual([]);
});

test('static Settings normalizes corrupt text size preferences', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await page.addInitScript(() => {
    localStorage.setItem('smt_textsize', '2500');
  });
  await openSettings(page, staticSite.baseUrl);

  await expect(page.locator('html')).toHaveCSS('font-size', '16px');
  await expectPressed(page, '[data-set="textsize"] button[data-val="100"]', true);
  await expectPressed(page, '[data-set="textsize"] button[data-val="90"]', false);
  await expectPressed(page, '[data-set="textsize"] button[data-val="115"]', false);
  await expect(page.locator('[data-set="textsize"] button[aria-pressed="true"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('smt_textsize'))).toBe('100');

  await page.locator('[data-set="textsize"] button[data-val="90"]').click();
  await expect(page.locator('html')).toHaveCSS('font-size', '14.4px');
  await expectPressed(page, '[data-set="textsize"] button[data-val="90"]', true);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('smt_textsize'))).toBe('90');

  expect(pageErrors).toEqual([]);
});
