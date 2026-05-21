import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  currentSettingsSeenAboutStorageKey,
  dismissBlockingModals,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function seedFreshSettings(page: Page, language: AppLanguage) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await seedSettingsLanguage(page, language);
}

test.use({ viewport: { width: 390, height: 844 } });

test('about-the-test route marks the first-run guide as seen after render', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await seedFreshSettings(page, 'en');

  await page.goto('/about-the-test', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', { name: 'What is the Swedish civic test?' }).last(),
  ).toBeVisible();
  await page.waitForFunction(
    (storageKey) => window.localStorage.getItem(storageKey) === 'true',
    currentSettingsSeenAboutStorageKey,
  );

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('button', { name: 'Skip the guide' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open the about-the-test guide' })).toHaveCount(0);
  await expect(page.getByText('Prepare calmly, one civic concept at a time')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
