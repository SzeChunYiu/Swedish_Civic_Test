import { expect, test, type Page } from '@playwright/test';

import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

async function seedSignedInDashboard(page: Page) {
  await page.addInitScript(() => {
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    localStorage.setItem('smt_buddy_hidden', '1');
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_lang', 'sv');
    localStorage.setItem('smt_signed_in', '1');
    localStorage.setItem(
      'smt_progress',
      JSON.stringify({
        ch1: { answered: 30, correct: 24 },
        ch2: { answered: 6, correct: 2 },
      }),
    );
    localStorage.setItem(
      'smt_mocks',
      JSON.stringify([{ correct: 32, pct: 80, t: Date.now(), total: 40 }]),
    );
    localStorage.setItem(
      'smt_streak',
      JSON.stringify({
        activeDays: [todayKey],
        answeredThisWeek: 36,
        days: 1,
        lastDate: todayKey,
      }),
    );
    localStorage.setItem(
      'smt_freeze',
      JSON.stringify({
        available: 1,
        lastEarnedWeek: todayKey,
        lifetimeSpent: 0,
        rescuedDays: [],
      }),
    );
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
}

test('static v1.1 dashboard weak chapters render on home and dashboard without page errors', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await seedSignedInDashboard(page);

  for (const hash of ['#/', '#/dashboard']) {
    await page.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'load' });

    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.isArray((window as typeof window & { SMT_QUESTIONS?: unknown[] }).SMT_QUESTIONS),
        ),
      )
      .toBe(true);
    await expect(page.locator('#v11-dashboard .v11-card--weak')).toBeAttached();
  }

  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'load' });
  const weakTitles = page.locator('#v11-dashboard .v11-weak-title');
  await expect(weakTitles.first()).toBeVisible();
  await expect
    .poll(async () => {
      const titles = (await weakTitles.allTextContents()).map((title) => title.trim());
      return titles.length > 0 && titles.every((title) => title.length > 0);
    })
    .toBe(true);
  await expect(page.locator('#v11-dashboard')).not.toContainText(/undefined|l is not defined/i);
  expect(pageErrors).toEqual([]);
});
