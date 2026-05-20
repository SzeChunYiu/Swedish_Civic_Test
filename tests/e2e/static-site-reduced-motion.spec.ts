import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, startStaticSiteServer, type StaticSite } from './staticSiteServer';

type StaticFx = {
  burst: (x: number, y: number, opts?: { count?: number }) => void;
  countUp: (el: HTMLElement, from: number, to: number, duration?: number) => void;
  floatPlus: (x: number, y: number) => void;
  prefersReducedMotion: () => boolean;
  rain: (opts?: { count?: number }) => void;
  toast: (message: string, opts?: { duration?: number }) => void;
};

type StaticWindow = Window &
  typeof globalThis & {
    smtFx?: StaticFx;
  };

async function seedStaticSite(page: Page, motionSetting: 'reduce' | '' | null) {
  await page.addInitScript((setting) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
    if (setting !== null) window.localStorage.setItem('smt_motion', setting);
  }, motionSetting);
}

async function hideConsentBanner(page: Page) {
  await page.locator('#consent').evaluate((node) => {
    (node as HTMLElement).hidden = true;
  });
}

async function runFxProbe(page: Page) {
  return page.evaluate(() => {
    const fx = (window as StaticWindow).smtFx;
    if (!fx) throw new Error('smtFx was not loaded');
    const originalRaf = window.requestAnimationFrame.bind(window);
    let rafCalls = 0;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      rafCalls += 1;
      return originalRaf(callback);
    }) as typeof window.requestAnimationFrame;

    fx.burst(120, 120, { count: 5 });
    fx.rain({ count: 5 });
    fx.floatPlus(120, 120);
    const score = document.createElement('span');
    score.id = 'e2e-score';
    score.textContent = '0';
    document.body.appendChild(score);
    fx.countUp(score, 0, 7, 1000);
    fx.toast('Static toast', { duration: 1000 });
    window.requestAnimationFrame = originalRaf;

    return {
      confettiCount: document.querySelectorAll('.smt-confetti').length,
      layerPresent: Boolean(document.getElementById('smt-fx-layer')),
      rafCalls,
      reduced: fx.prefersReducedMotion(),
      score: score.textContent,
      toastText: document.getElementById('smt-toast-host')?.textContent ?? '',
    };
  });
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer({ stripGoogleFonts: true });
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Reduce motion setting suppresses decorative effects but keeps immediate feedback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const pageErrors = collectPageErrors(page);
  await seedStaticSite(page, 'reduce');
  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await hideConsentBanner(page);

  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await expect(page.locator('#settings-open')).toBeVisible();

  const reducedProbe = await runFxProbe(page);
  expect(reducedProbe).toMatchObject({
    confettiCount: 0,
    layerPresent: false,
    rafCalls: 0,
    reduced: true,
    score: '7',
  });
  expect(reducedProbe.toastText).toContain('Static toast');

  await page.keyboard.type('snow');
  await expect(page.locator('#smt-snow')).toHaveCount(0);
  await expect(page.locator('#smt-toast-host')).toContainText('Snow');
  await page.keyboard.type('vasa');
  await expect(page.locator('#smt-vasa')).toHaveCount(0);

  await page.locator('#settings-open').click();
  const motionSwitch = page.locator('#settings-modal input[type=checkbox][data-set="motion"]');
  await expect(motionSwitch).toBeChecked();
  await motionSwitch.setChecked(false, { force: true });

  await expect(motionSwitch).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-motion', '');
  const toggledState = await page.evaluate(() => {
    const fx = (window as StaticWindow).smtFx;
    document.getElementById('smt-fx-layer')?.remove();
    fx?.burst(120, 120, { count: 4 });
    return {
      confettiCount: document.querySelectorAll('.smt-confetti').length,
      reduced: fx?.prefersReducedMotion(),
      storedMotion: window.localStorage.getItem('smt_motion'),
    };
  });

  expect(toggledState).toEqual({
    confettiCount: 4,
    reduced: false,
    storedMotion: '',
  });
  expect(pageErrors).toEqual([]);
});

test('static prefers-reduced-motion suppresses effects on first load without saved smt_motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors = collectPageErrors(page);
  await seedStaticSite(page, null);
  await page.goto(staticSite.baseUrl, { waitUntil: 'load' });
  await hideConsentBanner(page);

  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  const reducedProbe = await runFxProbe(page);

  expect(reducedProbe).toMatchObject({
    confettiCount: 0,
    layerPresent: false,
    rafCalls: 0,
    reduced: true,
    score: '7',
  });
  expect(await page.evaluate(() => window.localStorage.getItem('smt_motion'))).toBeNull();
  expect(pageErrors).toEqual([]);
});
