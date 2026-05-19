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

async function openStaticEbook(page: Page, baseUrl: string, language: 'en' | 'sv', hash: string) {
  await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'load' });
  await page.evaluate((nextLanguage) => {
    localStorage.setItem('smt_lang', nextLanguage);
    const staticWindow = window as typeof window & {
      smtEbookRender?: () => void;
      smtSetLanguage?: (language: string) => void;
    };
    staticWindow.smtSetLanguage?.(nextLanguage);
    staticWindow.smtEbookRender?.();
  }, language);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('#ebook-reader .ebook__h1')).toBeVisible();
}

async function expectNoHorizontalReaderOverflow(page: Page) {
  await expect
    .poll(() =>
      page
        .locator('#ebook-reader')
        .evaluate((reader) => reader.scrollWidth <= reader.clientWidth + 1),
    )
    .toBe(true);
}

async function expectMockLinksAreReachable(page: Page) {
  const mockLinks = page.locator('#ebook-reader .ebook__study-links a[href="#/mock"]');
  const count = await mockLinks.count();
  expect(count).toBeGreaterThanOrEqual(1);

  for (let index = 0; index < count; index += 1) {
    const link = mockLinks.nth(index);
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box, `mock link ${index + 1} should have a rendered box`).not.toBeNull();
    expect(
      box!.height,
      `mock link ${index + 1} should be at least 44px high`,
    ).toBeGreaterThanOrEqual(44);
    expect(
      box!.width,
      `mock link ${index + 1} should be a reachable button target`,
    ).toBeGreaterThanOrEqual(44);
  }

  const overlappingLinks = await page
    .locator('#ebook-reader .ebook__study-links a')
    .evaluateAll((links) => {
      const boxes = links.map((link) => link.getBoundingClientRect());
      return boxes.filter((box, index) =>
        boxes.some(
          (other, otherIndex) =>
            otherIndex > index &&
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top,
        ),
      ).length;
    });
  expect(overlappingLinks).toBe(0);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static ebook mock-exam wording renders naturally in Swedish and English', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const reader = page.locator('#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'sv', '#/ebook?c=intro');
  await expect(reader).toContainText('Sakta in.');
  await expect(reader).toContainText('Avsluta veckan med ett övningsprov');
  await expect(reader.getByRole('link', { name: 'Övningsprov', exact: true })).toBeVisible();
  await expect(reader).not.toContainText(/provexempel/i);
  await expectMockLinksAreReachable(page);
  await expectNoHorizontalReaderOverflow(page);

  await openStaticEbook(page, staticSite.baseUrl, 'sv', '#/ebook?c=12');
  await expect(reader).toContainText('Kapitel 12 · Övningsprov');
  await expect(
    reader.getByRole('heading', { name: /Övningsprov.*överlevnadsguide/i }),
  ).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Starta övningsprov' })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Övningsprov', exact: true })).toBeVisible();
  await expect(reader).not.toContainText(/provexempel/i);
  await expectMockLinksAreReachable(page);
  await expectNoHorizontalReaderOverflow(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=intro');
  await expect(reader.getByRole('link', { name: 'Mock exam', exact: true })).toBeVisible();
  await expect(reader).toContainText('run a mock exam once you finish reading');
  await expectMockLinksAreReachable(page);
  await expectNoHorizontalReaderOverflow(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=12');
  await expect(reader).toContainText('Chapter 12 · Mock exam');
  await expect(reader.getByRole('heading', { name: /Mock exam.*survival guide/i })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Start mock exam' })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Mock exam', exact: true })).toBeVisible();
  await expectMockLinksAreReachable(page);
  await expectNoHorizontalReaderOverflow(page);

  expect(pageErrors).toEqual([]);
});
