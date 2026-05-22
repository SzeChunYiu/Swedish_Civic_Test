import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  clearSpeechEvents,
  currentProgressStateStorageKey,
  dismissBlockingModals,
  installSpeechSynthesisMock,
  seedFreshSettingsLanguageAndAboutSeen,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  speakEvents,
  speechEvents,
} from './browserLaunch';
import { startAllVisiblePractice, type PracticeHubLanguage } from './practiceHub';

const accessibilityAudioPlaybackRateKey = 'accessibility\\a11y.audioPlaybackRate.v1';
const includeSupplementaryStorageKey = 'settings\\includeSupplementaryQuestions';
const legacyIncludeSupplementaryStorageKey = 'includeSupplementaryQuestions';

function sourceQuestionIdsBeforeFirstSupplementaryQuestion() {
  const csv = readFileSync(resolve('content/question-bank.csv'), 'utf8');
  const ids: string[] = [];

  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const idMatch = /^"([^"]+)"/.exec(line);
    const provenanceMatch = /,"([^"]+)"$/.exec(line);
    if (!idMatch || !provenanceMatch) continue;
    if (provenanceMatch[1] !== 'uhr') break;
    ids.push(idMatch[1]);
  }

  return ids;
}

type InteractionStyle = {
  backgroundColor: string;
  borderColor: string;
  transform: string;
};

async function closeLaunchAdIfPresent(page: Page) {
  const closeLaunchAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchAd.isVisible()) {
    await closeLaunchAd.click();
  }
}

async function getInteractionStyle(locator: Locator): Promise<InteractionStyle> {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);

    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      transform: style.transform,
    };
  });
}

function expectVisibleInteractionChange(
  before: InteractionStyle,
  after: InteractionStyle,
  label: string,
) {
  expect(
    after.backgroundColor !== before.backgroundColor ||
      after.borderColor !== before.borderColor ||
      after.transform !== before.transform,
    `${label} should expose visible interaction feedback`,
  ).toBe(true);
}

async function focusByKeyboard(page: Page, target: Locator, label: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) {
      return;
    }

    await page.keyboard.press('Tab');
  }

  await expect(target, `${label} should be reachable by Tab`).toBeFocused();
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

function answerRadio(page: Page, name: string) {
  return page.getByRole('radio', { name, exact: true });
}

async function answerRadioAccessibilityLabels(page: Page) {
  return page
    .getByRole('radio')
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute('aria-label') ?? '')
        .filter((label) => label.length > 0),
    );
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
  await answerRadio(page, 'Select answer In southern Europe').click();

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
    .getByRole('radio', {
      name: /Choose Dala horse as study companion\. Folk symbol from Dalarna\./,
    })
    .click();

  await openPracticeQuestion(page, 'en');

  await expect(page.getByText('Your study companion')).toBeVisible();
  await expect(page.getByText('Dala horse', { exact: true })).toBeVisible();
  const idleArtwork = page.getByTestId('study-companion-artwork-dala-horse-idle');
  await expect(idleArtwork).toBeVisible();
  await expect(idleArtwork.locator('svg')).toBeVisible();
  await expect(
    page.getByText('Dala horse is with you in practice. Folk symbol from Dalarna.'),
  ).toBeVisible();
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();

  await answerRadio(page, 'Select answer In southern Europe').click();

  await expect(page.getByText('Review', { exact: true })).toBeVisible();
  const oopsArtwork = page.getByTestId('study-companion-artwork-dala-horse-oops');
  await expect(oopsArtwork).toBeVisible();
  await expect(oopsArtwork.locator('svg')).toBeVisible();
  await expect(page.getByTestId('study-companion-artwork-dala-horse-idle')).toHaveCount(0);
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

  await expect(answerRadio(page, 'Välj svaret I södra Europa')).toBeVisible();
  await expect(answerRadio(page, 'Select answer I södra Europa')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(answerRadio(page, 'Välj svaret I södra Europa')).toBeVisible();
  await expect(answerRadio(page, 'Select answer I södra Europa')).toHaveCount(0);

  await enableEnglishSupport(page);
  await openPracticeQuestion(page, 'en');

  await expect(answerRadio(page, 'Select answer In southern Europe')).toBeVisible();
  await expect(answerRadio(page, 'Välj svaret In southern Europe')).toHaveCount(0);

  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);

  await expect(answerRadio(page, 'Select answer In southern Europe')).toBeVisible();
  await expect(answerRadio(page, 'Välj svaret In southern Europe')).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('routed quiz Try again keeps the current route-entry answer order', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/quiz/q001', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);

  const initialOrder = await answerRadioAccessibilityLabels(page);
  expect(initialOrder).toHaveLength(4);
  await answerRadio(page, 'Select answer In southern Europe').click();

  const tryAgain = page.getByRole('button', { name: 'Try this quiz question again' });
  await expect(tryAgain).toBeVisible();
  await tryAgain.click();

  await expect(answerRadio(page, 'Select answer In southern Europe')).toBeVisible();
  expect(await answerRadioAccessibilityLabels(page)).toEqual(initialOrder);
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
    await answerRadio(page, scenario.answerLabel).click();

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

  const eliminatedAnswer = answerRadio(page, 'In North America, Eliminated');
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
  await answerRadio(page, 'Select answer In the Nordic region in northern Europe').click();
  await expect(answerRadio(page, 'In the Nordic region in northern Europe, Correct')).toBeVisible();
  await expect(page.getByRole('button', { name: /Eliminate answer|Restore answer/ })).toHaveCount(
    0,
  );

  await page.getByLabel('Try this practice question again').click();
  await expect(eliminatedAnswer).toHaveCount(0);
  await expect(eliminateWrongAnswer).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('practice strikeout controls support keyboard focus, Space, and Enter', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await enableEnglishSupport(page);
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await startAllVisiblePractice(page, 'en');

  const restoredWrongAnswer = page.getByLabel('Select answer In North America');
  const eliminatedAnswer = page.getByLabel('In North America, Eliminated');
  const wrongFeedbackAnswer = page.getByLabel('In North America, Wrong');
  const eliminateWrongAnswer = page.getByRole('button', {
    name: 'Eliminate answer In North America',
  });
  const restoreWrongAnswer = page.getByRole('button', {
    name: 'Restore answer In North America',
  });

  await expect(eliminateWrongAnswer).toHaveAttribute('aria-pressed', 'false');
  const idleStyle = await getInteractionStyle(eliminateWrongAnswer);
  await focusByKeyboard(page, eliminateWrongAnswer, 'In North America strikeout control');
  await expect(eliminateWrongAnswer).toBeFocused();
  const focusStyle = await getInteractionStyle(eliminateWrongAnswer);
  expectVisibleInteractionChange(idleStyle, focusStyle, 'strikeout keyboard focus');

  await page.keyboard.down('Space');
  const pressedStyle = await getInteractionStyle(page.locator(':focus'));
  expectVisibleInteractionChange(focusStyle, pressedStyle, 'strikeout keyboard press');
  await page.keyboard.up('Space');

  await expect(eliminatedAnswer).toBeVisible();
  await expect(eliminatedAnswer).toBeDisabled();
  await expect(restoreWrongAnswer).toHaveAttribute('aria-pressed', 'true');
  await expect(restoreWrongAnswer).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(eliminatedAnswer).toHaveCount(0);
  await expect(eliminateWrongAnswer).toHaveAttribute('aria-pressed', 'false');
  await expect(restoredWrongAnswer).toBeVisible();
  await expect(restoredWrongAnswer).toBeEnabled();

  await page.keyboard.press('Shift+Tab');
  await expect(restoredWrongAnswer).toBeFocused();
  await restoredWrongAnswer.click();
  await expect(wrongFeedbackAnswer).toBeVisible();
  await expect(page.getByRole('button', { name: /Eliminate answer|Restore answer/ })).toHaveCount(
    0,
  );

  const tryAgain = page.getByLabel('Try this practice question again');
  await focusByKeyboard(page, tryAgain, 'Try again control after submitted feedback');
  await expect(tryAgain).toBeFocused();

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
  ).toHaveCount(1);
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
  ).toHaveCount(1);
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

  await answerRadio(page, 'Select answer In the Nordic region in northern Europe').click();
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

  const correctAnswer = answerRadio(page, 'Select answer In the Nordic region in northern Europe');
  await expect(correctAnswer).toBeVisible();
  await correctAnswer.click();

  await expect(answerRadio(page, 'In the Nordic region in northern Europe, Correct')).toBeVisible();
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

test('Practice adaptive summary announces recommendation mix updates without taking focus', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const recentlyWrongAnsweredAt = '2026-05-21T08:00:00.000Z';

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify({
        answerDates: ['2026-05-21'],
        answerHistory: [
          {
            answeredAt: recentlyWrongAnsweredAt,
            isCorrect: false,
            questionId: 'q001',
            timeSpentSeconds: 12,
          },
        ],
        questionProgress: {
          q001: {
            correctCount: 0,
            correctStreak: 0,
            lastAnsweredAt: recentlyWrongAnsweredAt,
            questionId: 'q001',
            seenCount: 1,
            wrongCount: 1,
          },
        },
      }),
    },
  });

  await openPracticeQuestion(page, 'en');

  const adaptiveSummary = page.locator('#practice-adaptive-summary-status');
  await expect(page.getByText('Recommended mix', { exact: true })).toBeVisible();
  await expect(adaptiveSummary).toHaveAttribute('aria-live', 'polite');
  await expect(adaptiveSummary).toHaveAccessibleName(
    /Recommended practice mix: 1 recently missed, 9 unseen, 0 stale, and 0 mastered\./,
  );
  await expect(adaptiveSummary).toContainText(
    '1 recently missed · 9 unseen · 0 stale · 0 mastered',
  );
  const initialSummary = await adaptiveSummary.textContent();

  await answerRadio(page, 'Select answer In the Nordic region in northern Europe').click();
  await page.getByRole('button', { name: 'Move to the next practice question' }).click();

  await expect(page.getByText('Question 2', { exact: true })).toBeVisible();
  await expect(adaptiveSummary).toContainText(
    '0 recently missed · 10 unseen · 0 stale · 0 mastered',
  );
  await expect.poll(async () => adaptiveSummary.textContent()).not.toBe(initialSummary);
  await expect(adaptiveSummary).not.toBeFocused();

  await page.getByRole('switch', { name: 'Include supplementary questions' }).click();
  await expect(page.getByRole('switch', { name: 'UHR questions only' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expect(adaptiveSummary).toHaveAttribute('aria-live', 'polite');

  expect(consoleErrors).toEqual([]);
});

test('Practice source filter restart clears hidden supplementary answer state', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const completedUhrQuestionIds = sourceQuestionIdsBeforeFirstSupplementaryQuestion();
  const firstSupplementaryQuestionNumber = completedUhrQuestionIds.length + 1;

  expect(completedUhrQuestionIds.length).toBeGreaterThan(0);

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [currentProgressStateStorageKey]: JSON.stringify({
        completedQuestionIds: completedUhrQuestionIds,
      }),
      [includeSupplementaryStorageKey]: 'true',
      [legacyIncludeSupplementaryStorageKey]: 'true',
    },
  });
  await page.goto('/practice', { waitUntil: 'networkidle' });
  await closeLaunchAdIfPresent(page);
  await dismissBlockingModals(page);
  await page.getByRole('button', { name: 'Start practice with all visible questions' }).click();

  await expect(
    page.getByText(`Question ${firstSupplementaryQuestionNumber}`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`Completed questions: ${completedUhrQuestionIds.length}`, { exact: true }),
  ).toBeVisible();

  await answerRadio(page, 'Select answer In southern Europe').click();

  await expect(answerRadio(page, 'In southern Europe, Wrong')).toBeVisible();
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(
    page.getByText(`Completed questions: ${firstSupplementaryQuestionNumber}`, { exact: true }),
  ).toBeVisible();

  await page.getByRole('switch', { name: 'Include supplementary questions' }).click();

  await expect(page.getByRole('switch', { name: 'UHR questions only' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  await expect(
    page.getByText(`Completed questions: ${completedUhrQuestionIds.length}`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Score: 0/1')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try this practice question again' })).toHaveCount(
    0,
  );

  await page.getByRole('switch', { name: 'UHR questions only' }).click();

  await expect(
    page.getByText(`Question ${firstSupplementaryQuestionNumber + 1}`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`Completed questions: ${firstSupplementaryQuestionNumber}`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Score: 0/1')).toHaveCount(0);

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
  await answerRadio(page, 'Select answer In southern Europe').click();

  await expect(answerRadio(page, 'In southern Europe, Wrong')).toBeVisible();
  await expect(
    answerRadio(page, 'In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(answerRadio(page, 'I södra Europa, Fel')).toHaveCount(0);
  await expect(answerRadio(page, 'I Norden i norra Europa, Rätt svar')).toHaveCount(0);
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
  await answerRadio(page, 'Välj svaret I södra Europa').click();

  await expect(answerRadio(page, 'I södra Europa, Fel')).toBeVisible();
  await expect(answerRadio(page, 'I Norden i norra Europa, Rätt svar')).toBeVisible();

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
  await answerRadio(page, 'Select answer In southern Europe').click();

  await expect(answerRadio(page, 'In southern Europe, Wrong')).toBeVisible();
  await expect(
    answerRadio(page, 'In the Nordic region in northern Europe, Correct answer'),
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
  await answerRadio(page, 'Select answer In southern Europe').click();

  await expect(answerRadio(page, 'In southern Europe, Wrong')).toBeVisible();
  await expect(
    answerRadio(page, 'In the Nordic region in northern Europe, Correct answer'),
  ).toBeVisible();
  await expect(answerRadio(page, 'I södra Europa, Fel')).toHaveCount(0);
  await expect(answerRadio(page, 'I Norden i norra Europa, Rätt svar')).toHaveCount(0);
  await expect(page.getByText('Score: 0/1')).toBeVisible();
  await expect(page.getByText(/Sweden is in the Nordic region/)).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
