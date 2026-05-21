import { existsSync } from 'node:fs';

import { expect, type Locator, type Page } from '@playwright/test';

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

const languagePickerMenuName = /Language picker|Språkväljare/;
const languagePickerTriggerName = /Open language picker|Öppna språkväljaren/;

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

export async function seedFreshSettingsLanguageAndAboutSeen(
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
      window.localStorage.setItem(legacySeenKey, 'true');
      window.localStorage.setItem(seenKey, 'true');
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

export async function mockBrowserDate(page: Page, fixedDate: string | Date): Promise<void> {
  const fixedTime = typeof fixedDate === 'string' ? Date.parse(fixedDate) : fixedDate.getTime();

  if (!Number.isFinite(fixedTime)) {
    throw new Error(`Invalid browser date mock: ${String(fixedDate)}`);
  }

  await page.addInitScript((mockedNow: number) => {
    const RealDate = Date;

    const MockDate = function (
      this: Date,
      valueOrYear?: string | number,
      monthIndex?: number,
      date?: number,
      hours?: number,
      minutes?: number,
      seconds?: number,
      ms?: number,
    ) {
      if (!new.target) {
        return new RealDate(mockedNow).toString();
      }

      if (arguments.length === 0) {
        return new RealDate(mockedNow);
      }

      if (arguments.length === 1) {
        return new RealDate(valueOrYear as string | number);
      }

      return new RealDate(
        valueOrYear as number,
        monthIndex as number,
        date,
        hours,
        minutes,
        seconds,
        ms,
      );
    } as unknown as DateConstructor;

    Object.setPrototypeOf(MockDate, RealDate);
    Object.defineProperty(MockDate, 'prototype', { value: RealDate.prototype });
    MockDate.now = () => mockedNow;
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    window.Date = MockDate;
  }, fixedTime);
}

async function clickFirstVisible(locator: Locator): Promise<boolean> {
  const target = locator.first();

  if (!(await target.isVisible().catch(() => false))) return false;

  try {
    await target.click({ timeout: 5_000 });
  } catch {
    // The modal controls can detach while an overlay is closing; the final
    // overlay assertion in dismissBlockingModals catches any real failure.
  }

  return true;
}

export async function closeLaunchAdIfPresent(page: Page): Promise<boolean> {
  const closeLaunchAd = page
    .getByRole('button', {
      name: /Close launch sponsor ad|Stäng startannons/,
    })
    .first();

  return clickFirstVisible(closeLaunchAd);
}

export async function dismissLanguagePickerIfPresent(page: Page): Promise<boolean> {
  const closeLanguagePicker = page
    .getByRole('button', {
      name: /Close language picker|Stäng språkväljaren/,
    })
    .first();

  const clicked = await clickFirstVisible(closeLanguagePicker);
  if (clicked)
    await expect(page.getByRole('menu', { name: languagePickerMenuName })).toHaveCount(0);

  return clicked;
}

export async function dismissFirstRunAboutModalIfPresent(page: Page): Promise<boolean> {
  const skipGuide = page
    .getByRole('button', {
      name: /Skip the guide|Hoppa över guiden/,
    })
    .first();

  return clickFirstVisible(skipGuide);
}

export async function dismissBlockingModals(page: Page): Promise<BlockingModalDismissal> {
  const dismissal: BlockingModalDismissal = {
    firstRunAboutDismissed: false,
    languagePickerDismissed: false,
    launchOverlayDismissed: false,
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const languagePickerDismissed = await dismissLanguagePickerIfPresent(page);
    const launchOverlayDismissed = await closeLaunchAdIfPresent(page);
    const firstRunAboutDismissed = await dismissFirstRunAboutModalIfPresent(page);
    const dismissed = languagePickerDismissed || launchOverlayDismissed || firstRunAboutDismissed;

    dismissal.languagePickerDismissed ||= languagePickerDismissed;
    dismissal.launchOverlayDismissed ||= launchOverlayDismissed;
    dismissal.firstRunAboutDismissed ||= firstRunAboutDismissed;

    if (!dismissed) break;
    await page.waitForTimeout(150);
  }

  await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);

  return dismissal;
}

export async function setupHomeCopyRoute(page: Page, language: AppLanguage): Promise<void> {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

export async function switchLanguageThroughTopBarPicker(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  const targetLabel = language === 'sv' ? 'Swedish' : 'English';

  await page.getByRole('button', { name: languagePickerTriggerName }).first().click();

  const menu = page.getByRole('menu', { name: languagePickerMenuName });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { exact: true, name: targetLabel }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('button', { name: languagePickerTriggerName }).first()).toBeVisible();
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
