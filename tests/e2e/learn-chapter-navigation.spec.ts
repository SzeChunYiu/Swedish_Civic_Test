import { expect, test } from '@playwright/test';

test('learning path opens a source-backed chapter detail screen and returns to the chapter list', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }

  await expect(page.locator('body')).toContainText('Studieväg');
  await expect(page.locator('body')).toContainText('13 samhällsområden');
  const firstChapter = page.getByLabel(/Öppna kapitel Landet Sverige/);
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('Landet Sverige');
  await expect(firstChapter).toContainText('0/50 besvarade');

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Starta quiz för Landet Sverige')).toBeVisible();

  const chapterScreen = page.locator('body');
  await expect(chapterScreen).toContainText('Landet Sverige');
  await expect(chapterScreen).toContainText('The country of Sweden');
  await expect(chapterScreen).toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  await expect(chapterScreen).toContainText('Övningsfrågor (50)');
  await expect(chapterScreen).toContainText('Var ligger Sverige?');
  await expect(chapterScreen).toContainText('Where is Sweden located?');
  await expect(chapterScreen).toContainText('UHR-källa');
  await expect(chapterScreen).toContainText('Landet Sverige · Geografi, klimat och natur');
  await expect(chapterScreen).toContainText('Ungefär sida 5');

  await page.getByLabel('Tillbaka till kapitellistan').click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('body')).toContainText('13 samhällsområden');

  expect(consoleErrors).toEqual([]);
});

test('learning path chapter cards follow English support mode', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
  await page
    .getByLabel(/Byt frågespråk till Engelskt stöd|Set question language to English support/)
    .click();
  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto('/learn', { waitUntil: 'networkidle' });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }

  await expect(page.locator('body')).toContainText('Learning path');
  const firstChapter = page.getByLabel(
    /Open chapter The country of Sweden\. Swedish name: Landet Sverige\./,
  );
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('The country of Sweden');
  await expect(firstChapter).toContainText('Landet Sverige');
  await expect(firstChapter).toContainText(
    'Geography, climate, nature, population, natural resources, and climate change.',
  );
  await expect(firstChapter).not.toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  await expect(firstChapter).toContainText('0/50 practiced');

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Start quiz for The country of Sweden')).toBeVisible();
  await expect(page.locator('body')).toContainText('The country of Sweden');
  await expect(page.locator('body')).toContainText('Geography, climate, nature');
  await expect(page.locator('body')).toContainText('Practice questions (50)');

  expect(consoleErrors).toEqual([]);
});
