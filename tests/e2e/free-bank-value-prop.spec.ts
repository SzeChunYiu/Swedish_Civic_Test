import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

type Language = 'sv' | 'en';

const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const confusingPaywallCopy =
  /Duolingo|Babbel|Memrise|Mondly|competitor|konkurrent|59\s*(?:SEK|kr)|cheaper|billigare|expensive|dyrt|better than|bättre än|worse than|sämre än/i;

const copy = {
  sv: {
    home: [/Hela frågebanken:\s*\d+\s*övningsfrågor i\s*\d+\s*kapitel/i, /Alla frågor är gratis/i],
    onboarding: [
      /Hela frågebanken är gratis/i,
      /Ta bort annonser påverkar bara annonser, inte tillgången till frågor/i,
    ],
    profile: [
      /Hela frågebanken är gratis och annonser finansierar studieskärmar/i,
      /Betala 29 SEK en gång för att ta bort annonser från studieskärmar/i,
      /det låser inte upp frågor/i,
      /Tidsatta övningsprov är redan annonsfria/i,
    ],
    profileBuy: /Köp Ta bort annonser för 29 SEK/i,
  },
  en: {
    home: [
      /Full question bank stays free:\s*\d+\s*practice questions across\s*\d+\s*chapters/i,
      /All questions stay free/i,
    ],
    onboarding: [
      /The full question bank stays free/i,
      /Remove Ads only changes ads, not question access/i,
    ],
    profile: [
      /The full question bank stays free and ads support study screens/i,
      /Pay 29 SEK once to remove ads from study screens/i,
      /it does not unlock questions/i,
      /Exams stay ad-free/i,
    ],
    profileBuy: /Buy Remove Ads for 29 SEK/i,
  },
} as const;

async function seedFreshLanguage(page: Page, language: Language) {
  await page.addInitScript(
    ({ language: seededLanguage, languageKey, seenKey }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.setItem(seenKey, 'true');
    },
    {
      language,
      languageKey: settingsLanguageKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectVisibleCopy(page: Page, patterns: readonly RegExp[]) {
  for (const pattern of patterns) {
    const locator = page.getByText(pattern).first();
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }
}

async function expectNoConfusingPaywallCopy(page: Page) {
  await expect(page.locator('body')).not.toContainText(confusingPaywallCopy);
}

test.use({ viewport: { width: 390, height: 844 } });

for (const language of ['sv', 'en'] as const) {
  test(`full-bank-free promise is visible in ${language.toUpperCase()} acquisition surfaces`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedFreshLanguage(page, language);

    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectVisibleCopy(page, t.home);
    await expectNoConfusingPaywallCopy(page);

    await page.goto('/onboarding', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectVisibleCopy(page, t.onboarding);
    await expectNoConfusingPaywallCopy(page);

    await page.goto('/profile', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expectVisibleCopy(page, t.profile);
    await expect(page.getByRole('button', { name: t.profileBuy })).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Restore Remove Ads purchase|Återställ köp av Ta bort annonser/i,
      }),
    ).toBeVisible();
    await expectNoConfusingPaywallCopy(page);

    expect(consoleErrors).toEqual([]);
  });
}
