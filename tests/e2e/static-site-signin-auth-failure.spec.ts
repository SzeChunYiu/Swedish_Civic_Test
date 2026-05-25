import { expect, test, type Page } from '@playwright/test';

import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

async function configureHostedSupabase(page: Page, options: { seedLocalDemo?: boolean } = {}) {
  await page.addInitScript(({ seedLocalDemo }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.setItem('smt_consent', 'min');
    window.localStorage.setItem('smt_lang', 'en');
    if (seedLocalDemo) {
      window.localStorage.setItem('smt_signed_in', '1');
      window.localStorage.setItem('smt_account_id', 'local-demo');
      window.localStorage.setItem('smt_account_email', 'local-demo@example.invalid');
    }
    window.sessionStorage.setItem('smt_buddy_greeted', '1');

    Object.defineProperty(window, 'SMT_SUPABASE_URL', {
      configurable: true,
      get: () => 'https://configured-auth-outage.supabase.co',
      set: () => undefined,
    });
    Object.defineProperty(window, 'SMT_SUPABASE_ANON_KEY', {
      configurable: true,
      get: () => 'sb_publishable_configured_auth_outage',
      set: () => undefined,
    });
  }, options);
}

async function expectSignedOutFailClosed(page: Page) {
  await expect(page.locator('#signin-modal .signin__login')).toBeVisible();
  await expect(page.locator('#signin-modal .signin__account')).toBeHidden();
  await expect(page.locator('#signin-modal .signin__status')).toHaveText(
    'Sign-in is unavailable right now. Please try again later.',
  );
  await expect(page.locator('#signin-open')).toHaveText(/Sign in/);
  await expect(page.locator('#v11-dashboard')).toHaveClass(/v11-dashboard--locked/);
  await expect(page.locator('[data-purchase-kind="remove_ads"]')).toHaveAttribute(
    'data-purchase-locked',
    'true',
  );

  await expect
    .poll(() =>
      page.evaluate(() => ({
        accountEmail: window.localStorage.getItem('smt_account_email'),
        accountId: window.localStorage.getItem('smt_account_id'),
        signedIn: window.localStorage.getItem('smt_signed_in'),
      })),
    )
    .toEqual({
      accountEmail: null,
      accountId: null,
      signedIn: null,
    });
}

function unexpectedPageErrors(errors: string[]) {
  return errors.filter((message) => !/Failed to load resource: net::ERR_FAILED/.test(message));
}

test('configured Supabase SDK load failure keeps static account surfaces signed out', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await configureHostedSupabase(page);
  await page.route(/https:\/\/esm\.sh\/@supabase\/supabase-js@2.*/, (route) => route.abort());

  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'load' });
  await page.locator('#signin-open').click();
  await page.locator('#signin-modal .signin__btn[data-prov="google"]').click();

  await expectSignedOutFailClosed(page);
  expect(unexpectedPageErrors(pageErrors)).toEqual([]);
});

test('configured Supabase OAuth and magic-link rejections keep static account surfaces signed out', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await configureHostedSupabase(page);
  await page.route(/https:\/\/esm\.sh\/@supabase\/supabase-js@2.*/, (route) =>
    route.fulfill({
      body: `
export function createClient() {
  return {
    auth: {
      getSession() {
        return Promise.resolve({ data: { session: null } });
      },
      onAuthStateChange() {},
      signInWithOAuth() {
        return Promise.reject(new Error('OAuth rejected by fixture'));
      },
      signInWithOtp() {
        return Promise.reject(new Error('OTP rejected by fixture'));
      },
      signOut() {
        return Promise.resolve();
      },
    },
  };
}
`,
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );

  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'load' });
  await page.locator('#signin-open').click();
  await page.locator('#signin-modal .signin__btn[data-prov="google"]').click();
  await expectSignedOutFailClosed(page);

  await page.locator('#signin-modal .signin__input').fill('learner@example.com');
  await page.locator('#signin-modal .signin__magic').click();
  await expectSignedOutFailClosed(page);
  expect(unexpectedPageErrors(pageErrors)).toEqual([]);
});

test('configured Supabase never treats an existing local demo account as purchase-ready', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await configureHostedSupabase(page, { seedLocalDemo: true });
  await page.route(/https:\/\/esm\.sh\/@supabase\/supabase-js@2.*/, (route) => route.abort());

  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'load' });

  await expect(page.locator('#signin-open')).toHaveText(/Sign in/);
  await expect(page.locator('#v11-dashboard')).toHaveClass(/v11-dashboard--locked/);
  await expect(page.locator('[data-purchase-kind="remove_ads"]')).toHaveAttribute(
    'data-purchase-locked',
    'true',
  );
  await page.locator('#signin-open').click();
  await expect(page.locator('#signin-modal .signin__login')).toBeVisible();
  await expect(page.locator('#signin-modal .signin__account')).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        accountEmail: window.localStorage.getItem('smt_account_email'),
        accountId: window.localStorage.getItem('smt_account_id'),
        signedIn: window.localStorage.getItem('smt_signed_in'),
      })),
    )
    .toEqual({
      accountEmail: null,
      accountId: null,
      signedIn: null,
    });
  expect(unexpectedPageErrors(pageErrors)).toEqual([]);
});

test('configured Supabase hash callback boots the SDK while ordinary route hashes stay local', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await configureHostedSupabase(page);
  let sdkRequests = 0;
  await page.route(/https:\/\/esm\.sh\/@supabase\/supabase-js@2.*/, (route) => {
    sdkRequests += 1;
    return route.fulfill({
      body: `
export function createClient() {
  return {
    auth: {
      getSession() {
        const params = new URLSearchParams(globalThis.location.hash.slice(1));
        if (params.has('access_token') && params.has('refresh_token')) {
          return Promise.resolve({
            data: {
              session: {
                user: {
                  id: 'hash-callback-user',
                  email: 'hash-callback@example.test'
                }
              }
            }
          });
        }
        return Promise.resolve({ data: { session: null } });
      },
      onAuthStateChange() {},
      signInWithOAuth() {
        return Promise.resolve();
      },
      signInWithOtp() {
        return Promise.resolve();
      },
      signOut() {
        return Promise.resolve();
      },
    },
  };
}
`,
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
    });
  });

  await page.goto(`${staticSite.baseUrl}/#/dashboard`, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => sdkRequests).toBe(0);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        accountEmail: window.localStorage.getItem('smt_account_email'),
        accountId: window.localStorage.getItem('smt_account_id'),
        signedIn: window.localStorage.getItem('smt_signed_in'),
      })),
    )
    .toEqual({
      accountEmail: null,
      accountId: null,
      signedIn: null,
    });

  await page.goto(`${staticSite.baseUrl}/#access_token=fake-token&refresh_token=fake-refresh`, {
    waitUntil: 'domcontentloaded',
  });
  await expect.poll(() => sdkRequests).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        accountEmail: window.localStorage.getItem('smt_account_email'),
        accountId: window.localStorage.getItem('smt_account_id'),
        signedIn: window.localStorage.getItem('smt_signed_in'),
      })),
    )
    .toEqual({
      accountEmail: 'hash-callback@example.test',
      accountId: 'hash-callback-user',
      signedIn: '1',
    });
  await page.locator('#signin-open').click();
  await expect(page.locator('#signin-modal .signin__account')).toBeVisible();
  await expect(page.locator('#signin-modal .signin__login')).toBeHidden();
  expect(unexpectedPageErrors(pageErrors)).toEqual([]);
});
