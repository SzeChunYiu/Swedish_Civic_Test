import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

const minimumTargetSizePx = 44;
const mobileViewport = { width: 390, height: 844 };

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

async function expectNoHorizontalOverflow(page: Page, context: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(
    Math.max(dimensions.bodyScrollWidth, dimensions.documentScrollWidth),
    `${context} should not overflow horizontally`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth);
}

async function expectInViewport(locator: Locator, name: string): Promise<void> {
  await expect(locator, `${name} should be visible`).toBeVisible();
  const box = await locator.boundingBox();

  expect(box, `${name} should have a rendered viewport box`).not.toBeNull();
  expect(box!.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
  expect(box!.y, `${name} top edge`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${name} right edge`).toBeLessThanOrEqual(mobileViewport.width);
  expect(box!.y + box!.height, `${name} bottom edge`).toBeLessThanOrEqual(mobileViewport.height);
}

async function openProfile(page: Page, language: AppLanguage): Promise<void> {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

for (const language of ['sv', 'en'] as const) {
  test.describe(`Profile study setup shortcut in ${language}`, () => {
    test('opens Settings controls on desktop', async ({ page }) => {
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

    test('keeps focused Settings controls reachable on mobile', async ({ page }) => {
      const copy = fixtures[language];
      const errors = collectConsoleAndPageErrors(page);
      await page.setViewportSize(mobileViewport);

      await openProfile(page, language);

      await page.getByRole('link', { name: copy.settingsCtaName }).click();
      await expect(page).toHaveURL(/\/settings\?focus=study$/);
      await dismissBlockingModals(page);

      await expectInViewport(
        page.getByRole('heading', { name: copy.settingsHeading }),
        `${language} settings heading`,
      );
      await expectInViewport(page.getByText(copy.studyFocusCue), `${language} study focus cue`);
      await expectInViewport(
        page.getByRole('radiogroup', { name: copy.dailyGoalGroup }),
        `${language} daily goal controls`,
      );
      await expect(page.getByRole('radio', { name: copy.dailyGoalRadioName })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await expectInViewport(
        page.getByRole('radiogroup', { name: copy.languageGroup }),
        `${language} language controls`,
      );
      await expect(page.getByRole('radio', { name: copy.languageRadioName })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await expectInViewport(
        page.getByRole('switch', { name: copy.audioSwitchName }),
        `${language} audio switch`,
      );
      await expect(page.getByRole('switch', { name: copy.audioSwitchName })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await expectNoHorizontalOverflow(page, `${language} focused Settings mobile viewport`);

      expect(errors.get()).toEqual([]);
    });

    test('returns to localized Profile setup from Settings back action', async ({ page }) => {
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
      await expectAnyVisibleExactText(page, copy.languageSetupBadge);

      expect(errors.get()).toEqual([]);
    });
  });
}
