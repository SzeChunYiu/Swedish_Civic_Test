import { expect, test } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';
import { trapExternalRequests } from './staticSiteNetworkGuards';

const docNavCases = [
  {
    route: '/privacy',
    href: '#/privacy#p3',
    heading: 'Local study progress',
    headingId: 'p3',
  },
  {
    route: '/support',
    href: '#/support#s1',
    heading: 'What we can help with',
    headingId: 's1',
  },
  {
    route: '/support',
    href: '#/support#s2',
    heading: 'What to include',
    headingId: 's2',
  },
  {
    route: '/support',
    href: '#/support#s3',
    heading: "Please don't include sensitive info",
    headingId: 's3',
  },
  {
    route: '/support',
    href: '#/support#s4',
    heading: "What we can't do",
    headingId: 's4',
  },
  {
    route: '/support',
    href: '#/support#s5',
    heading: 'Contact',
    headingId: 's5',
  },
  {
    route: '/terms',
    href: '#/terms#t3',
    heading: 'Content & accuracy',
    headingId: 't3',
  },
  {
    route: '/sources',
    href: '#/sources#src2',
    heading: 'How citations work',
    headingId: 'src2',
  },
] as const;

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripGoogleFonts: true });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('Privacy, Support, Terms, and Sources table of contents keep their hash routes active', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await trapExternalRequests(page, new URL(staticSite.baseUrl).origin);
  await page.addInitScript(() => {
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_buddy_hidden', '1');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });

  for (const item of docNavCases) {
    await page.goto(`${staticSite.baseUrl}/#${item.route}`, { waitUntil: 'domcontentloaded' });

    const activePage = page.locator(`[data-page="${item.route}"].is-active`);
    await expect(activePage).toBeVisible();

    await activePage.locator(`.doc__nav a[href="${item.href}"]`).click();

    await expect(page).toHaveURL(
      new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    );
    await expect(page.locator(`[data-page="${item.route}"].is-active`)).toBeVisible();
    await expect(page.locator('[data-page="/"].is-active')).toHaveCount(0);
    await expect(page.locator(`#${item.headingId}`)).toHaveText(item.heading);
    await expect(page.locator(`#${item.headingId}`)).toBeFocused();
  }

  expect(
    pageErrors.filter(
      (message) => !/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(message),
    ),
  ).toEqual([]);
});
