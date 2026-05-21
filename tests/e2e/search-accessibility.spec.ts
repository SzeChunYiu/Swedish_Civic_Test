import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type Language = 'sv' | 'en';

const copy = {
  sv: {
    browseChapters: 'Gå till alla kapitel',
    clear: 'Rensa sökfältet',
    filteredSummary: /\d+ av \d+ begrepp och \d+ övningsfrågor matchar/,
    initialSummary: /\d+ samhällsbegrepp i referensen/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    punctuatedQuery: 'kommun,',
    provenanceBadge: /Källtyp: (UHR-källa|Tilläggsfråga|Redaktionell)/,
    questionLink: /Öppna övningsfrågan:/,
    query: 'riksdag',
    termName: 'Kommun',
  },
  en: {
    browseChapters: 'Go to all chapters',
    clear: 'Clear the search field',
    filteredSummary: /\d+ of \d+ terms and \d+ practice questions match/,
    initialSummary: /\d+ civic reference terms/,
    inputName: 'Search civic terms and practice questions',
    punctuatedQuery: 'riksdag?',
    provenanceBadge: /Provenance: (UHR source|Supplementary|Editorial)/,
    questionLink: /Open practice question:/,
    query: 'municipality',
    termName: 'Riksdag',
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

async function expectStableTouchTarget(locator: Locator, label: string) {
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();

  expect(box, `${label} should have a rendered box`).not.toBeNull();
  expect(box?.width ?? 0, `${label} width should be at least 44px`).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0, `${label} height should be at least 44px`).toBeGreaterThanOrEqual(44);
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

    const liveSummary = page.locator('[aria-live="polite"]');
    await expect(liveSummary).toHaveCount(1);
    await expect(liveSummary).toHaveText(t.initialSummary);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.query);
    await expect(liveSummary).toHaveText(t.filteredSummary);
    const chapterLink = page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first();
    const questionLink = page.getByRole('link', { name: t.questionLink }).first();
    const browseLink = page.getByRole('link', { name: t.browseChapters });

    await expectStableTouchTarget(chapterLink, `${language} chapter result link`);
    await expectStableTouchTarget(questionLink, `${language} question result link`);
    await expectStableTouchTarget(browseLink, `${language} Browse chapters link`);
    await expect(page.getByRole('button', { name: t.provenanceBadge }).first()).toBeVisible();

    await page.getByRole('button', { name: t.clear }).click();
    await expect(liveSummary).toHaveText(t.initialSummary);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.punctuatedQuery);
    await expect(liveSummary).toHaveText(t.filteredSummary);
    await expect(page.getByText(t.termName, { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
}
