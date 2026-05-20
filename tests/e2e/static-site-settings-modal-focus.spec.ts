import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

async function openStaticHome(page: Page, baseUrl: string) {
  await page.addInitScript(() => {
    Math.random = () => 0.9;
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.removeItem('smt_consent');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#settings-open')).toBeVisible();
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripGoogleFonts: true });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static settings modal traps keyboard focus and restores the opener', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  const opener = page.locator('#settings-open');
  const modal = page.locator('#settings-modal');
  const closeButton = page.locator('#settings-modal .modal__close');
  const doneButton = page.locator('#settings-modal [data-close="settings"]').last();

  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(modal).toBeVisible();
  await expect(modal).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(doneButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const settingsModal = document.getElementById('settings-modal');
          return Boolean(settingsModal?.contains(document.activeElement));
        }),
      )
      .toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await doneButton.click();
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await page.locator('#reset-consent').click();
  await expect(modal).toBeHidden();
  await expect(page.locator('#consent')).toBeVisible();
  await expect(page.locator('#consent-min')).toBeFocused();

  expect(pageErrors).toEqual([]);
});
