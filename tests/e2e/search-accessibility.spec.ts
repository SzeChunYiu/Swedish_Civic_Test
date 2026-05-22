import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type Language = 'sv' | 'en';

const copy = {
  sv: {
    clear: 'Rensa sökfältet',
    filteredSummary: /\d+ av \d+ begrepp och \d+ övningsfrågor matchar/,
    initialSummary: /\d+ samhällsbegrepp i referensen/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    punctuatedQuery: 'kommun,',
    questionShown: /8 av \d+ källbaserade övningsfrågor visas/,
    provenanceBadge: /Källtyp: (UHR-källa|Tilläggsfråga|Redaktionell)/,
    questionLink: /Öppna övningsfrågan:/,
    query: 'riksdag',
    sourceNote: /^Källanteckning:/,
    termName: 'Kommun',
    browseChapters: 'Gå till alla kapitel',
  },
  en: {
    clear: 'Clear the search field',
    filteredSummary: /\d+ of \d+ terms and \d+ practice questions match/,
    initialSummary: /\d+ civic reference terms/,
    inputName: 'Search civic terms and practice questions',
    punctuatedQuery: 'riksdag?',
    questionShown: /8 of \d+ source-backed practice questions shown/,
    provenanceBadge: /Provenance: (UHR source|Supplementary|Editorial)/,
    questionLink: /Open practice question:/,
    query: 'municipality',
    sourceNote: /^Source note:/,
    termName: 'Riksdag',
    browseChapters: 'Go to all chapters',
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

async function getBox(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a measurable web target`).not.toBeNull();
  return box as NonNullable<typeof box>;
}

async function getComputedInteractionStyle(locator: Locator) {
  return locator.evaluate((node) => {
    const style = window.getComputedStyle(node);

    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      transform: style.transform,
    };
  });
}

async function expectSearchLinkFeedback(page: Page, locator: Locator, label: string) {
  await expect(locator, `${label} should be visible before interaction checks`).toBeVisible();

  const box = await getBox(locator, label);
  expect(box.width, `${label} should keep a 44px minimum width`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${label} should keep a 44px minimum height`).toBeGreaterThanOrEqual(44);

  await page.getByRole('textbox').focus();
  const idleStyle = await getComputedInteractionStyle(locator);

  await locator.focus();
  const focusStyle = await getComputedInteractionStyle(locator);
  expect(
    focusStyle.backgroundColor !== idleStyle.backgroundColor ||
      focusStyle.borderColor !== idleStyle.borderColor ||
      focusStyle.transform !== idleStyle.transform,
    `${label} should expose visible focus feedback`,
  ).toBe(true);

  await page.getByRole('textbox').focus();
  await locator.hover();
  const hoverStyle = await getComputedInteractionStyle(locator);
  expect(
    hoverStyle.backgroundColor !== idleStyle.backgroundColor ||
      hoverStyle.borderColor !== idleStyle.borderColor ||
      hoverStyle.transform !== idleStyle.transform,
    `${label} should expose visible hover feedback`,
  ).toBe(true);

  const hoverBox = await getBox(locator, `${label} hover`);
  await page.mouse.move(hoverBox.x + hoverBox.width / 2, hoverBox.y + hoverBox.height / 2);
  await page.mouse.down();
  const pressedStyle = await getComputedInteractionStyle(locator);
  expect(pressedStyle.transform, `${label} pressed transform should differ from hover`).not.toBe(
    hoverStyle.transform,
  );
  expect(pressedStyle.transform, `${label} pressed transform should be visible`).not.toBe('none');
  await page.mouse.move(2, 2);
  await page.mouse.up();
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
    await expect(page.getByText(t.questionShown)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: t.questionLink }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: t.provenanceBadge }).first()).toBeVisible();

    await page.getByRole('button', { name: t.clear }).click();
    await expect(liveSummary).toHaveText(t.initialSummary);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.punctuatedQuery);
    await expect(liveSummary).toHaveText(t.filteredSummary);
    await expect(page.getByText(t.questionShown)).toBeVisible();
    await expect(page.getByText(t.termName, { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: t.questionLink }).first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test(`Search route links expose keyboard focus, hover, and pressed feedback in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedSettingsLanguage(page, language);
    await markAboutTheTestSeen(page);
    await page.goto('/search', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.query);

    await expectSearchLinkFeedback(
      page,
      page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
      `${language} chapter result link`,
    );
    await expectSearchLinkFeedback(
      page,
      page.getByRole('link', { name: t.questionLink }).first(),
      `${language} practice question link`,
    );
    await expectSearchLinkFeedback(
      page,
      page.getByRole('link', { name: t.browseChapters }),
      `${language} browse chapters link`,
    );

    expect(consoleErrors).toEqual([]);
  });

  test(`Search question provenance badge toggles source notes in ${language.toUpperCase()}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const t = copy[language];

    await seedSettingsLanguage(page, language);
    await markAboutTheTestSeen(page);
    await page.goto('/search', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await page.getByRole('textbox', { name: t.inputName }).fill(t.query);

    const provenanceBadge = page.getByRole('button', { name: t.provenanceBadge }).first();
    const sourceNote = page.getByText(t.sourceNote);
    await expect(provenanceBadge).toBeVisible();
    await expect(provenanceBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);

    await provenanceBadge.click();
    await expect(provenanceBadge).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote.first()).toBeVisible();

    await provenanceBadge.click();
    await expect(provenanceBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);

    await provenanceBadge.focus();
    await page.keyboard.press('Enter');
    await expect(provenanceBadge).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote.first()).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(provenanceBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
}
