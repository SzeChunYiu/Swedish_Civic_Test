import { expect, type Locator, test } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';
import { startAllVisiblePractice, type PracticeHubLanguage } from './practiceHub';

type PracticeAriaLocaleCase = {
  aboutSourcesClose: string;
  aboutSourcesOpen: string;
  audioEnabled: string;
  audioMuted: string;
  bookmark: RegExp | string;
  language: PracticeHubLanguage;
  provenance: RegExp;
  questionTitle: string;
  sourceNote: RegExp;
  supplementaryOff: string;
  supplementaryOn: string;
};

type ExamFlagLocaleCase = {
  activeCount: string;
  flagLabel: string;
  language: PracticeHubLanguage;
  startLabel: string;
  title: string;
  unflagLabel: string;
};

const localeCases: PracticeAriaLocaleCase[] = [
  {
    aboutSourcesClose: 'Close source details',
    aboutSourcesOpen: 'About the sources',
    audioEnabled: 'Audio enabled, tap to mute',
    audioMuted: 'Audio muted, tap to enable',
    bookmark: 'Bookmark this question',
    language: 'en',
    provenance: /Provenance: UHR source/,
    questionTitle: 'Question 1',
    sourceNote: /^Source note:/,
    supplementaryOff: 'UHR questions only',
    supplementaryOn: 'Include supplementary questions',
  },
  {
    aboutSourcesClose: 'Stäng om källorna',
    aboutSourcesOpen: 'Om källorna',
    audioEnabled: 'Ljud är på, tryck för att stänga av',
    audioMuted: 'Ljud är avstängt, tryck för att slå på',
    bookmark: 'Bokmärk den här frågan',
    language: 'sv',
    provenance: /Källtyp: UHR-källa/,
    questionTitle: 'Fråga 1',
    sourceNote: /^Källanteckning:/,
    supplementaryOff: 'Bara UHR-frågor',
    supplementaryOn: 'Inkludera tilläggsfrågor',
  },
];

const examFlagCases: ExamFlagLocaleCase[] = [
  {
    activeCount: '0/20 answered',
    flagLabel: 'Flag question 1 for review',
    language: 'en',
    startLabel: 'Start mock exam',
    title: 'Mock exam',
    unflagLabel: 'Remove flag from question 1',
  },
  {
    activeCount: '0/20 besvarade',
    flagLabel: 'Flagga fråga 1 för granskning',
    language: 'sv',
    startLabel: 'Starta övningsprov',
    title: 'Övningsprov',
    unflagLabel: 'Ta bort flagga från fråga 1',
  },
];

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(Math.floor(box?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.floor(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
}

for (const labels of localeCases) {
  test(`Practice controls expose aria state and 44px targets on web in ${labels.language}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await seedSettingsLanguage(page, labels.language);
    await markAboutTheTestSeen(page);

    await page.goto('/practice', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await startAllVisiblePractice(page, labels.language);
    await expect(page.getByText(labels.questionTitle, { exact: true })).toBeVisible();

    const bookmark = page.getByRole('button', { name: labels.bookmark });
    await expectTouchTarget(bookmark);
    await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
    await expect(bookmark).not.toHaveAttribute('aria-selected');

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
    await expectTouchTarget(uhrOnly);
    await expect(uhrOnly).toHaveAttribute('aria-checked', 'false');
    await uhrOnly.click();
    const supplementary = page.getByRole('switch', { name: labels.supplementaryOn });
    await expectTouchTarget(supplementary);
    await expect(supplementary).toHaveAttribute('aria-checked', 'true');
    await supplementary.click();
    await expect(page.getByRole('switch', { name: labels.supplementaryOff })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    const aboutSources = page.getByRole('button', { name: labels.aboutSourcesOpen });
    await expectTouchTarget(aboutSources);
    await expect(aboutSources).toHaveAttribute('aria-expanded', 'false');
    await aboutSources.click();
    const closeSources = page.getByRole('button', { name: labels.aboutSourcesClose });
    await expectTouchTarget(closeSources);
    await expect(closeSources).toHaveAttribute('aria-expanded', 'true');
    await closeSources.click();
    await expect(page.getByRole('button', { name: labels.aboutSourcesOpen })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    const provenance = page.getByRole('button', { name: labels.provenance }).first();
    const sourceNote = page.getByText(labels.sourceNote);
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);
    await provenance.evaluate((element: HTMLElement) => element.blur());
    await expect(provenance).not.toBeFocused();
    await provenance.click();
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote).toBeVisible();
    await expect(sourceNote).toHaveAttribute('aria-live', 'polite');
    await provenance.click();
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);
    await provenance.evaluate((element: HTMLElement) => element.blur());
    await provenance.focus();
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote).toBeVisible();
    await provenance.evaluate((element: HTMLElement) => element.blur());
    await expect(provenance).not.toBeFocused();
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);
    await provenance.click();
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(provenance).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceNote).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(provenance).toHaveAttribute('aria-expanded', 'false');
    await expect(sourceNote).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
}

for (const labels of examFlagCases) {
  test(`Exam flag control exposes false pressed state on web in ${labels.language}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await seedSettingsLanguage(page, labels.language);
    await markAboutTheTestSeen(page);

    await page.goto('/exam', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);
    await expect(page.getByRole('heading', { name: labels.title }).first()).toBeVisible();
    const activeCount = page.getByText(labels.activeCount);
    if ((await activeCount.count()) === 0) {
      const start = page.getByRole('button', { name: labels.startLabel });
      await expect(start).toBeEnabled();
      await start.click();
    }
    await expect(activeCount).toBeVisible();

    const flag = page.getByRole('button', { name: labels.flagLabel });
    await expectTouchTarget(flag);
    await expect(flag).toHaveAttribute('aria-pressed', 'false');
    await expect(flag).not.toHaveAttribute('aria-selected');
    await flag.click();

    const unflag = page.getByRole('button', { name: labels.unflagLabel });
    await expectTouchTarget(unflag);
    await expect(unflag).toHaveAttribute('aria-pressed', 'true');
    await expect(unflag).not.toHaveAttribute('aria-selected');
    await unflag.click();
    await expect(flag).toHaveAttribute('aria-pressed', 'false');
    await expect(flag).not.toHaveAttribute('aria-selected');

    expect(consoleErrors).toEqual([]);
  });
}
