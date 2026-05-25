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
    for (const key of ['SMT_SUPABASE_URL', 'SMT_SUPABASE_ANON_KEY'] as const) {
      Object.defineProperty(window, key, {
        configurable: true,
        get: () => '',
        set: () => undefined,
      });
    }

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
    sessionStorage.setItem('smt_anchor_closed', '1');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
}

async function seedSignedOutDashboard(page: Page) {
  await page.addInitScript(() => {
    for (const key of ['SMT_SUPABASE_URL', 'SMT_SUPABASE_ANON_KEY'] as const) {
      Object.defineProperty(window, key, {
        configurable: true,
        get: () => '',
        set: () => undefined,
      });
    }

    localStorage.setItem('smt_buddy_hidden', '1');
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_lang', 'sv');
    localStorage.removeItem('smt_signed_in');
    localStorage.removeItem('smt_account_id');
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
    sessionStorage.setItem('smt_anchor_closed', '1');
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

test('static v1.1 signed-out dashboard shows a lock shell without personal progress leakage', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await seedSignedOutDashboard(page);

  for (const hash of ['#/dashboard', '#/practice']) {
    await page.goto(`${staticSite.baseUrl}/${hash}`, { waitUntil: 'load' });

    const dashboard = page.locator('#v11-dashboard');
    await expect(dashboard).toHaveClass(/v11-dashboard--locked/);
    await expect(dashboard.locator('.v11-lock__title')).toHaveText(
      'Logga in för att låsa upp din panel',
    );
    await expect(dashboard.locator('.v11-lock__cta')).toHaveText('Logga in');
    await expect(dashboard.locator('.v11-grid')).toHaveAttribute('aria-hidden', 'true');
    await expect(dashboard.locator('.v11-weak-title')).toHaveCount(0);
    await expect(dashboard).not.toContainText(/Landet Sverige|Demokrati|Rätt 80%|80%/);
    await expect(page.locator('body')).not.toContainText(/undefined|l is not defined/i);
  }

  expect(pageErrors).toEqual([]);
});

test('static v1.1 weak chapter Practice CTA opens a chapter-filtered practice route', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await seedSignedInDashboard(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'load' });

  const weakChapterCta = page.locator('a.v11-weak-link[href^="#/practice?c="]').first();
  await expect(weakChapterCta).toBeVisible();
  await expect(weakChapterCta).not.toHaveAttribute('href', /[?&]ch=/);

  await weakChapterCta.click();
  await expect(page).toHaveURL(/#\/practice\?c=\d+/);
  await expect(page.locator('#quiz-stage .quiz__card')).toBeVisible();

  const routeContract = await page.evaluate(() => {
    const params = new URLSearchParams((location.hash.split('?')[1] || '').replace(/^#/, ''));
    const chapterId = Number(params.get('c'));
    const staticWindow = window as typeof window & {
      smtPracticeFilterFor?: () => Array<{ chapterId: number }>;
    };
    const filtered = staticWindow.smtPracticeFilterFor?.() ?? [];
    return {
      chapterId,
      questionCount: filtered.length,
      allQuestionsMatchChapter: filtered.every((question) => question.chapterId === chapterId),
    };
  });

  expect(routeContract.chapterId).toBeGreaterThan(0);
  expect(routeContract.questionCount).toBeGreaterThan(0);
  expect(routeContract.allQuestionsMatchChapter).toBe(true);
  expect(pageErrors).toEqual([]);
});
