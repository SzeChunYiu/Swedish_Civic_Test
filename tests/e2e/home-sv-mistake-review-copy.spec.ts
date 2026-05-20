import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const forbiddenSwedishMistakeCopy = /felspårning|repetition av misstag/i;

test.use({ viewport: { width: 390, height: 844 } });

async function seedCleanLanguage(page: Page, language: AppLanguage) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
}

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectHomeWithoutHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return {
      bodyScrollWidth: body.scrollWidth,
      clientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
    };
  });

  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test('home renders natural Swedish missed-question review copy', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedCleanLanguage(page, 'sv');
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/genomgång av frågor du missat/i).first()).toBeVisible();
  await expect(page.getByText(/missade frågor, ljud och redoindikator/i).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(forbiddenSwedishMistakeCopy);
  await expectHomeWithoutHorizontalOverflow(page);
  expect(consoleErrors).toEqual([]);
});

test('home keeps intentional English mistake-review copy in support mode', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedCleanLanguage(page, 'en');
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByText(/mistake review/i).first()).toBeVisible();
  await expect(
    page.getByText(/mistake tracking, audio, and readiness signals/i).first(),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/genomgång av frågor du missat/i);
  await expectHomeWithoutHorizontalOverflow(page);
  expect(consoleErrors).toEqual([]);
});
