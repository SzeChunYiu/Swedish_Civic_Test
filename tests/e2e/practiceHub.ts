import { expect, type Page } from '@playwright/test';

export type PracticeHubLanguage = 'sv' | 'en';

const startAllPracticeLabels: Record<PracticeHubLanguage, string> = {
  sv: 'Starta övning med alla synliga frågor',
  en: 'Start practice with all visible questions',
};

export const practiceQuestionOneTitles: Record<PracticeHubLanguage, string> = {
  sv: 'Fråga 1',
  en: 'Question 1',
};

export async function startAllVisiblePractice(
  page: Page,
  language: PracticeHubLanguage,
): Promise<void> {
  await page.getByRole('button', { name: startAllPracticeLabels[language] }).click();
  await expect(page.getByText(practiceQuestionOneTitles[language], { exact: true })).toBeVisible();
}
