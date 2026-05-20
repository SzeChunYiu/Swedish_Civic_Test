import { existsSync } from 'node:fs';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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

export async function closeLaunchAdIfPresent(page: Page): Promise<boolean> {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });

  if (
    await closeLaunchAd
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await closeLaunchAd.first().click();
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
    return true;
  }

  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
  return false;
}
