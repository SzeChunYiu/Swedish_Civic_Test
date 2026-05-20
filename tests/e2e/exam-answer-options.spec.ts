import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const totalQuestions = 20;

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
}

async function expectReachableTarget(locator: Locator, label: string) {
  const box = await locator.boundingBox();

  expect(box, `${label} should be visible and measurable`).not.toBeNull();
  expect(box!.height, `${label} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
  expect(box!.width, `${label} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
}

test('mock exam answer options keep radio semantics through submission', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByText('Övningsprov')).toBeVisible();
  await expect(page.getByText(`0/${totalQuestions} besvarade`)).toBeVisible();

  const firstQuestionRadios = page.getByRole('radio', { name: /för fråga 1$/ });
  await expect(firstQuestionRadios).toHaveCount(4);

  const firstRadio = firstQuestionRadios.first();
  const secondRadio = firstQuestionRadios.nth(1);
  await expect(firstRadio).toHaveAttribute('aria-checked', 'false');
  await expect(secondRadio).toHaveAttribute('aria-checked', 'false');
  await expectReachableTarget(firstRadio, 'first answer option');

  await firstRadio.focus();
  await expect(firstRadio).toBeFocused();

  await firstRadio.click();
  await expect(firstRadio).toHaveAttribute('aria-checked', 'true');
  await expect(firstRadio).toHaveAttribute('aria-selected', 'true');
  await expect(secondRadio).toHaveAttribute('aria-checked', 'false');

  for (let questionNumber = 2; questionNumber <= totalQuestions; questionNumber += 1) {
    const option = page
      .getByRole('radio', {
        name: new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`),
      })
      .first();
    await expectReachableTarget(option, `question ${questionNumber} answer option`);
    await option.click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} besvarade`)).toBeVisible();

  const submit = page.getByLabel('Skicka övningsprov');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();
  await expect(page.getByText('Frågegenomgång')).toBeVisible();
  await expect(page.getByText('Valt svar').first()).toBeVisible();
  await expect(page.getByText('Rätt svar').first()).toBeVisible();
  await expect(page.getByRole('radio', { name: /för fråga 1$/ })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
