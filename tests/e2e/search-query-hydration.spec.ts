import { expect, test, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

type SearchNavigationScenario = {
  clearName: string;
  filteredSummary: RegExp;
  initialSummary: RegExp;
  inputName: string;
  language: AppLanguage;
  mountedQuery: string;
  mountedUrl: string;
  provenanceBadgeName: RegExp;
  questionLinkName: RegExp;
  questionTitlePrefix: RegExp;
  query: string;
  sessionTitle: (questionId: string) => string;
  sourceCitation: RegExp;
  url: string;
};

type SearchPunctuationScenario = {
  chapterLinkName: string;
  filteredSummary: RegExp;
  inputName: string;
  language: AppLanguage;
  query: string;
  termName: string;
  url: string;
};

const searchNavigationScenarios: SearchNavigationScenario[] = [
  {
    clearName: 'Rensa sökfältet',
    filteredSummary: /\d+ av \d+ begrepp och \d+ övningsfrågor matchar/,
    initialSummary: /\d+ samhällsbegrepp i referensen/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    language: 'sv',
    mountedQuery: 'kommun',
    mountedUrl: '/search?query=kommun',
    provenanceBadgeName: /Källtyp: (UHR-källa|Tilläggsfråga|Redaktionell)/,
    questionLinkName: /Öppna övningsfrågan:/,
    questionTitlePrefix: /^Öppna övningsfrågan:\s*/,
    query: 'riksdag',
    sessionTitle: (questionId) => `Frågepass ${questionId}`,
    sourceCitation: /Källa: Sverige i fokus/,
    url: '/search?q=riksdag',
  },
  {
    clearName: 'Clear the search field',
    filteredSummary: /\d+ of \d+ terms and \d+ practice questions match/,
    initialSummary: /\d+ civic reference terms/,
    inputName: 'Search civic terms and practice questions',
    language: 'en',
    mountedQuery: 'riksdag',
    mountedUrl: '/search?q=riksdag',
    provenanceBadgeName: /Provenance: (UHR source|Supplementary|Editorial)/,
    questionLinkName: /Open practice question:/,
    questionTitlePrefix: /^Open practice question:\s*/,
    query: 'kommun',
    sessionTitle: (questionId) => `Session ${questionId}`,
    sourceCitation: /Source: Sverige i fokus/,
    url: '/search?query=kommun',
  },
];

const searchPunctuationScenarios: SearchPunctuationScenario[] = [
  {
    chapterLinkName: 'Öppna kapitlet Så här styrs Sverige',
    filteredSummary: /\d+ av \d+ begrepp och \d+ övningsfrågor matchar/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    language: 'sv',
    query: 'kommun,',
    termName: 'Kommun',
    url: '/search?q=kommun%2C',
  },
  {
    chapterLinkName: 'Open the chapter How Sweden is governed',
    filteredSummary: /\d+ of \d+ terms and \d+ practice questions match/,
    inputName: 'Search civic terms and practice questions',
    language: 'en',
    query: 'riksdag?',
    termName: 'Riksdag',
    url: '/search?query=riksdag%3F',
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function expectHydratedSearch(page: Page, scenario: SearchNavigationScenario) {
  await page.goto(scenario.url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  return expectVisibleSearchResults(page, scenario, scenario.query);
}

async function expectVisibleSearchResults(
  page: Page,
  scenario: SearchNavigationScenario,
  expectedQuery: string,
) {
  const input = page.getByRole('textbox', { name: scenario.inputName });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(expectedQuery);
  await expect(page.getByText(scenario.filteredSummary)).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Öppna kapitlet|Open the chapter/ }).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: scenario.questionLinkName }).first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: scenario.provenanceBadgeName }).first(),
  ).toBeVisible();

  return input;
}

async function changeMountedSearchParams(page: Page, url: string) {
  await page.evaluate((nextUrl) => {
    window.history.pushState({}, '', nextUrl);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, url);
}

async function expectSearchUrlCleared(page: Page) {
  await expect
    .poll(() => {
      const url = new URL(page.url());
      return {
        hasQ: url.searchParams.has('q'),
        hasQuery: url.searchParams.has('query'),
      };
    })
    .toEqual({ hasQ: false, hasQuery: false });
}

async function expectFirstQuestionResultNavigates(page: Page, scenario: SearchNavigationScenario) {
  const questionLink = page.getByRole('link', { name: scenario.questionLinkName }).first();
  const accessibleName = await questionLink.evaluate((node) => {
    return node.getAttribute('aria-label') ?? node.textContent ?? '';
  });
  const href = await questionLink.getAttribute('href');
  const questionId = href?.match(/\/quiz\/([^/?#]+)/)?.[1];
  const questionTitle = accessibleName.replace(scenario.questionTitlePrefix, '').trim();

  expect(href).toMatch(/\/quiz\/[^/?#]+/);
  expect(questionId, 'search question result should route to a concrete question id').toBeTruthy();
  expect(
    questionTitle.length,
    'search question result should name the destination question',
  ).toBeGreaterThan(10);

  await questionLink.click();

  await expect(page).toHaveURL(new RegExp(`/quiz/${escapeRegExp(questionId ?? '')}(?:[?#].*)?$`));
  await expect(
    page.getByText(scenario.sessionTitle(questionId ?? ''), { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: questionTitle }).last()).toBeVisible();
  await expect(page.getByText(scenario.sourceCitation).first()).toBeVisible();
}

for (const scenario of searchNavigationScenarios) {
  test(`search question result opens the exact routed quiz from ${scenario.url}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await seedSettingsLanguage(page, scenario.language);
    await markAboutTheTestSeen(page);

    await expectHydratedSearch(page, scenario);
    await expectFirstQuestionResultNavigates(page, scenario);

    const input = await expectHydratedSearch(page, scenario);
    await page.getByRole('button', { name: scenario.clearName }).click();
    await expect(input).toHaveValue('');
    await expectSearchUrlCleared(page);
    await expect(page.getByText(scenario.initialSummary)).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    const clearedInput = page.getByRole('textbox', { name: scenario.inputName });
    await expect(clearedInput).toHaveValue('');
    await expect(page.getByText(scenario.initialSummary)).toBeVisible();
    await clearedInput.fill(scenario.mountedQuery);
    await expect(clearedInput).toHaveValue(scenario.mountedQuery);
    await expectSearchUrlCleared(page);

    await changeMountedSearchParams(page, scenario.mountedUrl);
    await expectVisibleSearchResults(page, scenario, scenario.mountedQuery);

    expect(consoleErrors).toEqual([]);
  });
}

for (const scenario of searchPunctuationScenarios) {
  test(`search glossary normalizes trailing punctuation from ${scenario.url}`, async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await seedSettingsLanguage(page, scenario.language);
    await markAboutTheTestSeen(page);
    await page.goto(scenario.url, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('textbox', { name: scenario.inputName })).toHaveValue(
      scenario.query,
    );
    await expect(page.getByText(scenario.filteredSummary)).toBeVisible();
    await expect(page.getByText(scenario.termName, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: scenario.chapterLinkName }).first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
}
