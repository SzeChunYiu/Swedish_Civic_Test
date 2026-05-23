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
    emptyText: 'Bokmärk en fråga eller svara fel i övningen, så visas den här.',
    emptyTitle: 'Inga sparade eller missade frågor ännu',
    hubTitle: 'Välj hur du vill öva',
    language: 'sv',
  },
  {
    ctaLabel: 'Practice weak questions',
    emptyText:
      'Bookmark a question or answer one incorrectly in practice, and it will appear here.',
    emptyTitle: 'No saved or missed questions yet',
    hubTitle: 'Choose how to practise',
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
    await expect(page.getByRole('heading', { name: copy.hubTitle })).toBeVisible();
    expect(consoleErrors.get()).toEqual([]);
  });
}
