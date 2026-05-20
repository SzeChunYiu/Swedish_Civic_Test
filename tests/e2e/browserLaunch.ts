import { existsSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

import type { AppLanguage } from '../../lib/storage/settingsStore';

export type { AppLanguage } from '../../lib/storage/settingsStore';

const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const dialogLocator = '[role="dialog"][aria-modal="true"]';

export type BlockingModalDismissal = {
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
};

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

export function collectConsoleAndPageErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

export async function seedSettingsLanguage(page: Page, language: AppLanguage): Promise<void> {
  await page.addInitScript(
    ({ language: seededLanguage, languageKey }: { language: AppLanguage; languageKey: string }) => {
      window.localStorage.setItem(languageKey, seededLanguage);
    },
    { language, languageKey: settingsLanguageKey },
  );
}

export async function markAboutTheTestSeen(page: Page): Promise<void> {
  await page.addInitScript(
    ({ seenKey }: { seenKey: string }) => {
      window.localStorage.setItem(seenKey, 'true');
    },
    { seenKey: settingsSeenAboutKey },
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
      seenKey,
    }: {
      language: AppLanguage;
      languageKey: string;
      seenKey: string;
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.removeItem(seenKey);
    },
    { language, languageKey: settingsLanguageKey, seenKey: settingsSeenAboutKey },
  );
}

export async function selectQuestionLanguageInSettings(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const label =
    language === 'en'
      ? /Byt frågespråk till Engelskt stöd|Set question language to English support/
      : /Byt frågespråk till Svenska|Set question language to Swedish/;
  const selectedLabel =
    language === 'en' ? 'Set question language to English support' : 'Byt frågespråk till Svenska';

  await page.getByLabel(label).click();
  await expect(page.getByRole('radio', { name: selectedLabel })).toHaveAttribute(
    'aria-checked',
    'true',
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
