import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
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

  await expect(page.getByText('Medel', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Svårighetsgrad: Medel/)).toBeVisible();
  await expect(page.getByText('MEDIUM', { exact: true })).toHaveCount(0);
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

  await expect(page.getByLabel('Välj svaret Cirka 160 kilometer')).toBeVisible();
  await expect(page.getByLabel('Select answer Cirka 160 kilometer')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Select answer About 160 kilometres')).toBeVisible();
  await expect(page.getByLabel('Välj svaret About 160 kilometres')).toHaveCount(0);

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
    page.getByText('Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5', {
      exact: true,
    }),
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
    page.getByText('Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5', {
      exact: true,
    }),
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

test('practice provenance source note collapses when advancing to a new question', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText('Question 1')).toBeVisible();
  const provenance = page.getByRole('button', { name: /Provenance: UHR source/ }).first();
  const sourceNote = page.getByText(/^Source note:/);
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await expect(sourceNote).toHaveCount(0);

  await provenance.click();
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');
  await expect(sourceNote).toBeVisible();

  await page.getByLabel('Select answer In the Nordic region in northern Europe').click();
  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus, /).first()).toBeVisible();
  await expect(sourceNote).toHaveCount(0);
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');

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
  await expect(page.getByText('Medium', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Difficulty: Medium/)).toBeVisible();
  await expectPrimaryPrompt(
    page,
    'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
  );
  await expect(page.getByText(/Adaptive mix:/)).toBeVisible();
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer About 1,600 kilometres');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(page.getByLabel('About 1,600 kilometres, Correct')).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explanation' })).toBeVisible();
  await expect(page.getByText(/Sweden is an elongated country/)).toBeVisible();
  await expect(page.getByText('UHR reference')).toBeVisible();
  await expect(page.getByText('Landet Sverige · Geografi, klimat och natur')).toBeVisible();
  await expect(page.getByText('Approx. page 5')).toBeVisible();

  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: "Which list contains only Sweden's four constitutional laws?",
    }),
  ).toBeVisible();
  await expect(page.getByText('Hard', { exact: true })).toBeVisible();
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

  await expectPrimaryPrompt(
    page,
    'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
  );
  await page.getByLabel('Select answer About 160 kilometres').click();

  await expect(page.getByLabel('About 160 kilometres, Wrong')).toBeVisible();
  await expect(page.getByLabel('About 1,600 kilometres, Correct answer')).toBeVisible();
  await expect(page.getByLabel('Cirka 160 kilometer, Fel')).toHaveCount(0);
  await expect(page.getByLabel('Cirka 1 600 kilometer, Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is an elongated country/)).toBeVisible();

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

  await expectPrimaryPrompt(
    page,
    'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
    'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
  );
  await page.getByLabel('Välj svaret Cirka 160 kilometer').click();

  await expect(page.getByLabel('Cirka 160 kilometer, Fel')).toBeVisible();
  await expect(page.getByLabel('Cirka 1 600 kilometer, Rätt svar')).toBeVisible();

  await page.getByText('Repetition', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const swedishMistakeReview = page.getByLabel(
    'Fråga att öva igen. Ditt senaste svar: Cirka 160 kilometer. Rätt svar: Cirka 1 600 kilometer.',
  );
  await expect(page.getByText('Frågor att öva igen')).toBeVisible();
  await expect(page.getByText('Ditt senaste svar')).toBeVisible();
  await expect(
    swedishMistakeReview.getByText('Cirka 160 kilometer', { exact: true }),
  ).toBeVisible();
  await expect(swedishMistakeReview.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(
    swedishMistakeReview.getByText('Cirka 1 600 kilometer', { exact: true }),
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

  await expectPrimaryPrompt(
    page,
    'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
  );
  await page.getByLabel('Select answer About 160 kilometres').click();

  await expect(page.getByLabel('About 160 kilometres, Wrong')).toBeVisible();
  await expect(page.getByLabel('About 1,600 kilometres, Correct answer')).toBeVisible();

  await page.getByText('Mistakes', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const englishMistakeReview = page.getByLabel(
    'Answers to review. Your latest wrong answer: About 160 kilometres. Correct answer: About 1,600 kilometres.',
  );
  await expect(page.getByText('Wrong answers to revisit')).toBeVisible();
  await expect(page.getByText('Your latest wrong answer')).toBeVisible();
  await expect(
    englishMistakeReview.getByText('About 160 kilometres', { exact: true }),
  ).toBeVisible();
  await expect(englishMistakeReview.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(
    englishMistakeReview.getByText('About 1,600 kilometres', { exact: true }),
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
