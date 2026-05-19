import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();
  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

async function enableSwedish(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page.getByLabel(/Byt frågespråk till Svenska|Set question language to Swedish/).click();
  await expect(page.getByLabel('Byt frågespråk till Svenska')).toHaveAttribute(
    'aria-selected',
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
  await dismissBlockingModals(page);

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
  await dismissBlockingModals(page);

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
  await dismissBlockingModals(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

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
  await dismissBlockingModals(page);

  await expect(
    page.getByText('Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5'),
  ).toBeVisible();
  await expect(
    page.getByLabel(/Källhänvisning: Källa: Sverige i fokus, Landet Sverige/),
  ).toBeVisible();
  await expect(page.getByText(/Källa\/Source:/)).toHaveCount(0);

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByText('Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5'),
  ).toBeVisible();
  await expect(
    page.getByLabel(/Source citation: Source: Sverige i fokus, Landet Sverige/),
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
  await dismissBlockingModals(page);

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByText('Easy', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Difficulty: Easy/)).toBeVisible();
  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer In the Nordic region in northern Europe');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(page.getByText('In the Nordic region in northern Europe — Correct')).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByText('Explanation')).toBeVisible();
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
  await dismissBlockingModals(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByText('In southern Europe — Wrong')).toBeVisible();
  await expect(
    page.getByText('In the Nordic region in northern Europe — Correct answer'),
  ).toBeVisible();
  await expect(page.getByText('I södra Europa — Fel')).toHaveCount(0);
  await expect(page.getByText('I Norden i norra Europa — Rätt svar')).toHaveCount(0);
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
  await dismissBlockingModals(page);

  await expectPrimaryPrompt(page, 'Var ligger Sverige?', 'Where is Sweden located?');
  await page.getByLabel('Välj svaret I södra Europa').click();

  await expect(page.getByText('I södra Europa — Fel')).toBeVisible();
  await expect(page.getByText('I Norden i norra Europa — Rätt svar')).toBeVisible();

  await page.getByText('Misstag', { exact: true }).click();
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText('Fel svar att repetera')).toBeVisible();
  await expect(page.getByText('Ditt senaste felaktiga svar')).toBeVisible();
  await expect(page.getByText('I södra Europa', { exact: true })).toBeVisible();
  await expect(page.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(page.getByText('I Norden i norra Europa', { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(
      'Svar att repetera. Ditt senaste felaktiga svar: I södra Europa. Rätt svar: I Norden i norra Europa.',
    ),
  ).toBeVisible();

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
  await dismissBlockingModals(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByText('In southern Europe — Wrong')).toBeVisible();
  await expect(
    page.getByText('In the Nordic region in northern Europe — Correct answer'),
  ).toBeVisible();

  await page.getByText('Mistakes', { exact: true }).click();
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText('Wrong answers to revisit')).toBeVisible();
  await expect(page.getByText('Your latest wrong answer')).toBeVisible();
  await expect(page.getByText('In southern Europe', { exact: true })).toBeVisible();
  await expect(page.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(
    page.getByText('In the Nordic region in northern Europe', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Answers to review. Your latest wrong answer: In southern Europe. Correct answer: In the Nordic region in northern Europe.',
    ),
  ).toBeVisible();
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
  await dismissBlockingModals(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByText('In southern Europe — Wrong')).toBeVisible();
  await expect(
    page.getByText('In the Nordic region in northern Europe — Correct answer'),
  ).toBeVisible();
  await expect(page.getByText('I södra Europa — Fel')).toHaveCount(0);
  await expect(page.getByText('I Norden i norra Europa — Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
