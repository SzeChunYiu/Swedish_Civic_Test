import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function expectTapTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function openPracticeRouteMode(page: Page, mode: 'challenge' | 'quick') {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto(`/practice?mode=${mode}`, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

function collectPageErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectPracticeHub(page: Page, expectedUrl: RegExp, label: string) {
  await expect(page).toHaveURL(expectedUrl);
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(page.getByText('Practice hub', { exact: true })).toBeVisible();
  await expect(page.getByText('Question 1', { exact: true })).toHaveCount(0);

  const fullBank = page.getByRole('button', { name: 'Start practice with all visible questions' });
  await expect(fullBank).toBeVisible();
  await expectTapTarget(fullBank, `${label} full-bank action`);
}

async function expectInvalidModeStaysOnPracticeHub(page: Page, mode: 'review' | 'bad') {
  const consoleErrors = collectPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto(`/practice?mode=${mode}`, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectPracticeHub(page, new RegExp(`/practice\\?mode=${mode}`), `mode=${mode}`);
  expect(consoleErrors).toEqual([]);
}

async function expectQuestionMode(page: Page, mode: 'challenge' | 'quick') {
  const consoleErrors = collectPageErrors(page);

  await openPracticeRouteMode(page, mode);

  await expect(page).toHaveURL(new RegExp(`/practice\\?mode=${mode}`));
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toHaveCount(0);
  await expect(page.getByText('Practice hub', { exact: true })).toHaveCount(0);

  const firstOption = page.getByRole('radio').first();
  await expect(firstOption).toBeVisible();
  await expectTapTarget(firstOption, `${mode} first answer option`);
  await firstOption.click();

  const nextQuestion = page.getByRole('button', { name: 'Move to the next practice question' });
  await expect(nextQuestion).toBeVisible();
  await expectTapTarget(nextQuestion, `${mode} next-question action`);
  expect(consoleErrors).toEqual([]);
}

test('challenge route mode bypasses the Practice hub and opens the daily question set', async ({
  page,
}) => {
  await expectQuestionMode(page, 'challenge');
});

test('quick route mode bypasses the Practice hub and opens the ten-question set', async ({
  page,
}) => {
  await expectQuestionMode(page, 'quick');
});

test('plain Practice route stays on the Practice hub', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectPracticeHub(page, /\/practice$/, 'plain Practice');
});

test('invalid mode=review route stays on the Practice hub', async ({ page }) => {
  await expectInvalidModeStaysOnPracticeHub(page, 'review');
});

test('invalid mode=bad route stays on the Practice hub', async ({ page }) => {
  await expectInvalidModeStaysOnPracticeHub(page, 'bad');
});
