import { expect, test } from '@playwright/test';
import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshFirstRunSettingsLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const emptyStateCases = [
  {
    ctaLabel: 'Öva svåra frågor',
    emptyText: 'När du missar en övningsfråga visas den här.',
    emptyTitle: 'Inga missade frågor ännu',
    firstQuestionLabel: 'Fråga 1',
    language: 'sv',
  },
  {
    ctaLabel: 'Practice weak questions',
    emptyText: 'Answer a practice question incorrectly and it will appear here.',
    emptyTitle: 'No mistakes yet',
    firstQuestionLabel: 'Question 1',
    language: 'en',
  },
] as const;

for (const copy of emptyStateCases) {
  test(`mistakes empty state CTA is a full-size route to practice in ${copy.language}`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);

    await seedFreshFirstRunSettingsLanguage(page, copy.language);

    await page.goto('/mistakes', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByText(copy.emptyTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(copy.emptyText, { exact: true })).toBeVisible();

    const practiceCta = page.getByRole('button', { name: copy.ctaLabel });
    await expect(practiceCta).toBeVisible();

    const practiceCtaBox = await practiceCta.boundingBox();
    expect(practiceCtaBox).not.toBeNull();
    expect(practiceCtaBox!.width).toBeGreaterThanOrEqual(44);
    expect(practiceCtaBox!.height).toBeGreaterThanOrEqual(44);

    await practiceCta.click();

    await expect(page).toHaveURL(/\/practice$/);
    await expect(page.getByText(copy.firstQuestionLabel, { exact: true })).toBeVisible();
    expect(consoleErrors.get()).toEqual([]);
  });
}
