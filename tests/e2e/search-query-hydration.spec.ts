import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type SearchStateCopy = {
  allTermsSummaryPattern: RegExp;
  clearButtonName: string;
  filteredSummaryPattern: RegExp;
  inputName: string;
  questionLinkName: RegExp;
  questionShownPattern: RegExp;
  submitButtonName: string;
};

const searchStateCopy: Record<'sv' | 'en', SearchStateCopy> = {
  sv: {
    allTermsSummaryPattern: /\d+ samhällsbegrepp i referensen/,
    clearButtonName: 'Rensa sökfältet',
    filteredSummaryPattern: /\d+ av \d+ begrepp och \d+ övningsfrågor matchar/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    questionLinkName: /Öppna övningsfrågan:/,
    questionShownPattern: /8 av \d+ källbaserade övningsfrågor visas/,
    submitButtonName: 'Sök med den inskrivna texten',
  },
  en: {
    allTermsSummaryPattern: /\d+ civic reference terms/,
    clearButtonName: 'Clear the search field',
    filteredSummaryPattern: /\d+ of \d+ terms and \d+ practice questions match/,
    inputName: 'Search civic terms and practice questions',
    questionLinkName: /Open practice question:/,
    questionShownPattern: /8 of \d+ source-backed practice questions shown/,
    submitButtonName: 'Submit the typed search',
  },
};

async function expectSearchState(
  page: Page,
  expectedQuery: string,
  copy: SearchStateCopy = searchStateCopy.sv,
) {
  const input = page.getByRole('textbox', { name: copy.inputName });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(expectedQuery);
  await expect(page.getByText(copy.filteredSummaryPattern)).toBeVisible();
  await expect(page.getByText(new RegExp(expectedQuery, 'i')).first()).toBeVisible();
  await expect(page.getByRole('link', { name: copy.questionLinkName }).first()).toBeVisible();

  return input;
}

function expectSearchUrlWithoutQueryParams(page: Page) {
  const url = new URL(page.url());

  expect(url.pathname).toBe('/search');
  expect(url.searchParams.has('q')).toBe(false);
  expect(url.searchParams.has('query')).toBe(false);
}

async function expectSearchUrlWithQParam(page: Page, expectedQuery: string) {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/search');
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(expectedQuery);
  await expect.poll(() => new URL(page.url()).searchParams.has('query')).toBe(false);
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const documentElement = document.documentElement;
        const body = document.body;
        return Math.max(documentElement.scrollWidth, body.scrollWidth) - window.innerWidth;
      }),
    )
    .toBeLessThanOrEqual(1);
}

async function expectLocatorInsideViewport(page: Page, locatorName: string, locator: Locator) {
  const rect = await locator.evaluate((element) => {
    const { height, left, right, top, width } = element.getBoundingClientRect();
    return { height, left, right, top, width };
  });

  expect(rect.width, `${locatorName} width`).toBeGreaterThan(0);
  expect(rect.height, `${locatorName} height`).toBeGreaterThan(0);
  expect(rect.left, `${locatorName} left edge`).toBeGreaterThanOrEqual(0);
  expect(rect.right, `${locatorName} right edge`).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 360,
  );
  expect(rect.top, `${locatorName} top edge`).toBeGreaterThanOrEqual(0);
}

async function expectHydratedSearch(
  page: Page,
  url: string,
  expectedQuery: string,
  copy: SearchStateCopy = searchStateCopy.sv,
) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  return expectSearchState(page, expectedQuery, copy);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function expectQuestionResultNavigation({
  backSearchLinkName,
  expectedSearchQuery,
  inputName,
  language,
  linkName,
  linkPrefix,
  page,
  sourceSummaryLabel,
  sourceCitationLabel,
  url,
}: {
  backSearchLinkName: RegExp;
  expectedSearchQuery: string;
  inputName: string;
  language: 'sv' | 'en';
  linkName: RegExp;
  linkPrefix: string;
  page: Page;
  sourceSummaryLabel: 'Källa' | 'Source';
  sourceCitationLabel: 'Källhänvisning' | 'Source citation';
  url: string;
}) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto(url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('textbox', { name: inputName })).toBeVisible();

  const questionLink = page.getByRole('link', { name: linkName }).first();
  await expect(questionLink).toBeVisible();

  const href = await questionLink.getAttribute('href');
  expect(href).toMatch(/\/quiz\/q\d+/);
  if (!href) throw new Error('Question result link is missing an href');

  const questionId = href.match(/\/quiz\/(q\d+)/)?.[1];
  if (!questionId) throw new Error(`Question result href did not include a question id: ${href}`);
  const routeSessionHeading =
    language === 'sv' ? `Frågepass ${questionId}` : `Session ${questionId}`;
  const questionUrl = new URL(href, 'https://example.test');
  expect(questionUrl.pathname).toBe(`/quiz/${questionId}`);
  expect(questionUrl.searchParams.get('q')).toBe(expectedSearchQuery);

  const linkLabel = await questionLink.getAttribute('aria-label');
  const questionTitle = linkLabel?.startsWith(linkPrefix) ? linkLabel.slice(linkPrefix.length) : '';
  expect(questionTitle).toMatch(/\S/);

  const summaryId = await questionLink.getAttribute('aria-describedby');
  expect(summaryId).toMatch(/^search-question-summary-/);
  if (!summaryId) throw new Error(`Question result ${questionId} is missing its summary id`);

  const summaryText = (await page.locator(`#${summaryId}`).textContent()) ?? '';
  expect(summaryText).toContain(questionTitle);

  const sourceReference = summaryText.match(
    new RegExp(`${sourceSummaryLabel}: ([^.]+?)(?:\\.|$)`),
  )?.[1];
  expect(sourceReference).toMatch(/\S/);
  if (!sourceReference) throw new Error(`Question result ${questionId} is missing source context`);

  const [sourceChapter, sourceSection] = sourceReference.split(' · ');
  expect(sourceChapter).toMatch(/\S/);
  expect(sourceSection).toMatch(/\S/);
  if (!sourceChapter || !sourceSection) {
    throw new Error(`Question result ${questionId} has incomplete source context`);
  }

  await questionLink.click();
  await expect(page).toHaveURL(
    new RegExp(`/quiz/${questionId}\\?q=${encodeURIComponent(expectedSearchQuery)}$`),
  );
  await expect(page.getByRole('heading', { name: routeSessionHeading })).toBeVisible();
  await expect(page.getByRole('heading', { name: questionTitle }).first()).toBeVisible();
  await expect(
    page
      .getByLabel(
        new RegExp(
          `${sourceCitationLabel}: .*${escapeRegExp(sourceChapter)}.*${escapeRegExp(sourceSection)}`,
        ),
      )
      .first(),
  ).toBeVisible();

  const backToSearchLink = page.getByRole('link', { name: backSearchLinkName }).first();
  await expect(backToSearchLink).toBeVisible();
  await expect(backToSearchLink).toHaveAttribute(
    'href',
    `/search?q=${encodeURIComponent(expectedSearchQuery)}`,
  );

  await backToSearchLink.click();
  await expect(page).toHaveURL(
    new RegExp(`/search\\?q=${encodeURIComponent(expectedSearchQuery)}$`),
  );
  await expect(page.getByRole('textbox', { name: inputName })).toHaveValue(expectedSearchQuery);
  await expect(page.getByRole('heading', { name: routeSessionHeading })).toHaveCount(0);
  await expect(page.getByRole('link', { name: backSearchLinkName })).toHaveCount(0);
}

test('search route hydrates q and query URL parameters before typing', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const riksdagInput = await expectHydratedSearch(page, '/search?q=riksdag', 'riksdag');
  await expect(page.getByText(searchStateCopy.sv.questionShownPattern)).toBeVisible();
  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(riksdagInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);
  await expect(page.getByText(searchStateCopy.sv.allTermsSummaryPattern)).toBeVisible();

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(riksdagInput).toHaveValue('');
  await expect(page.getByText(searchStateCopy.sv.allTermsSummaryPattern)).toBeVisible();

  const kommunInput = await expectHydratedSearch(page, '/search?query=kommun', 'kommun');
  await expect(page.getByText(searchStateCopy.sv.questionShownPattern)).toBeVisible();
  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(kommunInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);

  await kommunInput.fill('demokrati');
  await expect(kommunInput).toHaveValue('demokrati');
  expectSearchUrlWithoutQueryParams(page);

  expect(consoleErrors).toEqual([]);
});

test('search route keeps q before query precedence for both params on load and mounted navigation', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const bothParamInput = await expectHydratedSearch(
    page,
    '/search?query=kommun&q=riksdag',
    'riksdag',
  );
  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(bothParamInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);
  await expect(page.getByText(searchStateCopy.sv.allTermsSummaryPattern)).toBeVisible();

  const mountedInput = await expectHydratedSearch(page, '/search?q=demokrati', 'demokrati');
  await mountedInput.fill('lokal text');
  await expect(mountedInput).toHaveValue('lokal text');

  await page.evaluate(() => {
    window.history.pushState({}, '', '/search?query=kommun&q=riksdag');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await expectSearchState(page, 'riksdag');

  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(mountedInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);

  expect(consoleErrors).toEqual([]);
});

test('English search route hydrates and clears q/query URL parameters before typing', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);

  const democracyInput = await expectHydratedSearch(
    page,
    '/search?q=democracy',
    'democracy',
    searchStateCopy.en,
  );
  await expect(page.getByText(searchStateCopy.en.questionShownPattern)).toBeVisible();
  await expect(page.getByRole('textbox', { name: searchStateCopy.sv.inputName })).toHaveCount(0);
  await expect(page.getByRole('button', { name: searchStateCopy.sv.submitButtonName })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: searchStateCopy.en.submitButtonName }),
  ).toBeEnabled();
  await page.getByRole('button', { name: searchStateCopy.en.clearButtonName }).click();
  await expect(democracyInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);
  await expect(page.getByText(searchStateCopy.en.allTermsSummaryPattern)).toBeVisible();

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(democracyInput).toHaveValue('');
  await expect(page.getByText(searchStateCopy.en.allTermsSummaryPattern)).toBeVisible();

  const municipalityInput = await expectHydratedSearch(
    page,
    '/search?query=municipality',
    'municipality',
    searchStateCopy.en,
  );
  await expect(page.getByText(searchStateCopy.en.questionShownPattern)).toBeVisible();
  await expect(page.getByRole('button', { name: searchStateCopy.sv.clearButtonName })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: searchStateCopy.en.clearButtonName }).click();
  await expect(municipalityInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);

  await municipalityInput.fill('parliament');
  await expect(municipalityInput).toHaveValue('parliament');
  expectSearchUrlWithoutQueryParams(page);

  expect(consoleErrors).toEqual([]);
});

test('search route submits manual typing via button or Enter before URL hydration and clears empty stale query', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const manualSubmitQuery = 'mänskliga rättigheter';
  const buttonSubmitQuery = 'kommun';
  const encodedManualSubmitQuery = encodeURIComponent(manualSubmitQuery);

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);
  await page.goto('/search', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const input = page.getByRole('textbox', { name: searchStateCopy.sv.inputName });
  const submitButton = page.getByRole('button', { name: searchStateCopy.sv.submitButtonName });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();
  await expect
    .poll(() => submitButton.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThanOrEqual(44);
  expectSearchUrlWithoutQueryParams(page);

  await input.fill(buttonSubmitQuery);
  await expect(input).toHaveValue(buttonSubmitQuery);
  await expect(submitButton).toBeEnabled();
  expectSearchUrlWithoutQueryParams(page);

  await submitButton.click();
  await expectSearchUrlWithQParam(page, buttonSubmitQuery);
  await expectSearchState(page, buttonSubmitQuery);

  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(input).toHaveValue('');
  await expect(submitButton).toBeDisabled();
  expectSearchUrlWithoutQueryParams(page);

  await input.fill(manualSubmitQuery);
  await expect(input).toHaveValue(manualSubmitQuery);
  expectSearchUrlWithoutQueryParams(page);

  await input.press('Enter');
  await expectSearchUrlWithQParam(page, manualSubmitQuery);
  expect(page.url()).toContain(`q=${encodedManualSubmitQuery}`);
  await expectSearchState(page, manualSubmitQuery);

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  const hydratedInput = await expectSearchState(page, manualSubmitQuery);
  await expectSearchUrlWithQParam(page, manualSubmitQuery);

  await hydratedInput.fill('   ');
  await expect(hydratedInput).toHaveValue('   ');
  await hydratedInput.press('Enter');
  await expect(hydratedInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);
  await expect(page.getByText(searchStateCopy.sv.allTermsSummaryPattern)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('Search actions mobile wrap submit and clear without horizontal overflow', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const mobileQuery = 'riksdag';

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ height: 740, width: 360 });
  await markAboutTheTestSeen(page);
  await page.goto('/search', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const input = page.getByRole('textbox', { name: searchStateCopy.sv.inputName });
  const submitButton = page.getByRole('button', { name: searchStateCopy.sv.submitButtonName });
  const clearButton = page.getByRole('button', { name: searchStateCopy.sv.clearButtonName });

  await expect(input).toBeVisible();
  await expect(submitButton).toBeVisible();
  await expect(clearButton).toBeVisible();
  await expect(submitButton).toBeDisabled();
  await expect(clearButton).toBeDisabled();
  await expectNoHorizontalOverflow(page);

  await input.fill(mobileQuery);
  await expect(input).toHaveValue(mobileQuery);
  await expect(submitButton).toBeEnabled();
  await expect(clearButton).toBeEnabled();
  await expect(page.getByText(searchStateCopy.sv.filteredSummaryPattern)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await submitButton.click();
  await expectSearchUrlWithQParam(page, mobileQuery);
  await expect(page.getByText(searchStateCopy.sv.filteredSummaryPattern)).toBeVisible();
  await expectLocatorInsideViewport(page, 'mobile submit button', submitButton);
  await expectLocatorInsideViewport(page, 'mobile clear button', clearButton);
  await expectNoHorizontalOverflow(page);

  await clearButton.click();
  await expect(input).toHaveValue('');
  await expect(submitButton).toBeDisabled();
  await expect(clearButton).toBeDisabled();
  await expect(page.getByText(searchStateCopy.sv.allTermsSummaryPattern)).toBeVisible();
  expectSearchUrlWithoutQueryParams(page);
  await expectNoHorizontalOverflow(page);

  expect(consoleErrors).toEqual([]);
});

test('search route resyncs when URL query params change after mount', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const input = await expectHydratedSearch(page, '/search?q=riksdag', 'riksdag');
  await input.fill('egen text');
  await expect(input).toHaveValue('egen text');

  await page.evaluate(() => {
    window.history.pushState({}, '', '/search?query=kommun');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await expectSearchState(page, 'kommun');

  await page.getByRole('button', { name: searchStateCopy.sv.clearButtonName }).click();
  await expect(input).toHaveValue('');
  await expect(page).toHaveURL(/\/search$/);

  await input.fill('lokal text');
  await expect(input).toHaveValue('lokal text');
  await page.evaluate(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(input).toHaveValue('lokal text');

  expect(consoleErrors).toEqual([]);
});

test('search question result links open the exact routed quiz question', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await expectQuestionResultNavigation({
    backSearchLinkName: /Sök efter övningsfrågor|Sök övningsfrågor/,
    expectedSearchQuery: 'riksdag',
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    language: 'sv',
    linkName: /Öppna övningsfrågan:/,
    linkPrefix: 'Öppna övningsfrågan: ',
    page,
    sourceSummaryLabel: 'Källa',
    sourceCitationLabel: 'Källhänvisning',
    url: '/search?q=riksdag',
  });

  await expectQuestionResultNavigation({
    backSearchLinkName: /Search for practice questions|Search questions/,
    expectedSearchQuery: 'kommun',
    inputName: 'Search civic terms and practice questions',
    language: 'en',
    linkName: /Open practice question:/,
    linkPrefix: 'Open practice question: ',
    page,
    sourceSummaryLabel: 'Source',
    sourceCitationLabel: 'Source citation',
    url: '/search?query=kommun',
  });

  expect(consoleErrors).toEqual([]);
});

test('direct quiz visits keep the search backlink query-free', async ({ page }) => {
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const backToSearchLink = page
    .getByRole('link', { name: /Search for practice questions/ })
    .first();
  await expect(backToSearchLink).toBeVisible();
  await expect(backToSearchLink).toHaveAttribute('href', '/search');

  await backToSearchLink.click();
  await expect(page).toHaveURL(/\/search$/);
  expectSearchUrlWithoutQueryParams(page);
});

test('direct quiz visits ignore malformed and overlong search backlink params', async ({
  page,
}) => {
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);

  const overlongQuery = 'r'.repeat(121);
  const malformedQuizUrls = [
    '/quiz/q001?q=',
    `/quiz/q001?q=${encodeURIComponent('   ')}`,
    `/quiz/q001?q=${overlongQuery}`,
    `/quiz/q001?query=${overlongQuery}`,
  ];

  for (const quizUrl of malformedQuizUrls) {
    await page.goto(quizUrl, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const backToSearchLink = page
      .getByRole('link', { name: /Search for practice questions/ })
      .first();
    await expect(backToSearchLink).toBeVisible();
    await expect(backToSearchLink).toHaveAttribute('href', '/search');

    await backToSearchLink.click();
    await expect(page).toHaveURL(/\/search$/);
    expectSearchUrlWithoutQueryParams(page);
  }
});
