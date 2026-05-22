import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

async function openStaticHome(page: Page, baseUrl: string, language: 'en' | 'sv' = 'en') {
  await page.addInitScript((nextLanguage) => {
    Math.random = () => 0.9;
    localStorage.setItem('smt_consent', 'min');
    if (!sessionStorage.getItem('smt_buddy_keyboard_booted')) {
      localStorage.removeItem('smt_buddy_hidden');
      sessionStorage.setItem('smt_buddy_keyboard_booted', '1');
    }
    if (!localStorage.getItem('smt_buddy')) localStorage.setItem('smt_buddy', 'dala');
    if (!localStorage.getItem('smt_lang')) localStorage.setItem('smt_lang', nextLanguage);
    sessionStorage.setItem('smt_buddy_greeted', '1');
  }, language);
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.evaluate(() => {
    const staticWindow = window as typeof window & { smtHideConsent?: () => void };
    if (typeof staticWindow.smtHideConsent === 'function') {
      staticWindow.smtHideConsent();
      return;
    }
    const consent = document.getElementById('consent');
    if (consent) consent.hidden = true;
    document.documentElement.removeAttribute('data-consent-visible');
    window.dispatchEvent(new CustomEvent('smt:consentvisibility', { detail: { visible: false } }));
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

test('static study buddy keeps public messages text-safe and preserves fact emphasis', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticHome(page, staticSite.baseUrl, 'en');

  await page.evaluate(() => {
    const staticWindow = window as typeof window & {
      smtBuddyCelebrate?: (message: unknown, fallback?: string) => void;
    };
    staticWindow.smtBuddyCelebrate?.(
      {
        en: '<img src=x onerror=alert(1)> <svg onload=alert(2)></svg> & "quoted"',
        sv: '<script>alert(3)</script>',
      },
      '<button onclick=alert(4)>fallback</button>',
    );
  });

  const message = page.locator('#dala-msg');
  await expect(page.locator('#dala-bubble')).toBeVisible();
  await expect(message).toContainText('<img src=x onerror=alert(1)>');
  await expect(message).toContainText('<svg onload=alert(2)></svg>');
  await expect(message.locator('img, svg, script, button')).toHaveCount(0);
  await expect(message.locator('[onerror], [onload], [onclick]')).toHaveCount(0);

  await page.locator('#dala-bubble-close').click();
  await expect(page.locator('#dala-bubble')).toBeHidden();

  await page.evaluate(() => {
    const randomValues = [0.9, 0.1, 0.1];
    Math.random = () => (randomValues.length ? (randomValues.shift() ?? 0.1) : 0.1);
  });
  await page.locator('#dala-figure').click();

  await expect(page.locator('#dala-bubble')).toBeVisible();
  await expect(message.locator('em')).toHaveText(/Did you know|Visste du|fact|Psst/i);
  await expect(message.locator('em')).toHaveCount(1);
  await expect(message.locator('img, svg, script, button')).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
