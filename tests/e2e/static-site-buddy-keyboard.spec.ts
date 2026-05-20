import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

async function openStaticHome(page: Page, baseUrl: string, language: 'en' | 'sv' = 'en') {
  await page.addInitScript((nextLanguage) => {
    Math.random = () => 0.9;
    localStorage.removeItem('smt_consent');
    if (!sessionStorage.getItem('smt_buddy_keyboard_booted')) {
      localStorage.removeItem('smt_buddy_hidden');
      sessionStorage.setItem('smt_buddy_keyboard_booted', '1');
    }
    if (!localStorage.getItem('smt_buddy')) localStorage.setItem('smt_buddy', 'dala');
    if (!localStorage.getItem('smt_lang')) localStorage.setItem('smt_lang', nextLanguage);
    sessionStorage.setItem('smt_buddy_greeted', '1');
  }, language);
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#dala-buddy')).toBeVisible();
  await expect(page.locator('#dala-figure')).toHaveAttribute('role', 'button');
  await expect(page.locator('#dala-figure')).toHaveAttribute('tabindex', '0');
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static study buddy opens from Enter and Space without page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticHome(page, staticSite.baseUrl, 'en');

  const figure = page.locator('#dala-figure');
  const bubble = page.locator('#dala-bubble');

  await figure.focus();
  const beforeSpaceScroll = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Space');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText(/Tap an option|Study the material|When two answers/i);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(beforeSpaceScroll);

  await page.keyboard.press('Space');
  await expect(bubble).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(bubble).toBeVisible();
  await page.locator('#dala-bubble-close').click();
  await expect(bubble).toBeHidden();

  await page.evaluate(() => {
    const staticWindow = window as typeof window & { smtBuddyHide?: () => void };
    staticWindow.smtBuddyHide?.();
  });
  await expect(page.locator('#dala-buddy')).toBeHidden();
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#dala-buddy')).toBeHidden();
  await page.evaluate(() => {
    const staticWindow = window as typeof window & { smtBuddyShow?: () => void };
    staticWindow.smtBuddyShow?.();
  });
  await expect(page.locator('#dala-buddy')).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem('smt_lang', 'sv');
  });
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#dala-name')).toContainText('Dalahästen');
  await page.locator('#dala-figure').focus();
  await page.keyboard.press('Enter');
  await expect(bubble).toBeVisible();

  expect(pageErrors).toEqual([]);
});
