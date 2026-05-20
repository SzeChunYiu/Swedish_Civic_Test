import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const mobileViewport = { width: 390, height: 844 };
const feedbackAudioControlNames =
  /Lyssna på återkopplingen|Listen to feedback|Stoppa återkoppling|Stop feedback/;

async function openRouteWithLanguage(page: Page, route: string, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectPrimaryPrompt(page: Page, primaryText: string, secondaryText: string) {
  const primaryPrompt = page.getByText(primaryText, { exact: true }).first();
  const secondaryPrompt = page.getByText(secondaryText, { exact: true }).first();

  await expect(primaryPrompt).toBeVisible();
  await expect(secondaryPrompt).toBeVisible();

  const primaryBox = await primaryPrompt.boundingBox();
  const secondaryBox = await secondaryPrompt.boundingBox();

  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect(primaryBox!.y).toBeLessThan(secondaryBox!.y);
}

async function installPersistentSpeechSynthesis(page: Page) {
  await page.addInitScript(() => {
    let activeUtterance: SpeechSynthesisUtterance | null = null;
    let onVoicesChanged: ((this: SpeechSynthesis, ev: Event) => unknown) | null = null;
    let speaking = false;

    class PersistentSpeechSynthesisUtterance extends EventTarget {
      lang = '';
      onboundary: SpeechSynthesisUtterance['onboundary'] = null;
      onend: SpeechSynthesisUtterance['onend'] = null;
      onerror: SpeechSynthesisUtterance['onerror'] = null;
      onmark: SpeechSynthesisUtterance['onmark'] = null;
      onpause: SpeechSynthesisUtterance['onpause'] = null;
      onresume: SpeechSynthesisUtterance['onresume'] = null;
      onstart: SpeechSynthesisUtterance['onstart'] = null;
      pitch = 1;
      rate = 1;
      text = '';
      voice: SpeechSynthesisVoice | null = null;
      volume = 1;

      constructor(text?: string) {
        super();
        if (typeof text === 'string') this.text = text;
      }
    }

    const callSpeechHandler = (
      utterance: SpeechSynthesisUtterance,
      handlerName: 'onpause' | 'onstart',
      eventName: string,
    ) => {
      const handler = utterance[handlerName];
      if (typeof handler === 'function') {
        handler.call(utterance, new Event(eventName) as SpeechSynthesisEvent);
      }
    };

    const synthesis = {
      addEventListener: () => undefined,
      cancel: () => {
        const stoppedUtterance = activeUtterance;
        activeUtterance = null;
        speaking = false;
        if (stoppedUtterance) {
          window.setTimeout(() => callSpeechHandler(stoppedUtterance, 'onpause', 'pause'), 0);
        }
      },
      dispatchEvent: () => true,
      getVoices: () => [],
      pause: () => undefined,
      removeEventListener: () => undefined,
      resume: () => undefined,
      speak: (utterance: SpeechSynthesisUtterance) => {
        activeUtterance = utterance;
        speaking = true;
        window.setTimeout(() => callSpeechHandler(utterance, 'onstart', 'start'), 0);
      },
      get onvoiceschanged() {
        return onVoicesChanged;
      },
      set onvoiceschanged(listener: ((this: SpeechSynthesis, ev: Event) => unknown) | null) {
        onVoicesChanged = listener;
      },
      get paused() {
        return false;
      },
      get pending() {
        return false;
      },
      get speaking() {
        return speaking;
      },
    } as SpeechSynthesis;

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: PersistentSpeechSynthesisUtterance,
      writable: true,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synthesis,
      writable: true,
    });
  });
}

async function expectTapTargetAtLeast44(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${label} should render a measurable button`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function openPracticeQuestion(page: Page, language: AppLanguage) {
  await openRouteWithLanguage(page, '/practice', language);

  const startPractice = page
    .getByRole('button', {
      name: /Starta övning med alla synliga frågor|Start practice with all visible questions/,
    })
    .first();

  if (await startPractice.isVisible().catch(() => false)) {
    await startPractice.click();
  }
}

test('practice audio control follows the selected question language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'sv');

  await expect(page.getByText('Lätt', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Svårighetsgrad: Lätt/)).toBeVisible();
  await expect(page.getByText('EASY', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toHaveCount(0);

  await openPracticeQuestion(page, 'en');

  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('feedback audio controls appear after answers, localize, and stay out of active exams', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await installPersistentSpeechSynthesis(page);
  await page.setViewportSize(mobileViewport);

  await openPracticeQuestion(page, 'sv');

  await expect(page.getByRole('button', { name: 'Lyssna på återkopplingen' })).toHaveCount(0);
  await page.getByLabel('Välj svaret I södra Europa').click();

  const swedishPlay = page.getByRole('button', { name: 'Lyssna på återkopplingen' });
  await expect(swedishPlay).toBeVisible();
  await expectTapTargetAtLeast44(swedishPlay, 'Swedish feedback audio control');
  await swedishPlay.click();

  const swedishStop = page.getByRole('button', { name: 'Stoppa återkoppling' });
  await expect(swedishStop).toBeVisible();
  await expectTapTargetAtLeast44(swedishStop, 'Swedish stop feedback audio control');
  await swedishStop.click();
  await expect(swedishPlay).toBeVisible();

  await openRouteWithLanguage(page, '/quiz/q001', 'en');

  await expect(page.getByRole('button', { name: 'Listen to feedback' })).toHaveCount(0);
  await page.getByLabel('Select answer In southern Europe').click();

  const englishPlay = page.getByRole('button', { name: 'Listen to feedback' });
  await expect(englishPlay).toBeVisible();
  await expectTapTargetAtLeast44(englishPlay, 'English feedback audio control');
  await englishPlay.click();

  const englishStop = page.getByRole('button', { name: 'Stop feedback' });
  await expect(englishStop).toBeVisible();
  await expectTapTargetAtLeast44(englishStop, 'English stop feedback audio control');
  await englishStop.click();
  await expect(englishPlay).toBeVisible();

  await openRouteWithLanguage(page, '/exam', 'en');

  const startExam = page.getByLabel('Start mock exam');
  await expect(startExam).toBeEnabled();
  await startExam.click();

  await expect(page.getByText('0/20 answered')).toBeVisible();
  await expect(page.getByRole('button', { name: feedbackAudioControlNames })).toHaveCount(0);
  await page
    .getByLabel(/^Select answer .+ for question 1$/)
    .first()
    .click();
  await expect(page.getByText('1/20 answered')).toBeVisible();
  await expect(page.getByRole('button', { name: feedbackAudioControlNames })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice and routed quiz answer option labels follow the selected language', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'sv');

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await openRouteWithLanguage(page, '/quiz/q001', 'sv');

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await openPracticeQuestion(page, 'en');

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  await openRouteWithLanguage(page, '/quiz/q001', 'en');

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice question source citation prefix follows the selected language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'sv');

  await expect(
    page.getByText('Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Källhänvisning: Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Källa\/Source:/)).toHaveCount(0);

  await openPracticeQuestion(page, 'en');

  await expect(
    page.getByText('Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel(
      'Source citation: Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/Källa\/Source:/)).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice flow answers a question, shows source feedback, and advances', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'en');

  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.getByText('Easy', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Difficulty: Easy/)).toBeVisible();
  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer In the Nordic region in northern Europe');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(
    page.getByRole('radio', { name: 'In the Nordic region in northern Europe, Correct' }),
  ).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explanation' })).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'UHR reference' })).toBeVisible();
  await expect(page.getByText('Landet Sverige · Geografi, klimat och natur')).toBeVisible();
  await expect(page.getByText('Approx. page 5')).toBeVisible();

  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: "Sweden's northernmost part lies north of the Arctic Circle.",
    }),
  ).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice feedback reveals the correct option after a wrong answer', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'en');

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByRole('radio', { name: 'In southern Europe, Wrong' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: 'In the Nordic region in northern Europe, Correct answer',
    }),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: 'I södra Europa, Fel' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'I Norden i norra Europa, Rätt svar' })).toHaveCount(
    0,
  );
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('wrong practice answer appears in Mistakes with answer review context', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'sv');

  await expectPrimaryPrompt(page, 'Var ligger Sverige?', 'Where is Sweden located?');
  await page.getByLabel('Välj svaret I södra Europa').click();

  await expect(page.getByRole('radio', { name: 'I södra Europa, Fel' })).toBeVisible();
  await expect(
    page.getByRole('radio', { name: 'I Norden i norra Europa, Rätt svar' }),
  ).toBeVisible();

  await page.getByText('Misstag', { exact: true }).click();
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText('Frågor att öva igen')).toBeVisible();
  const swedishMistakeCard = page.getByLabel(
    'Fråga att öva igen. Ditt senaste svar: I södra Europa. Rätt svar: I Norden i norra Europa.',
  );
  await expect(swedishMistakeCard).toBeVisible();
  await expect(swedishMistakeCard.getByText('Ditt senaste svar')).toBeVisible();
  await expect(swedishMistakeCard.getByText('I södra Europa', { exact: true })).toBeVisible();
  await expect(swedishMistakeCard.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(
    swedishMistakeCard.getByText('I Norden i norra Europa', { exact: true }),
  ).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('bookmarked practice question appears in Mistakes with correct answer context', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'sv');

  await expectPrimaryPrompt(page, 'Var ligger Sverige?', 'Where is Sweden located?');
  await page.getByLabel('Bokmärk den här frågan').click();
  await expect(
    page.getByRole('button', { name: 'Ta bort bokmärket från den här frågan' }),
  ).toBeVisible();

  await page.getByText('Misstag', { exact: true }).click();
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText('Bokmärkta frågor')).toBeVisible();
  await expect(page.getByText('Sparad för att öva igen')).toBeVisible();
  const bookmarkedAnswerCard = page.getByLabel(
    'Fråga att öva igen. Rätt svar: I Norden i norra Europa.',
  );
  await expect(bookmarkedAnswerCard).toBeVisible();
  await expect(bookmarkedAnswerCard.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(
    bookmarkedAnswerCard.getByText('I Norden i norra Europa', { exact: true }),
  ).toBeVisible();
  await expect(bookmarkedAnswerCard.getByText('Ditt senaste felaktiga svar')).toHaveCount(0);
  await expect(page.getByText('Fel svar att repetera')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('wrong practice answer appears in Mistakes with English answer review context', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openPracticeQuestion(page, 'en');

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByRole('radio', { name: 'In southern Europe, Wrong' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: 'In the Nordic region in northern Europe, Correct answer',
    }),
  ).toBeVisible();

  await page.getByText('Mistakes', { exact: true }).click();
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  await expect(page.getByText('Wrong answers to revisit')).toBeVisible();
  const englishMistakeCard = page.getByLabel(
    'Answers to review. Your latest wrong answer: In southern Europe. Correct answer: In the Nordic region in northern Europe.',
  );
  await expect(englishMistakeCard).toBeVisible();
  await expect(englishMistakeCard.getByText('Your latest wrong answer')).toBeVisible();
  await expect(englishMistakeCard.getByText('In southern Europe', { exact: true })).toBeVisible();
  await expect(englishMistakeCard.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(
    englishMistakeCard.getByText('In the Nordic region in northern Europe', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Ditt senaste svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('routed quiz uses English question headings and answer feedback in English support mode', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openRouteWithLanguage(page, '/quiz/q001', 'en');

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByRole('radio', { name: 'In southern Europe, Wrong' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: 'In the Nordic region in northern Europe, Correct answer',
    }),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: 'I södra Europa, Fel' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'I Norden i norra Europa, Rätt svar' })).toHaveCount(
    0,
  );
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
