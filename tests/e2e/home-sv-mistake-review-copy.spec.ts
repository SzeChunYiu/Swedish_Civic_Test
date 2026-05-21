import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { collectConsoleAndPageErrors, setupHomeCopyRoute } from './browserLaunch';

const forbiddenSwedishMistakeCopy = /felspårning|repetition av misstag/i;

test.use({ viewport: { width: 390, height: 844 } });

async function expectHomeWithoutHorizontalOverflow(page: Page) {
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

test('home renders natural Swedish missed-question review copy', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await setupHomeCopyRoute(page, 'sv');

  await expect(page.getByText(/genomgång av frågor du missat/i).first()).toBeVisible();
  await expect(
    page.getByText(/missade frågor, ljud och förberedelsesignal/i).first(),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(forbiddenSwedishMistakeCopy);
  await expectHomeWithoutHorizontalOverflow(page);
  expect(consoleErrors.get()).toEqual([]);
});

test('home keeps intentional English mistake-review copy in support mode', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await setupHomeCopyRoute(page, 'en');

  await expect(page.getByText(/mistake review/i).first()).toBeVisible();
  await expect(
    page.getByText(/missed-question review, audio, and preparation signals/i).first(),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/genomgång av frågor du missat/i);
  await expectHomeWithoutHorizontalOverflow(page);
  expect(consoleErrors.get()).toEqual([]);
});
