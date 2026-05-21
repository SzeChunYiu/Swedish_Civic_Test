import { expect, test, type Page } from '@playwright/test';
import {
  collectPageErrors,
  openStaticEbook,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

const sourceUrls = {
  uhrStudyMaterial: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  scbLandUse: 'https://www.scb.se/mi0803-en',
  riksbankHistory:
    'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  governmentNato: 'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
};

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

async function expectSafeExternalSourceLinks(page: Page, url: string) {
  const links = page.locator(`#ebook-reader a[href="${url}"]`);
  const count = await links.count();
  expect(count, `${url} should be rendered as an ebook source link`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(links.nth(index)).toHaveAttribute('target', '_blank');
    await expect(links.nth(index)).toHaveAttribute('rel', /(^|\s)noreferrer(\s|$)/);
  }
}

async function expectInternalFootnoteLinksStayInPage(page: Page) {
  const unsafeHashLinks = await page
    .locator('#ebook-reader a[href^="#ebook-fn"]')
    .evaluateAll((links) =>
      links
        .filter((link) => link.hasAttribute('target') || link.hasAttribute('rel'))
        .map((link) => link.outerHTML),
    );
  expect(unsafeHashLinks).toEqual([]);
}

async function expectEditorialNotesStayTextOnly(page: Page) {
  await expect(
    page.locator('#ebook-reader [data-source-key="editorialCommentary"] a[href^="http"]'),
  ).toHaveCount(0);
}

test('static ebook source links expose safe external-link attributes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await expectSafeExternalSourceLinks(page, sourceUrls.uhrStudyMaterial);
  await expectSafeExternalSourceLinks(page, sourceUrls.governmentNato);
  await expectInternalFootnoteLinksStayInPage(page);
  await expectEditorialNotesStayTextOnly(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=7');
  await expectSafeExternalSourceLinks(page, sourceUrls.scbLandUse);
  await expectInternalFootnoteLinksStayInPage(page);
  await expectEditorialNotesStayTextOnly(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=9');
  await expectSafeExternalSourceLinks(page, sourceUrls.riksbankHistory);
  await expectInternalFootnoteLinksStayInPage(page);
  await expectEditorialNotesStayTextOnly(page);

  expect(pageErrors).toEqual([]);
});
