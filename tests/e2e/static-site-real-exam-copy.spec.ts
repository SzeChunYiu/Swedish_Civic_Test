import { expect, test, type Page } from '@playwright/test';

import {
  collectPageErrors,
  openStaticPage,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

const forbiddenCopy = [
  new RegExp(['real', 'timing'].join('\\s+'), 'i'),
  new RegExp(['real', 'format'].join('\\s+'), 'i'),
  new RegExp(['look', 'and', 'feel', 'like', 'the', 'real', 'thing'].join('\\s+'), 'i'),
  new RegExp(['ready', 'for', 'the', 'real', 'thing'].join('\\s+'), 'i'),
  new RegExp(['riktig', 'tidsbegransning'].join('\\s+'), 'i'),
  new RegExp(['riktig', 'tidsbegränsning'].join('\\s+'), 'i'),
  new RegExp(['riktig', 'timing'].join('\\s+'), 'i'),
  new RegExp(['riktigt', 'format'].join('\\s+'), 'i'),
  new RegExp(['riktig', 'tid'].join('\\s+'), 'i'),
  new RegExp(['kanns', 'som', 'det', 'riktiga'].join('\\s+'), 'i'),
  new RegExp(['känns', 'som', 'det', 'riktiga'].join('\\s+'), 'i'),
  new RegExp(['redo', 'for', 'det', 'riktiga'].join('\\s+'), 'i'),
  new RegExp(['redo', 'för', 'det', 'riktiga'].join('\\s+'), 'i'),
];

type LanguageCopy = {
  code: 'en' | 'sv';
  home: string;
  demo: string;
  chapterTitle: string;
  result: string;
};

const languageCopies: LanguageCopy[] = [
  {
    code: 'en',
    home: 'A calm, unofficial study tool',
    demo: 'Answer one question, read the explanation, and keep going.',
    chapterTitle: 'Mock exam & survival guide',
    result: 'Strong practice round. Keep reviewing the source material before the official test.',
  },
  {
    code: 'sv',
    home: 'Ett lugnt, fristående studieverktyg',
    demo: 'Svara på en fråga, läs förklaringen och fortsätt.',
    chapterTitle: 'Övningsprov & överlevnadsguide',
    result: 'Starkt övningspass. Fortsätt repetera källmaterialet inför det officiella provet.',
  },
];

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

async function expectNoForbiddenCopy(page: Page): Promise<void> {
  const visibleText = await page.locator('body').innerText();

  for (const pattern of forbiddenCopy) {
    expect(visibleText, `Rendered text should not include ${pattern}`).not.toMatch(pattern);
  }
}

async function renderPracticeResult(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/#/practice?c=mix`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () =>
      typeof (window as typeof window & { smtQuizRender?: unknown }).smtQuizRender === 'function',
  );
  await page.waitForFunction(() => {
    const w = window as typeof window & {
      SMT_QUESTIONS?: unknown[];
      smtQuestionBankIsReady?: () => boolean;
    };
    return (
      (typeof w.smtQuestionBankIsReady === 'function' && w.smtQuestionBankIsReady()) ||
      (Array.isArray(w.SMT_QUESTIONS) && w.SMT_QUESTIONS.length > 0)
    );
  });
  await page.evaluate(() => {
    window.eval(`
      const questions = smtQuizQuestionSet();
      const passingScore = Math.ceil(questions.length * 0.8);
      SMT_QUIZ.scope = smtQuizScopeKey();
      SMT_QUIZ.i = questions.length;
      SMT_QUIZ.score = passingScore;
      SMT_QUIZ.answers = questions.map((question, index) =>
        index < passingScore ? question.answer : -1
      );
      smtQuizRender();
    `);
  });
  await expect(page.locator('#quiz-stage .quiz__result')).toBeVisible();
}

for (const copy of languageCopies) {
  test(`static site renders neutral Mock exam / Övningsprov survival guide copy in ${copy.code}`, async ({
    page,
  }) => {
    const browserErrors = collectPageErrors(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await openStaticPage(page, staticSite.baseUrl, copy.code);

    await expect(page.locator('body')).toContainText(copy.home);
    await expect(page.locator('body')).toContainText(copy.demo);
    await expect(page.locator('body')).toContainText(copy.chapterTitle);
    await expectNoForbiddenCopy(page);

    await renderPracticeResult(page, staticSite.baseUrl);
    await expect(page.locator('#quiz-stage')).toContainText(copy.result);
    await expectNoForbiddenCopy(page);

    expect(browserErrors).toEqual([]);
  });
}
