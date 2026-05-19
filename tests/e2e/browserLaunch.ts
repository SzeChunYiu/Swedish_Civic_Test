import { existsSync } from 'node:fs';

import { expect, type Page } from '@playwright/test';

const SYSTEM_CHROMIUM_EXECUTABLES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((candidate): candidate is string => Boolean(candidate));

export type ChromiumLaunchOptions = {
  executablePath?: string;
};

export type AppLanguage = 'sv' | 'en';

export type BlockingModalDismissal = {
  firstRunAboutDismissed: boolean;
  languagePickerDismissed: boolean;
  launchOverlayDismissed: boolean;
};

const dialogLocator = '[role="dialog"][aria-modal="true"]';
const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';

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
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: settingsLanguageKey, value: JSON.stringify(language) },
  );
}

export async function markAboutTheTestSeen(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key }) => {
      window.localStorage.setItem(key, 'true');
    },
    { key: settingsSeenAboutKey },
  );
}

export async function dismissLanguagePickerIfPresent(page: Page): Promise<boolean> {
  const languageActions = page.getByRole('button', {
    name: /Continue in English|Fortsätt på svenska|English|Svenska/i,
  });
  const action = languageActions.first();
  const visible = await action.isVisible().catch(() => false);
  if (!visible) return false;

  await action.click({ force: true, timeout: 1_500 }).catch(() => undefined);
  return true;
}

export async function closeLaunchAdIfPresent(page: Page): Promise<boolean> {
  const launchActions = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/i,
  });
  const action = launchActions.last();
  const visible = await action.isVisible().catch(() => false);
  if (!visible) return false;

  await action.click({ force: true, timeout: 1_500 }).catch(() => undefined);
  return true;
}

export async function dismissBlockingModals(page: Page): Promise<BlockingModalDismissal> {
  const dismissal: BlockingModalDismissal = {
    firstRunAboutDismissed: false,
    languagePickerDismissed: false,
    launchOverlayDismissed: false,
  };

  const firstRunActionName = /Skip guide|Hoppa över guiden/;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.waitForTimeout(200);

    dismissal.languagePickerDismissed =
      (await dismissLanguagePickerIfPresent(page)) || dismissal.languagePickerDismissed;
    dismissal.launchOverlayDismissed =
      (await closeLaunchAdIfPresent(page)) || dismissal.launchOverlayDismissed;

    const firstRunActions = page.getByRole('button', { name: firstRunActionName });
    const firstRunAction = firstRunActions.last();
    const firstRunVisible = await firstRunAction.isVisible().catch(() => false);
    if (firstRunVisible) {
      await firstRunAction.click({ force: true, timeout: 1_500 }).catch(() => undefined);
      dismissal.firstRunAboutDismissed = true;
    }
  }

  await expect(page.locator(dialogLocator)).toHaveCount(0);
  return dismissal;
}
