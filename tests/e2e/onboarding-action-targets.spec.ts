import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const minimumTargetSizePx = 44;
const seededOnceMarkerKey = '__onboardingDailyGoalPersistenceSeeded';
const settingsDailyGoalKey = 'settings\\dailyGoalAnswers';
const settingsLanguageKey = 'settings\\language';
const settingsSeenAboutKey = 'settings\\hasSeenAboutTheTest';
const settingsStudyPlanIntensityKey = 'settings\\studyPlanIntensity';
const settingsStudyPlanTestDateIsoKey = 'settings\\studyPlanTestDateIso';
const legacySettingsLanguageKey = 'language';
const legacySettingsSeenAboutKey = 'hasSeenAboutTheTest';

const onboardingActionLinks = [
  {
    href: /\/home$/,
    label: 'Fortsätt utan att välja dagligt mål',
    visibleText: 'Bestäm senare',
  },
  {
    href: /\/home$/,
    label: 'Börja studera',
    visibleText: 'Börja studera',
  },
  {
    href: /\/settings$/,
    label: 'Öppna inställningar',
    visibleText: 'Justera inställningar',
  },
] as const;

const dailyGoalPersistenceCases = [
  {
    expectedHomeMetric: '0/20',
    goal: 20,
    homeGoalTitle: 'Dagens mål',
    language: 'sv',
    onboardingGoalLabel: 'Välj regelbundet dagligt mål med 20 svar',
    settingsGoalLabel: 'Ställ in dagligt mål till 20 svar',
    settingsGoalSummary: '20 svar per dag',
  },
  {
    expectedHomeMetric: '0/40',
    goal: 40,
    homeGoalTitle: "Today's goal",
    language: 'en',
    onboardingGoalLabel: 'Choose serious daily goal with 40 answers',
    settingsGoalLabel: 'Set daily goal to 40 answers',
    settingsGoalSummary: '40 answers per day',
  },
] as const;

const decideLaterDefaultGoalCases = [
  {
    decideLaterLabel: 'Fortsätt utan att välja dagligt mål',
    decideLaterVisibleText: 'Bestäm senare',
    expectedHomeMetric: '0/10',
    homeGoalTitle: 'Dagens mål',
    language: 'sv',
    settingsGoalLabel: 'Ställ in dagligt mål till 10 svar',
    settingsGoalSummary: '10 svar per dag',
  },
  {
    decideLaterLabel: 'Continue without choosing a daily goal',
    decideLaterVisibleText: 'Decide later',
    expectedHomeMetric: '0/10',
    homeGoalTitle: "Today's goal",
    language: 'en',
    settingsGoalLabel: 'Set daily goal to 10 answers',
    settingsGoalSummary: '10 answers per day',
  },
] as const;

const startStudyingDefaultGoalCases = [
  {
    expectedHomeMetric: '0/10',
    homeGoalTitle: 'Dagens mål',
    language: 'sv',
    settingsGoalLabel: 'Ställ in dagligt mål till 10 svar',
    settingsGoalSummary: '10 svar per dag',
    startStudyingLabel: 'Börja studera',
    startStudyingVisibleText: 'Börja studera',
  },
  {
    expectedHomeMetric: '0/10',
    homeGoalTitle: "Today's goal",
    language: 'en',
    settingsGoalLabel: 'Set daily goal to 10 answers',
    settingsGoalSummary: '10 answers per day',
    startStudyingLabel: 'Start studying',
    startStudyingVisibleText: 'Start studying',
  },
] as const;

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectMinimumTargetSize(locator: Locator, label: string): Promise<void> {
  await expect(locator, `${label} should be visible`).toBeVisible();
  await locator.scrollIntoViewIfNeeded();

  const box = await locator.boundingBox();

  expect(box, `${label} should have a rendered target box`).not.toBeNull();
  expect(box!.width, `${label} target width`).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.height, `${label} target height`).toBeGreaterThanOrEqual(minimumTargetSizePx);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;

          return (
            document.documentElement.scrollWidth <= viewportWidth + 1 &&
            document.body.scrollWidth <= viewportWidth + 1
          );
        }),
      { message: 'Onboarding should not overflow horizontally' },
    )
    .toBe(true);
}

async function seedFreshSettingsLanguageAndAboutSeenOnce(
  page: Page,
  language: AppLanguage,
): Promise<void> {
  await page.addInitScript(
    ({
      language: seededLanguage,
      languageKey,
      legacyLanguageKey,
      legacySeenKey,
      markerKey,
      seenKey,
    }: {
      language: AppLanguage;
      languageKey: string;
      legacyLanguageKey: string;
      legacySeenKey: string;
      markerKey: string;
      seenKey: string;
    }) => {
      if (window.localStorage.getItem(markerKey) === '1') return;

      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(legacyLanguageKey, seededLanguage);
      window.localStorage.setItem(languageKey, seededLanguage);
      window.localStorage.setItem(legacySeenKey, 'true');
      window.localStorage.setItem(seenKey, 'true');
      window.localStorage.setItem(markerKey, '1');
    },
    {
      language,
      languageKey: settingsLanguageKey,
      legacyLanguageKey: legacySettingsLanguageKey,
      legacySeenKey: legacySettingsSeenAboutKey,
      markerKey: seededOnceMarkerKey,
      seenKey: settingsSeenAboutKey,
    },
  );
}

test('Onboarding actions keep mobile-safe targets and daily goal selection', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', { name: 'Förbered dig lugnt för samhällskunskapsprovet' }),
  ).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Välj ett mjukt dagligt mål' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'När är ditt prov?' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Ange provdatum som ÅÅÅÅ-MM-DD' })).toBeVisible();

  for (const link of onboardingActionLinks) {
    const target = page.getByRole('link', { exact: true, name: link.label });
    await expect(target).toContainText(link.visibleText);
    await expect(target).toHaveAttribute('href', link.href);
    await expectMinimumTargetSize(target, link.visibleText);
  }

  const regularGoal = page.getByRole('radio', {
    exact: true,
    name: 'Välj regelbundet dagligt mål med 20 svar',
  });
  await expectMinimumTargetSize(regularGoal, 'Regular daily goal');
  await expect(regularGoal).toHaveAttribute('aria-checked', 'false');
  await expect(regularGoal).not.toHaveAttribute('aria-selected', /.+/);
  await regularGoal.click();
  await expect(regularGoal).toHaveAttribute('aria-checked', 'true');

  const testDateInput = page.getByRole('textbox', { name: 'Ange provdatum som ÅÅÅÅ-MM-DD' });
  await expectMinimumTargetSize(testDateInput, 'Test date input');
  await testDateInput.fill('2026-08-15');
  await expect(page.getByText(/Sparat provdatum:/)).toBeVisible();

  const skipTestDate = page.getByRole('button', { name: 'Fortsätt utan bokat provdatum' });
  await expect(skipTestDate).toContainText('Jag har inte bokat än');
  await expectMinimumTargetSize(skipTestDate, 'Skip test date');

  await expectNoHorizontalOverflow(page);
  expect(consoleErrors).toEqual([]);
});

test('Onboarding optional test date persists locally and skip clears it without plan details', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedFreshSettingsLanguageAndAboutSeenOnce(page, 'en');
  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'When is your test?' })).toBeVisible();
  await expect(page.getByText(/Get a daily plan|59 kr|questions\/day|mocks this week/)).toHaveCount(
    0,
  );

  const seriousGoal = page.getByRole('radio', {
    exact: true,
    name: 'Choose serious daily goal with 40 answers',
  });
  await seriousGoal.click();
  await expect(seriousGoal).toHaveAttribute('aria-checked', 'true');
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
    .toBe('40');
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), settingsStudyPlanIntensityKey),
    )
    .toBe('serious');

  const testDateInput = page.getByRole('textbox', { name: 'Enter test date as YYYY-MM-DD' });
  await expect(testDateInput).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(testDateInput).not.toHaveAttribute('aria-invalid', 'true');
  await testDateInput.fill('2026-08-15');
  const savedFeedback = page.getByText('Test date saved: 15 August 2026.');
  await expect(savedFeedback).toBeVisible();
  await expect(savedFeedback).toHaveAttribute('aria-live', 'polite');
  const savedFeedbackId = await savedFeedback.getAttribute('id');
  expect(savedFeedbackId).toBeTruthy();
  await expect(testDateInput).toHaveAttribute('aria-describedby', savedFeedbackId!);
  await expect(testDateInput).not.toHaveAttribute('aria-invalid', 'true');
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), settingsStudyPlanTestDateIsoKey),
    )
    .toBe('2026-08-15T00:00:00.000Z');

  await testDateInput.fill('2026-02-31');
  const invalidFeedback = page.getByText("Use YYYY-MM-DD, or skip until you've booked.");
  await expect(invalidFeedback).toBeVisible();
  await expect(invalidFeedback).toHaveAttribute('aria-live', 'polite');
  await expect(testDateInput).toHaveAttribute('aria-describedby', savedFeedbackId!);
  await expect(testDateInput).toHaveAttribute('aria-invalid', 'true');
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), settingsStudyPlanTestDateIsoKey),
    )
    .toBe('2026-08-15T00:00:00.000Z');

  await page.getByRole('button', { name: 'Continue without a booked test date' }).click();
  await expect(testDateInput).toHaveValue('');
  await expect(testDateInput).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(testDateInput).not.toHaveAttribute('aria-invalid', 'true');
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), settingsStudyPlanTestDateIsoKey),
    )
    .toBe('');

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByRole('heading', { name: "Today's goal" })).toBeVisible();
  await expect(page.getByText('0/40')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

for (const fixture of dailyGoalPersistenceCases) {
  test(`Onboarding daily goal ${fixture.goal} persists into Settings and Home in ${fixture.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedFreshSettingsLanguageAndAboutSeenOnce(page, fixture.language);
    await page.goto('/onboarding', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(
      page.getByRole('radiogroup', {
        name:
          fixture.language === 'sv' ? 'Välj ett mjukt dagligt mål' : 'Choose a gentle daily goal',
      }),
    ).toBeVisible();

    const onboardingGoal = page.getByRole('radio', {
      exact: true,
      name: fixture.onboardingGoalLabel,
    });
    await expectMinimumTargetSize(onboardingGoal, `${fixture.goal}-answer onboarding goal`);
    await onboardingGoal.click();
    await expect(onboardingGoal).toHaveAttribute('aria-checked', 'true');
    await expect(onboardingGoal).not.toHaveAttribute('aria-selected', /.+/);
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBe(String(fixture.goal));

    await page.reload({ waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(
      page.getByRole('radio', {
        exact: true,
        name: fixture.onboardingGoalLabel,
      }),
    ).toHaveAttribute('aria-checked', 'true');

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByText(fixture.settingsGoalSummary)).toBeVisible();
    await expect(page.getByRole('radio', { name: fixture.settingsGoalLabel })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.homeGoalTitle })).toBeVisible();
    await expect(page.getByText(fixture.expectedHomeMetric)).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
}

for (const fixture of startStudyingDefaultGoalCases) {
  test(`Onboarding Start studying keeps the default daily goal implicit in ${fixture.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedFreshSettingsLanguageAndAboutSeenOnce(page, fixture.language);
    await page.goto('/onboarding', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    const startStudying = page.getByRole('link', {
      exact: true,
      name: fixture.startStudyingLabel,
    });
    await expect(startStudying).toContainText(fixture.startStudyingVisibleText);
    await expectMinimumTargetSize(startStudying, fixture.startStudyingVisibleText);
    await startStudying.click();

    await expect(page).toHaveURL(/\/home$/);
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.homeGoalTitle })).toBeVisible();
    await expect(page.getByText(fixture.expectedHomeMetric)).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    await page.reload({ waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.homeGoalTitle })).toBeVisible();
    await expect(page.getByText(fixture.expectedHomeMetric)).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByText(fixture.settingsGoalSummary)).toBeVisible();
    await expect(page.getByRole('radio', { name: fixture.settingsGoalLabel })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    expect(consoleErrors).toEqual([]);
  });
}

for (const fixture of decideLaterDefaultGoalCases) {
  test(`Onboarding decide later keeps the default daily goal implicit in ${fixture.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedFreshSettingsLanguageAndAboutSeenOnce(page, fixture.language);
    await page.goto('/onboarding', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    const decideLater = page.getByRole('link', {
      exact: true,
      name: fixture.decideLaterLabel,
    });
    await expect(decideLater).toContainText(fixture.decideLaterVisibleText);
    await expectMinimumTargetSize(decideLater, fixture.decideLaterVisibleText);
    await decideLater.click();

    await expect(page).toHaveURL(/\/home$/);
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.homeGoalTitle })).toBeVisible();
    await expect(page.getByText(fixture.expectedHomeMetric)).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    await page.reload({ waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: fixture.homeGoalTitle })).toBeVisible();
    await expect(page.getByText(fixture.expectedHomeMetric)).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByText(fixture.settingsGoalSummary)).toBeVisible();
    await expect(page.getByRole('radio', { name: fixture.settingsGoalLabel })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), settingsDailyGoalKey))
      .toBeNull();

    expect(consoleErrors).toEqual([]);
  });
}
