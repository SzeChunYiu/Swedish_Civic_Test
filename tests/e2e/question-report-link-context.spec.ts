import { expect, test } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

function supportUrl(params: Record<string, string>) {
  return `/support?${new URLSearchParams(params).toString()}`;
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
