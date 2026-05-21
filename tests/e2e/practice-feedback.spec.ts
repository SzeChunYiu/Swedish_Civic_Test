import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  clearSpeechEvents,
  dismissBlockingModals,
  installSpeechSynthesisMock,
  seedFreshSettingsLanguageAndAboutSeen,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  speakEvents,
  speechEvents,
} from './browserLaunch';
import { startAllVisiblePractice, type PracticeHubLanguage } from './practiceHub';

const accessibilityAudioPlaybackRateKey = 'accessibility\\a11y.audioPlaybackRate.v1';

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
}

async function enableEnglishSupport(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  await page
    .getByLabel(/Byt studiespråk till Engelskt stöd|Set study language to English support/)
    .click();
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );
}

async function enableSwedish(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  await page.getByLabel(/Byt studiespråk till Svenska|Set study language to Swedish/).click();
  await expect(page.getByLabel('Byt studiespråk till Svenska')).toHaveAttribute(
    'aria-checked',
    'true',
  );
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

async function openPracticeQuestion(page: Page, language: PracticeHubLanguage) {
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  await startAllVisiblePractice(page, language);
}

test('practice audio control follows the selected question language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
  await openPracticeQuestion(page, 'sv');

  await expect(page.getByText('Lätt', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Svårighetsgrad: Lätt/)).toBeVisible();
  await expect(page.getByText('MEDIUM', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toHaveCount(0);

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');

  await expect(
    page.getByRole('button', { name: 'Listen to the Swedish question and answers' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Lyssna på den svenska frågan och svaren' }),
  ).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('listen-first speech synthesis autoplay starts from Settings and stays out of exam', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await installSpeechSynthesisMock(page);
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityAudioPlaybackRateKey]: '1.25',
    },
    reseedOnNavigation: false,
  });

  await openPracticeQuestion(page, 'en');
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  expect(speakEvents(await speechEvents(page))).toHaveLength(0);

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  const enableListenFirst = page.getByRole('switch', {
    name: 'Enable automatic playback for new questions',
  });
  await expect(enableListenFirst).toHaveAttribute('aria-checked', 'false');
  await enableListenFirst.click();
  await expect(
    page.getByRole('switch', { name: 'Disable automatic playback for new questions' }),
  ).toHaveAttribute('aria-checked', 'true');
  await clearSpeechEvents(page);

  await openPracticeQuestion(page, 'en');

  await expect.poll(async () => speakEvents(await speechEvents(page)).length).toBe(1);
  await page.waitForTimeout(250);
  expect(speakEvents(await speechEvents(page))).toHaveLength(1);

  const practiceSpeaks = speakEvents(await speechEvents(page));
  const practiceQuestionAudio = practiceSpeaks[0];
  expect(practiceQuestionAudio.lang).toBe('sv-SE');
  expect(practiceQuestionAudio.rate).toBe(1.25);
  expect(practiceQuestionAudio.text).toContain('Alternativ A.');
  expect(practiceQuestionAudio.text).toContain('Alternativ B.');

  const cancelCountBeforeAnswer = (await speechEvents(page)).filter(
    (event) => event.type === 'cancel',
  ).length;
  await page.getByLabel('Select answer In southern Europe').click();

  await expect
    .poll(async () => (await speechEvents(page)).filter((event) => event.type === 'cancel').length)
    .toBeGreaterThan(cancelCountBeforeAnswer);

  const cancelCountBeforeNext = (await speechEvents(page)).filter(
    (event) => event.type === 'cancel',
  ).length;
  await page.getByRole('button', { name: 'Move to the next practice question' }).click();
  await expect
    .poll(async () => (await speechEvents(page)).filter((event) => event.type === 'cancel').length)
    .toBeGreaterThan(cancelCountBeforeNext);
  await expect
    .poll(async () => speakEvents(await speechEvents(page)).length)
    .toBe(practiceSpeaks.length + 1);
  await page.waitForTimeout(250);
  expect(speakEvents(await speechEvents(page))).toHaveLength(practiceSpeaks.length + 1);

  await clearSpeechEvents(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  await expect(page.getByRole('heading', { name: 'Mock exam' }).first()).toBeVisible();
  const startMockExam = page.getByRole('button', { name: 'Start mock exam' });
  if (await startMockExam.isVisible()) {
    await expect(startMockExam).toBeEnabled();
    await startMockExam.click();
  }
  await expect(page.getByText('0/20 answered')).toBeVisible();
  await page.waitForTimeout(250);
  expect(speakEvents(await speechEvents(page))).toHaveLength(0);

  await clearSpeechEvents(page);
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);

  await expect
    .poll(async () => speakEvents(await speechEvents(page)).length)
    .toBeGreaterThanOrEqual(1);

  const quizSpeaks = speakEvents(await speechEvents(page));
  const quizQuestionAudio = quizSpeaks[0];
  expect(quizQuestionAudio.lang).toBe('sv-SE');
  expect(quizQuestionAudio.rate).toBe(1.25);
  expect(quizQuestionAudio.text).toContain('Alternativ A.');
  expect(quizQuestionAudio.text).toContain('Alternativ B.');

  expect(consoleErrors).toEqual([]);
});

test('practice shows the selected study companion and answer-state guidance', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page
    .getByRole('button', {
      name: /Choose Dala horse as study companion\. Folk symbol from Dalarna\./,
    })
    .click();

  await openPracticeQuestion(page, 'en');

  await expect(page.getByText('Your study companion')).toBeVisible();
  await expect(page.getByText('Dala horse', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Dala horse is with you in practice. Folk symbol from Dalarna.'),
  ).toBeVisible();
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();

  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByText('Review', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Dala horse suggests: read the source, compare the options, and try again.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Change study companion in Settings' }).click();
  await expect(page).toHaveURL(/\/settings/);

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

  await enableSwedish(page);
  await openPracticeQuestion(page, 'sv');

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Välj svaret I södra Europa')).toBeVisible();
  await expect(page.getByLabel('Select answer I södra Europa')).toHaveCount(0);

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(page.getByLabel('Select answer In southern Europe')).toBeVisible();
  await expect(page.getByLabel('Välj svaret In southern Europe')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('routed quiz Back to Practice and Tillbaka till övning return without retained quiz content', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const scenarios = [
    {
      answerLabel: 'Select answer In southern Europe',
      backLabel: 'Back to practice',
      hubHeading: 'Choose how to practise',
      language: 'en',
      sessionHeading: 'Session q001',
      tryAgainLabel: 'Try this quiz question again',
    },
    {
      answerLabel: 'Välj svaret I södra Europa',
      backLabel: 'Tillbaka till övning',
      hubHeading: 'Välj hur du vill öva',
      language: 'sv',
      sessionHeading: 'Frågepass q001',
      tryAgainLabel: 'Försök igen med den här frågan',
    },
  ] as const;

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  for (const scenario of scenarios) {
    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
    await closeLaunchAdIfPresent(page);
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: scenario.sessionHeading })).toBeVisible();
    await page.getByLabel(scenario.answerLabel).click();

    const backToPractice = page.getByRole('link', { name: scenario.backLabel });
    await expect(backToPractice).toBeVisible();
    await backToPractice.click();

    await expect(page).toHaveURL(/\/practice\/?$/);
    await expect(page.getByRole('heading', { name: scenario.hubHeading })).toBeVisible();
    await expect(page.getByRole('heading', { name: scenario.sessionHeading })).toHaveCount(0);
    await expect(page.getByRole('link', { name: scenario.backLabel })).toHaveCount(0);
    await expect(page.getByLabel(scenario.tryAgainLabel)).toHaveCount(0);
  }

  expect(consoleErrors).toEqual([]);
});

test('practice answer choices can be eliminated and restored before submission', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await startAllVisiblePractice(page, 'en');

  const eliminatedAnswer = page.getByLabel('In North America, Eliminated');
  const eliminateWrongAnswer = page.getByRole('button', {
    name: 'Eliminate answer In North America',
  });
  const restoreWrongAnswer = page.getByRole('button', {
    name: 'Restore answer In North America',
  });

  await expect(eliminateWrongAnswer).toBeVisible();
  await eliminateWrongAnswer.click();
  await expect(eliminatedAnswer).toBeVisible();
  await expect(eliminatedAnswer).toBeDisabled();
  await expect(restoreWrongAnswer).toHaveAttribute('aria-pressed', 'true');

  await restoreWrongAnswer.click();
  await expect(eliminatedAnswer).toHaveCount(0);
  await expect(eliminateWrongAnswer).toBeVisible();

  await eliminateWrongAnswer.click();
  await page.getByLabel('Select answer In the Nordic region in northern Europe').click();
  await expect(page.getByLabel('In the Nordic region in northern Europe, Correct')).toBeVisible();
  await expect(page.getByRole('button', { name: /Eliminate answer|Restore answer/ })).toHaveCount(
    0,
  );

  await page.getByLabel('Try this practice question again').click();
  await expect(eliminatedAnswer).toHaveCount(0);
  await expect(eliminateWrongAnswer).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('practice question source citation prefix follows the selected language', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableSwedish(page);
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

  await enableEnglishSupport(page);
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

test('practice provenance source note collapses when advancing to a new question', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await openPracticeQuestion(page, 'en');
  const provenance = page.getByRole('button', { name: /Provenance: UHR source/ }).first();
  const sourceNote = page.getByText(/^Source note:/);
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await expect(sourceNote).toHaveCount(0);

  await provenance.click();
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');
  await expect(sourceNote).toBeVisible();

  await page.getByLabel('Select answer In the Nordic region in northern Europe').click();
  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus, /).first()).toBeVisible();
  await expect(sourceNote).toHaveCount(0);
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');

  expect(consoleErrors).toEqual([]);
});

test('practice flow answers a question, shows source feedback, and advances', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');
  await expect(page.getByText('Easy', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Difficulty: Easy/)).toBeVisible();
  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await expect(page.getByText('Completed questions: 0')).toBeVisible();

  const correctAnswer = page.getByLabel('Select answer In the Nordic region in northern Europe');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(page.getByLabel('In the Nordic region in northern Europe, Correct')).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toBeVisible();
  await expect(page.getByText('Completed questions: 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explanation' })).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();
  await expect(page.getByText('UHR reference')).toBeVisible();
  await expect(page.getByText('Landet Sverige · Geografi, klimat och natur')).toBeVisible();
  await expect(page.getByText('Approx. page 5')).toBeVisible();

  await page.getByLabel('Move to the next practice question').click();

  await expect(page.getByText('Question 2')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: "Sweden's northernmost part lies north of the Arctic Circle.",
    }),
  ).toBeVisible();
  await expect(page.getByText('Easy', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 1/1')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('practice feedback reveals the correct option after a wrong answer', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(page.getByLabel('I södra Europa, Fel')).toHaveCount(0);
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toHaveCount(0);
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

  await enableSwedish(page);
  await openPracticeQuestion(page, 'sv');

  await expectPrimaryPrompt(page, 'Var ligger Sverige?', 'Where is Sweden located?');
  await page.getByLabel('Välj svaret I södra Europa').click();

  await expect(page.getByLabel('I södra Europa, Fel')).toBeVisible();
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toBeVisible();

  await page.getByText('Repetition', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const swedishMistakeReview = page.getByLabel(
    'Fråga att öva igen. Ditt senaste svar: I södra Europa. Rätt svar: I Norden i norra Europa.',
  );
  await expect(page.getByText('Frågor att öva på')).toBeVisible();
  await expect(swedishMistakeReview.getByText('Ditt senaste svar')).toBeVisible();
  await expect(swedishMistakeReview.getByText('I södra Europa', { exact: true })).toBeVisible();
  await expect(swedishMistakeReview.getByText('Rätt svar', { exact: true })).toBeVisible();
  await expect(
    swedishMistakeReview.getByText('I Norden i norra Europa', { exact: true }),
  ).toBeVisible();
  await expect(swedishMistakeReview).toBeVisible();

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

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();

  await page.getByText('Mistakes', { exact: true }).click();
  await closeLaunchAdIfPresent(page);

  await expect(page).toHaveURL(/\/mistakes$/);
  const englishMistakeReview = page.getByLabel(
    'Answers to review. Your latest wrong answer: In southern Europe. Correct answer: In the Nordic region in northern Europe.',
  );
  await expect(page.getByText('Wrong answers to revisit')).toBeVisible();
  await expect(page.getByText('Your latest wrong answer')).toBeVisible();
  await expect(englishMistakeReview.getByText('In southern Europe', { exact: true })).toBeVisible();
  await expect(englishMistakeReview.getByText('Correct answer', { exact: true })).toBeVisible();
  await expect(
    englishMistakeReview.getByText('In the Nordic region in northern Europe', { exact: true }),
  ).toBeVisible();
  await expect(englishMistakeReview).toBeVisible();
  await expect(page.getByText('Ditt senaste felaktiga svar')).toHaveCount(0);
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

  await enableEnglishSupport(page);
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expectPrimaryPrompt(page, 'Where is Sweden located?', 'Var ligger Sverige?');
  await page.getByLabel('Select answer In southern Europe').click();

  await expect(page.getByLabel('In southern Europe, Wrong')).toBeVisible();
  await expect(
    page.getByLabel('In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(page.getByLabel('I södra Europa, Fel')).toHaveCount(0);
  await expect(page.getByLabel('I Norden i norra Europa, Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
