import { expect, type Page } from '@playwright/test';
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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

export type StaticSite = {
  baseUrl: string;
  close: () => Promise<void>;
};

export type StaticSiteLanguage = 'en' | 'sv';

export type StaticSiteServerOptions = {
  stripExternalScripts?: boolean;
  stripGoogleFonts?: boolean;
};

function sanitizedIndexHtml(options: StaticSiteServerOptions = {}) {
  let html = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');

  if (options.stripGoogleFonts) {
    html = html
      .replace(/\s*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.[^>]+>\s*/g, '\n')
      .replace(
        /\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]+rel="stylesheet"\s*\/>\s*/g,
        '\n',
      );
  }

  if (options.stripExternalScripts !== false) {
    html = html
      .replace(/\s*<script[\s\S]*?src="https:\/\/unpkg\.com\/[\s\S]*?<\/script>\s*/g, '\n')
      .replace(/\s*<script\s+type="text\/babel"\s+src="[^"]+"><\/script>\s*/g, '\n');
  }

  return html;
}

export async function startStaticSiteServer(
  options: StaticSiteServerOptions = {},
): Promise<StaticSite> {
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
      filePath.endsWith('index.html') ? sanitizedIndexHtml(options) : fs.readFileSync(filePath),
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

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export async function setStaticSiteLanguage(page: Page, language: StaticSiteLanguage) {
  await page.evaluate((nextLanguage) => {
    localStorage.setItem('smt_lang', nextLanguage);
    const staticWindow = window as typeof window & {
      smtSetLanguage?: (language: string) => void;
    };
    staticWindow.smtSetLanguage?.(nextLanguage);
  }, language);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
}

export async function openStaticPage(
  page: Page,
  baseUrl: string,
  language: StaticSiteLanguage,
  hash = '#/',
) {
  await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_buddy_hidden', '1');
  });
  await setStaticSiteLanguage(page, language);
}

export async function openStaticEbook(
  page: Page,
  baseUrl: string,
  language: StaticSiteLanguage,
  hash: string,
) {
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

export async function expectNoHorizontalOverflow(page: Page, label: string) {
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

export async function expectElementNoHorizontalOverflow(page: Page, selector: string) {
  await expect
    .poll(() =>
      page.locator(selector).evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    )
    .toBe(true);
}
