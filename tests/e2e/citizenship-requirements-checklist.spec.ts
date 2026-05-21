import { expect, test } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
} from './browserLaunch';

const checklistStorageKey = 'citizenship-requirements\\citizenshipRequirements.checkedAreaIds.v1';

test('citizenship requirements checklist persists checked planning areas', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);
  await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const identity = page.getByRole('checkbox', {
    name: /I can prove my identity or have checked which exception route applies/i,
  });
  const residenceStatus = page.getByRole('checkbox', {
    name: /I have checked that my residence status fits the right category/i,
  });

  await expect(identity).toHaveAttribute('aria-checked', 'false');
  await expect(residenceStatus).toHaveAttribute('aria-checked', 'false');
  const identityApplicationSource = page.getByRole('link', {
    name: /Source for Proven identity: Migrationsverket: Apply for Swedish citizenship/i,
  });
  const identityRulesSource = page.getByRole('link', {
    name: /Source for Proven identity: Migrationsverket: New rules for Swedish citizenship from 6 June 2026/i,
  });

  await expect(identityApplicationSource).toContainText('Apply for Swedish citizenship');
  await expect(identityApplicationSource).toContainText('Checked 2026-05-19');
  await expect(identityApplicationSource).toContainText('migrationsverket.se');
  await expect(identityRulesSource).toContainText(
    'New rules for Swedish citizenship from 6 June 2026',
  );
  await expect(identityRulesSource).toContainText('Source date 2026-05-06');

  await identity.click();
  await residenceStatus.click();

  await expect(identity).toHaveAttribute('aria-checked', 'true');
  await expect(residenceStatus).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('You have marked 2 of 7 planning items.')).toBeVisible();

  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), checklistStorageKey))
    .toBe(JSON.stringify(['identity', 'residenceStatus']));

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(identity).toHaveAttribute('aria-checked', 'true');
  await expect(residenceStatus).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('You have marked 2 of 7 planning items.')).toBeVisible();

  expect(consoleErrors.get()).toEqual([]);
});
