import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen } from './browserLaunch';

async function switchQuestionLanguage(page: Page, language: 'sv' | 'en') {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const label =
    language === 'sv'
      ? /Byt frågespråk till Svenska|Set question language to Swedish/
      : /Byt frågespråk till Engelskt stöd|Set question language to English support/;
  const selectedLabel =
    language === 'sv' ? 'Byt frågespråk till Svenska' : 'Set question language to English support';

  await page.getByLabel(label).click();
  await expect(page.getByLabel(selectedLabel)).toHaveAttribute('aria-selected', 'true');
  await page.evaluate((nextLanguage) => {
    window.localStorage.setItem('settings\\language', nextLanguage);
  }, language);
}

async function expectNoConsoleErrors(page: Page, consoleErrors: string[]) {
  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toEqual([]);
}

test('practice source drawer renders natural English close copy and preserves Swedish toggle copy', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await markAboutTheTestSeen(page);
  await switchQuestionLanguage(page, 'en');

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Question 1')).toBeVisible();

  const aboutSources = page.getByRole('button', { name: 'About the sources' });
  await expect(aboutSources).toHaveAttribute('aria-expanded', 'false');
  await aboutSources.click();

  const closeSourceDetails = page.getByRole('button', { name: 'Close source details' });
  await expect(closeSourceDetails).toBeVisible();
  await expect(closeSourceDetails).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Close source details', { exact: true })).toBeVisible();
  await expect(page.getByText(/Close about-the-sources|about-the-sources/)).toHaveCount(0);
  await expect(page.getByText('UHR source', { exact: true }).first()).toBeVisible();

  await closeSourceDetails.click();
  await expect(page.getByRole('button', { name: 'About the sources' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await switchQuestionLanguage(page, 'sv');
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const omKallorna = page.getByRole('button', { name: 'Om källorna' });
  await expect(omKallorna).toHaveAttribute('aria-expanded', 'false');
  await omKallorna.click();

  const stangOmKallorna = page.getByRole('button', { name: 'Stäng om källorna' });
  await expect(stangOmKallorna).toBeVisible();
  await expect(stangOmKallorna).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Stäng om källorna', { exact: true })).toBeVisible();
  await expect(page.getByText('UHR-källa', { exact: true }).first()).toBeVisible();
  await stangOmKallorna.click();
  await expect(page.getByRole('button', { name: 'Om källorna' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await expectNoConsoleErrors(page, consoleErrors);
});
