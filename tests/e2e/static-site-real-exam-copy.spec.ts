import { expect, test, type Page } from '@playwright/test';

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
    demo: 'Mock exam mode with a timed practice flow',
    chapterTitle: 'Mock exam & survival guide',
    result: 'Strong practice round. Keep reviewing the source material before the official test.',
  },
  {
    code: 'sv',
    home: 'Ett lugnt, fristående studieverktyg',
    demo: 'Provläge med tidsatt övning',
    chapterTitle: 'Övningsprov & överlevnadsguide',
    result: 'Starkt övningspass. Fortsätt repetera källmaterialet inför det officiella provet.',
  },
];

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

async function setStaticSiteLanguage(page: Page, language: LanguageCopy['code']): Promise<void> {
  await page.addInitScript((selectedLanguage) => {
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.removeItem('smt_consent');
    window.localStorage.setItem('smt_ads_mode', 'none');
    window.localStorage.setItem('smt_lang', selectedLanguage);
  }, language);
}

async function expectNoForbiddenCopy(page: Page): Promise<void> {
  const visibleText = await page.locator('body').innerText();

  for (const pattern of forbiddenCopy) {
    expect(visibleText, `Rendered text should not include ${pattern}`).not.toMatch(pattern);
  }
}

async function renderPracticeResult(page: Page): Promise<void> {
  await page.goto('/#/practice?c=mix', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () =>
      typeof (window as typeof window & { smtQuizRender?: unknown }).smtQuizRender === 'function',
  );
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
  test(`static site renders neutral timed-practice copy in ${copy.code}`, async ({ page }) => {
    const browserErrors = collectBrowserErrors(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await setStaticSiteLanguage(page, copy.code);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(copy.home);
    await expect(page.locator('body')).toContainText(copy.demo);
    await expect(page.locator('body')).toContainText(copy.chapterTitle);
    await expectNoForbiddenCopy(page);

    await renderPracticeResult(page);
    await expect(page.locator('#quiz-stage')).toContainText(copy.result);
    await expectNoForbiddenCopy(page);

    expect(browserErrors).toEqual([]);
  });
}
