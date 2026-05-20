import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type Language = 'sv' | 'en';

const copy = {
  sv: {
    clear: 'Rensa sökfältet',
    filteredSummary: /\d+ av \d+ samhällsbegrepp visas/,
    initialSummary: /\d+ samhällsbegrepp i referensen/,
    inputName: 'Sök samhällsbegrepp',
    query: 'riksdag',
  },
  en: {
    clear: 'Clear the search field',
    filteredSummary: /\d+ of \d+ civic reference terms shown/,
    initialSummary: /\d+ civic reference terms/,
    inputName: 'Search civic terms',
    query: 'municipality',
  },
} as const;

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

test.use({ viewport: { width: 390, height: 844 } });

for (const language of ['sv', 'en'] as const satisfies readonly Language[]) {
  test(`Search result summary announces changing counts in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedSettingsLanguage(page, language);
    await markAboutTheTestSeen(page);
    await page.goto('/search', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const liveSummary = page.locator('[aria-live="polite"]').filter({
      hasText: language === 'sv' ? /samhällsbegrepp/ : /civic reference terms/,
    });
    await expect(liveSummary).toHaveCount(1);
    await expect(liveSummary).toHaveText(t.initialSummary);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.query);
    await expect(liveSummary).toHaveText(t.filteredSummary);
    await expect(
      page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: t.clear }).click();
    await expect(liveSummary).toHaveText(t.initialSummary);

    expect(consoleErrors).toEqual([]);
  });
}
