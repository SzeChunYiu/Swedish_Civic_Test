import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

type StaticWindow = Window &
  typeof globalThis & {
    smtSetLanguage?: (language: string) => void;
  };

async function seedStaticHome(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.setItem('smt_consent', 'min');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
  });
}

async function openStaticHome(page: Page, baseUrl: string) {
  await seedStaticHome(page);
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
  await expect(page.locator('#settings-open')).toBeVisible();
}

async function setStaticLanguage(page: Page, language: string) {
  await page.evaluate((nextLanguage) => {
    (window as StaticWindow).smtSetLanguage?.(nextLanguage);
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

test('static Settings modal focuses, traps focus, and restores the invoker', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  const opener = page.locator('#settings-open');
  const modal = page.locator('#settings-modal');
  const closeButton = page.locator('#settings-modal-close');
  const doneButton = page.locator('#settings-modal [data-close="settings"]').last();
  const backdrop = page.locator('#settings-modal .modal__backdrop');

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

  await backdrop.click({ position: { x: 5, y: 5 } });
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await expect(modal).toBeVisible();
  await doneButton.click();
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();

  expect(pageErrors).toEqual([]);
});

test('static Settings language changes update icon-only labels without navigating', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });

  await expect(page.locator('#settings-open')).toHaveAttribute('aria-label', 'Settings');
  await expect(page.locator('#settings-modal-close')).toHaveAttribute('aria-label', 'Close');
  await expect(page.locator('#ad-anchor-close')).toHaveAttribute('aria-label', 'Close ad');
  await expect(page.locator('#dala-bubble-close')).toHaveAttribute('aria-label', 'Close');
  await expect(page.locator('#dala-figure')).toHaveAttribute('aria-label', 'Study buddy');

  await setStaticLanguage(page, 'sv');
  await expect(page.locator('#settings-open')).toHaveAttribute('aria-label', 'Inställningar');
  await expect(page.locator('#settings-modal-close')).toHaveAttribute('aria-label', 'Stäng');
  await expect(page.locator('#ad-anchor-close')).toHaveAttribute('aria-label', 'Stäng annons');
  await expect(page.locator('#dala-bubble-close')).toHaveAttribute('aria-label', 'Stäng');
  await expect(page.locator('#dala-figure')).toHaveAttribute('aria-label', 'Studiekompis');

  await setStaticLanguage(page, 'zh-Hans');
  await expect(page.locator('#settings-open')).toHaveAttribute('aria-label', '设置');
  await expect(page.locator('#ad-anchor-close')).toHaveAttribute('aria-label', '关闭广告');
  await expect(page.locator('#dala-bubble-close')).toHaveAttribute('aria-label', '关闭');
  await expect(page.locator('#dala-figure')).toHaveAttribute('aria-label', '学习伙伴');

  await page.waitForTimeout(100);
  expect(navigations).toBe(0);
  expect(pageErrors).toEqual([]);
});

test('static prefers-reduced-motion sets root flag on first load without persisting', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors = collectPageErrors(page);
  await seedStaticHome(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem('smt_motion');
  });
  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });

  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  expect(await page.evaluate(() => window.localStorage.getItem('smt_motion'))).toBeNull();
  expect(pageErrors).toEqual([]);
});
