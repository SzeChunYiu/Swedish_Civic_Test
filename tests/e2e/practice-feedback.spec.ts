import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

async function closeLaunchAdIfPresent(page: Page) {
  await dismissBlockingModals(page);
}

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await page
    .getByLabel(/Byt studiespråk till Engelskt stöd|Set study language to English support/)
    .click();
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );
}

async function enableSwedish(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await page.getByLabel(/Byt studiespråk till Svenska|Set study language to Swedish/).click();
  await expect(page.getByLabel('Byt studiespråk till Svenska')).toHaveAttribute(
    'aria-checked',
    'true',
  );
}

async function expectPrimaryPrompt(page: Page, primaryText: string, secondaryText: string) {
  const primaryPrompt = page.getByText(primaryText, { exact: true }).first();
  const secondaryPrompt = page.getByText(secondaryText, { exact: true }).first();

  await expect(primaryPrompt).toBeVisible();
  await expect(secondaryPrompt).toBeVisible();

  const primaryBox = await primaryPrompt.boundingBox();
  const secondaryBox = await secondaryPrompt.boundingBox();

  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect(primaryBox!.y).toBeLessThan(secondaryBox!.y);
}

test('practice audio control follows the selected question language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByText('Lätt', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Svårighetsgrad: Lätt/)).toBeVisible();
  await expect(page.getByText('EASY', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice and routed quiz answer option labels follow the selected language', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice question source citation prefix follows the selected language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(
    page.getByText('Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5'),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Källhänvisning: Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Källa\/Source:/)).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(
    page.getByText('Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5'),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Source citation: Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Källa\/Source:/)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice flow answers a question, shows source feedback, and advances', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByText('Easy', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Difficulty: Easy/)).toBeVisible();
  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer In the Nordic region in northern Europe');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(page.getByLabel('In the Nordic region in northern Europe, Correct')).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explanation' })).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();
  await expect(page.getByText('UHR reference')).toBeVisible();
  await expect(page.getByText('Landet Sverige · Geografi, klimat och natur')).toBeVisible();
  await expect(page.getByText('Approx. page 5')).toBeVisible();

  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(
    page.getByText("Sweden's northernmost part lies north of the Arctic Circle."),
  ).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice feedback reveals the correct option after a wrong answer', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(page.getByLabel('I södra Europa, Fel')).toHaveCount(0);
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('wrong practice answer appears in Mistakes with answer review context', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expectPrimaryPrompt(page, 'Var ligger Sverige?', 'Where is Sweden located?');
  await page.getByLabel('Välj svaret I södra Europa').click();

  await expect(page.getByLabel('I södra Europa, Fel')).toBeVisible();
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toBeVisible();

  await page.getByText('Repetition', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const swedishMistakeReview = page.getByLabel(
    'Svar att repetera. Ditt senaste felaktiga svar: I södra Europa. Rätt svar: I Norden i norra Europa.',
  );
  await expect(page.getByText('Fel svar att repetera')).toBeVisible();
  await expect(page.getByText('Ditt senaste felaktiga svar')).toBeVisible();
  await expect(swedishMistakeReview.getByText('I södra Europa', { exact: true })).toBeVisible();
  await expect(swedishMistakeReview.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(
    swedishMistakeReview.getByText('I Norden i norra Europa', { exact: true }),
  ).toBeVisible();
  await expect(swedishMistakeReview).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('wrong practice answer appears in Mistakes with English answer review context', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();

  await page.getByText('Mistakes', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const englishMistakeReview = page.getByLabel(
    'Answers to review. Your latest wrong answer: In southern Europe. Correct answer: In the Nordic region in northern Europe.',
  );
  await expect(page.getByText('Wrong answers to revisit')).toBeVisible();
  await expect(page.getByText('Your latest wrong answer')).toBeVisible();
  await expect(englishMistakeReview.getByText('In southern Europe', { exact: true })).toBeVisible();
  await expect(englishMistakeReview.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(
    englishMistakeReview.getByText('In the Nordic region in northern Europe', { exact: true }),
  ).toBeVisible();
  await expect(englishMistakeReview).toBeVisible();
  await expect(page.getByText('Ditt senaste felaktiga svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('routed quiz uses English question headings and answer feedback in English support mode', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(page.getByLabel('I södra Europa, Fel')).toHaveCount(0);
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('unknown routed quiz shows an empty state instead of a hashed question', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/quiz/not-a-question', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByRole('heading', { name: 'Question not found' })).toBeVisible();
  await expect(
    page.getByText('We could not find a practice question for this link.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to practice' })).toHaveAttribute(
    'href',
    '/practice',
  );
  await expect(page.getByRole('link', { name: 'Search for practice questions' })).toHaveAttribute(
    'href',
    '/search',
  );
  await expect(page.getByText('Session not-a-question')).toHaveCount(0);
  await expect(page.getByText('Where is Sweden located?')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Select answer/ })).toHaveCount(0);

  await enableSwedish(page);
  await page.goto('/quiz/okand-fraga', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByRole('heading', { name: 'Frågan hittades inte' })).toBeVisible();
  await expect(page.getByText('Vi hittar ingen övningsfråga för den här länken.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tillbaka till övning' })).toHaveAttribute(
    'href',
    '/practice',
  );
  await expect(page.getByRole('link', { name: 'Sök efter övningsfrågor' })).toHaveAttribute(
    'href',
    '/search',
  );
  await expect(page.getByText('Frågepass okand-fraga')).toHaveCount(0);
  await expect(page.getByText('Var ligger Sverige?')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Välj svaret/ })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
