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

type StaticFx = {
  burst: (x: number, y: number, opts?: { count?: number }) => void;
  countUp: (el: HTMLElement, from: number, to: number, duration?: number) => void;
  floatPlus: (x: number, y: number) => void;
  prefersReducedMotion: () => boolean;
  rain: (opts?: { count?: number }) => void;
  toast: (message: string, opts?: { duration?: number }) => void;
};

type StaticWindow = Window &
  typeof globalThis & {
    smtFx?: StaticFx;
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

async function seedStaticSite(page: Page, motionSetting: 'reduce' | '' | null) {
  await page.addInitScript((setting) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
    if (setting !== null) window.localStorage.setItem('smt_motion', setting);
  }, motionSetting);
}

async function hideConsentBanner(page: Page) {
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
}

async function runFxProbe(page: Page) {
  return page.evaluate(() => {
    const fx = (window as StaticWindow).smtFx;
    if (!fx) throw new Error('smtFx was not loaded');
    const originalRaf = window.requestAnimationFrame.bind(window);
    let rafCalls = 0;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      rafCalls += 1;
      return originalRaf(callback);
    }) as typeof window.requestAnimationFrame;

    fx.burst(120, 120, { count: 5 });
    fx.rain({ count: 5 });
    fx.floatPlus(120, 120);
    const score = document.createElement('span');
    score.id = 'e2e-score';
    score.textContent = '0';
    document.body.appendChild(score);
    fx.countUp(score, 0, 7, 1000);
    fx.toast('Static toast', { duration: 1000 });
    window.requestAnimationFrame = originalRaf;

    return {
      confettiCount: document.querySelectorAll('.smt-confetti').length,
      layerPresent: Boolean(document.getElementById('smt-fx-layer')),
      rafCalls,
      reduced: fx.prefersReducedMotion(),
      score: score.textContent,
      toastText: document.getElementById('smt-toast-host')?.textContent ?? '',
    };
  });
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Reduce motion setting suppresses decorative effects but keeps immediate feedback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const pageErrors = collectPageErrors(page);
  await seedStaticSite(page, 'reduce');
  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await hideConsentBanner(page);

  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await expect(page.locator('#settings-open')).toBeVisible();

  const reducedProbe = await runFxProbe(page);
  expect(reducedProbe).toMatchObject({
    confettiCount: 0,
    layerPresent: false,
    rafCalls: 0,
    reduced: true,
    score: '7',
  });
  expect(reducedProbe.toastText).toContain('Static toast');

  await page.keyboard.type('snow');
  await expect(page.locator('#smt-snow')).toHaveCount(0);
  await expect(page.locator('#smt-toast-host')).toContainText('Snow');
  await page.keyboard.type('vasa');
  await expect(page.locator('#smt-vasa')).toHaveCount(0);

  await page.locator('#settings-open').click();
  const motionSwitch = page.locator('#settings-modal input[type=checkbox][data-set="motion"]');
  await expect(motionSwitch).toBeChecked();
  await motionSwitch.setChecked(false, { force: true });

  await expect(motionSwitch).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-motion', '');
  const toggledState = await page.evaluate(() => {
    const fx = (window as StaticWindow).smtFx;
    document.getElementById('smt-fx-layer')?.remove();
    fx?.burst(120, 120, { count: 4 });
    return {
      confettiCount: document.querySelectorAll('.smt-confetti').length,
      reduced: fx?.prefersReducedMotion(),
      storedMotion: window.localStorage.getItem('smt_motion'),
    };
  });

  expect(toggledState).toEqual({
    confettiCount: 4,
    reduced: false,
    storedMotion: '',
  });
  expect(pageErrors).toEqual([]);
});

test('static prefers-reduced-motion suppresses effects on first load without saved smt_motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors = collectPageErrors(page);
  await seedStaticSite(page, null);
  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await hideConsentBanner(page);

  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  const reducedProbe = await runFxProbe(page);

  expect(reducedProbe).toMatchObject({
    confettiCount: 0,
    layerPresent: false,
    rafCalls: 0,
    reduced: true,
    score: '7',
  });
  expect(await page.evaluate(() => window.localStorage.getItem('smt_motion'))).toBeNull();
  expect(pageErrors).toEqual([]);
});
