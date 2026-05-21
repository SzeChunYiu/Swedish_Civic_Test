import { expect, type Page, test } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  setupHomeCopyRoute,
  switchLanguageThroughTopBarPicker,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function readVisibleBody(page: Page): Promise<string> {
  return page.locator('body').innerText();
}

test('home study-loop copy renders without stale flashcard promises', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await setupHomeCopyRoute(page, 'sv');

  await expect(page.getByText('Tidsatt övning', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'En tydlig väg för svensk samhällskunskap: dagliga svar, realistiska prov, genomgång av frågor du missat och källstödda förklaringar.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
    ),
  ).toBeVisible();

  let bodyText = await readVisibleBody(page);
  expect(bodyText).not.toMatch(
    /flashcards|Flashkort|flashkort|samhällskunskaper|felspårning|mistake tracking|redoindikator|Provredo/i,
  );

  await switchLanguageThroughTopBarPicker(page, 'en');

  await expect(page.getByText('Timed practice', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'A focused path for Swedish civic knowledge: daily answers, realistic mock exams, mistake review, and source-backed explanations.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Switch between timed practice exams, bookmarks, missed-question review, audio, and preparation signals.',
    ),
  ).toBeVisible();

  bodyText = await readVisibleBody(page);
  expect(bodyText).not.toMatch(
    /flashcards|Flashkort|flashkort|felspårning|mistake tracking|Exam readiness|readiness signals/i,
  );
  expect(consoleErrors.get()).toEqual([]);
});
