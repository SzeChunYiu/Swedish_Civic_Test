import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

type ActivationMode = 'keyboard' | 'pointer';

type ShortcutFixture = {
  activation: ActivationMode;
  audioSwitchLabel: string;
  ctaAccessibilityLabel: string;
  ctaText: string;
  dailyGoalOptionLabel: string;
  dailyGoalTitle: string;
  language: AppLanguage;
  languageOptionLabel: string;
  settingsTitle: string;
  studyLanguageTitle: string;
};

const mobileViewport = { width: 390, height: 844 };

const shortcutFixtures: ShortcutFixture[] = [
  {
    activation: 'pointer',
    audioSwitchLabel: 'Stäng av ljud',
    ctaAccessibilityLabel: 'Öppna inställningar för dagligt mål, språk och ljud',
    ctaText: 'Ändra mål, språk och ljud',
    dailyGoalOptionLabel: 'Ställ in dagligt mål till 10 svar',
    dailyGoalTitle: 'Dagligt mål',
    language: 'sv',
    languageOptionLabel: 'Byt studiespråk till Engelskt stöd',
    settingsTitle: 'Inställningar',
    studyLanguageTitle: 'Studiespråk',
  },
  {
    activation: 'keyboard',
    audioSwitchLabel: 'Disable audio',
    ctaAccessibilityLabel: 'Open settings for daily goal, language, and audio',
    ctaText: 'Adjust goal, language, and audio',
    dailyGoalOptionLabel: 'Set daily goal to 10 answers',
    dailyGoalTitle: 'Daily goal',
    language: 'en',
    languageOptionLabel: 'Set study language to Swedish',
    settingsTitle: 'Settings',
    studyLanguageTitle: 'Study language',
  },
];

async function expectMinimumTarget(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} should render measurable geometry`).not.toBeNull();
  expect(box!.width, `${label} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
}

async function openProfile(page: Page, language: AppLanguage) {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function activateShortcut(shortcut: Locator, activation: ActivationMode) {
  if (activation === 'keyboard') {
    await shortcut.focus();
    await expect(shortcut).toBeFocused();
    await shortcut.press('Enter');
    return;
  }

  await shortcut.click();
}

test.use({ viewport: mobileViewport });

for (const fixture of shortcutFixtures) {
  test(`profile study setup shortcut opens settings with promised controls in ${fixture.language}`, async ({
    page,
  }) => {
    const errors = collectConsoleAndPageErrors(page);

    await openProfile(page, fixture.language);

    const settingsShortcut = page.getByRole('link', {
      name: fixture.ctaAccessibilityLabel,
    });

    await expect(settingsShortcut).toHaveCount(1);
    await expect(settingsShortcut).toContainText(fixture.ctaText);
    await expectMinimumTarget(settingsShortcut, `${fixture.language} study setup shortcut`);

    await activateShortcut(settingsShortcut, fixture.activation);

    await expect(page).toHaveURL(/\/settings(?:[?#].*)?$/);
    await expect(page.getByRole('heading', { name: fixture.settingsTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.dailyGoalTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.studyLanguageTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Ljud$|^Audio$/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: fixture.dailyGoalOptionLabel })).toBeVisible();
    await expect(page.getByRole('radio', { name: fixture.languageOptionLabel })).toBeVisible();
    await expect(page.getByRole('switch', { name: fixture.audioSwitchLabel })).toBeVisible();

    expect(errors.get()).toEqual([]);
  });
}
