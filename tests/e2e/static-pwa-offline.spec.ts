import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

async function seedStaticPwaRun(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_buddy_hidden', '1');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
}

async function waitForServiceWorkerControl(page: Page) {
  await expect.poll(() => page.evaluate(() => Boolean('serviceWorker' in navigator))).toBe(true);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
}

async function cachedStaticPaths(page: Page) {
  return page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const requests = (
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          return cache.keys();
        }),
      )
    ).flat();

    return requests
      .map((request) => new URL(request.url).pathname.replace(/^\//, ''))
      .sort((left, right) => left.localeCompare(right));
  });
}

async function expectOfflineRoute(
  page: Page,
  context: BrowserContext,
  staticSite: StaticSite,
  hash: string,
  activePage: string,
) {
  await context.setOffline(true);
  try {
    await page.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(`main[data-page="${activePage}"].is-active`)).toBeVisible();
    await expectNoHorizontalOverflow(page, hash);
  } finally {
    await context.setOffline(false);
  }
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripExternalScripts: false });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static PWA shell installs and reloads core study routes offline', async ({
  context,
  page,
}) => {
  await seedStaticPwaRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);

  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await waitForServiceWorkerControl(page);

  const pwaState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifestResponse = await fetch('manifest.webmanifest');
    const cacheNames = await caches.keys();
    return {
      cacheNames,
      manifest: await manifestResponse.json(),
      scriptUrl: registration.active?.scriptURL ?? '',
    };
  });

  expect(pwaState.scriptUrl).toContain('/sw.js');
  expect(pwaState.manifest.display).toBe('standalone');
  expect(pwaState.manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
    'icons/pwa-icon-192.png',
    'icons/pwa-icon-512.png',
    'icons/pwa-maskable-512.png',
  ]);
  expect(
    pwaState.cacheNames.some((cacheName: string) => cacheName.startsWith('almost-swedish-static-')),
  ).toBe(true);

  for (const [hash, activePage] of [
    ['#/', '/'],
    ['#/practice', '/practice'],
    ['#/mock', '/mock'],
    ['#/dashboard', '/dashboard'],
  ] as const) {
    await expectOfflineRoute(page, context, staticSite, hash, activePage);
  }
});

test('static PWA caches lazy ebook route bundles only after route demand', async ({
  context,
  page,
}) => {
  await seedStaticPwaRun(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin, []);

  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await waitForServiceWorkerControl(page);

  const installCachedPaths = await cachedStaticPaths(page);
  expect(installCachedPaths).toContain('app.js');
  expect(installCachedPaths).toContain('styles.css');
  expect(installCachedPaths).not.toContain('questions.js');
  expect(installCachedPaths).not.toContain('practice.js');
  expect(installCachedPaths).not.toContain('ebook-tools.js');
  expect(installCachedPaths).not.toContain('ebook.js');

  await page.goto(`${staticSite.baseUrl}/#/ebook?c=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ebook-reader .ebook__h1')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="1"]')).toHaveClass(/is-active/);

  await expect.poll(() => cachedStaticPaths(page)).toContain('ebook-tools.js');
  await expect.poll(() => cachedStaticPaths(page)).toContain('ebook.js');

  await expectOfflineRoute(page, context, staticSite, '#/ebook?c=1', '/ebook');
  await expect(page.locator('#ebook-reader .ebook__h1')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="1"]')).toHaveClass(/is-active/);
});
