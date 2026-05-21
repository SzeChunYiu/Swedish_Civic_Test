import { expect, test, type Locator } from '@playwright/test';

import { questions } from '../../data/questions';
import { dismissBlockingModals } from './browserLaunch';

const chapterOneQuestionCount = questions.filter(
  (question) => question.chapterId === 'ch01',
).length;
const englishFirstChapterLabel =
  /Open chapter The country of Sweden\. Swedish name: Landet Sverige\./;

function extractQuestionCount(text: string | null, pattern: RegExp) {
  const match = text?.match(pattern);
  expect(match).not.toBeNull();

  return Number(match?.[1] ?? '0');
}

async function expectStableBackLinkTarget(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Back link should have a measurable target box');
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

test('learning path opens a source-backed chapter detail screen and returns through a target-sized chapter list link', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.locator('body')).toContainText('Studieväg');
  await expect(page.locator('body')).toContainText('13 samhällsområden');
  const firstChapter = page.getByLabel(/Öppna kapitel Landet Sverige/);
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('Landet Sverige');
  const questionCount = extractQuestionCount(
    await firstChapter.textContent(),
    /0\/(\d+) besvarade/,
  );
  expect(questionCount).toBe(chapterOneQuestionCount);
  await expect(firstChapter).toContainText(`0/${questionCount} besvarade`);

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Starta frågepass för Landet Sverige')).toBeVisible();

  const chapterScreen = page.locator('body');
  await expect(chapterScreen).toContainText('Landet Sverige');
  await expect(chapterScreen).toContainText('The country of Sweden');
  await expect(chapterScreen).toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  await expect(chapterScreen).toContainText(`Övningsfrågor (${questionCount})`);
  await expect(chapterScreen).toContainText('Var ligger Sverige?');
  await expect(chapterScreen).toContainText('Where is Sweden located?');
  await expect(chapterScreen).toContainText('UHR-källa');
  await expect(chapterScreen).toContainText('Landet Sverige · Geografi, klimat och natur');
  await expect(chapterScreen).toContainText('Ungefär sida 5');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(chapterScreen).toContainText('UHR-källa');
  await page.evaluate(() => window.scrollTo(0, 0));

  const backToChapterList = page.getByLabel('Tillbaka till kapitellistan');
  await expectStableBackLinkTarget(backToChapterList);
  await backToChapterList.click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('body')).toContainText('13 samhällsområden');

  expect(consoleErrors).toEqual([]);
});

test('learning path chapter cards follow English support mode with Back to chapter list target', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt studiespråk till Engelskt stöd|Set study language to English support/)
    .click();
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.locator('body')).toContainText('Learning path');
  const firstChapter = page.getByLabel(englishFirstChapterLabel);
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('The country of Sweden');
  await expect(firstChapter).toContainText('Landet Sverige');
  await expect(firstChapter).toContainText(
    'Geography, climate, nature, population, natural resources, and climate change.',
  );
  await expect(firstChapter).not.toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  const questionCount = extractQuestionCount(
    await firstChapter.textContent(),
    /0\/(\d+) practiced/,
  );
  expect(questionCount).toBe(chapterOneQuestionCount);
  await expect(firstChapter).toContainText(`0/${questionCount} practiced`);

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Start quiz for The country of Sweden')).toBeVisible();
  await expect(page.locator('body')).toContainText('The country of Sweden');
  await expect(page.locator('body')).toContainText('Geography, climate, nature');
  await expect(page.locator('body')).toContainText(`Practice questions (${questionCount})`);
  const backToChapterList = page.getByLabel('Back to chapter list');
  await expectStableBackLinkTarget(backToChapterList);
  await backToChapterList.click();

  await expect(page).toHaveURL(/\/learn$/);
  const returnedFirstChapter = page.getByRole('link', { name: englishFirstChapterLabel });
  await expect(returnedFirstChapter).toHaveCount(1);
  await expect(returnedFirstChapter).toBeVisible();
  await expect(returnedFirstChapter).toContainText('The country of Sweden');
  await expect(returnedFirstChapter).toContainText('Landet Sverige');
  await expect(returnedFirstChapter).toContainText(`0/${questionCount} practiced`);

  expect(consoleErrors).toEqual([]);
});

test('deep-linked missing chapter fallback exposes a target-sized chapter list link', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/chapter/not-a-real-chapter', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.locator('body')).toContainText('Kapitlet hittades inte');
  const backToChapterList = page.getByLabel('Tillbaka till kapitellistan');
  await expectStableBackLinkTarget(backToChapterList);
  await backToChapterList.click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('body')).toContainText('13 samhällsområden');

  expect(consoleErrors).toEqual([]);
});
