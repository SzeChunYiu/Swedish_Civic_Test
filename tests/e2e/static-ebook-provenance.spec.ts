import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  collectPageErrors,
  expectElementNoHorizontalOverflow,
  openStaticEbook,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

type EbookSourceExpectation = {
  chapterId: string;
  label: string;
  url: string;
};

const expectedExternalSources: EbookSourceExpectation[] = [
  {
    chapterId: 'intro',
    label: 'UHR public study material',
    url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  },
  {
    chapterId: '7',
    label: 'SCB land and water area statistics',
    url: 'https://www.scb.se/mi0803-en',
  },
  {
    chapterId: '9',
    label: 'Riksbank historical timeline',
    url: 'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  },
  {
    chapterId: '1',
    label: 'Government Offices NATO membership notice',
    url: 'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
  },
];

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

async function expectSafeExternalLink(link: Locator, source: EbookSourceExpectation) {
  await expect(link, `${source.label} source link should render`).toBeVisible();
  await expect(link).toHaveAttribute('href', source.url);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /(?:^|\s)noreferrer(?:\s|$)/);
}

async function expectInternalFootnoteLinksStayInPage(page: Page) {
  const footnoteReference = page.locator('#ebook-reader a[href^="#ebook-fn-"]').first();
  const footnoteBacklink = page.locator('#ebook-reader a[href^="#ebook-fnref-"]').first();

  await expect(footnoteReference).toBeVisible();
  await expect(footnoteBacklink).toBeVisible();
  expect(await footnoteReference.getAttribute('target')).toBeNull();
  expect(await footnoteReference.getAttribute('rel')).toBeNull();
  expect(await footnoteBacklink.getAttribute('target')).toBeNull();
  expect(await footnoteBacklink.getAttribute('rel')).toBeNull();
}

test('static ebook source links expose safe external-link attributes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  for (const source of expectedExternalSources) {
    await openStaticEbook(page, staticSite.baseUrl, 'en', `#/ebook?c=${source.chapterId}`);
    const link = page.locator(`#ebook-reader a[href="${source.url}"]`).first();
    await expectSafeExternalLink(link, source);
    await expectInternalFootnoteLinksStayInPage(page);
    await expectElementNoHorizontalOverflow(page, '#ebook-reader');
  }

  expect(pageErrors).toEqual([]);
});
