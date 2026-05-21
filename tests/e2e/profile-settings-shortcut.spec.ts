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
    dailyGoalGroup: string;
    dailyGoalRadioName: string;
    languageGroup: string;
    languageRadioName: string;
    profileHeading: string;
    settingsCtaName: string;
    settingsHeading: string;
    studySetupHeading: string;
  }
> = {
  sv: {
    audioSwitchName: 'Stäng av ljud',
    dailyGoalGroup: 'Dagligt mål',
    dailyGoalRadioName: 'Ställ in dagligt mål till 10 svar',
    languageGroup: 'Studiespråk',
    languageRadioName: 'Byt studiespråk till Svenska',
    profileHeading: 'Framsteg utan konto',
    settingsCtaName: 'Öppna inställningar för dagligt mål, språk och ljud',
    settingsHeading: 'Inställningar',
    studySetupHeading: 'Studieinställningar',
  },
  en: {
    audioSwitchName: 'Disable audio',
    dailyGoalGroup: 'Daily goal',
    dailyGoalRadioName: 'Set daily goal to 10 answers',
    languageGroup: 'Study language',
    languageRadioName: 'Set study language to English support',
    profileHeading: 'Progress without an account',
    settingsCtaName: 'Open settings for daily goal, language, and audio',
    settingsHeading: 'Settings',
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

    await expect(page).toHaveURL(/\/settings$/);
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: copy.settingsHeading })).toBeVisible();
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
}
