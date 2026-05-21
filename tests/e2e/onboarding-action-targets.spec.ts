import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, seedFreshSettingsLanguageAndAboutSeen } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const minimumTargetSizePx = 44;

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

test('Onboarding actions keep mobile-safe targets and daily goal selection', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', { name: 'Förbered dig lugnt för samhällskunskapsprovet' }),
  ).toBeVisible();

  for (const link of onboardingActionLinks) {
    const target = page.getByRole('link', { exact: true, name: link.label });
    await expect(target).toContainText(link.visibleText);
    await expect(target).toHaveAttribute('href', link.href);
    await expectMinimumTargetSize(target, link.visibleText);
  }

  const regularGoal = page.getByRole('button', {
    exact: true,
    name: 'Välj regelbundet dagligt mål med 20 svar',
  });
  await expectMinimumTargetSize(regularGoal, 'Regular daily goal');
  await regularGoal.click();
  await expect(regularGoal).toHaveAttribute('aria-selected', 'true');

  await expectNoHorizontalOverflow(page);
  expect(consoleErrors).toEqual([]);
});
