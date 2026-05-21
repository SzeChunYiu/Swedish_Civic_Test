import { expect, test, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

async function expectSearchState(page: Page, expectedQuery: string) {
  const input = page.getByRole('textbox', { name: 'Sök samhällsbegrepp och övningsfrågor' });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(expectedQuery);
  await expect(page.getByText(/\d+ av \d+ begrepp och \d+ övningsfrågor matchar/)).toBeVisible();
  await expect(page.getByText(new RegExp(expectedQuery, 'i')).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Öppna övningsfrågan:/ }).first()).toBeVisible();

  return input;
}

function expectSearchUrlWithoutQueryParams(page: Page) {
  const url = new URL(page.url());

  expect(url.pathname).toBe('/search');
  expect(url.searchParams.has('q')).toBe(false);
  expect(url.searchParams.has('query')).toBe(false);
}

async function expectHydratedSearch(page: Page, url: string, expectedQuery: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  return expectSearchState(page, expectedQuery);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function expectQuestionResultNavigation({
  inputName,
  language,
  linkName,
  linkPrefix,
  page,
  sourceSummaryLabel,
  sourceCitationLabel,
  url,
}: {
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
  await expect(page).toHaveURL(new RegExp(`/quiz/${questionId}$`));
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
}

test('search route hydrates q and query URL parameters before typing', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const riksdagInput = await expectHydratedSearch(page, '/search?q=riksdag', 'riksdag');
  await page.getByRole('button', { name: 'Rensa sökfältet' }).click();
  await expect(riksdagInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);
  await expect(page.getByText(/\d+ samhällsbegrepp i referensen/)).toBeVisible();

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(riksdagInput).toHaveValue('');
  await expect(page.getByText(/\d+ samhällsbegrepp i referensen/)).toBeVisible();

  const kommunInput = await expectHydratedSearch(page, '/search?query=kommun', 'kommun');
  await page.getByRole('button', { name: 'Rensa sökfältet' }).click();
  await expect(kommunInput).toHaveValue('');
  expectSearchUrlWithoutQueryParams(page);

  await kommunInput.fill('demokrati');
  await expect(kommunInput).toHaveValue('demokrati');
  expectSearchUrlWithoutQueryParams(page);

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

  await page.getByRole('button', { name: 'Rensa sökfältet' }).click();
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
