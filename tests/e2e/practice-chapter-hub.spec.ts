import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function seedEnglishHub(page: Page) {
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);
}

async function expectTapTarget(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

test('practice opens on a localized hub with chapter cards and mock exam link', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(page.getByText('Practice hub', { exact: true })).toBeVisible();
  await expect(page.getByText(/You have answered 0 of \d+ visible questions\./)).toBeVisible();
  await expect(page.getByText('Question 1')).toHaveCount(0);

  const allPractice = page.getByRole('button', {
    name: 'Start practice with all visible questions',
  });
  const quickRound = page.getByRole('button', { name: 'Start a quick round with 10 questions' });
  const mockExam = page.getByRole('link', { name: 'Go to the mock exam' });
  const chapterCard = page.getByRole('button', {
    name: /Sweden's democratic system: 0 of \d+ questions answered, 0% accuracy\. Practise this chapter\./,
  });

  await expectTapTarget(allPractice, 'all-practice CTA');
  await expectTapTarget(quickRound, 'quick-round CTA');
  await expectTapTarget(mockExam, 'mock exam link');
  await expectTapTarget(chapterCard, 'chapter practice card');
  expect(consoleErrors).toEqual([]);
});

test('chapter selection starts a chapter-scoped practice loop', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page
    .getByRole('button', {
      name: /Sweden's democratic system: 0 of \d+ questions answered, 0% accuracy\. Practise this chapter\./,
    })
    .click();

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What does democracy mean?' })).toBeVisible();
  await expect(page.getByText('Choose how to practise')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('chapter reader report link opens source context without selected answer', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedEnglishHub(page);
  await page.goto('/chapter/ch02', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const reportLink = page.getByRole('link', { name: /Report question q\d+/ }).first();
  await expect(reportLink).toBeVisible();
  await expectTapTarget(reportLink, 'chapter question report link');
  await reportLink.click();

  await expect(page).toHaveURL(/\/support\?/);
  await expect(page).toHaveURL(/screen=chapter/);
  await expect(page).not.toHaveURL(/selectedAnswer=/);
  await expect(page.getByText('Question report context')).toBeVisible();
  await expect(page.getByText('Question ID')).toBeVisible();
  await expect(page.getByText('Source')).toBeVisible();
  await expect(page.getByText(/Source: Sverige i fokus/)).toBeVisible();
  await expect(page.getByText('Active language')).toBeVisible();
  await expect(page.getByText('en')).toBeVisible();
  await expect(page.getByText('Screen')).toBeVisible();
  await expect(page.getByText('Chapter')).toBeVisible();
  await expect(page.getByText('Selected answer')).toHaveCount(0);
  await expect(
    page.getByText(/Do not add names, personal identity numbers, case numbers/),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
