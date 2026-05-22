import { expect, test } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static sign-in preserves a sanitized hash return route outside the Supabase redirect URL', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  await page.goto(`${staticSite.baseUrl}/#/ebook?c=ch04`, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const staticWindow = window as typeof window & {
      smtNormalizeSigninReturnRoute: (route: string) => string;
      smtSigninCaptureReturnRoute: () => string;
      smtSigninRedirectTarget: () => string | undefined;
    };
    const redirectTarget = staticWindow.smtSigninRedirectTarget();
    const capturedRoute = staticWindow.smtSigninCaptureReturnRoute();
    return {
      capturedRoute,
      invalidExternal: staticWindow.smtNormalizeSigninReturnRoute('https://evil.test/#/ebook'),
      invalidMarkup: staticWindow.smtNormalizeSigninReturnRoute('#/ebook?c=<script>'),
      invalidPath: staticWindow.smtNormalizeSigninReturnRoute('#/admin'),
      redirectedWithoutHash: redirectTarget,
      validDashboard: staticWindow.smtNormalizeSigninReturnRoute('#/dashboard'),
      validPractice: staticWindow.smtNormalizeSigninReturnRoute('#/practice?c=4'),
      validPurchaseAnchor: staticWindow.smtNormalizeSigninReturnRoute('#/#purchase-account-gate'),
    };
  });

  const returnPage = await page.context().newPage();
  const returnPageErrors = collectPageErrors(returnPage);
  await returnPage.goto(
    `${staticSite.baseUrl}/#access_token=fake-token&refresh_token=fake-refresh`,
    {
      waitUntil: 'domcontentloaded',
    },
  );
  const restored = await returnPage.evaluate(() => {
    const staticWindow = window as typeof window & {
      smtSigninRestoreReturnRoute: () => string;
    };
    const restoredRoute = staticWindow.smtSigninRestoreReturnRoute();
    return {
      restoredHash: window.location.hash,
      restoredRoute,
      storedRouteAfterRestore: localStorage.getItem('smt_signin_return_route'),
    };
  });
  await returnPage.close();

  const stalePage = await page.context().newPage();
  const stalePageErrors = collectPageErrors(stalePage);
  await stalePage.goto(
    `${staticSite.baseUrl}/#access_token=fake-token&refresh_token=fake-refresh`,
    {
      waitUntil: 'domcontentloaded',
    },
  );
  const staleRestore = await stalePage.evaluate(() => {
    const staticWindow = window as typeof window & {
      smtSigninRestoreReturnRoute: () => string;
    };
    localStorage.setItem(
      'smt_signin_return_route',
      JSON.stringify({
        route: '#/dashboard',
        storedAt: Date.now() - 31 * 60 * 1000,
      }),
    );
    const restoredRoute = staticWindow.smtSigninRestoreReturnRoute();
    return {
      restoredHash: window.location.hash,
      restoredRoute,
      storedRouteAfterRestore: localStorage.getItem('smt_signin_return_route'),
    };
  });
  await stalePage.close();

  expect(result.redirectedWithoutHash).toBe(`${staticSite.baseUrl}/`);
  expect(result.capturedRoute).toBe('#/ebook?c=ch04');
  expect(restored.restoredRoute).toBe('#/ebook?c=ch04');
  expect(restored.restoredHash).toBe('#/ebook?c=ch04');
  expect(restored.storedRouteAfterRestore).toBeNull();
  expect(staleRestore.restoredRoute).toBe('');
  expect(staleRestore.restoredHash).toBe('#access_token=fake-token&refresh_token=fake-refresh');
  expect(staleRestore.storedRouteAfterRestore).toBeNull();
  expect(result.validDashboard).toBe('#/dashboard');
  expect(result.validPractice).toBe('#/practice?c=4');
  expect(result.validPurchaseAnchor).toBe('#/#purchase-account-gate');
  expect(result.invalidPath).toBe('#/');
  expect(result.invalidExternal).toBe('#/');
  expect(result.invalidMarkup).toBe('#/');
  expect(pageErrors).toEqual([]);
  expect(returnPageErrors).toEqual([]);
  expect(stalePageErrors).toEqual([]);
});
