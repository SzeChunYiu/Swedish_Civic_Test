import { existsSync } from 'node:fs';

import { expect, type Page } from '@playwright/test';

import type { AppLanguage } from '../../lib/storage/settingsStore';

export type { AppLanguage };

export type BlockingModalDismissal = {
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
};

// Storage keys matching the app's settingsStore constants.
const settingsStorageId = 'settings';
const settingsLanguageKey = 'language';
const settingsSeenAboutKey = 'hasSeenAboutTheTest';
export const currentSettingsLanguageStorageKey = `${settingsStorageId}\\${settingsLanguageKey}`;
export const currentSettingsSeenAboutStorageKey = `${settingsStorageId}\\${settingsSeenAboutKey}`;
const settingsLanguageStorageKeys = [
  settingsLanguageKey,
  currentSettingsLanguageStorageKey,
] as const;
const settingsSeenAboutStorageKeys = [
  settingsSeenAboutKey,
  currentSettingsSeenAboutStorageKey,
] as const;

// Selector for blocking dialog/menu overlays in the rendered app.
export const blockingModalOverlayLocator =
  '[role="dialog"][aria-modal="true"], [role="menu"][aria-modal="true"]';
const dialogLocator = blockingModalOverlayLocator;

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
      languageKeys,
    }: {
      language: AppLanguage;
      languageKeys: readonly string[];
    }) => {
      for (const languageKey of languageKeys) {
        window.localStorage.setItem(languageKey, seededLanguage);
      }
    },
    { language, languageKeys: settingsLanguageStorageKeys },
  );
}

export async function markAboutTheTestSeen(page: Page): Promise<void> {
  await page.addInitScript(
    ({ seenKeys }: { seenKeys: readonly string[] }) => {
      for (const seenKey of seenKeys) {
        window.localStorage.setItem(seenKey, 'true');
      }
    },
    { seenKeys: settingsSeenAboutStorageKeys },
  );
}

export async function seedFreshSettingsLanguageAndAboutSeen(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKeys,
      seenKeys,
    }: {
      language: AppLanguage;
      languageKeys: readonly string[];
      seenKeys: readonly string[];
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      for (const languageKey of languageKeys) {
        window.localStorage.setItem(languageKey, seededLanguage);
      }
      for (const seenKey of seenKeys) {
        window.localStorage.setItem(seenKey, 'true');
      }
    },
    {
      language,
      languageKeys: settingsLanguageStorageKeys,
      seenKeys: settingsSeenAboutStorageKeys,
    },
  );
}

export async function seedFreshFirstRunSettingsLanguage(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKeys,
      seenKeys,
    }: {
      language: AppLanguage;
      languageKeys: readonly string[];
      seenKeys: readonly string[];
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      for (const languageKey of languageKeys) {
        window.localStorage.setItem(languageKey, seededLanguage);
      }
      for (const seenKey of seenKeys) {
        window.localStorage.removeItem(seenKey);
      }
    },
    {
      language,
      languageKeys: settingsLanguageStorageKeys,
      seenKeys: settingsSeenAboutStorageKeys,
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
    await expect(page.locator(dialogLocator)).toHaveCount(0);
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
    await expect(page.locator(dialogLocator)).toHaveCount(0);
    return true;
  }

  return false;
}

export async function dismissBlockingModals(page: Page): Promise<BlockingModalDismissal> {
  const languagePickerDismissed = await dismissLanguagePickerIfPresent(page);
  const launchOverlayDismissed = await closeLaunchAdIfPresent(page);
  const firstRunAboutDismissed = await dismissFirstRunAboutModalIfPresent(page);

  await expect(page.locator(dialogLocator)).toHaveCount(0);

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
      languageKeys,
    }: {
      language: AppLanguage;
      languageKeys: readonly string[];
    }) => {
      for (const languageKey of languageKeys) {
        window.localStorage.setItem(languageKey, seededLanguage);
      }
    },
    { language, languageKeys: settingsLanguageStorageKeys },
  );
}

export async function setupHomeCopyRoute(page: Page, language: AppLanguage): Promise<void> {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

export async function mockBrowserDate(page: Page, fixedDate: string | Date): Promise<void> {
  const mockedNow = fixedDate instanceof Date ? fixedDate.getTime() : new Date(fixedDate).getTime();

  await page.addInitScript((mockedNow: number) => {
    const RealDate = Date;

    function MockDate(this: Date, ...args: unknown[]) {
      if (!new.target) {
        return new RealDate(mockedNow).toString();
      }
      if (args.length === 0) {
        return new RealDate(mockedNow);
      }
      return new RealDate(...(args as [number | string | Date]));
    }

    MockDate.now = () => mockedNow;
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    MockDate.prototype = RealDate.prototype;

    // Keep Date constructor semantics predictable for app code loaded after init.
    window.Date = MockDate as DateConstructor;
  }, mockedNow);
}
