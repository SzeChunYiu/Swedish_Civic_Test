import { expect, test, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen } from './browserLaunch';

async function expectSearchState(page: Page, expectedQuery: string) {
  const input = page.getByRole('textbox', { name: 'Sök samhällsbegrepp och övningsfrågor' });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(expectedQuery);
  await expect(page.getByText(/\d+ av \d+ begrepp och \d+ övningsfrågor matchar/)).toBeVisible();
  await expect(page.getByText(new RegExp(expectedQuery, 'i')).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Öppna övningsfrågan:/ }).first()).toBeVisible();

  return input;
}

async function expectHydratedSearch(page: Page, url: string, expectedQuery: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  return expectSearchState(page, expectedQuery);
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

test('search route resyncs when URL query params change after mount', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await markAboutTheTestSeen(page);

  const input = await expectHydratedSearch(page, '/search?q=riksdag', 'riksdag');
  await input.fill('egen text');
  await expect(input).toHaveValue('egen text');

  await page.evaluate(() => {
    window.history.pushState({}, '', '/search?query=kommun');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await expectSearchState(page, 'kommun');

  await page.getByRole('button', { name: 'Rensa sökfältet' }).click();
  await expect(input).toHaveValue('');
  await expect(page).toHaveURL(/\/search$/);

  await input.fill('lokal text');
  await expect(input).toHaveValue('lokal text');
  await page.evaluate(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(input).toHaveValue('lokal text');

  expect(consoleErrors).toEqual([]);
});
