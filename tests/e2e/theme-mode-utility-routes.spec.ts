import { expect, test, type Locator, type Page } from '@playwright/test';

import { darkColors } from '../../lib/theme';
import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedFreshFirstRunSettingsLanguage,
  seedSettingsLanguage,
} from './browserLaunch';

type SourceAffordanceLanguage = 'sv' | 'en';

const accessibilityThemeModeKey = 'accessibility\\a11y.themeMode.v1';
const mobileViewport = { width: 390, height: 844 };

const searchSourceAffordanceCases = [
  {
    language: 'sv',
    chapterQuery: 'kommun',
    chapterLinkName: /Öppna kapitlet/,
    inputName: 'Sök samhällsbegrepp och övningsfrågor',
    provenanceBadgeName: /Källtyp: UHR-källa/,
    provenanceLabel: 'UHR-källa',
    provenanceQuery: 'folkomröstning',
    sourceNoteName: /^Källanteckning:/,
  },
  {
    language: 'en',
    chapterQuery: 'municipality',
    chapterLinkName: /Open the chapter/,
    inputName: 'Search civic terms and practice questions',
    provenanceBadgeName: /Provenance: UHR source/,
    provenanceLabel: 'UHR source',
    provenanceQuery: 'municipality',
    sourceNoteName: /^Source note:/,
  },
] as const satisfies readonly {
  chapterLinkName: RegExp;
  chapterQuery: string;
  inputName: string;
  language: SourceAffordanceLanguage;
  provenanceBadgeName: RegExp;
  provenanceLabel: string;
  provenanceQuery: string;
  sourceNoteName: RegExp;
}[];

const citizenshipSourceAffordanceCases = [
  {
    checkedCheckboxName: /Markerad:/,
    checkboxName: /Ej markerad:/,
    disclaimerBodyName: /^Oberoende studieverktyg\./,
    disclaimerLabel: /Studieinformation: Oberoende studieverktyg/,
    disclaimerTitle: 'Studieinformation',
    language: 'sv',
    practiceLinkName: 'Öppna övningsläget för samhällskunskap',
    sourceLinkName: /Migrationsverket: Ansök om svenskt medborgarskap/,
    sourceTitle: 'Ansök om svenskt medborgarskap',
  },
  {
    checkedCheckboxName: /Marked:/,
    checkboxName: /Not marked:/,
    disclaimerBodyName: /^Independent study tool\./,
    disclaimerLabel: /Study disclaimer: Independent study tool/,
    disclaimerTitle: 'Study disclaimer',
    language: 'en',
    practiceLinkName: 'Open civic knowledge practice mode',
    sourceLinkName: /Migrationsverket: Apply for Swedish citizenship/,
    sourceTitle: 'Apply for Swedish citizenship',
  },
] as const satisfies readonly {
  checkedCheckboxName: RegExp;
  checkboxName: RegExp;
  disclaimerBodyName: RegExp;
  disclaimerLabel: RegExp;
  disclaimerTitle: string;
  language: SourceAffordanceLanguage;
  practiceLinkName: string;
  sourceLinkName: RegExp;
  sourceTitle: string;
}[];

const firstRunAboutModalCases = [
  {
    body: 'En kort guide till vad provet är',
    dialogLabel: 'Vad är medborgarskapsprovet?',
    eyebrow: 'Välkommen',
    language: 'sv',
    openLabel: 'Läs guiden',
    openLinkName: 'Öppna guiden om medborgarskapsprovet',
    skipLabel: 'Hoppa över',
    title: 'Vad är medborgarskapsprovet?',
  },
  {
    body: 'A short guide to what the test is',
    dialogLabel: 'What is the Swedish civic test?',
    eyebrow: 'Welcome',
    language: 'en',
    openLabel: 'Read the guide',
    openLinkName: 'Open the about-the-test guide',
    skipLabel: 'Skip',
    title: 'What is the Swedish civic test?',
  },
] as const satisfies readonly {
  body: string;
  dialogLabel: string;
  eyebrow: string;
  language: SourceAffordanceLanguage;
  openLabel: string;
  openLinkName: string;
  skipLabel: string;
  title: string;
}[];

const onboardingDarkThemeCases = [
  {
    adjustSettingsLabel: 'Öppna inställningar',
    dailyGoalTitle: 'Välj ett mjukt dagligt mål',
    goalLabel: 'Välj regelbundet dagligt mål med 20 svar',
    language: 'sv',
    startStudyingLabel: 'Börja studera',
    subtitle:
      'En liten, fristående studiekompis för daglig övning, provträning och genomgång av frågor du missat.',
    testDateInputLabel: 'Ange provdatum som ÅÅÅÅ-MM-DD',
    title: 'Förbered dig lugnt för samhällskunskapsprovet',
  },
  {
    adjustSettingsLabel: 'Adjust settings',
    dailyGoalTitle: 'Choose a gentle daily goal',
    goalLabel: 'Choose regular daily goal with 20 answers',
    language: 'en',
    startStudyingLabel: 'Start studying',
    subtitle:
      'A small, independent study companion for daily practice, mock exams, and mistake review.',
    testDateInputLabel: 'Enter test date as YYYY-MM-DD',
    title: 'Prepare calmly for the civic test',
  },
] as const satisfies readonly {
  adjustSettingsLabel: string;
  dailyGoalTitle: string;
  goalLabel: string;
  language: SourceAffordanceLanguage;
  startStudyingLabel: string;
  subtitle: string;
  testDateInputLabel: string;
  title: string;
}[];

function hexToRgb(hexColor: string) {
  if (hexColor.startsWith('rgb')) return hexColor;

  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
}

async function seedDarkTheme(page: Page) {
  await page.addInitScript((themeModeKey: string) => {
    window.localStorage.setItem(themeModeKey, 'dark');
  }, accessibilityThemeModeKey);
}

async function computedColors(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);

    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      color: style.color,
    };
  });
}

async function expectComputedColor(
  locator: Locator,
  property: 'backgroundColor' | 'borderColor' | 'color',
  expectedHexColor: string,
  message: string,
) {
  await expect
    .poll(async () => (await computedColors(locator))[property], { message })
    .toBe(hexToRgb(expectedHexColor));
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

test.use({ viewport: mobileViewport });

for (const testCase of firstRunAboutModalCases) {
  test(`first-run About modal uses dark theme tokens in ${testCase.language}`, async ({ page }) => {
    await seedFreshFirstRunSettingsLanguage(page, testCase.language);
    await seedDarkTheme(page);

    await page.goto('/practice', { waitUntil: 'networkidle' });

    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAttribute('aria-label', testCase.dialogLabel);
    await expect(dialog).toHaveAttribute('aria-labelledby', 'first-run-about-dialog-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'first-run-about-dialog-body');

    const card = page.getByTestId('first-run-about-modal-card');
    await expect(card).toBeVisible();
    await expectComputedColor(
      card,
      'backgroundColor',
      darkColors.surface,
      `First-run About modal cards should use the dark surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      card,
      'borderColor',
      darkColors.border,
      `First-run About modal cards should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByText(testCase.eyebrow).first(),
      'color',
      darkColors.badgeBlueText,
      `First-run About modal eyebrow text should use the dark badge text token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.locator('#first-run-about-dialog-title'),
      'color',
      darkColors.text,
      `First-run About modal titles should use the dark primary text token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.locator('#first-run-about-dialog-body'),
      'color',
      darkColors.textSecondary,
      `First-run About modal body copy should use the dark secondary text token in ${testCase.language}`,
    );
    await expect(page.locator('#first-run-about-dialog-body')).toContainText(testCase.body);

    const primaryAction = page.getByTestId('first-run-about-modal-primary-action');
    await expect(primaryAction).toBeVisible();
    await expectComputedColor(
      primaryAction,
      'backgroundColor',
      darkColors.accent,
      `First-run About modal primary actions should use the dark accent token in ${testCase.language}`,
    );
    await expectComputedColor(
      primaryAction.getByText(testCase.openLabel),
      'color',
      darkColors.surface,
      `First-run About modal primary action labels should use the dark surface token in ${testCase.language}`,
    );
    await expect(page.getByRole('link', { name: testCase.openLinkName })).toHaveCount(1);

    const secondaryAction = page.getByTestId('first-run-about-modal-secondary-action');
    await expect(secondaryAction).toBeVisible();
    await expectComputedColor(
      secondaryAction.getByText(testCase.skipLabel),
      'color',
      darkColors.textMuted,
      `First-run About modal secondary action labels should use the dark muted text token in ${testCase.language}`,
    );
    await expectNoHorizontalOverflow(page);
  });
}

for (const testCase of onboardingDarkThemeCases) {
  test(`onboarding route uses dark theme tokens in ${testCase.language}`, async ({ page }) => {
    await seedSettingsLanguage(page, testCase.language);
    await markAboutTheTestSeen(page);
    await seedDarkTheme(page);

    await page.goto('/onboarding', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);

    const hero = page.getByTestId('onboarding-hero');
    await expect(hero).toBeVisible();
    await expectComputedColor(
      hero,
      'backgroundColor',
      darkColors.surface,
      `Onboarding hero should use the dark surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      hero,
      'borderColor',
      darkColors.border,
      `Onboarding hero should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByRole('heading', { name: testCase.title }),
      'color',
      darkColors.text,
      `Onboarding title should use the dark text token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByText(testCase.subtitle),
      'color',
      darkColors.textMuted,
      `Onboarding subtitle should use the dark muted text token in ${testCase.language}`,
    );

    const goalSection = page.getByTestId('onboarding-goal-section');
    await expect(goalSection).toBeVisible();
    await expectComputedColor(
      goalSection,
      'backgroundColor',
      darkColors.surfaceWarm,
      `Onboarding daily-goal section should use the dark warm surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      goalSection,
      'borderColor',
      darkColors.border,
      `Onboarding daily-goal section should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByRole('heading', { name: testCase.dailyGoalTitle }),
      'color',
      darkColors.text,
      `Onboarding daily-goal heading should use the dark text token in ${testCase.language}`,
    );

    const goalRadio = page.getByRole('radio', { exact: true, name: testCase.goalLabel });
    await expect(goalRadio).toBeVisible();
    await expectComputedColor(
      goalRadio,
      'backgroundColor',
      darkColors.surface,
      `Unselected onboarding daily-goal radio should use the dark surface token in ${testCase.language}`,
    );
    await goalRadio.click();
    await expect(goalRadio).toHaveAttribute('aria-checked', 'true');
    await expectComputedColor(
      goalRadio,
      'backgroundColor',
      darkColors.badgeBlueBg,
      `Selected onboarding daily-goal radio should use the dark badge background token in ${testCase.language}`,
    );
    await expectComputedColor(
      goalRadio,
      'borderColor',
      darkColors.badgeBlueText,
      `Selected onboarding daily-goal radio should use the dark badge border token in ${testCase.language}`,
    );

    const testDateInput = page.getByRole('textbox', { name: testCase.testDateInputLabel });
    await expect(testDateInput).toBeVisible();
    await expectComputedColor(
      testDateInput,
      'backgroundColor',
      darkColors.surfaceWarm,
      `Onboarding test-date input should use the dark warm surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      testDateInput,
      'borderColor',
      darkColors.border,
      `Onboarding test-date input should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      testDateInput,
      'color',
      darkColors.text,
      `Onboarding test-date input should use the dark text token in ${testCase.language}`,
    );

    const startStudying = page.getByRole('link', {
      exact: true,
      name: testCase.startStudyingLabel,
    });
    await expectComputedColor(
      startStudying,
      'backgroundColor',
      darkColors.accent,
      `Onboarding primary action should use the dark accent token in ${testCase.language}`,
    );
    await expectComputedColor(
      startStudying,
      'color',
      darkColors.surface,
      `Onboarding primary action label should use the dark surface token in ${testCase.language}`,
    );

    const adjustSettings = page.getByRole('link', {
      exact: true,
      name: testCase.adjustSettingsLabel,
    });
    await expectComputedColor(
      adjustSettings,
      'backgroundColor',
      darkColors.surfaceMuted,
      `Onboarding secondary action should use the dark muted surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      adjustSettings,
      'borderColor',
      darkColors.border,
      `Onboarding secondary action should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      adjustSettings,
      'color',
      darkColors.text,
      `Onboarding secondary action label should use the dark text token in ${testCase.language}`,
    );
    await expectNoHorizontalOverflow(page);
  });
}

for (const testCase of searchSourceAffordanceCases) {
  test(`search utility route uses dark source-affordance tokens in ${testCase.language}`, async ({
    page,
  }) => {
    await seedSettingsLanguage(page, testCase.language);
    await markAboutTheTestSeen(page);
    await seedDarkTheme(page);

    await page.goto('/search', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const searchInput = page.getByRole('textbox', {
      name: testCase.inputName,
    });
    await expect(searchInput).toBeVisible();
    await expect
      .poll(async () => (await computedColors(searchInput)).color)
      .toBe(hexToRgb(darkColors.text));
    await expect
      .poll(async () => (await computedColors(searchInput)).borderColor)
      .toBe(hexToRgb(darkColors.border));

    await searchInput.fill(testCase.chapterQuery);
    const chapterLink = page.getByRole('link', { name: testCase.chapterLinkName }).first();
    await expect(chapterLink).toBeVisible();
    await expectComputedColor(
      chapterLink,
      'borderColor',
      darkColors.focus,
      `Search chapter links should use the dark focus border token in ${testCase.language}`,
    );

    await searchInput.fill(testCase.provenanceQuery);
    const provenanceBadge = page
      .getByRole('button', { name: testCase.provenanceBadgeName })
      .first();
    await expect(provenanceBadge).toBeVisible();
    await expectComputedColor(
      provenanceBadge,
      'backgroundColor',
      darkColors.badgeBlueBg,
      `Search provenance badges should use the dark UHR badge background token in ${testCase.language}`,
    );
    await expectComputedColor(
      provenanceBadge.getByText(testCase.provenanceLabel),
      'color',
      darkColors.badgeBlueText,
      `Search provenance badge labels should use the dark UHR badge text token in ${testCase.language}`,
    );

    await provenanceBadge.click();
    const sourceNote = page.getByText(testCase.sourceNoteName).first();
    await expect(sourceNote).toBeVisible();
    await expectComputedColor(
      provenanceBadge,
      'borderColor',
      darkColors.focus,
      `Expanded Search provenance badges should use the dark focus border token in ${testCase.language}`,
    );
    await expectComputedColor(
      sourceNote,
      'backgroundColor',
      darkColors.surfaceWarm,
      `Search provenance source notes should use the dark warm surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      sourceNote,
      'borderColor',
      darkColors.border,
      `Search provenance source notes should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      sourceNote,
      'color',
      darkColors.textSecondary,
      `Search provenance source notes should use the dark secondary text token in ${testCase.language}`,
    );
    await expectNoHorizontalOverflow(page);
  });
}

for (const testCase of citizenshipSourceAffordanceCases) {
  test(`citizenship requirements route preserves dark checked tokens after reload in ${testCase.language}`, async ({
    page,
  }) => {
    await seedSettingsLanguage(page, testCase.language);
    await markAboutTheTestSeen(page);
    await seedDarkTheme(page);

    await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const firstChecklistItem = page.getByRole('checkbox', { name: testCase.checkboxName }).first();
    const firstChecklistRow = page.getByTestId('citizenship-requirement-identity-checkbox');
    const firstChecklistBox = page.getByTestId('citizenship-requirement-identity-checkbox-box');
    await expect(firstChecklistItem).toBeVisible();
    await expect
      .poll(async () => (await computedColors(firstChecklistItem)).borderColor)
      .toBe(hexToRgb(darkColors.border));

    await firstChecklistItem.click();
    await expect(
      page.getByRole('checkbox', { name: testCase.checkedCheckboxName }).first(),
    ).toBeChecked();
    await expect(firstChecklistRow).toHaveAttribute('aria-checked', 'true');
    await expectComputedColor(
      firstChecklistRow,
      'backgroundColor',
      darkColors.successSoft,
      `Checked Citizenship checklist rows should use the dark success-soft token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistRow,
      'borderColor',
      darkColors.success,
      `Checked Citizenship checklist rows should use the dark success border token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistBox,
      'backgroundColor',
      darkColors.success,
      `Checked Citizenship checkbox boxes should use the dark success fill token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistBox,
      'borderColor',
      darkColors.success,
      `Checked Citizenship checkbox boxes should use the dark success border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByTestId('citizenship-requirement-identity-checkbox-check'),
      'backgroundColor',
      darkColors.surface,
      `Checked Citizenship check indicators should use the dark surface token in ${testCase.language}`,
    );

    await page.reload({ waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const reloadedCheckedChecklistItem = page
      .getByRole('checkbox', { name: testCase.checkedCheckboxName })
      .first();
    await expect(reloadedCheckedChecklistItem).toBeChecked();
    await expect(firstChecklistRow).toHaveAttribute('aria-checked', 'true');
    await expectComputedColor(
      firstChecklistRow,
      'backgroundColor',
      darkColors.successSoft,
      `Reloaded checked Citizenship rows should keep the dark success-soft token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistRow,
      'borderColor',
      darkColors.success,
      `Reloaded checked Citizenship rows should keep the dark success border token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistBox,
      'backgroundColor',
      darkColors.success,
      `Reloaded checked Citizenship checkbox boxes should keep the dark success fill token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstChecklistBox,
      'borderColor',
      darkColors.success,
      `Reloaded checked Citizenship checkbox boxes should keep the dark success border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByTestId('citizenship-requirement-identity-checkbox-check'),
      'backgroundColor',
      darkColors.surface,
      `Reloaded checked Citizenship check indicators should keep the dark surface token in ${testCase.language}`,
    );

    const disclaimer = page.getByLabel(testCase.disclaimerLabel).first();
    await expect(disclaimer).toBeVisible();
    await expectComputedColor(
      disclaimer,
      'backgroundColor',
      darkColors.surfaceWarm,
      `Citizenship disclaimer should use the dark warm surface token in ${testCase.language}`,
    );
    await expectComputedColor(
      disclaimer,
      'borderColor',
      darkColors.border,
      `Citizenship disclaimer should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByText(testCase.disclaimerTitle).first(),
      'color',
      darkColors.textSecondary,
      `Citizenship disclaimer title should use the dark secondary text token in ${testCase.language}`,
    );
    await expectComputedColor(
      page.getByText(testCase.disclaimerBodyName).first(),
      'color',
      darkColors.textDisclaimer,
      `Citizenship disclaimer copy should use the dark disclaimer text token in ${testCase.language}`,
    );

    const firstSourceLink = page.getByRole('link', { name: testCase.sourceLinkName }).first();
    await expect(firstSourceLink).toBeVisible();
    await expectComputedColor(
      firstSourceLink,
      'borderColor',
      darkColors.border,
      `Citizenship source links should use the dark border token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstSourceLink.getByText(testCase.sourceTitle),
      'color',
      darkColors.text,
      `Citizenship source titles should use the dark primary text token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstSourceLink.getByText('Migrationsverket').first(),
      'color',
      darkColors.textSecondary,
      `Citizenship source metadata should use the dark secondary text token in ${testCase.language}`,
    );
    await expectComputedColor(
      firstSourceLink.getByText(/https:\/\/www\.migrationsverket\.se\//).first(),
      'color',
      darkColors.accent,
      `Citizenship source URLs should use the dark accent token in ${testCase.language}`,
    );

    const practiceLink = page.getByRole('link', {
      name: testCase.practiceLinkName,
    });
    await expect(practiceLink).toBeVisible();
    await expect
      .poll(async () => (await computedColors(practiceLink)).backgroundColor)
      .toBe(hexToRgb(darkColors.accent));
    await expect
      .poll(async () => (await computedColors(practiceLink)).color)
      .toBe(hexToRgb(darkColors.surface));
    await expectNoHorizontalOverflow(page);
  });
}
