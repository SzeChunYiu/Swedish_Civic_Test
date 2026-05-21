import { expect, test, type Page } from '@playwright/test';

import { collectConsoleAndPageErrors, dismissBlockingModals } from './browserLaunch';

const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const legacyLanguageKey = 'language';
const legacySeenAboutKey = 'hasSeenAboutTheTest';
const forbiddenSwedishMockprovCopy = /mockprov|mock-provet/i;

async function seedEnglishSettingsOnce(page: Page) {
  await page.addInitScript(
    ({ languageKey, legacyLanguageKey, legacySeenKey, seenKey }) => {
      const seedMarker = 'about-test-sv-copy-seeded';
      if (window.sessionStorage.getItem(seedMarker) === 'true') return;

      window.localStorage.clear();
      window.sessionStorage.setItem(seedMarker, 'true');
      window.localStorage.setItem(legacyLanguageKey, 'en');
      window.localStorage.setItem(languageKey, 'en');
      window.localStorage.setItem(legacySeenKey, 'true');
      window.localStorage.setItem(seenKey, 'true');
    },
    {
      languageKey: settingsLanguageKey,
      legacyLanguageKey,
      legacySeenKey: legacySeenAboutKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

async function selectSwedishThroughSettings(page: Page) {
  await seedEnglishSettingsOnce(page);
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page.getByRole('radio', { name: 'Set study language to Swedish' }).click();
  await expect(page.getByRole('radio', { name: 'Byt studiespråk till Svenska' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
}

async function resetFirstRunAboutGuide(page: Page) {
  await page.evaluate(
    ({ legacySeenKey, seenKey }) => {
      window.localStorage.removeItem(legacySeenKey);
      window.localStorage.removeItem(seenKey);
      window.sessionStorage.removeItem('sct_launch_popup_first_run_deferred');
      (
        window as Window & {
          __sctLaunchPopupFirstRunDeferred?: boolean;
        }
      ).__sctLaunchPopupFirstRunDeferred = false;
    },
    { legacySeenKey: legacySeenAboutKey, seenKey: settingsSeenAboutKey },
  );
}

async function expectNoStaleSwedishMockprovCopy(page: Page) {
  await expect(page.locator('body')).not.toContainText(forbiddenSwedishMockprovCopy);
}

test.use({ viewport: { width: 390, height: 844 } });

test('about-the-test route uses Swedish settings copy without mockprov wording', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await selectSwedishThroughSettings(page);
  await page.goto('/about-the-test', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', {
      name: 'Vad är medborgarskapsprovet i samhällskunskap?',
    }),
  ).toBeVisible();
  await expect(page.getByText('övningsprov från andra aktörer')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Öppna övningsläget' })).toBeVisible();
  await expect(page.getByText('Medborgarskapsprovet är ett kunskapsprov')).toBeVisible();
  await expectNoStaleSwedishMockprovCopy(page);
  expect(consoleErrors.get()).toEqual([]);
});

test('first-run about guide follows Swedish settings copy without mockprov wording', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await selectSwedishThroughSettings(page);
  await resetFirstRunAboutGuide(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });

  const dialogs = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Vad är medborgarskapsprovet?');
  await expect(page.getByRole('heading', { name: 'Vad är medborgarskapsprovet?' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Öppna guiden om medborgarskapsprovet' }),
  ).toBeVisible();
  await expectNoStaleSwedishMockprovCopy(page);

  await page.getByRole('link', { name: 'Öppna guiden om medborgarskapsprovet' }).click();
  await expect(page).toHaveURL(/\/about-the-test$/);
  await expect(
    page.getByRole('heading', {
      name: 'Vad är medborgarskapsprovet i samhällskunskap?',
    }),
  ).toBeVisible();
  await expect(page.getByText('övningsprov från andra aktörer')).toBeVisible();
  await expectNoStaleSwedishMockprovCopy(page);
  expect(consoleErrors.get()).toEqual([]);
});
