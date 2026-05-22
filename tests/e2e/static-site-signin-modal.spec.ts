import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

async function openStaticHome(page: Page, baseUrl: string) {
  await page.addInitScript(() => {
    localStorage.setItem('smt_buddy_hidden', '1');
    localStorage.setItem('smt_consent', 'min');
    localStorage.setItem('smt_lang', 'en');
    sessionStorage.setItem('smt_buddy_greeted', '1');
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#signin-open')).toBeVisible();
}

async function setStaticLanguage(page: Page, language: string) {
  await page.evaluate((nextLanguage) => {
    const staticWindow = window as typeof window & {
      smtSetLanguage?: (language: string) => void;
    };
    staticWindow.smtSetLanguage?.(nextLanguage);
  }, language);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripGoogleFonts: true });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static sign-in email field localizes label and placeholder while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  await page.locator('#signin-open').click();
  const modal = page.locator('#signin-modal');
  const emailInput = modal.locator('.signin__input');

  await expect(modal).toBeVisible();
  await expect(emailInput).toHaveAttribute('aria-label', 'Email address');
  await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');

  await setStaticLanguage(page, 'sv');
  await expect(emailInput).toHaveAttribute('aria-label', 'E-postadress');
  await expect(emailInput).toHaveAttribute('placeholder', 'namn@example.com');

  await setStaticLanguage(page, 'pl');
  await expect(emailInput).toHaveAttribute('aria-label', 'Adres e-mail');
  await expect(emailInput).toHaveAttribute('placeholder', 'imie@example.com');

  expect(pageErrors).toEqual([]);
});
