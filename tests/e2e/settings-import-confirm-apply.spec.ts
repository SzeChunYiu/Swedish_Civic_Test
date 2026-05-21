import { expect, test, type Page } from '@playwright/test';

import { citizenshipRequirementAreas } from '../../data/citizenshipRequirements';
import { collectConsoleAndPageErrors, dismissBlockingModals } from './browserLaunch';

const citizenshipRequirementsChecklistKey =
  'citizenship-requirements\\citizenshipRequirementsChecklistState';
const legacySettingsLanguageKey = 'language';
const legacySettingsSeenAboutKey = 'hasSeenAboutTheTest';
const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const seededOnceMarkerKey = '__citizenshipRequirementsImportSeeded';

const importedAreaIds = ['identity', 'civicKnowledge'] as const;

const importedAreaPrompts = citizenshipRequirementAreas
  .filter((area) => importedAreaIds.includes(area.id as (typeof importedAreaIds)[number]))
  .map((area) => area.checklistPrompt.en);

const unimportedAreaPrompt = citizenshipRequirementAreas.find(
  (area) => !importedAreaIds.includes(area.id as (typeof importedAreaIds)[number]),
)!.checklistPrompt.en;

async function readChecklistStorage(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => window.localStorage.getItem(key),
    citizenshipRequirementsChecklistKey,
  );
}

async function seedFreshEnglishSettingsOnce(page: Page): Promise<void> {
  await page.addInitScript(
    ({
      languageKey,
      legacyLanguageKey,
      legacySeenKey,
      markerKey,
      seenKey,
    }: {
      languageKey: string;
      legacyLanguageKey: string;
      legacySeenKey: string;
      markerKey: string;
      seenKey: string;
    }) => {
      if (window.localStorage.getItem(markerKey) === '1') return;

      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(legacyLanguageKey, 'en');
      window.localStorage.setItem(languageKey, 'en');
      window.localStorage.setItem(legacySeenKey, 'true');
      window.localStorage.setItem(seenKey, 'true');
      window.localStorage.setItem(markerKey, '1');
    },
    {
      languageKey: settingsLanguageKey,
      legacyLanguageKey: legacySettingsLanguageKey,
      legacySeenKey: legacySettingsSeenAboutKey,
      markerKey: seededOnceMarkerKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

test.use({ viewport: { width: 390, height: 844 } });

test('settings import confirms citizenship checklist before rendering checked requirements', async ({
  page,
}) => {
  await seedFreshEnglishSettingsOnce(page);
  const errors = collectConsoleAndPageErrors(page);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(readChecklistStorage(page)).resolves.toBeNull();

  await page.getByLabel('Paste JSON export').fill(
    JSON.stringify({
      version: 1,
      citizenshipRequirements: {
        checkedAreaIds: ['civicKnowledge', 'unknown', 'identity', 'identity'],
      },
    }),
  );

  await page.getByRole('button', { name: 'Preview local study data import' }).click();

  await expect(page.getByRole('heading', { name: 'Summary before import' })).toBeVisible();
  await expect(page.getByText('2 marked requirements checklist items')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm local study data import' })).toBeVisible();
  await expect(readChecklistStorage(page)).resolves.toBeNull();

  await page.getByRole('button', { name: 'Confirm local study data import' }).click();

  await expect(page.getByText('Import complete.')).toBeVisible();
  await expect
    .poll(() => readChecklistStorage(page), {
      message: 'confirmed import should persist the citizenship checklist',
    })
    .toBe(JSON.stringify({ checkedAreaIds: importedAreaIds }));

  await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  for (const prompt of importedAreaPrompts) {
    await expect(
      page.getByRole('checkbox', {
        exact: true,
        name: `Marked: ${prompt}`,
      }),
    ).toHaveAttribute('aria-checked', 'true');
  }
  await expect(
    page.getByRole('checkbox', {
      exact: true,
      name: `Not marked: ${unimportedAreaPrompt}`,
    }),
  ).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(importedAreaIds.length);

  await page.reload({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  for (const prompt of importedAreaPrompts) {
    await expect(
      page.getByRole('checkbox', {
        exact: true,
        name: `Marked: ${prompt}`,
      }),
    ).toHaveAttribute('aria-checked', 'true');
  }
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(importedAreaIds.length);
  expect(errors.get()).toEqual([]);
});
