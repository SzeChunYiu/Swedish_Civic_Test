import { expect, test, type Locator, type Page } from '@playwright/test';

import { darkColors, shadows, space } from '../../lib/theme';
import {
  currentProgressStateStorageKey,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';
import { startAllVisiblePractice } from './practiceHub';

const accessibilityThemeModeKey = 'accessibility\\a11y.themeMode.v1';
const mobileViewport = { width: 390, height: 844 };

function hexToRgb(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
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

async function computedStyleValue(locator: Locator, property: keyof CSSStyleDeclaration) {
  return locator.evaluate((element, propertyName) => {
    const style = window.getComputedStyle(element);

    return style[propertyName as keyof CSSStyleDeclaration];
  }, property);
}

async function closestBoxShadow(locator: Locator) {
  return locator.evaluate((element) => {
    let current = element.parentElement;
    while (current) {
      const boxShadow = window.getComputedStyle(current).boxShadow;
      if (boxShadow && boxShadow !== 'none') return boxShadow;
      current = current.parentElement;
    }

    return 'none';
  });
}

function expectBoxShadowToMatchToken(actualBoxShadow: string, tokenBoxShadow: string) {
  const color = tokenBoxShadow.match(/rgba\([^)]+\)/)?.[0];
  const lengths = tokenBoxShadow.match(/\d+px/g) ?? [];

  expect(color).toBeTruthy();
  expect(actualBoxShadow).toContain(color);
  for (const length of lengths.slice(1)) {
    expect(actualBoxShadow).toContain(length);
  }
}

async function expectComputedStyleValue(
  locator: Locator,
  property: keyof CSSStyleDeclaration,
  expectedValue: string,
  message: string,
) {
  await expect
    .poll(async () => computedStyleValue(locator, property), { message })
    .toBe(expectedValue);
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

async function expectComputedCssColor(
  locator: Locator,
  property: 'backgroundColor' | 'borderColor' | 'color',
  expectedCssColor: string,
  message: string,
) {
  await expect
    .poll(async () => (await computedColors(locator))[property], { message })
    .toBe(expectedCssColor);
}

async function expectNoHorizontalOverflow(page: Page, message: string) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;

          return (
            root.scrollWidth <= root.clientWidth + 1 && body.scrollWidth <= root.clientWidth + 1
          );
        }),
      { message },
    )
    .toBe(true);
}

async function seedDarkEnglishMonetization(page: Page) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityThemeModeKey]: 'dark',
    },
    windowValues: {
      __SMT_E2E__: true,
      __SMT_ENABLE_PRO_RUNTIME_SCOPE__: true,
      __SMT_PRO_LIFETIME_MOCK_OWNED__: false,
      __SMT_REMOVE_ADS_MOCK_OWNED__: false,
    },
  });
}

function dateInCurrentLocalWeek(offsetDays: number, minuteOffset = 0) {
  const date = new Date();
  const offsetToMonday = (date.getDay() + 6) % 7;
  date.setHours(12, minuteOffset, 0, 0);
  date.setDate(date.getDate() - offsetToMonday + offsetDays);
  return date;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weeklyRecapProgressSeed() {
  const firstAnswerAt = dateInCurrentLocalWeek(0);
  const secondAnswerAt = dateInCurrentLocalWeek(0, 2);
  const mockCompletedAt = dateInCurrentLocalWeek(1);

  return {
    answerDates: [localDateKey(firstAnswerAt)],
    answerHistory: [
      {
        answeredAt: firstAnswerAt.toISOString(),
        isCorrect: false,
        questionId: 'q001',
        timeSpentSeconds: 12,
      },
      {
        answeredAt: secondAnswerAt.toISOString(),
        isCorrect: true,
        questionId: 'q002',
        timeSpentSeconds: 9,
      },
    ],
    completedQuestionIds: ['q002'],
    dailyChallengeCompletions: {},
    mockExamSessions: [
      {
        completedAt: mockCompletedAt.toISOString(),
        correctCount: 14,
        questionTimings: [{ questionId: 'q001', timeSpentSeconds: 60 }],
        score: 0.7,
        sessionId: 'exam-weekly',
        totalCount: 20,
      },
    ],
    questionProgress: {
      q001: {
        correctCount: 0,
        correctStreak: 0,
        lastAnsweredAt: firstAnswerAt.toISOString(),
        questionId: 'q001',
        seenCount: 1,
        wrongCount: 1,
      },
      q002: {
        correctCount: 1,
        correctStreak: 1,
        lastAnsweredAt: secondAnswerAt.toISOString(),
        questionId: 'q002',
        seenCount: 1,
        wrongCount: 0,
      },
    },
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 80,
  };
}

function quietWeekProgressSeed() {
  return {
    answerDates: [],
    answerHistory: [],
    completedQuestionIds: [],
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    questionProgress: {},
    streakFreezeState: {
      available: 0,
      lastEarnedAt: null,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
    totalXp: 0,
  };
}

async function seedDarkEnglishWeeklyRecap(page: Page, progressSeed: unknown) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityThemeModeKey]: 'dark',
      [currentProgressStateStorageKey]: JSON.stringify(progressSeed),
    },
  });
}

test.use({ viewport: mobileViewport });

test('home monetization ad surfaces use dark theme tokens', async ({ page }) => {
  await seedDarkEnglishMonetization(page);
  await page.goto('/home', { waitUntil: 'networkidle' });

  const launchCloseButton = page.getByRole('button', { name: 'Close launch sponsor ad' });
  if (await launchCloseButton.isVisible().catch(() => false)) {
    await expectComputedColor(
      page.getByText('Launch sponsor', { exact: true }),
      'color',
      darkColors.text,
      'Launch popup title should use the dark text token',
    );
    await expectComputedColor(
      launchCloseButton,
      'backgroundColor',
      darkColors.accent,
      'Launch popup close button should use the dark accent token',
    );
  }

  await dismissBlockingModals(page);

  const pricingWedge = page
    .getByLabel(/practice questions across \d+ chapters\. Remove ads forever for 29 SEK/)
    .first();
  await pricingWedge.scrollIntoViewIfNeeded();
  await expect(pricingWedge).toBeVisible();
  await expectComputedColor(
    pricingWedge,
    'backgroundColor',
    darkColors.successSoft,
    'Pricing wedge should use the dark success surface token',
  );
  await expectComputedColor(
    pricingWedge,
    'borderColor',
    darkColors.success,
    'Pricing wedge should use the dark success border token',
  );
  await expectComputedColor(
    page.getByText(/practice questions across \d+ chapters/).first(),
    'color',
    darkColors.success,
    'Pricing wedge proof text should use the dark success text token',
  );

  const adBanner = page.getByLabel(/Google AdMob: Home banner/).first();
  await adBanner.scrollIntoViewIfNeeded();
  await expect(adBanner).toBeVisible();
  await expectComputedColor(
    adBanner,
    'backgroundColor',
    darkColors.surface,
    'Home ad fallback card should use the dark card surface token',
  );
  await expectComputedColor(
    page.getByText('Google AdMob', { exact: true }).first(),
    'color',
    darkColors.badgeBlueText,
    'Home ad fallback eyebrow should use the dark badge text token',
  );
  await expectComputedColor(
    page.getByText('AdMob test unit active - preview', { exact: true }).first(),
    'color',
    darkColors.textMuted,
    'Home ad fallback status should use the dark muted text token',
  );
});

test('profile Remove Ads and Pro surfaces use dark theme tokens', async ({ page }) => {
  await seedDarkEnglishMonetization(page);
  await page.goto('/profile?focus=remove-ads', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const focusedPaywall = page.getByTestId('remove-ads-paywall');
  await focusedPaywall.scrollIntoViewIfNeeded();
  await expect(focusedPaywall).toBeVisible();
  await expectComputedColor(
    focusedPaywall,
    'borderColor',
    darkColors.focus,
    'Focused Remove Ads wrapper should use the dark focus token',
  );
  await expectComputedColor(
    page.getByText('Remove Ads is highlighted. Buy and Restore controls are here.', {
      exact: true,
    }),
    'color',
    darkColors.accent,
    'Focused Remove Ads cue should use the dark accent token',
  );

  const removeAdsTitle = page.getByRole('heading', { name: 'Remove Ads' }).first();
  await removeAdsTitle.scrollIntoViewIfNeeded();
  await expect(removeAdsTitle).toBeVisible();
  await expectComputedColor(
    removeAdsTitle,
    'color',
    darkColors.text,
    'Remove Ads title should use the dark text token',
  );
  await expectComputedColor(
    page.getByText(/Free study keeps AdMob ads on/).first(),
    'color',
    darkColors.textMuted,
    'Remove Ads body should use the dark muted text token',
  );
  await expectComputedColor(
    page.getByLabel(/Remove Ads status:/).first(),
    'color',
    darkColors.textMuted,
    'Remove Ads status should use the dark muted text token',
  );

  const proTitle = page.getByRole('heading', { name: 'Compare Free, Ad-Free, and Pro' }).first();
  await proTitle.scrollIntoViewIfNeeded();
  await expect(proTitle).toBeVisible();
  await expectComputedColor(
    page.getByText('Pro Lifetime', { exact: true }).first(),
    'color',
    darkColors.badgeBlueText,
    'Pro eyebrow should use the dark badge text token',
  );
  await expectComputedColor(
    proTitle,
    'color',
    darkColors.text,
    'Pro title should use the dark text token',
  );
  await expectComputedColor(
    page.getByLabel(/Pro status:/).first(),
    'color',
    darkColors.textMuted,
    'Pro status should use the dark muted text token',
  );
  await expectComputedColor(
    page.getByText('59 SEK', { exact: true }).last(),
    'color',
    darkColors.textPlaceholder,
    'Pro price note should use the dark placeholder text token',
  );
});

test('practice post-answer reward panel uses dark theme tokens', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityThemeModeKey]: 'dark',
    },
  });
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, 'en');

  await page.getByLabel('Select answer In the Nordic region in northern Europe').click();

  const rewardPanel = page.getByRole('region', { name: /^Correct answer\./ }).first();
  await rewardPanel.scrollIntoViewIfNeeded();
  await expect(rewardPanel).toBeVisible();
  await expectComputedColor(
    rewardPanel,
    'backgroundColor',
    darkColors.surfaceWarm,
    'Post-answer reward panel should use the dark warm surface token',
  );
  await expectComputedColor(
    rewardPanel,
    'borderColor',
    darkColors.border,
    'Post-answer reward panel should use the dark border token',
  );

  const factTitle = page.getByText("Today's UHR thread", { exact: true });
  const factBubble = factTitle.locator('..');
  await expectComputedColor(
    factBubble,
    'backgroundColor',
    darkColors.surface,
    'Post-answer fact bubble should use the dark surface token',
  );
  await expectComputedColor(
    factTitle,
    'color',
    darkColors.text,
    'Post-answer fact title should use the dark text token',
  );

  const xpLabel = page.getByText('XP now', { exact: true });
  const xpPill = xpLabel.locator('..');
  await expectComputedColor(
    xpPill,
    'backgroundColor',
    darkColors.badgeBlueBg,
    'Post-answer XP pill should use the dark badge surface token',
  );
  await expectComputedColor(
    page.getByText('+12', { exact: true }),
    'color',
    darkColors.text,
    'Post-answer XP value should use the dark text token',
  );
  await expectComputedColor(
    xpLabel,
    'color',
    darkColors.badgeBlueText,
    'Post-answer XP label should use the dark badge text token',
  );
});

test('weekly recap route uses dark theme tokens without horizontal overflow', async ({ page }) => {
  await seedDarkEnglishWeeklyRecap(page, quietWeekProgressSeed());
  await page.goto('/recap', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectComputedColor(
    page.getByRole('heading', { name: 'Your study week' }),
    'color',
    darkColors.text,
    'Weekly recap title should use the dark text token',
  );
  await expectComputedColor(
    page.getByText(/A local summary of this week.s answers/),
    'color',
    darkColors.textMuted,
    'Weekly recap subtitle should use the dark muted text token',
  );

  const questionsMetric = page.getByLabel('questions answered: 0');
  await expectComputedColor(
    questionsMetric,
    'backgroundColor',
    darkColors.badgeBlueBg,
    'Weekly recap questions metric should use the dark badge surface token',
  );
  await expectComputedColor(
    page.getByText('questions answered', { exact: true }),
    'color',
    darkColors.textMuted,
    'Weekly recap metric labels should use the dark muted text token',
  );

  const quietWeekCard = page.getByLabel(/Quiet week\. No problem\./);
  await expectComputedColor(
    quietWeekCard,
    'backgroundColor',
    darkColors.surface,
    'Quiet-week card should use the dark card surface token',
  );
  await expectComputedColor(
    page.getByText('Quiet week', { exact: true }),
    'color',
    darkColors.text,
    'Quiet-week card title should use the dark text token',
  );
  await expectComputedColor(
    page.getByText(/A quiet week still counts/),
    'color',
    darkColors.textSecondary,
    'Quiet-week card body should use the dark secondary text token',
  );

  const backToProfile = page.getByRole('link', { name: 'Back to Profile' });
  await expectComputedCssColor(
    backToProfile,
    'backgroundColor',
    darkColors.surfaceMuted,
    'Back to Profile link should use the dark muted surface token',
  );
  await expectComputedColor(
    page.getByText('Back to Profile', { exact: true }),
    'color',
    darkColors.text,
    'Back to Profile label should use the dark text token',
  );
  await expectNoHorizontalOverflow(page, 'Quiet weekly recap should not overflow horizontally');

  await seedDarkEnglishWeeklyRecap(page, weeklyRecapProgressSeed());
  await page.goto('/recap', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectComputedColor(
    page.getByRole('heading', { name: 'Next calm review' }),
    'color',
    darkColors.text,
    'Weekly recap weak-chapter heading should use the dark text token',
  );
  await expectComputedColor(
    page.getByText(/appeared in this week.s answers/),
    'color',
    darkColors.textMuted,
    'Weekly recap weak-chapter subtitle should use the dark muted text token',
  );
  await expectComputedColor(
    page.getByRole('link', { name: /Practise / }),
    'backgroundColor',
    darkColors.accent,
    'Weak-chapter practice link should use the dark accent token',
  );
  await expectNoHorizontalOverflow(page, 'Active weekly recap should not overflow horizontally');
});

test('search and settings hairline/divider CSS widths stay correct in dark theme', async ({
  page,
}) => {
  await seedDarkEnglishMonetization(page);
  await page.goto('/search', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const searchInput = page.getByTestId('search-input');
  await expect(searchInput).toBeVisible();
  await expectComputedStyleValue(
    searchInput,
    'borderTopWidth',
    `${space.hairline}px`,
    'Dark Search input should render the semantic hairline as 1px CSS',
  );

  const searchSummarySpacer = page.getByTestId('search-accessibility-summary-spacer');
  await expectComputedStyleValue(
    searchSummarySpacer,
    'height',
    `${space.divider}px`,
    'Dark Search hidden summary spacer should keep the 2px divider height',
  );
  await expectComputedStyleValue(
    searchSummarySpacer,
    'width',
    `${space.divider}px`,
    'Dark Search hidden summary spacer should keep the 2px divider width',
  );

  await page.goto('/settings?focus=study', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const studyControls = page.getByTestId('study-settings-controls');
  await expect(studyControls).toBeVisible();
  await expectComputedStyleValue(
    studyControls,
    'borderTopWidth',
    `${space.hairline}px`,
    'Dark focused Settings study controls should render the semantic hairline as 1px CSS',
  );

  const dailyGoalOption = page.getByTestId('daily-goal-option-5');
  await expect(dailyGoalOption).toBeVisible();
  await expectComputedStyleValue(
    dailyGoalOption,
    'borderTopWidth',
    `${space.hairline}px`,
    'Dark daily goal pill should render the semantic hairline as 1px CSS',
  );
  await expectComputedStyleValue(
    dailyGoalOption,
    'rowGap',
    `${space.divider}px`,
    'Dark daily goal pill should keep the intentional 2px divider row gap',
  );
  await expectComputedStyleValue(
    dailyGoalOption,
    'columnGap',
    `${space.divider}px`,
    'Dark daily goal pill should keep the intentional 2px divider column gap',
  );
});

test('ebook elevated card uses the tokenized web shadow', async ({ page }) => {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en');
  await page.goto('/ebook', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const articleHeading = page.getByRole('heading', {
    name: "Slow down. We've got coffee.",
  });
  await expect(articleHeading).toBeVisible();

  const articleCardBoxShadow = await closestBoxShadow(articleHeading);
  expect(articleCardBoxShadow).not.toBe('none');
  expectBoxShadowToMatchToken(articleCardBoxShadow, shadows.card.boxShadow);
});

test('ebook route uses dark theme tokens without horizontal overflow', async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityThemeModeKey]: 'dark',
    },
  });
  await page.goto('/ebook', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const articleHeading = page.getByRole('heading', {
    name: "Slow down. We've got coffee.",
  });
  await expect(articleHeading).toBeVisible();
  await expectComputedColor(
    articleHeading,
    'color',
    darkColors.text,
    'Ebook article heading should use the dark text token',
  );

  const backLink = page.getByRole('link', { name: 'Back to Learn' });
  const backLinkLabel = backLink.getByText('Back to Learn');
  await expectComputedColor(
    backLinkLabel,
    'color',
    darkColors.accent,
    'Ebook back link should use the dark accent token',
  );

  const provenanceBody = page.getByText(/Original study guide/);
  await expectComputedColor(
    provenanceBody,
    'color',
    darkColors.textSecondary,
    'Ebook provenance text should use the dark secondary text token',
  );

  const sectionSourceBox = page
    .getByRole('link', {
      name: /Open source: UHR public study material\./,
    })
    .first();
  await expectComputedColor(
    sectionSourceBox,
    'borderColor',
    darkColors.border,
    'Ebook section-source link should use the dark border token',
  );
  await expectNoHorizontalOverflow(page, 'Ebook dark mobile layout should not overflow');
});
