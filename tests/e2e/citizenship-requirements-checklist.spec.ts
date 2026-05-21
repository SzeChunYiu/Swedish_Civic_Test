import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
} from './browserLaunch';

const checklistStorageKey = 'citizenship-requirements\\citizenshipRequirements.checkedAreaIds.v1';

const areaSourceLayoutCases = [
  {
    accessibleName: /Källa för Styrkt identitet: Migrationsverket: Ansök om svenskt medborgarskap/i,
    checkedText: 'Kontrollerad 2026-05-19',
    language: 'sv',
    title: 'Ansök om svenskt medborgarskap',
    urlPart: 'migrationsverket.se',
    viewport: { height: 844, width: 390 },
    viewportName: 'mobile',
  },
  {
    accessibleName: /Source for Proven identity: Migrationsverket: Apply for Swedish citizenship/i,
    checkedText: 'Checked 2026-05-19',
    language: 'en',
    title: 'Apply for Swedish citizenship',
    urlPart: 'migrationsverket.se',
    viewport: { height: 800, width: 1024 },
    viewportName: 'desktop',
  },
] as const;

async function openRequirementsRoute(page: Page, language: 'sv' | 'en') {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectNoHorizontalOverflow(page: Page) {
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

async function getPaint(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
    };
  });
}

async function expectSourceRowFits(locator: Locator) {
  const metrics = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      scrollWidth: element.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.height).toBeGreaterThanOrEqual(44);
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

for (const fixture of areaSourceLayoutCases) {
  test(`citizenship requirements area source rows fit and focus on ${fixture.viewportName} in ${fixture.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);

    await page.setViewportSize(fixture.viewport);
    await openRequirementsRoute(page, fixture.language);

    const sourceRow = page.getByRole('link', { name: fixture.accessibleName }).first();
    await expect(sourceRow).toBeVisible();
    await expect(sourceRow).toContainText(fixture.title);
    await expect(sourceRow).toContainText(fixture.checkedText);
    await expect(sourceRow).toContainText(fixture.urlPart);
    await expectSourceRowFits(sourceRow);
    await expectNoHorizontalOverflow(page);

    const beforeFocus = await getPaint(sourceRow);
    await sourceRow.focus();
    await expect(sourceRow).toBeFocused();
    const afterFocus = await getPaint(sourceRow);

    expect(afterFocus.borderColor).not.toBe(beforeFocus.borderColor);
    expect(afterFocus.backgroundColor).not.toBe(beforeFocus.backgroundColor);
    expect(consoleErrors.get()).toEqual([]);
  });
}

test('citizenship requirements checklist persists checked planning areas', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await openRequirementsRoute(page, 'en');

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
