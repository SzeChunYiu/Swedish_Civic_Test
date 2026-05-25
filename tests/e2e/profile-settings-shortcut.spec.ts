import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const minimumTargetSizePx = 44;

const fixtures: Record<
  AppLanguage,
  {
    audioSwitchName: string;
    backToProfileName: string;
    dailyGoalGroup: string;
    dailyGoalSetupBadge: string;
    dailyGoalRadioName: string;
    languageGroup: string;
    languageSetupBadge: string;
    languageRadioName: string;
    profileHeading: string;
    settingsCtaName: string;
    settingsHeading: string;
    studyFocusCue: string;
    studySetupHeading: string;
  }
> = {
  sv: {
    audioSwitchName: 'Stäng av ljud',
    backToProfileName: 'Tillbaka till profil',
    dailyGoalGroup: 'Dagligt mål',
    dailyGoalSetupBadge: 'Dagligt mål: 10 svar/dag',
    dailyGoalRadioName: 'Ställ in dagligt mål till 10 svar',
    languageGroup: 'Studiespråk',
    languageSetupBadge: 'Språk: Svenska',
    languageRadioName: 'Byt studiespråk till Svenska',
    profileHeading: 'Framsteg utan konto',
    settingsCtaName: 'Öppna inställningar för dagligt mål, språk och ljud',
    settingsHeading: 'Inställningar',
    studyFocusCue: 'Studieinställningarna från profilen är markerade här.',
    studySetupHeading: 'Studieinställningar',
  },
  en: {
    audioSwitchName: 'Disable audio',
    backToProfileName: 'Back to profile',
    dailyGoalGroup: 'Daily goal',
    dailyGoalSetupBadge: 'Daily goal: 10 answers/day',
    dailyGoalRadioName: 'Set daily goal to 10 answers',
    languageGroup: 'Study language',
    languageSetupBadge: 'Language: English support',
    languageRadioName: 'Set study language to English support',
    profileHeading: 'Progress without an account',
    settingsCtaName: 'Open settings for daily goal, language, and audio',
    settingsHeading: 'Settings',
    studyFocusCue: 'The study setup controls from Profile are highlighted here.',
    studySetupHeading: 'Study setup',
  },
};

async function expectMinimumTargetSize(locator: Locator, name: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${name} should have a rendered target box`).not.toBeNull();
  expect(box!.width, `${name} target width`).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.height, `${name} target height`).toBeGreaterThanOrEqual(minimumTargetSizePx);
}

async function expectAnyVisibleExactText(page: Page, text: string): Promise<void> {
  const matches = page.getByText(text, { exact: true });
  const count = await matches.count();

  expect(count, `${text} should render at least once`).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    if (await matches.nth(index).isVisible()) return;
  }
  expect(false, `${text} should have at least one visible rendered instance`).toBe(true);
}

async function expectAnyVisibleAriaLabel(page: Page, label: string): Promise<void> {
  const matches = page.locator(`[aria-label="${label.replace(/"/g, '\\"')}"]`);
  const count = await matches.count();

  expect(count, `${label} should be exposed as an aria-label`).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    if (await matches.nth(index).isVisible()) return;
  }
  expect(false, `${label} aria-label should have at least one visible rendered instance`).toBe(
    true,
  );
}

async function openProfile(page: Page, language: AppLanguage): Promise<void> {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

for (const language of ['sv', 'en'] as const) {
  test(`Profile study setup shortcut opens Settings controls in ${language}`, async ({ page }) => {
    const copy = fixtures[language];
    const errors = collectConsoleAndPageErrors(page);

    await openProfile(page, language);

    await expect(page.getByRole('heading', { name: copy.profileHeading })).toBeVisible();
    await expect(page.getByRole('heading', { name: copy.studySetupHeading })).toBeVisible();

    const settingsShortcut = page.getByRole('link', { name: copy.settingsCtaName });
    await expect(settingsShortcut).toHaveCount(1);
    await expectMinimumTargetSize(settingsShortcut, `${language} profile settings shortcut`);
    await settingsShortcut.click();

    await expect(page).toHaveURL(/\/settings\?focus=study$/);
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: copy.settingsHeading })).toBeVisible();
    await expect(page.getByText(copy.studyFocusCue)).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: copy.dailyGoalGroup })).toBeVisible();
    await expect(page.getByRole('radio', { name: copy.dailyGoalRadioName })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('radiogroup', { name: copy.languageGroup })).toBeVisible();
    await expect(page.getByRole('radio', { name: copy.languageRadioName })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('switch', { name: copy.audioSwitchName })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    expect(errors.get()).toEqual([]);
  });

  test(`Settings back action returns to localized Profile setup in ${language}`, async ({
    page,
  }) => {
    const copy = fixtures[language];
    const errors = collectConsoleAndPageErrors(page);

    await openProfile(page, language);

    await page.getByRole('link', { name: copy.settingsCtaName }).click();
    await expect(page).toHaveURL(/\/settings(?:\?focus=study)?$/);
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: copy.settingsHeading })).toBeVisible();

    const backToProfile = page.getByRole('link', { name: copy.backToProfileName });
    await expect(backToProfile).toHaveCount(1);
    await expectMinimumTargetSize(backToProfile, `${language} settings back to profile link`);
    await backToProfile.click();

    await expect(page).toHaveURL(/\/profile$/);
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: copy.profileHeading })).toBeVisible();
    await expect(page.getByRole('heading', { name: copy.studySetupHeading })).toBeVisible();
    await expectAnyVisibleExactText(page, copy.dailyGoalSetupBadge);
    await expectAnyVisibleAriaLabel(page, copy.dailyGoalSetupBadge);
    await expectAnyVisibleExactText(page, copy.languageSetupBadge);

    expect(errors.get()).toEqual([]);
  });
}
