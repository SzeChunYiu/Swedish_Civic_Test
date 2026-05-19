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

async function openStaticHome(page: Page, baseUrl: string, language: 'en' | 'sv' = 'en') {
  await page.addInitScript((nextLanguage) => {
    Math.random = () => 0.9;
    localStorage.removeItem('smt_consent');
    if (!sessionStorage.getItem('smt_buddy_keyboard_booted')) {
      localStorage.removeItem('smt_buddy_hidden');
      sessionStorage.setItem('smt_buddy_keyboard_booted', '1');
    }
    if (!localStorage.getItem('smt_buddy')) localStorage.setItem('smt_buddy', 'dala');
    if (!localStorage.getItem('smt_lang')) localStorage.setItem('smt_lang', nextLanguage);
    sessionStorage.setItem('smt_buddy_greeted', '1');
  }, language);
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#dala-buddy')).toBeVisible();
  await expect(page.locator('#dala-figure')).toHaveAttribute('role', 'button');
  await expect(page.locator('#dala-figure')).toHaveAttribute('tabindex', '0');
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static study buddy opens from Enter and Space without page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticHome(page, staticSite.baseUrl, 'en');

  const figure = page.locator('#dala-figure');
  const bubble = page.locator('#dala-bubble');

  await figure.focus();
  const beforeSpaceScroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Space');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText(/Tap an option|Study the material|When two answers/i);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(beforeSpaceScroll);

  await page.keyboard.press('Space');
  await expect(bubble).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(bubble).toBeVisible();
  await page.locator('#dala-bubble-close').click();
  await expect(bubble).toBeHidden();

  await page.evaluate(() => {
    const staticWindow = window as typeof window & { smtBuddyHide?: () => void };
    staticWindow.smtBuddyHide?.();
  });
  await expect(page.locator('#dala-buddy')).toBeHidden();
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#dala-buddy')).toBeHidden();
  await page.evaluate(() => {
    const staticWindow = window as typeof window & { smtBuddyShow?: () => void };
    staticWindow.smtBuddyShow?.();
  });
  await expect(page.locator('#dala-buddy')).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem('smt_lang', 'sv');
  });
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#dala-name')).toContainText('Dalahästen');
  await page.locator('#dala-figure').focus();
  await page.keyboard.press('Enter');
  await expect(bubble).toBeVisible();

  expect(pageErrors).toEqual([]);
});
