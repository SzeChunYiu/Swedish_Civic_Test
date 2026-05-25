import { existsSync } from 'node:fs';
import { release } from 'node:os';

import { chromium, expect, type Locator, type Page } from '@playwright/test';

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
const progressStorageId = 'progress';
const progressStateKey = 'progressState';
export const currentSettingsLanguageStorageKey = `${settingsStorageId}\\${settingsLanguageKey}`;
export const currentSettingsSeenAboutStorageKey = `${settingsStorageId}\\${settingsSeenAboutKey}`;
export const currentProgressStateStorageKey = `${progressStorageId}\\${progressStateKey}`;
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
type BrowserInitWindowValue = boolean | null | number | string;
export type BrowserSpeechEvent =
  | { type: 'cancel' }
  | { lang: string; rate: number; text: string; type: 'speak' };

type FreshSettingsSeedOptions = {
  localStorageValues?: Record<string, string>;
  reseedOnNavigation?: boolean;
  windowValues?: Record<string, BrowserInitWindowValue>;
};

export type BrowserEntropySeed = {
  now: number;
  random: number;
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

export type ChromiumBrowserAvailability = {
  executablePath?: string;
  installCommand: string;
  message?: string;
  ok: boolean;
};

export const playwrightChromiumInstallCommand = 'npx playwright install --with-deps chromium';

export function findSystemChromiumExecutable(): string | undefined {
  return SYSTEM_CHROMIUM_EXECUTABLES.find((candidate) => existsSync(candidate));
}

export function getChromiumLaunchOptions(): ChromiumLaunchOptions | undefined {
  const executablePath = findSystemChromiumExecutable();

  return executablePath ? { executablePath } : undefined;
}

export function getPlaywrightChromiumExecutablePath(): string | undefined {
  try {
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

export function getChromiumBrowserAvailability(): ChromiumBrowserAvailability {
  const systemExecutablePath = findSystemChromiumExecutable();
  if (systemExecutablePath) {
    return {
      executablePath: systemExecutablePath,
      installCommand: playwrightChromiumInstallCommand,
      ok: true,
    };
  }

  const playwrightExecutablePath = getPlaywrightChromiumExecutablePath();
  if (playwrightExecutablePath && existsSync(playwrightExecutablePath)) {
    return {
      executablePath: playwrightExecutablePath,
      installCommand: playwrightChromiumInstallCommand,
      ok: true,
    };
  }

  const expectedPath = playwrightExecutablePath
    ? `Expected Playwright Chromium at: ${playwrightExecutablePath}`
    : 'Playwright did not report a Chromium executable path.';
  const host = `${process.platform}-${process.arch} ${release()}`;
  return {
    executablePath: playwrightExecutablePath,
    installCommand: playwrightChromiumInstallCommand,
    message: [
      'Playwright Chromium is not available before the e2e specs start.',
      expectedPath,
      `Host: ${host}`,
      'Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or CHROME_BIN to an existing Chromium/Chrome binary,',
      `or install the Playwright browser with: ${playwrightChromiumInstallCommand}`,
      'CI must provide a working Chromium binary; local runs should fix the browser install before rerunning specs.',
    ].join('\n'),
    ok: false,
  };
}

export function assertChromiumBrowserAvailable(): void {
  const availability = getChromiumBrowserAvailability();
  if (availability.ok) return;

  throw new Error(availability.message);
}

async function activateBlockingModalControl(control: Locator): Promise<void> {
  try {
    await control.click({ timeout: 2_000 });
  } catch {
    if ((await control.count()) === 0) return;
    await control.dispatchEvent('click', undefined, { timeout: 2_000 });
  }
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
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language);
}

export async function seedFreshSettingsLanguageAndAboutSeenWithStorage(
  page: Page,
  language: AppLanguage,
  {
    localStorageValues = {},
    reseedOnNavigation = true,
    windowValues = {},
  }: FreshSettingsSeedOptions = {},
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKeys,
      reseedOnNavigation,
      seenKeys,
      storageValues,
      windowValues,
    }: {
      language: AppLanguage;
      languageKeys: readonly string[];
      reseedOnNavigation: boolean;
      seenKeys: readonly string[];
      storageValues: Record<string, string>;
      windowValues: Record<string, BrowserInitWindowValue>;
    }) => {
      const seedMarker = '__SMT_FRESH_SETTINGS_SEEDED__';
      if (!reseedOnNavigation && window.sessionStorage.getItem(seedMarker) === 'true') {
        return;
      }

      window.localStorage.clear();
      window.sessionStorage.clear();
      if (!reseedOnNavigation) window.sessionStorage.setItem(seedMarker, 'true');
      for (const languageKey of languageKeys) {
        window.localStorage.setItem(languageKey, seededLanguage);
      }
      for (const seenKey of seenKeys) {
        window.localStorage.setItem(seenKey, 'true');
      }
      for (const [key, value] of Object.entries(storageValues)) {
        window.localStorage.setItem(key, value);
      }
      for (const [key, value] of Object.entries(windowValues)) {
        (window as unknown as Record<string, BrowserInitWindowValue>)[key] = value;
      }
    },
    {
      language,
      languageKeys: settingsLanguageStorageKeys,
      reseedOnNavigation,
      seenKeys: settingsSeenAboutStorageKeys,
      storageValues: localStorageValues,
      windowValues,
    },
  );
}

export async function installDeterministicBrowserEntropy(
  page: Page,
  entropy: BrowserEntropySeed,
): Promise<void> {
  await page.addInitScript(({ now, random }: BrowserEntropySeed) => {
    Object.defineProperty(Date, 'now', {
      configurable: true,
      value: () => now,
    });
    Object.defineProperty(Math, 'random', {
      configurable: true,
      value: () => random,
    });
  }, entropy);
}

export async function installSpeechSynthesisMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const speechEvents: BrowserSpeechEvent[] = [];
    const speechState = {
      paused: false,
      pending: false,
      speaking: false,
    };

    class MockSpeechSynthesisUtterance {
      lang = '';
      pitch = 1;
      rate = 1;
      text: string;
      voice = null;
      volume = 1;

      constructor(text: string) {
        this.text = String(text);
      }
    }

    Object.defineProperty(window, '__SMT_SPEECH_EVENTS__', {
      configurable: true,
      value: speechEvents,
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {
          speechState.speaking = false;
          speechState.pending = false;
          speechEvents.push({ type: 'cancel' });
        },
        get paused() {
          return speechState.paused;
        },
        get pending() {
          return speechState.pending;
        },
        get speaking() {
          return speechState.speaking;
        },
        getVoices() {
          return [];
        },
        pause() {
          speechState.paused = true;
        },
        resume() {
          speechState.paused = false;
        },
        speak(utterance: MockSpeechSynthesisUtterance) {
          speechState.speaking = true;
          speechEvents.push({
            lang: utterance.lang,
            rate: utterance.rate,
            text: utterance.text,
            type: 'speak',
          });
        },
      },
    });
  });
}

export async function speechEvents(page: Page): Promise<BrowserSpeechEvent[]> {
  return page.evaluate(() => {
    const typedWindow = window as typeof window & {
      __SMT_SPEECH_EVENTS__?: BrowserSpeechEvent[];
    };

    return [...(typedWindow.__SMT_SPEECH_EVENTS__ ?? [])];
  });
}

export async function clearSpeechEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    const typedWindow = window as typeof window & {
      __SMT_SPEECH_EVENTS__?: BrowserSpeechEvent[];
    };

    typedWindow.__SMT_SPEECH_EVENTS__?.splice(0);
  });
}

export function speakEvents(events: BrowserSpeechEvent[]) {
  return events.filter(
    (event): event is Extract<BrowserSpeechEvent, { type: 'speak' }> => event.type === 'speak',
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
    await activateBlockingModalControl(closeLaunchAd);
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
    await activateBlockingModalControl(closeLanguagePicker);
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
    await activateBlockingModalControl(skipGuide);
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

export async function switchLanguageThroughTopBarPicker(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  const languageMenu = page.getByRole('menu', { name: /Language picker|Språkväljare/ });

  await page
    .getByRole('button', {
      name: /Nuvarande språk [A-Z]{2}\. Öppna språkväljaren\.|Current language [A-Z]{2}\. Open language picker\./,
    })
    .click();
  await page.getByRole('menuitem', { name: language === 'sv' ? 'Swedish' : 'English' }).click();
  await expect(languageMenu).toHaveCount(0);
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
