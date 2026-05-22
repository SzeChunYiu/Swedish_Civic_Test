import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  expectElementNoHorizontalOverflow,
  expectNoHorizontalOverflow,
  openStaticEbook,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

test.use({ serviceWorkers: 'block' });

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static ebook reader keeps navigation, highlights, sources link, and mobile layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const reader = page.locator('#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await expect(reader.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="1"]')).toHaveClass(/is-active/);
  await expect(reader.locator('.ebook__notes')).toBeVisible();
  await expect(reader.locator('#eb-notes-list')).toBeVisible();
  await expect(reader.locator('.ebook__study-links a[href="#/sources"]')).toHaveText('Sources');
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');
  await expectNoHorizontalOverflow(page, 'ebook chapter 1');

  await reader.locator('.ebook__study-links a[href="#/sources"]').click();
  await expect(page).toHaveURL(/#\/sources$/);
  await expect(page.locator('[data-page="/sources"]')).toHaveClass(/is-active/);
  await expectNoHorizontalOverflow(page, 'sources route from ebook');

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await reader.locator('.ebook__pager a.next').click();
  await expect(page).toHaveURL(/#\/ebook\?c=2$/);
  await expect(reader.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="2"]')).toHaveClass(/is-active/);
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');
  await expectNoHorizontalOverflow(page, 'ebook chapter 2');

  expect(pageErrors).toEqual([]);
});

test('static ebook route shows a localized error when the route bundle fails to load', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/ebook.js', (route) => route.abort());

  await page.goto(`${staticSite.baseUrl}/#/ebook?c=1`, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-page="/ebook"]')).toHaveClass(/is-active/);
  await expect(page.locator('#ebook-reader .ebook__route-status')).toContainText(
    'Ebook could not load',
  );
  await expect(page.locator('#ebook-reader .ebook__route-status')).toContainText(
    'Check your connection and open the ebook again.',
  );
  await expectNoHorizontalOverflow(page, 'ebook route load failure');
});
