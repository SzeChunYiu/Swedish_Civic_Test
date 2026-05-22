import { expect, test } from '@playwright/test';

import {
  type AppLanguage,
  blockingModalOverlayLocator,
  collectConsoleAndPageErrors,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

type LaunchCloseKeyboardCase = {
  activationKey: 'Enter' | 'Space';
  closeLabel: string;
  contentHeading: string;
  dialogLabel: string;
  language: AppLanguage;
};

const launchCloseKeyboardCases: LaunchCloseKeyboardCase[] = [
  {
    activationKey: 'Enter',
    closeLabel: 'Stäng startannons',
    contentHeading: 'Dagens mål',
    dialogLabel: 'Startannons',
    language: 'sv',
  },
  {
    activationKey: 'Space',
    closeLabel: 'Stäng startannons',
    contentHeading: 'Dagens mål',
    dialogLabel: 'Startannons',
    language: 'sv',
  },
  {
    activationKey: 'Enter',
    closeLabel: 'Close launch sponsor ad',
    contentHeading: "Today's goal",
    dialogLabel: 'Launch sponsor ad',
    language: 'en',
  },
  {
    activationKey: 'Space',
    closeLabel: 'Close launch sponsor ad',
    contentHeading: "Today's goal",
    dialogLabel: 'Launch sponsor ad',
    language: 'en',
  },
];

type LaunchEscapeCloseCase = {
  contentHeading: string;
  dialogLabel: string;
  language: AppLanguage;
};

const launchEscapeCloseCases: LaunchEscapeCloseCase[] = [
  {
    contentHeading: 'Dagens mål',
    dialogLabel: 'Startannons',
    language: 'sv',
  },
  {
    contentHeading: "Today's goal",
    dialogLabel: 'Launch sponsor ad',
    language: 'en',
  },
];

const launchSuppressedRouteCases = [
  '/about-the-test',
  '/settings',
  '/search?q=riksdag',
  '/chapter/ch01',
] as const;

async function focusLaunchCloseControlByKeyboard(page: import('@playwright/test').Page) {
  const focusedCloseButton = page
    .getByRole('button', { name: /Close launch sponsor ad|Stäng startannons/ })
    .and(page.locator(':focus'));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.keyboard.press('Tab');
    if ((await focusedCloseButton.count()) > 0) return;
  }

  await expect(focusedCloseButton).toHaveCount(1);
}

test('launch sponsor modal exposes one named dialog on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/home', { waitUntil: 'networkidle' });

  const dialogs = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Startannons');
  await expect(page.getByRole('heading', { name: 'Startannons' })).toBeVisible();
  await expect(page.getByText('Testannons för appstart visas en gång per appstart.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Launch sponsor' })).toHaveCount(0);
  await expect(page.getByText('Continue studying')).toHaveCount(0);

  await page.getByRole('button', { name: 'Stäng startannons' }).click();

  await expect(dialogs).toHaveCount(0);
  await expect(page.getByText('Dagens mål')).toBeVisible();

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('launch sponsor route allowlist shows Home once for a free user', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto('/home', { waitUntil: 'networkidle' });

  const dialogs = page.locator(blockingModalOverlayLocator);
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Startannons');
  await expect(page.getByRole('heading', { name: 'Startannons' })).toBeVisible();

  await page.getByRole('button', { name: 'Stäng startannons' }).click();

  await expect(dialogs).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Dagens mål' })).toBeVisible();

  await page.waitForTimeout(150);

  await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Dagens mål' })).toBeVisible();
  expect(consoleErrors.get()).toEqual([]);
});

for (const routePath of launchSuppressedRouteCases) {
  test(`launch sponsor route allowlist suppresses ${routePath}`, async ({ page }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);

    await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
    await page.goto(routePath, { waitUntil: 'networkidle' });

    await expect(page.locator(blockingModalOverlayLocator)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Startannons' })).toHaveCount(0);
    await expect(page.getByText('Testannons för appstart visas en gång per appstart.')).toHaveCount(
      0,
    );
    expect(consoleErrors.get()).toEqual([]);
  });
}

for (const {
  activationKey,
  closeLabel,
  contentHeading,
  dialogLabel,
  language,
} of launchCloseKeyboardCases) {
  test(`launch sponsor close control closes from keyboard ${activationKey} in ${language}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await seedFreshSettingsLanguageAndAboutSeen(page, language);
    await page.goto('/home', { waitUntil: 'networkidle' });

    const dialogs = page.locator(blockingModalOverlayLocator);
    await expect(dialogs).toHaveCount(1);
    await expect(dialogs.first()).toHaveAttribute('aria-label', dialogLabel);

    const closeLaunchAd = page.getByRole('button', { name: closeLabel });
    await expect(closeLaunchAd).toBeVisible();

    await focusLaunchCloseControlByKeyboard(page);
    await expect(closeLaunchAd).toBeFocused();

    await page.keyboard.press(activationKey);

    await expect(dialogs).toHaveCount(0);
    await expect(page.getByRole('heading', { name: contentHeading })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
}

for (const { contentHeading, dialogLabel, language } of launchEscapeCloseCases) {
  test(`launch sponsor modal closes with Escape in ${language}`, async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await seedFreshSettingsLanguageAndAboutSeen(page, language);
    await page.goto('/home', { waitUntil: 'networkidle' });

    const dialogs = page.locator(blockingModalOverlayLocator);
    await expect(dialogs).toHaveCount(1);
    await expect(dialogs.first()).toHaveAttribute('aria-label', dialogLabel);

    await page.keyboard.press('Escape');

    await expect(dialogs).toHaveCount(0);
    await expect(page.getByRole('heading', { name: contentHeading })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
}

test('first-run about modal exposes only real guide actions on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\hasCompletedOnboarding', 'true');
  });

  await page.goto('/practice', { waitUntil: 'networkidle' });

  const dialogs = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first()).toHaveAttribute('aria-label', 'Vad är medborgarskapsprovet?');
  await expect(dialogs.first()).toHaveAttribute('aria-labelledby', 'first-run-about-dialog-title');
  await expect(dialogs.first()).toHaveAttribute('aria-describedby', 'first-run-about-dialog-body');
  await expect(page.locator('#first-run-about-dialog-title')).toHaveText(
    'Vad är medborgarskapsprovet?',
  );
  await expect(page.locator('#first-run-about-dialog-body')).toContainText(
    'En kort guide till vad provet är',
  );
  await expect(page.getByRole('heading', { name: 'Vad är medborgarskapsprovet?' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Öppna guiden om medborgarskapsprovet' }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: ['Öppna om-', 'provet-', 'guiden'].join('') }),
  ).toHaveCount(0);

  const skipGuideButtons = page.getByRole('button', { name: 'Hoppa över guiden' });
  await expect(skipGuideButtons).toHaveCount(1);
  const skipGuideBox = await skipGuideButtons.first().boundingBox();
  expect(skipGuideBox).not.toBeNull();
  expect(skipGuideBox?.width).toBeLessThan(220);
  expect(skipGuideBox?.height).toBeLessThan(96);

  await page.mouse.click(8, 8);
  await expect(dialogs).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('onboarding route is not covered by the first-run about modal', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', 'sv');
  });

  await page.goto('/onboarding', { waitUntil: 'networkidle' });

  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Förbered dig lugnt för samhällskunskapsprovet' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vad är medborgarskapsprovet?' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Välj ett mjukt dagligt mål' })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
