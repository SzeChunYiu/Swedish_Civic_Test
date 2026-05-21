import { expect, test } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

type PracticeAriaLocaleCase = {
  aboutSourcesClose: string;
  aboutSourcesOpen: string;
  audioEnabled: string;
  audioMuted: string;
  language: AppLanguage;
  provenanceButtonName: RegExp;
  questionTitle: string;
  sourceNotePrefix: string;
  supplementaryOff: string;
  supplementaryOn: string;
};

const localeCases: PracticeAriaLocaleCase[] = [
  {
    aboutSourcesClose: 'Close source details',
    aboutSourcesOpen: 'About the sources',
    audioEnabled: 'Audio enabled, tap to mute',
    audioMuted: 'Audio muted, tap to enable',
    language: 'en',
    provenanceButtonName: /Provenance: UHR source\. Source note:/,
    questionTitle: 'Question 1',
    sourceNotePrefix: 'Source note',
    supplementaryOff: 'UHR questions only',
    supplementaryOn: 'Include supplementary questions',
  },
  {
    aboutSourcesClose: 'Stäng om källorna',
    aboutSourcesOpen: 'Om källorna',
    audioEnabled: 'Ljud är på, tryck för att stänga av',
    audioMuted: 'Ljud är avstängt, tryck för att slå på',
    language: 'sv',
    provenanceButtonName: /Källtyp: UHR-källa\. Källanteckning:/,
    questionTitle: 'Fråga 1',
    sourceNotePrefix: 'Källanteckning',
    supplementaryOff: 'Bara UHR-frågor',
    supplementaryOn: 'Inkludera tilläggsfrågor',
  },
];

for (const labels of localeCases) {
  test(`practice controls expose explicit false and true aria state on web (${labels.language})`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await seedSettingsLanguage(page, labels.language);
    await markAboutTheTestSeen(page);

    await page.goto('/practice', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByText(labels.questionTitle, { exact: true })).toBeVisible();

    const audioEnabled = page.getByRole('switch', { name: labels.audioEnabled });
    await expect(audioEnabled).toHaveAttribute('aria-checked', 'true');
    await audioEnabled.click();
    const audioMuted = page.getByRole('switch', { name: labels.audioMuted });
    await expect(audioMuted).toHaveAttribute('aria-checked', 'false');
    await audioMuted.click();
    await expect(page.getByRole('switch', { name: labels.audioEnabled })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const uhrOnly = page.getByRole('switch', { name: labels.supplementaryOff });
    await expect(uhrOnly).toHaveAttribute('aria-checked', 'false');
    await uhrOnly.click();
    const supplementary = page.getByRole('switch', { name: labels.supplementaryOn });
    await expect(supplementary).toHaveAttribute('aria-checked', 'true');
    await supplementary.click();
    await expect(page.getByRole('switch', { name: labels.supplementaryOff })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    const aboutSources = page.getByRole('button', { name: labels.aboutSourcesOpen });
    await expect(aboutSources).toHaveAttribute('aria-expanded', 'false');
    await aboutSources.click();
    const closeSources = page.getByRole('button', { name: labels.aboutSourcesClose });
    await expect(closeSources).toHaveAttribute('aria-expanded', 'true');
    await closeSources.click();
    await expect(page.getByRole('button', { name: labels.aboutSourcesOpen })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    const provenance = page.getByRole('button', { name: labels.provenanceButtonName });
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await provenance.focus();
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(new RegExp(`^${labels.sourceNotePrefix}:`))).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await provenance.click();
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');

    expect(consoleErrors.get()).toEqual([]);
  });
}
