import { expect, test, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const viewport = { width: 390, height: 844 };

async function openChapter(page: Page, language: AppLanguage) {
  await page.setViewportSize(viewport);
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/chapter/ch01', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function openQuizRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

const oldStartQuiz = ['Starta', 'quiz'].join(' ');
const oldQuizPass = ['Quiz', 'pass'].join('');
const oldQuizQuestions = ['quiz', 'frågor'].join('');
const oldQuizQuestion = ['quiz', 'frågan'].join('');

test('chapter detail and routed quiz render natural Swedish study terms', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await openChapter(page, 'sv');

  const body = page.locator('body');
  await expect(page.getByLabel('Starta frågepass för Landet Sverige')).toBeVisible();
  await expect(body).toContainText('Starta frågepass');
  await expect(body).toContainText('Övningsfrågor');
  await expect(body).not.toContainText(oldStartQuiz);
  await expect(body).not.toContainText(oldQuizPass);
  await expect(body).not.toContainText(oldQuizQuestions);
  await expect(body).not.toContainText(oldQuizQuestion);

  await page.getByLabel('Starta frågepass för Landet Sverige').click();

  await expect(page).toHaveURL(/\/quiz\/q001\?chapterId=ch01$/);
  await expect(body).toContainText('Frågepass');
  await expect(body).toContainText('Frågepass: Landet Sverige');
  await expect(body).toContainText(
    'Besvara en fråga från Landet Sverige och gå sedan igenom den källbaserade återkopplingen.',
  );
  await expect(body).not.toContainText('Frågepass q001');
  await expect(body).not.toContainText(oldStartQuiz);
  await expect(body).not.toContainText(oldQuizPass);
  await expect(body).not.toContainText(oldQuizQuestions);
  await expect(body).not.toContainText(oldQuizQuestion);

  await page
    .getByLabel(/Välj svaret /)
    .first()
    .click();
  await expect(page.getByLabel('Försök igen med den här frågan')).toBeVisible();
  await expect(body).not.toContainText(oldQuizQuestion);

  await openQuizRoute(page, '/quiz/q001');
  await expect(body).toContainText('Frågepass q001');
  await expect(body).not.toContainText('Frågepass: Landet Sverige');

  await openQuizRoute(page, '/quiz/q001?chapterId=ch02');
  await expect(page).toHaveURL(/\/quiz\/q001\?chapterId=ch02$/);
  await expect(body).toContainText('Frågepass q001');
  await expect(body).toContainText(
    'Besvara frågan och gå sedan igenom den källbaserade återkopplingen.',
  );
  await expect(body).not.toContainText('Frågepass: Landet Sverige');
  await expect(body).not.toContainText('Frågepass: Sveriges demokratiska system');
  await expect(body).not.toContainText('Besvara en fråga från');

  await openQuizRoute(page, '/quiz/not-a-question?chapterId=ch01');
  await expect(page).toHaveURL(/\/quiz\/not-a-question\?chapterId=ch01$/);
  await expect(body).toContainText('Frågan hittades inte');
  await expect(body).toContainText('Vi hittar ingen övningsfråga för den här länken.');
  await expect(body).not.toContainText('Frågepass: Landet Sverige');
  await expect(body).not.toContainText('Frågepass not-a-question');
  await expect(body).not.toContainText('Var ligger Sverige?');

  expect(pageErrors).toEqual([]);
});

test('chapter detail and routed quiz keep English quiz copy in support mode', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await openChapter(page, 'en');

  const body = page.locator('body');
  await expect(page.getByLabel('Start quiz for The country of Sweden')).toBeVisible();
  await expect(body).toContainText('Start quiz');
  await expect(body).toContainText('Practice questions');
  await expect(body).not.toContainText('Starta frågepass');
  await expect(body).not.toContainText('Frågepass');

  await page.getByLabel('Start quiz for The country of Sweden').click();

  await expect(page).toHaveURL(/\/quiz\/q001\?chapterId=ch01$/);
  await expect(body).toContainText('Quiz session');
  await expect(body).toContainText('Quiz session: The country of Sweden');
  await expect(body).toContainText(
    'Answer a question from The country of Sweden, then review the source-backed feedback.',
  );
  await expect(body).not.toContainText('Session q001');
  await expect(body).not.toContainText('Starta frågepass');
  await expect(body).not.toContainText('Frågepass q001');

  await page
    .getByLabel(/Select answer /)
    .first()
    .click();
  await expect(page.getByLabel('Try this quiz question again')).toBeVisible();

  await openQuizRoute(page, '/quiz/q001');
  await expect(body).toContainText('Session q001');
  await expect(body).not.toContainText('Quiz session: The country of Sweden');

  await openQuizRoute(page, '/quiz/q001?chapterId=ch02');
  await expect(page).toHaveURL(/\/quiz\/q001\?chapterId=ch02$/);
  await expect(body).toContainText('Session q001');
  await expect(body).toContainText(
    'Answer the routed question, then review the source-backed feedback.',
  );
  await expect(body).not.toContainText('Quiz session: The country of Sweden');
  await expect(body).not.toContainText("Quiz session: Sweden's democratic system");
  await expect(body).not.toContainText('Answer a question from');

  await openQuizRoute(page, '/quiz/not-a-question?chapterId=ch01');
  await expect(page).toHaveURL(/\/quiz\/not-a-question\?chapterId=ch01$/);
  await expect(body).toContainText('Question not found');
  await expect(body).toContainText('We could not find a practice question for this link.');
  await expect(body).not.toContainText('Quiz session: The country of Sweden');
  await expect(body).not.toContainText('Session not-a-question');
  await expect(body).not.toContainText('Where is Sweden located?');

  expect(pageErrors).toEqual([]);
});
