import { expect, test, type Page } from '@playwright/test';

const forbiddenCopy = [
  /real timing/i,
  /real format/i,
  /look and feel like the real thing/i,
  /ready for the real thing/i,
  /riktig tidsbegransning/i,
  /riktig tidsbegränsning/i,
  /riktig timing/i,
  /riktigt format/i,
  /riktig tid/i,
  /kanns som det riktiga/i,
  /känns som det riktiga/i,
  /redo for det riktiga/i,
  /redo för det riktiga/i,
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
    home: 'A friendly, unofficial study app',
    demo: 'Every question comes with a plain-language explanation and a link to the source.',
    chapterTitle: 'Mock exam & survival guide',
    result: 'Strong. Keep reviewing the official sources and your weak chapters.',
  },
  {
    code: 'sv',
    home: 'En vänlig, inofficiell studieapp',
    demo: 'Varje fråga har en förklaring på begriplig svenska och en länk till källan.',
    chapterTitle: 'Provexempel & överlevnadsguide',
    result: 'Starkt. Fortsätt repetera källorna och dina svaga kapitel.',
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
