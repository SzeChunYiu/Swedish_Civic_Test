import { existsSync } from 'node:fs';

import { expect, type Page } from '@playwright/test';

import type { AppLanguage } from '../../lib/storage/settingsStore';

export type { AppLanguage };

export type BlockingModalDismissal = {
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
};

// Storage keys matching the web MMKV keys plus the legacy localStorage keys
// that older tests used before settings moved behind the "settings" store id.
const legacySettingsLanguageKey = 'language';
const legacySettingsSeenAboutKey = 'hasSeenAboutTheTest';
const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';

// Selector for modal overlays that block route screenshots in the rendered app.
export const blockingModalOverlayLocator =
  '[role="dialog"][aria-modal="true"], [role="menu"][aria-modal="true"]';

const SYSTEM_CHROMIUM_EXECUTABLES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((candidate): candidate is string => Boolean(candidate));

export type ChromiumLaunchOptions = {
  executablePath?: string;
};

export function findSystemChromiumExecutable(): string | undefined {
  return SYSTEM_CHROMIUM_EXECUTABLES.find((candidate) => existsSync(candidate));
}

export function getChromiumLaunchOptions(): ChromiumLaunchOptions | undefined {
  const executablePath = findSystemChromiumExecutable();

  return executablePath ? { executablePath } : undefined;
}

export async function seedSettingsLanguage(page: Page, language: AppLanguage): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKey,
      legacyLanguageKey,
    }: {
      language: AppLanguage;
      languageKey: string;
      legacyLanguageKey: string;
    }) => {
      window.localStorage.setItem(legacyLanguageKey, seededLanguage);
      window.localStorage.setItem(languageKey, seededLanguage);
    },
    { language, languageKey: settingsLanguageKey, legacyLanguageKey: legacySettingsLanguageKey },
  );
}

export async function markAboutTheTestSeen(page: Page): Promise<void> {
  await page.addInitScript(
    ({ legacySeenKey, seenKey }: { legacySeenKey: string; seenKey: string }) => {
      window.localStorage.setItem(legacySeenKey, 'true');
      window.localStorage.setItem(seenKey, 'true');
    },
    { legacySeenKey: legacySettingsSeenAboutKey, seenKey: settingsSeenAboutKey },
  );
}

export async function seedFreshFirstRunSettingsLanguage(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKey,
      legacyLanguageKey,
      legacySeenKey,
      seenKey,
    }: {
      language: AppLanguage;
      languageKey: string;
      legacyLanguageKey: string;
      legacySeenKey: string;
      seenKey: string;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(legacyLanguageKey, seededLanguage);
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.removeItem(legacySeenKey);
      window.localStorage.removeItem(seenKey);
    },
    {
      language,
      languageKey: settingsLanguageKey,
      legacyLanguageKey: legacySettingsLanguageKey,
      legacySeenKey: legacySettingsSeenAboutKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

export async function closeLaunchAdIfPresent(page: Page): Promise<boolean> {
  const closeLaunchAd = page
    .getByRole('button', {
      name: /Close launch sponsor ad|Stäng startannons/,
    })
    .first();

  if (await closeLaunchAd.isVisible().catch(() => false)) {
    await closeLaunchAd.click();
    await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);
    return true;
  }

  return false;
}

export async function dismissLanguagePickerIfPresent(page: Page): Promise<boolean> {
  const closeLanguagePicker = page
    .getByRole('button', {
      name: /Close language picker|Stäng språkväljaren/,
    })
    .first();

  if (await closeLanguagePicker.isVisible().catch(() => false)) {
    await closeLanguagePicker.click();
    await expect(page.getByRole('menu', { name: /Language picker|Språkväljare/ })).toHaveCount(0);
    return true;
  }

  return false;
}

export async function dismissFirstRunAboutModalIfPresent(page: Page): Promise<boolean> {
  const skipGuide = page
    .getByRole('button', {
      name: /Skip the guide|Hoppa över guiden/,
    })
    .first();

  if (await skipGuide.isVisible().catch(() => false)) {
    await skipGuide.click();
    await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);
    return true;
  }

  return false;
}

export async function dismissBlockingModals(page: Page): Promise<BlockingModalDismissal> {
  const languagePickerDismissed = await dismissLanguagePickerIfPresent(page);
  const launchOverlayDismissed = await closeLaunchAdIfPresent(page);
  const firstRunAboutDismissed = await dismissFirstRunAboutModalIfPresent(page);

  await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);

  return {
    firstRunAboutDismissed,
    languagePickerDismissed,
    launchOverlayDismissed,
  };
}

/**
 * Collects console errors and uncaught page errors during the test.
 * Returns an object with a `get` method to retrieve the collected messages.
 */
export function collectConsoleAndPageErrors(page: Page): { get: () => string[] } {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`[console.error] ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`[pageerror] ${error.message}`);
  });

  return { get: () => errors };
}

/**
 * Navigates to the profile settings screen and selects the given question
 * language, then returns to the previous page.
 */
export async function selectQuestionLanguageInSettings(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKey,
      legacyLanguageKey,
    }: {
      language: AppLanguage;
      languageKey: string;
      legacyLanguageKey: string;
    }) => {
      window.localStorage.setItem(legacyLanguageKey, seededLanguage);
      window.localStorage.setItem(languageKey, seededLanguage);
    },
    { language, languageKey: settingsLanguageKey, legacyLanguageKey: legacySettingsLanguageKey },
  );
}
