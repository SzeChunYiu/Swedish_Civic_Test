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

async function openStaticHome(page: Page, baseUrl: string) {
  await page.addInitScript(() => {
    Math.random = () => 0.9;
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.removeItem('smt_consent');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#settings-open')).toBeVisible();
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static settings modal traps keyboard focus and restores the opener', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  const opener = page.locator('#settings-open');
  const modal = page.locator('#settings-modal');
  const closeButton = page.locator('#settings-modal .modal__close');
  const doneButton = page.locator('#settings-modal [data-close="settings"]').last();

  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(modal).toBeVisible();
  await expect(modal).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(doneButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const settingsModal = document.getElementById('settings-modal');
          return Boolean(settingsModal?.contains(document.activeElement));
        }),
      )
      .toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await doneButton.click();
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await page.locator('#reset-consent').click();
  await expect(modal).toBeHidden();
  await expect(page.locator('#consent')).toBeVisible();
  await expect(page.locator('#consent-min')).toBeFocused();

  expect(pageErrors).toEqual([]);
});
