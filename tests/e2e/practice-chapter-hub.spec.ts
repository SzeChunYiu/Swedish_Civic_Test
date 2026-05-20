import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const mobileViewport = { width: 390, height: 844 };

async function openPractice(page: Page, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.setViewportSize(mobileViewport);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

test('practice hub starts quick and chapter-scoped rounds', async ({ page }) => {
  await openPractice(page, 'sv');

  await expect(page.getByRole('heading', { name: 'Välj hur du vill öva' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Starta snabbmix med 10 frågor/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gå till övningsprovet' })).toBeVisible();

  await page.getByRole('button', { name: /Starta snabbmix med 10 frågor/ }).click();
  await expect(page.getByText('Snabbmix', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Aktivt läge: Snabbmix')).toBeVisible();

  await page
    .getByRole('button', { name: /Starta frågepass för Sveriges demokratiska system/ })
    .click();
  await expect(
    page.getByText('Sveriges demokratiska system', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Aktivt läge: Sveriges demokratiska system')).toBeVisible();
});

test('practice hub localizes English start choices', async ({ page }) => {
  await openPractice(page, 'en');

  await expect(page.getByRole('heading', { name: 'Choose how to practise' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Start a quick mix with 10 questions/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Start a practice round for Sweden's democratic system/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the mock exam' })).toBeVisible();
});
