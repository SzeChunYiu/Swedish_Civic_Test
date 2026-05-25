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
    listenFirstSwitchName: string;
    listenFirstTitle: string;
    profileHeading: string;
    settingsCtaName: string;
    settingsHeading: string;
    studyFocusCue: string;
    studySetupHeading: string;
    themeHeading: string;
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
    listenFirstSwitchName: 'Slå på automatisk uppläsning av nya frågor',
    listenFirstTitle: 'Lyssna först',
    profileHeading: 'Framsteg utan konto',
    settingsCtaName: 'Öppna inställningar för dagligt mål, språk och ljud',
    settingsHeading: 'Inställningar',
    studyFocusCue: 'Studieinställningarna från profilen är markerade här.',
    studySetupHeading: 'Studieinställningar',
    themeHeading: 'Tema',
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
    listenFirstSwitchName: 'Enable automatic playback for new questions',
    listenFirstTitle: 'Listen first',
    profileHeading: 'Progress without an account',
    settingsCtaName: 'Open settings for daily goal, language, and audio',
    settingsHeading: 'Settings',
    studyFocusCue: 'The study setup controls from Profile are highlighted here.',
    studySetupHeading: 'Study setup',
    themeHeading: 'Theme',
  },
};

async function expectMinimumTargetSize(locator: Locator, name: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${name} should have a rendered target box`).not.toBeNull();
  expect(box!.width, `${name} target width`).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.height, `${name} target height`).toBeGreaterThanOrEqual(minimumTargetSizePx);
}

async function expectNoHorizontalOverflow(locator: Locator, name: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const metrics = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      left: rect.left,
      right: rect.right,
      scrollWidth: element.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(metrics.left, `${name} should not overflow left`).toBeGreaterThanOrEqual(0);
  expect(metrics.right, `${name} should not overflow right`).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.scrollWidth, `${name} content should not overflow`).toBeLessThanOrEqual(
    metrics.clientWidth + 1,
  );
}

async function expectBeforeInDocument(
  first: Locator,
  second: Locator,
  name: string,
): Promise<void> {
  const secondHandle = await second.elementHandle();
  expect(secondHandle, `${name} comparison target should exist`).not.toBeNull();
  if (!secondHandle) return;
  const precedes = await first.evaluate(
    (firstElement, secondElement) =>
      Boolean(
        secondElement &&
        firstElement.compareDocumentPosition(secondElement) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    secondHandle,
  );
  await secondHandle?.dispose();

  expect(precedes, name).toBe(true);
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
    await expect(page.getByText(copy.listenFirstTitle, { exact: true })).toBeVisible();
    const listenFirstSwitch = page.getByRole('switch', { name: copy.listenFirstSwitchName });
    await expect(listenFirstSwitch).toHaveAttribute('aria-checked', 'false');
    await expectMinimumTargetSize(listenFirstSwitch, `${language} listen-first audio switch`);
    await expectNoHorizontalOverflow(
      page.getByTestId('study-settings-controls'),
      `${language} focused Settings study controls`,
    );
    await expectBeforeInDocument(
      page.getByText(copy.listenFirstTitle, { exact: true }),
      page.getByRole('heading', { name: copy.themeHeading }),
      `${language} listen-first audio control should stay before unrelated Settings sections`,
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
    await expectAnyVisibleExactText(page, copy.languageSetupBadge);

    expect(errors.get()).toEqual([]);
  });
}
