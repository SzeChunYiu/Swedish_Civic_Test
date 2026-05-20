import { expect, test, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen } from './browserLaunch';

async function expectHydratedSearch(page: Page, url: string, expectedQuery: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const input = page.getByRole('textbox', { name: 'Sök samhällsbegrepp' });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(expectedQuery);
  await expect(page.getByText(/\d+ av \d+ samhällsbegrepp visas/)).toBeVisible();
  await expect(page.getByText(new RegExp(expectedQuery, 'i')).first()).toBeVisible();

  return input;
}

test('search route hydrates q and query URL parameters before typing', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const riksdagInput = await expectHydratedSearch(page, '/search?q=riksdag', 'riksdag');
  await page.getByRole('button', { name: 'Rensa sökfältet' }).click();
  await expect(riksdagInput).toHaveValue('');
  await expect(page.getByText(/\d+ samhällsbegrepp i referensen/)).toBeVisible();

  await expectHydratedSearch(page, '/search?query=kommun', 'kommun');

  expect(consoleErrors).toEqual([]);
});
