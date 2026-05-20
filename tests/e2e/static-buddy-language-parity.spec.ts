import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

declare global {
  interface Window {
    smtSetBuddy?: (id: string) => void;
    smtSetLanguage?: (language: string) => void;
  }
}

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

async function openStaticHome(page: Page, baseUrl: string, language: 'sv' | 'en') {
  await page.addInitScript((nextLanguage) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_lang', nextLanguage);
    window.localStorage.setItem('smt_buddy', 'dala');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
  }, language);

  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await page.evaluate((nextLanguage) => window.smtSetLanguage?.(nextLanguage), language);

  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('#dala-buddy')).toBeVisible();
  await expect(page.locator('#dala-figure')).toBeVisible();
}

async function setRandomSequence(page: Page, sequence: number[]) {
  await page.evaluate((values) => {
    let index = 0;
    Math.random = () => values[Math.min(index++, values.length - 1)];
  }, sequence);
}

async function selectBuddy(page: Page, id: string) {
  await page.evaluate((nextId) => window.smtSetBuddy?.(nextId), id);
  await expect(page.locator('#dala-bubble')).toBeVisible();
}

async function closeBubble(page: Page) {
  const bubble = page.locator('#dala-bubble');
  if (await bubble.isVisible().catch(() => false)) {
    await page.locator('#dala-bubble-close').click();
    await expect(bubble).toBeHidden();
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectBuddyDoesNotOverlapHeaderControls(page: Page) {
  const overlapCount = await page.evaluate(() => {
    const buddy = document.getElementById('dala-buddy')?.getBoundingClientRect();
    const controls = ['settings-open', 'nav-toggle']
      .map((id) => document.getElementById(id)?.getBoundingClientRect())
      .filter((box): box is DOMRect => Boolean(box));
    if (!buddy) return 0;

    return controls.filter(
      (box) =>
        buddy.left < box.right &&
        buddy.right > box.left &&
        buddy.top < box.bottom &&
        buddy.bottom > box.top,
    ).length;
  });

  expect(overlapCount).toBe(0);
}

async function expectBuddyCopyIsScoped(page: Page) {
  const bubbleText = await page.locator('#dala-bubble').innerText();
  expect(bubbleText).not.toMatch(/shorter answer|answer letter|tamper|switched answer/i);
  expect(bubbleText).not.toMatch(/account|konto/i);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static study buddy keeps Swedish and English copy in the active language', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const bubble = page.locator('#dala-bubble');
  const message = page.locator('#dala-msg');

  await openStaticHome(page, staticSite.baseUrl, 'sv');

  await selectBuddy(page, 'dala');
  await expect(page.locator('#dala-name')).toHaveText('Dala · Dalahästen');
  await expect(message).toContainText('Hej. Jag är Dala. Trevligt att hänga ihop.');
  await expect(message).not.toContainText('Nice to be on duty');
  await expectBuddyCopyIsScoped(page);

  await closeBubble(page);
  await setRandomSequence(page, [0.9, 0.9, 0]);
  await page.locator('#dala-figure').click();
  await expect(message).toContainText('Ta det lugnt.');
  await expect(message).not.toContainText('Pace yourself');
  await expectBuddyCopyIsScoped(page);

  await closeBubble(page);
  await setRandomSequence(page, [0.1, 0]);
  await page.locator('#dala-figure').click();
  await expect(message).toContainText('Tack. Trä uppskattar.');
  await expect(message).not.toContainText('Wood appreciates');
  await expectBuddyCopyIsScoped(page);

  await closeBubble(page);
  await setRandomSequence(page, [0.9, 0.1, 0]);
  await page.locator('#dala-figure').click();
  await expect(message).toContainText('Visste du — ');
  await expect(message).toContainText('Spotify är svenskt');
  await expect(message).not.toContainText('Did you know');
  await expectBuddyCopyIsScoped(page);

  await page.evaluate(() => {
    window.location.hash = '#/practice';
  });
  await expect(message).toContainText('Dala säger: tio frågor, inget straff för fel.');
  await expect(message).not.toContainText('Dala says');
  await expectBuddyCopyIsScoped(page);
  await expectBuddyDoesNotOverlapHeaderControls(page);
  await expectNoHorizontalOverflow(page);

  await page.evaluate(() => window.smtSetLanguage?.('en'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await closeBubble(page);
  await selectBuddy(page, 'kanel');
  await expect(page.locator('#dala-name')).toHaveText('Kanel · The cinnamon bun');
  await expect(message).toContainText("Hej. I'm Kanel. Nice to be on duty.");
  await expect(message).not.toContainText('Trevligt att hänga ihop');
  await expectBuddyCopyIsScoped(page);

  await closeBubble(page);
  await selectBuddy(page, 'tomte');
  await expect(page.locator('#dala-name')).toHaveText('Tomte · The Swedish gnome');
  await expect(message).toContainText("Hej. I'm Tomte. Nice to be on duty.");
  await expect(message).not.toContainText('Din pluggkompis');
  await expectBuddyCopyIsScoped(page);

  await closeBubble(page);
  await setRandomSequence(page, [0.9, 0.1, 0]);
  await page.locator('#dala-figure').click();
  await expect(message).toContainText('Psst. ');
  await expect(message).toContainText('Spotify is Swedish');
  await expect(message).not.toContainText('Visste du');
  await expectBuddyCopyIsScoped(page);

  await page.evaluate(() => {
    window.location.hash = '#/ebook';
  });
  await expect(message).toContainText('Tomte loves a quiet read.');
  await expect(message).not.toContainText('gillar en lugn läsning');
  await expectBuddyCopyIsScoped(page);
  await expectBuddyDoesNotOverlapHeaderControls(page);
  await expectNoHorizontalOverflow(page);

  await expect(bubble).toBeVisible();
  expect(pageErrors).toEqual([]);
});
