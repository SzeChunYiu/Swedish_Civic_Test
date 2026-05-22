import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const totalQuestions = 20;
const unsupportedPassVerdictPattern =
  /(?:passing line|pass line|pass threshold|official pass|passed|failed|pass\/fail|gräns för godkänt|officiell(?:a)?\s+gräns|godkänt|underkänt|75\s*%\s*(?:pass|passing|godkänt|godkänd)|(?:pass|passing|godkänt|godkänd)\s*(?:line|threshold|gräns)?\s*75\s*%)/i;

type NeutralSummaryContract = {
  correctCountPattern: RegExp;
  progressPattern: RegExp;
  summaryAriaPrefix: string;
  visibleLabel: string;
};

type TimeHeatmapContract = {
  firstCellPattern: RegExp;
  medianLabel: string;
  summaryAriaPrefix: string;
  title: string;
};

type ProvenanceToggleContract = {
  buttonName: RegExp;
  sourceNoteLabel: RegExp;
};

async function expectNeutralResultSummary(page: Page, contract: NeutralSummaryContract) {
  const summary = page
    .locator(`[role="region"][aria-label^="${contract.summaryAriaPrefix}"]`)
    .first();

  await expect(summary).toBeVisible();
  await expect(summary.getByText(contract.visibleLabel, { exact: true })).toBeVisible();
  await expect(summary.getByText(contract.correctCountPattern)).toBeVisible();
  await expect(summary.getByRole('progressbar', { name: contract.progressPattern })).toBeVisible();
}

async function expectTimeHeatmap(page: Page, contract: TimeHeatmapContract) {
  await expect(
    page.locator(`[role="region"][aria-label^="${contract.summaryAriaPrefix}"]`).first(),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: contract.title })).toBeVisible();
  await expect(page.getByText(contract.medianLabel, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: contract.firstCellPattern }).first()).toBeVisible();
}

async function expectProvenanceSourceNoteToggle(page: Page, contract: ProvenanceToggleContract) {
  const provenance = page.getByRole('button', { name: contract.buttonName }).first();
  const sourceNote = page.getByText(contract.sourceNoteLabel).first();

  await expect(provenance).toBeVisible();
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await expect(sourceNote).toHaveCount(0);

  await provenance.click();
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');
  await expect(sourceNote).toBeVisible();

  await provenance.click();
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await expect(sourceNote).toHaveCount(0);

  await provenance.focus();
  await expect(provenance).toBeFocused();
  await provenance.press('Enter');
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');
  await expect(sourceNote).toBeVisible();

  await provenance.press('Enter');
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await expect(sourceNote).toHaveCount(0);
}

async function expectNoPassVerdictCopy(page: Page) {
  await expect(page.getByText(unsupportedPassVerdictPattern)).toHaveCount(0);
}

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(Math.floor(box?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.floor(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
}

async function openExamWithLanguage(page: Page, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto('/exam', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

test('mock exam requires all answers before showing Swedish score and source provenance review', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openExamWithLanguage(page, 'sv');

  await expect(page.getByRole('heading', { name: 'Övningsprov' }).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-baserade frågor`))).toBeVisible();
  const activeCount = page.getByText(`0/${totalQuestions} besvarade`);
  if ((await activeCount.count()) === 0) {
    const start = page.getByLabel('Starta övningsprov');
    await expect(start).toBeEnabled();
    await start.click();
  }

  await expect(activeCount).toBeVisible();
  await expect(page.getByText(/^Tid kvar/)).toBeVisible();
  await expect(page.getByText(/^Källa: Sverige i fokus/).first()).toBeVisible();
  const submit = page.getByRole('button', { name: 'Skicka övningsprov' });
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);
  await expect(page.getByText('Förklaring', { exact: true })).toHaveCount(0);
  await expect(page.getByText('UHR-källa', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel(/^UHR-källa:/)).toHaveCount(0);
  await expectProvenanceSourceNoteToggle(page, {
    buttonName: /Källtyp: UHR-källa/,
    sourceNoteLabel: /^Källanteckning:/,
  });
  const activeReportLink = page.getByRole('link', { name: /Rapportera frågan q\d+/ }).first();
  await expect(activeReportLink).toBeVisible();
  await expect(activeReportLink).toHaveAttribute('href', /reportScreen=exam/);
  await expect(activeReportLink).not.toHaveAttribute('href', /selectedAnswer=/);
  const flagQuestionOne = page.getByRole('button', { name: 'Flagga fråga 1 för granskning' });
  await expectTouchTarget(flagQuestionOne);
  await expect(flagQuestionOne).toHaveAttribute('aria-pressed', 'false');
  await expect(flagQuestionOne).not.toHaveAttribute('aria-selected');
  await flagQuestionOne.click();
  const unflagQuestionOne = page.getByRole('button', {
    name: 'Ta bort flagga från fråga 1',
  });
  await expect(unflagQuestionOne).toHaveAttribute('aria-pressed', 'true');
  await expect(unflagQuestionOne).not.toHaveAttribute('aria-selected');
  await unflagQuestionOne.click();
  await expect(flagQuestionOne).toHaveAttribute('aria-pressed', 'false');
  await flagQuestionOne.click();
  await expect(unflagQuestionOne).toHaveAttribute('aria-pressed', 'true');

  const flagQuestionTwo = page.getByRole('button', { name: 'Flagga fråga 2 för granskning' });
  await expectTouchTarget(flagQuestionTwo);
  await expect(flagQuestionTwo).toHaveAttribute('aria-pressed', 'false');
  await expect(flagQuestionTwo).not.toHaveAttribute('aria-selected');
  await flagQuestionTwo.click();
  await expect(page.getByRole('button', { name: 'Ta bort flagga från fråga 2' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByLabel(new RegExp(`^Välj svaret .+ för fråga ${questionNumber}$`))
      .first()
      .click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} besvarade`)).toBeVisible();
  await expect(submit).toBeEnabled();

  await submit.click();

  await expect(page.getByText('Provresultat', { exact: true })).toBeVisible();
  await expect(page.getByText('Övningsresultat').first()).toBeVisible();
  await expect(page.getByText(new RegExp(`/${totalQuestions} rätt`))).toBeVisible();
  await expectTimeHeatmap(page, {
    firstCellPattern:
      /^Fråga 1, \d+ sek, (Snabb|Nära median|Tog längre tid|Fastnade), (rätt|behöver granskas)\. Hoppa till genomgången\.$/,
    medianLabel: 'Nära median',
    summaryAriaPrefix: 'Tidskarta per fråga',
    title: 'Tidskarta per fråga',
  });
  await expect(page.getByText('Kapitelöversikt')).toBeVisible();
  await expect(page.getByText('Frågegenomgång')).toBeVisible();
  await expect(page.getByText('Flaggade frågor: 2', { exact: true })).toBeVisible();
  await expect(page.getByText(`Visar ${totalQuestions} av ${totalQuestions} frågor`)).toBeVisible();
  await page.getByRole('button', { name: 'Visa flaggade frågor (2)' }).click();
  await expect(page.getByText(`Visar 2 av ${totalQuestions} frågor`)).toBeVisible();
  await expect(page.getByText('Fråga 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Fråga 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Fråga 3', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Visa alla frågor' }).click();
  await expect(page.getByText(`Visar ${totalQuestions} av ${totalQuestions} frågor`)).toBeVisible();
  await expect(page.getByText('Fråga 3', { exact: true })).toBeVisible();
  await expect(page.getByText('Valt svar').first()).toBeVisible();
  await expect(page.getByText('Rätt svar').first()).toBeVisible();
  await expect(page.getByText('Förklaring', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR-källa', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel(/^UHR-källa:/).first()).toBeVisible();
  await expectProvenanceSourceNoteToggle(page, {
    buttonName: /Källtyp: UHR-källa/,
    sourceNoteLabel: /^Källanteckning:/,
  });
  const reviewReportLink = page.getByRole('link', { name: /Rapportera frågan q\d+/ }).first();
  await expect(reviewReportLink).toBeVisible();
  await expect(reviewReportLink).toHaveAttribute('href', /reportScreen=exam/);
  await expect(reviewReportLink).toHaveAttribute('href', /selectedAnswer=/);
  await expect(page.getByText('Skickade resultat är slutgiltiga')).toBeVisible();
  await expect(page.getByLabel('Back to exam answers')).toHaveCount(0);
  await expectNoPassVerdictCopy(page);

  expect(consoleErrors).toEqual([]);
});

test('mock exam provenance review follows English support mode', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openExamWithLanguage(page, 'en');

  await expect(page.getByRole('heading', { name: 'Mock exam' }).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${totalQuestions} UHR-based questions`))).toBeVisible();
  const activeCount = page.getByText(`0/${totalQuestions} answered`);
  if ((await activeCount.count()) === 0) {
    const start = page.getByLabel('Start mock exam');
    await expect(start).toBeEnabled();
    await start.click();
  }

  await expect(activeCount).toBeVisible();
  await expect(page.getByText(/^Time left/)).toBeVisible();
  await expect(page.getByText(/^Source: Sverige i fokus/).first()).toBeVisible();
  await expect(page.getByText('Övningsprov')).toHaveCount(0);
  const activeReportLink = page.getByRole('link', { name: /^Report question q/ }).first();
  await expect(activeReportLink).toBeVisible();
  const activeReportHref = await activeReportLink.getAttribute('href');
  expect(activeReportHref).toContain('reportScreen=exam');
  expect(activeReportHref).not.toContain('selectedAnswer=');
  await expect(activeReportLink).toHaveAttribute('href', /reportScreen=exam/);
  await expect(activeReportLink).not.toHaveAttribute('href', /selectedAnswer=/);

  const submit = page.getByRole('button', { name: 'Submit mock exam' });
  await expect(submit).toBeDisabled();
  await expect(page.getByText('Question review')).toHaveCount(0);
  await expect(page.getByText('Explanation', { exact: true })).toHaveCount(0);
  await expect(page.getByText('UHR reference', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel(/^UHR reference:/)).toHaveCount(0);
  await expect(page.getByText('UHR source', { exact: true }).first()).toBeVisible();
  await expectProvenanceSourceNoteToggle(page, {
    buttonName: /Provenance: UHR source/,
    sourceNoteLabel: /^Source note:/,
  });
  const flagQuestionOne = page.getByRole('button', { name: 'Flag question 1 for review' });
  await expectTouchTarget(flagQuestionOne);
  await expect(flagQuestionOne).toHaveAttribute('aria-pressed', 'false');
  await expect(flagQuestionOne).not.toHaveAttribute('aria-selected');
  await flagQuestionOne.click();
  const unflagQuestionOne = page.getByRole('button', {
    name: 'Remove flag from question 1',
  });
  await expect(unflagQuestionOne).toHaveAttribute('aria-pressed', 'true');
  await expect(unflagQuestionOne).not.toHaveAttribute('aria-selected');
  await unflagQuestionOne.click();
  await expect(flagQuestionOne).toHaveAttribute('aria-pressed', 'false');
  await flagQuestionOne.click();
  await expect(unflagQuestionOne).toHaveAttribute('aria-pressed', 'true');

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    await page
      .getByLabel(new RegExp(`^Select answer .+ for question ${questionNumber}$`))
      .first()
      .click();
  }

  await expect(page.getByText(`${totalQuestions}/${totalQuestions} answered`)).toBeVisible();
  await expect(submit).toBeEnabled();

  await submit.click();

  await expect(page.getByText('Mock exam result', { exact: true })).toBeVisible();
  await expectNeutralResultSummary(page, {
    correctCountPattern: new RegExp(`\\d+/${totalQuestions} correct`),
    progressPattern: /\d+ percent correct/,
    summaryAriaPrefix: 'Practice result.',
    visibleLabel: 'Practice result',
  });
  await expect(page.getByText(new RegExp(`/${totalQuestions} correct`))).toBeVisible();
  await expectTimeHeatmap(page, {
    firstCellPattern:
      /^Question 1, \d+ sec, (Rushed|Near median|Over-thought|Stuck), (correct|needs review)\. Jump to review\.$/,
    medianLabel: 'Near median',
    summaryAriaPrefix: 'Time map by question',
    title: 'Time map by question',
  });
  await expect(page.getByText('Chapter breakdown')).toBeVisible();
  await expect(page.getByText('The country of Sweden')).toBeVisible();
  await expect(page.getByText('Question review')).toBeVisible();
  await expect(page.getByText('Flagged questions: 1', { exact: true })).toBeVisible();
  await expect(
    page.getByText(`Showing ${totalQuestions} of ${totalQuestions} questions`),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show flagged questions (1)' }).click();
  await expect(page.getByText(`Showing 1 of ${totalQuestions} questions`)).toBeVisible();
  await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Question 2', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show all questions' }).click();
  await expect(
    page.getByText(`Showing ${totalQuestions} of ${totalQuestions} questions`),
  ).toBeVisible();
  await expect(page.getByText('Question 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Selected answer').first()).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('UHR reference', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel(/^UHR reference:/).first()).toBeVisible();
  const reviewReportLink = page.getByRole('link', { name: /^Report question q/ }).first();
  await expect(reviewReportLink).toBeVisible();
  const reviewReportHref = await reviewReportLink.getAttribute('href');
  expect(reviewReportHref).toContain('reportScreen=exam');
  expect(reviewReportHref).toContain('selectedAnswer=');
  await expect(reviewReportLink).toHaveAttribute('href', /reportScreen=exam/);
  await expect(reviewReportLink).toHaveAttribute('href', /selectedAnswer=/);
  await expectProvenanceSourceNoteToggle(page, {
    buttonName: /Provenance: UHR source/,
    sourceNoteLabel: /^Source note:/,
  });
  await expect(page.getByText('Submitted results are final')).toBeVisible();
  await expect(page.getByText('Kapitelöversikt')).toHaveCount(0);
  await expect(page.getByText('Frågegenomgång')).toHaveCount(0);
  await expect(page.getByText('Valt svar')).toHaveCount(0);
  await expect(page.getByText('Rätt svar')).toHaveCount(0);
  await expect(page.getByText('UHR-källa')).toHaveCount(0);
  await expect(page.getByLabel('Tillbaka till provsvar')).toHaveCount(0);
  await expectNoPassVerdictCopy(page);

  expect(consoleErrors).toEqual([]);
});
