import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  collectPageErrors,
  expectNoHorizontalOverflow,
  openStaticPage,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

async function expectReachableLink(link: Locator, label: string) {
  await link.scrollIntoViewIfNeeded();
  await expect(link, `${label} should be visible`).toBeVisible();
  const box = await link.boundingBox();
  expect(box, `${label} should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} should have width`).toBeGreaterThan(0);
  expect(box!.height, `${label} should have height`).toBeGreaterThan(0);
  expect(box!.x, `${label} should not start off-screen`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${label} should fit inside the viewport`).toBeLessThanOrEqual(390);
}

async function expectMockRouteActive(page: Page, expectedHeading: RegExp | string) {
  await expect(page).toHaveURL(/#\/mock$/);
  await expect(page.locator('[data-page="/mock"]')).toHaveClass(/is-active/);
  await expect(page.locator('#mock-stage')).toContainText(expectedHeading);
  await expectNoHorizontalOverflow(page, 'mock route');
}

async function expectMobileNavMockLink(page: Page, expectedName: string) {
  await expectNoHorizontalOverflow(page, 'closed mobile nav');
  await page.getByRole('button', { name: /Open navigation|Öppna navigering/ }).click();
  await expectNoHorizontalOverflow(page, 'open mobile nav');
  const link = page.locator('.nav a[href="#/mock"]');
  await expect(link).toHaveText(expectedName);
  await expectReachableLink(link, 'mobile nav mock-exam link');
  await link.click();
}

async function expectFooterMockLink(page: Page, expectedName: string) {
  const link = page.locator('footer a[href="#/mock"]');
  await expect(link).toHaveText(expectedName);
  await expectReachableLink(link, 'footer mock-exam link');
  await link.click();
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Swedish and English surfaces render mock-exam wording and reachable links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticPage(page, staticSite.baseUrl, 'sv');
  await expect(page.locator('.hero')).toContainText('tidsatt övningsprov');
  await expect(page.locator('.faq')).toContainText('inte kopplade till UHR');
  await expect(page.locator('.footer')).toContainText('Inofficiell. Fristående.');
  await expect(page.locator('body')).toContainText('Övningsprov');
  await expect(page.locator('body')).not.toContainText(/provexempel/i);
  await expectMobileNavMockLink(page, 'Övningsprov');
  await expectMockRouteActive(page, 'Övningsprov');

  await openStaticPage(page, staticSite.baseUrl, 'sv');
  await expectFooterMockLink(page, 'Övningsprov');
  await expectMockRouteActive(page, 'Övningsprov');

  await openStaticPage(page, staticSite.baseUrl, 'sv', '#/support');
  await expect(page.locator('[data-page="/support"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-page="/support"].is-active .doc__main')).toContainText(
    'ett övningsprov som inte går att avsluta',
  );
  await expect(page.locator('.footer')).toContainText('Inte kopplad till UHR');
  await expect(page.locator('body')).not.toContainText(/provexempel/i);
  await expectNoHorizontalOverflow(page, 'Swedish support');

  await openStaticPage(page, staticSite.baseUrl, 'en');
  await expect(page.locator('.hero')).toContainText('mock exam');
  await expect(page.locator('.faq')).toContainText('take mock exams');
  await expect(page.locator('.footer')).toContainText('Unofficial. Independent.');
  await expect(page.locator('body')).toContainText('Mock exam');
  await expect(page.locator('body')).toContainText('mock exams');
  await expectMobileNavMockLink(page, 'Mock exam');
  await expectMockRouteActive(page, 'Mock exam');

  await openStaticPage(page, staticSite.baseUrl, 'en');
  await expectFooterMockLink(page, 'Mock exam');
  await expectMockRouteActive(page, 'Mock exam');

  await openStaticPage(page, staticSite.baseUrl, 'en', '#/support');
  await expect(page.locator('[data-page="/support"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-page="/support"].is-active .doc__main')).toContainText(
    'unfinishable mock exam',
  );
  await expect(page.locator('.footer')).toContainText('Not affiliated with UHR');
  await expectNoHorizontalOverflow(page, 'English support');

  expect(pageErrors).toEqual([]);
});
