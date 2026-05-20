import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
} from './browserLaunch';

const legacyLanguageKey = 'language';
const settingsLanguageKey = 'settings\\language';

async function seedLanguage(page: Page, language: 'sv' | 'en') {
  await page.addInitScript(
    ({
      currentLanguage,
      legacyKey,
      settingsKey,
    }: {
      currentLanguage: 'sv' | 'en';
      legacyKey: string;
      settingsKey: string;
    }) => {
      window.localStorage.setItem(legacyKey, currentLanguage);
      window.localStorage.setItem(settingsKey, currentLanguage);
    },
    { currentLanguage: language, legacyKey: legacyLanguageKey, settingsKey: settingsLanguageKey },
  );
}

async function expectStoredLanguage(page: Page, language: 'sv' | 'en') {
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsLanguageKey))
    .toBe(language);
}

test('disabled language rows stay inert while available rows update the picker', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedLanguage(page, 'sv');
  await markAboutTheTestSeen(page);
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const swedishTrigger = page.getByRole('button', {
    name: 'Nuvarande språk SV. Öppna språkväljaren.',
  });
  await expect(swedishTrigger).toBeVisible();
  await expectStoredLanguage(page, 'sv');

  await swedishTrigger.click();
  const swedishMenu = page.getByRole('menu', { name: 'Språkväljare' });
  await expect(swedishMenu).toBeVisible();
  await expect(swedishTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Swedish' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  for (const name of ['Arabic, kommer snart', 'Persian, kommer snart']) {
    const row = page.getByRole('menuitem', { name });
    await expect(row).toHaveAttribute('aria-disabled', 'true');
    await expect(row).toHaveAttribute('aria-selected', 'false');
    await row.click({ force: true });
    await expect(swedishMenu).toBeVisible();
    await expect(swedishTrigger).toHaveAttribute('aria-expanded', 'true');
    await expectStoredLanguage(page, 'sv');
  }

  await page.getByRole('menuitem', { name: 'English' }).click();
  await expect(swedishMenu).toHaveCount(0);
  const englishTrigger = page.getByRole('button', {
    name: 'Current language EN. Open language picker.',
  });
  await expect(englishTrigger).toBeVisible();
  await expect(englishTrigger).toHaveAttribute('aria-expanded', 'false');
  await expectStoredLanguage(page, 'en');

  await englishTrigger.click();
  const englishMenu = page.getByRole('menu', { name: 'Language picker' });
  await expect(englishMenu).toBeVisible();
  await page.getByRole('menuitem', { name: 'Swedish' }).click();
  await expect(englishMenu).toHaveCount(0);
  await expect(swedishTrigger).toBeVisible();
  await expect(swedishTrigger).toHaveAttribute('aria-expanded', 'false');
  await expectStoredLanguage(page, 'sv');

  expect(errors.get()).toEqual([]);
});
