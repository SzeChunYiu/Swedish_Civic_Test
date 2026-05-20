import { expect, test, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const viewport = { width: 390, height: 844 };

async function openChapter(page: Page, language: AppLanguage) {
  await page.setViewportSize(viewport);
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/chapter/ch01', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('chapter detail and routed quiz render natural Swedish study terms', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await openChapter(page, 'sv');

  const body = page.locator('body');
  await expect(page.getByLabel('Starta kapitelövning för Landet Sverige')).toBeVisible();
  await expect(body).toContainText('Starta kapitelövning');
  await expect(body).toContainText('Övningsfrågor');
  await expect(body).not.toContainText('Starta quiz');
  await expect(body).not.toContainText('Quizpass');
  await expect(body).not.toContainText('quizfrågor');
  await expect(body).not.toContainText('quizfrågan');

  await page.getByLabel('Starta kapitelövning för Landet Sverige').click();

  await expect(page).toHaveURL(/\/quiz\/q001$/);
  await expect(body).toContainText('Frågepass');
  await expect(body).toContainText('Frågepass q001');
  await expect(body).not.toContainText('Starta quiz');
  await expect(body).not.toContainText('Quizpass');
  await expect(body).not.toContainText('quizfrågor');
  await expect(body).not.toContainText('quizfrågan');

  await page
    .getByLabel(/Välj svaret /)
    .first()
    .click();
  await expect(page.getByLabel('Försök igen med den här övningsfrågan')).toBeVisible();
  await expect(body).not.toContainText('quizfrågan');

  expect(pageErrors).toEqual([]);
});

test('chapter detail and routed quiz keep English quiz copy in support mode', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await openChapter(page, 'en');

  const body = page.locator('body');
  await expect(page.getByLabel('Start quiz for The country of Sweden')).toBeVisible();
  await expect(body).toContainText('Start quiz');
  await expect(body).toContainText('Practice questions');
  await expect(body).not.toContainText('Starta kapitelövning');
  await expect(body).not.toContainText('Frågepass');

  await page.getByLabel('Start quiz for The country of Sweden').click();

  await expect(page).toHaveURL(/\/quiz\/q001$/);
  await expect(body).toContainText('Quiz session');
  await expect(body).toContainText('Session q001');
  await expect(body).not.toContainText('Starta kapitelövning');
  await expect(body).not.toContainText('Frågepass q001');

  await page
    .getByLabel(/Select answer /)
    .first()
    .click();
  await expect(page.getByLabel('Try this quiz question again')).toBeVisible();

  expect(pageErrors).toEqual([]);
});
