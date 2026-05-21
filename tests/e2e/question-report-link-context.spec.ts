import { expect, test, type Page } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';
import { startAllVisiblePractice } from './practiceHub';

function supportUrl(params: Record<string, string>) {
  return `/support?${new URLSearchParams(params).toString()}`;
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

function collectUnexpectedSubmissions(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      requests.push(request.url());
    }
  });
  return requests;
}

async function expectEnglishReportContext(
  page: Page,
  {
    questionId,
    screen,
    selectedAnswer,
  }: {
    questionId: string | RegExp;
    screen: string;
    selectedAnswer: string;
  },
) {
  await expect(page).toHaveURL(/\/support\?/);
  await expect(page).toHaveURL(/language=en/);
  await expect(page).toHaveURL(/selectedAnswer=/);
  await expect(page.getByRole('heading', { name: 'Support and feedback' })).toBeVisible();
  const context = page.getByRole('region', { name: /Report context for question q\d+/ });
  await expect(context).toBeVisible();
  await expect(context.getByText('Question report context')).toBeVisible();
  await expect(context.getByText('Question ID')).toBeVisible();
  if (typeof questionId === 'string') {
    await expect(context.getByText(questionId, { exact: true })).toBeVisible();
  } else {
    await expect(context.getByText(questionId)).toBeVisible();
  }
  await expect(context.getByText('Source', { exact: true })).toBeVisible();
  await expect(context.getByText(/Source: Sverige i fokus/)).toBeVisible();
  await expect(context.getByText('Active language')).toBeVisible();
  await expect(context.getByText('en', { exact: true })).toBeVisible();
  await expect(context.getByText('Screen')).toBeVisible();
  await expect(context.getByText(screen, { exact: true })).toBeVisible();
  await expect(context.getByText('Selected answer')).toBeVisible();
  await expect(context.getByText(selectedAnswer, { exact: true })).toBeVisible();
  await expect(
    context.getByText(/Do not add names, personal identity numbers, case numbers/),
  ).toBeVisible();
}

test.use({ viewport: { width: 390, height: 844 } });

test('support question report context trims valid app-generated params', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto(
    supportUrl({
      language: ' en ',
      questionId: ' q001 ',
      screen: ' exam ',
      selectedAnswer: ' In northern Europe ',
      source: ' Source: Sverige i fokus, Landet Sverige, Geografi, p. 5 ',
    }),
    { waitUntil: 'networkidle' },
  );
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Support and feedback' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Report context for question q001' }),
  ).toBeVisible();
  await expect(page.getByText('Question ID')).toBeVisible();
  await expect(page.getByText('q001', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Source: Sverige i fokus, Landet Sverige, Geografi, p. 5', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Active language')).toBeVisible();
  await expect(page.getByText('en', { exact: true })).toBeVisible();
  await expect(page.getByText('Mock exam', { exact: true })).toBeVisible();
  await expect(page.getByText('In northern Europe', { exact: true })).toBeVisible();
});

test('support question report context drops hostile direct URL params', async ({ page }) => {
  const overlongValue = 'x'.repeat(360);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto(
    supportUrl({
      language: 'de',
      questionId: 'q001',
      screen: 'unknown-screen',
      selectedAnswer: overlongValue,
      source: overlongValue,
    }),
    { waitUntil: 'networkidle' },
  );
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Support och återkoppling' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Rapportkontext för frågan q001' })).toBeVisible();
  await expect(page.getByText('q001', { exact: true })).toBeVisible();
  await expect(page.getByText('Saknas', { exact: true })).toBeVisible();
  await expect(page.getByText('sv', { exact: true })).toBeVisible();
  await expect(page.getByText('Övning', { exact: true })).toBeVisible();
  await expect(page.getByText(overlongValue)).toHaveCount(0);

  await page.goto(supportUrl({ questionId: 'not-a-question', source: 'Source: arbitrary' }), {
    waitUntil: 'networkidle',
  });
  await dismissBlockingModals(page);

  await expect(page.getByText('Kontext för frågerapport')).toHaveCount(0);
  await expect(page.getByText('not-a-question')).toHaveCount(0);
  await expect(page.getByText('Source: arbitrary')).toHaveCount(0);
});

test('practice report link carries selected answer and source context to Support', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  const unexpectedSubmissions = collectUnexpectedSubmissions(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, 'en');
  await page.getByLabel('Select answer In southern Europe').click();
  await expect(page.getByRole('link', { name: /Report question q\d+/ })).toBeVisible();

  await page.getByRole('link', { name: /Report question q\d+/ }).click();

  await expect(page).toHaveURL(/reportScreen=practice/);
  await expectEnglishReportContext(page, {
    questionId: 'q001',
    screen: 'Practice',
    selectedAnswer: 'In southern Europe',
  });
  expect(unexpectedSubmissions).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('routed quiz report link carries selected answer and source context to Support', async ({
  page,
}) => {
  const pageErrors = collectPageErrors(page);
  const unexpectedSubmissions = collectUnexpectedSubmissions(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Where is Sweden located?' })).toBeVisible();
  await page.getByLabel('Select answer In southern Europe').click();
  await expect(page.getByRole('link', { name: 'Report question q001' })).toBeVisible();

  await page.getByRole('link', { name: 'Report question q001' }).click();

  await expect(page).toHaveURL(/questionId=q001/);
  await expect(page).toHaveURL(/reportScreen=quiz/);
  await expectEnglishReportContext(page, {
    questionId: 'q001',
    screen: 'Quiz session',
    selectedAnswer: 'In southern Europe',
  });
  expect(unexpectedSubmissions).toEqual([]);
  expect(pageErrors).toEqual([]);
});
