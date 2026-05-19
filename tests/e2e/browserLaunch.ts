import { existsSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

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

export async function dismissBlockingModals(page: Page): Promise<void> {
  const blockingActionName =
    /Close launch sponsor ad|Stäng startannons|Skip guide|Hoppa över guiden/;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.waitForTimeout(200);
    const blockingActions = page.getByRole('button', { name: blockingActionName });
    const action = blockingActions.last();
    const visible = await action.isVisible().catch(() => false);
    if (!visible) continue;
    await action.click({ force: true, timeout: 1_500 }).catch(() => undefined);
  }

  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
}

export function collectConsoleAndPageErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}
