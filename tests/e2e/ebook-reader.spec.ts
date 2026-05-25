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

test('static ebook reader exposes annotation controls after keyboard text selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await expect(page.locator('#ebook-reader')).toBeVisible();

  await page.evaluate(() => {
    const reader = document.querySelector('#ebook-reader');
    if (!reader) {
      throw new Error('ebook reader not found');
    }

    const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.textContent && node.textContent.trim().length > 20
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const textNode = walker.nextNode();
    if (!textNode?.textContent) {
      throw new Error('ebook text node not found');
    }

    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(textNode.textContent.length, 12));
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new Event('selectionchange'));
    document.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowRight', shiftKey: true, bubbles: true }),
    );
  });

  const popover = page.locator('.eb-pop');
  await expect(popover).toBeVisible();
  await expect(popover.locator('[data-act="hl"]')).toHaveAttribute('aria-label', 'Highlight');
  await expect(popover.locator('[data-act="note"]')).toHaveAttribute('aria-label', 'Add note');
  await expectElementNoHorizontalOverflow(page, '.eb-pop');
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
