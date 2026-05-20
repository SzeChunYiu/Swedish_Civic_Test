import { expect, test, type Page } from '@playwright/test';

import { chapters } from '../../data/chapters';
import { questions } from '../../data/questions';
import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const chapterQuestionCounts = new Map(
  chapters.map((chapter) => [
    chapter.id,
    questions.filter((question) => question.chapterId === chapter.id).length,
  ]),
);

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

function expectedChapterLinkLabel(chapter: (typeof chapters)[number], language: AppLanguage) {
  const questionCount = chapterQuestionCounts.get(chapter.id) ?? 0;

  if (language === 'en') {
    return `Open chapter ${chapter.nameEn}. Swedish name: ${chapter.nameSv}. Progress: 0 of ${questionCount} questions practiced.`;
  }

  return `Öppna kapitel ${chapter.nameSv}. Engelskt namn: ${chapter.nameEn}. Framsteg: 0 av ${questionCount} frågor besvarade.`;
}

async function openLearn(page: Page, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
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
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

async function expectChapterRowsAreSingleAccessibleLinks(page: Page, language: AppLanguage) {
  const linkNamePrefix = language === 'en' ? /^Open chapter/ : /^Öppna kapitel/;
  await expect(page.getByRole('link', { name: linkNamePrefix })).toHaveCount(chapters.length);

  for (const chapter of chapters) {
    const label = expectedChapterLinkLabel(chapter, language);
    const link = page.getByRole('link', { exact: true, name: label });

    await expect(link, `${chapter.id} should expose one localized row link`).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();

    const box = await link.boundingBox();
    expect(box, `${chapter.id} should have a rendered link box`).not.toBeNull();
    expect(box!.width, `${chapter.id} link should be at least 44px wide`).toBeGreaterThanOrEqual(
      44,
    );
    expect(box!.height, `${chapter.id} link should be at least 44px tall`).toBeGreaterThanOrEqual(
      44,
    );

    await expect(link.locator('a'), `${chapter.id} should not nest another link`).toHaveCount(0);
    await expect(
      link.locator('[role="summary"], [aria-label^="Kapitel:"], [aria-label^="Chapter:"]'),
      `${chapter.id} should not expose a nested card summary inside the link`,
    ).toHaveCount(0);
  }
}

test('learning path opens a source-backed chapter detail screen and returns to the chapter list', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);
  const firstChapterQuestionCount = chapterQuestionCounts.get('ch01') ?? 0;

  await openLearn(page, 'sv');

  await expect(page.locator('body')).toContainText('Studieväg');
  await expect(page.locator('body')).toContainText('13 samhällsområden');
  await expectChapterRowsAreSingleAccessibleLinks(page, 'sv');
  await expectNoHorizontalOverflow(page, 'Swedish learn chapter list');

  const firstChapter = page.getByRole('link', {
    exact: true,
    name: expectedChapterLinkLabel(chapters[0], 'sv'),
  });
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('Landet Sverige');
  await expect(firstChapter).toContainText(`0/${firstChapterQuestionCount} besvarade`);
  await expect(firstChapter.getByRole('progressbar')).toHaveCount(0);

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Starta frågepass för Landet Sverige')).toBeVisible();

  const chapterScreen = page.locator('body');
  await expect(chapterScreen).toContainText('Landet Sverige');
  await expect(chapterScreen).toContainText('The country of Sweden');
  await expect(chapterScreen).toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  await expect(chapterScreen).toContainText(`Övningsfrågor (${firstChapterQuestionCount})`);
  await expect(chapterScreen).toContainText('Var ligger Sverige?');
  await expect(chapterScreen).toContainText('Where is Sweden located?');
  await expect(chapterScreen).toContainText('UHR-källa');
  await expect(chapterScreen).toContainText('Landet Sverige · Geografi, klimat och natur');
  await expect(chapterScreen).toContainText('Ungefär sida 5');

  await page.getByLabel('Tillbaka till kapitellistan').click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('body')).toContainText('13 samhällsområden');
  await expectChapterRowsAreSingleAccessibleLinks(page, 'sv');

  expect(consoleErrors).toEqual([]);
});

test('learning path chapter cards follow English support mode', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  const firstChapterQuestionCount = chapterQuestionCounts.get('ch01') ?? 0;

  await openLearn(page, 'en');

  await expect(page.locator('body')).toContainText('Learning path');
  await expectChapterRowsAreSingleAccessibleLinks(page, 'en');
  await expectNoHorizontalOverflow(page, 'English learn chapter list');

  const firstChapter = page.getByRole('link', {
    exact: true,
    name: expectedChapterLinkLabel(chapters[0], 'en'),
  });
  await expect(firstChapter).toBeVisible();
  await expect(firstChapter).toContainText('The country of Sweden');
  await expect(firstChapter).toContainText('Landet Sverige');
  await expect(firstChapter).toContainText(
    'Geography, climate, nature, population, natural resources, and climate change.',
  );
  await expect(firstChapter).not.toContainText(
    'Geografi, klimat, natur, befolkning, naturresurser och klimatförändringar.',
  );
  await expect(firstChapter).toContainText(`0/${firstChapterQuestionCount} practiced`);
  await expect(firstChapter.getByRole('progressbar')).toHaveCount(0);

  await firstChapter.click();

  await expect(page).toHaveURL(/\/chapter\/ch01$/);
  await expect(page.getByLabel('Start quiz for The country of Sweden')).toBeVisible();
  await expect(page.locator('body')).toContainText('The country of Sweden');
  await expect(page.locator('body')).toContainText('Geography, climate, nature');
  await expect(page.locator('body')).toContainText(
    `Practice questions (${firstChapterQuestionCount})`,
  );

  expect(consoleErrors).toEqual([]);
});
