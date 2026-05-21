import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type ResumeCase = {
  chapterCtaLabel: string;
  chapterTitle: string;
  language: AppLanguage;
  linkLabel: string;
  subtitle: string;
  title: string;
  visibleCta: string;
};

const resumeCases: ResumeCase[] = [
  {
    chapterCtaLabel: 'Starta frågepass för Landet Sverige',
    chapterTitle: 'Landet Sverige',
    language: 'sv',
    linkLabel: 'Fortsätt där du slutade i Landet Sverige. 1 fråga avklarad i detta kapitel',
    subtitle: '1 fråga avklarad i detta kapitel',
    title: 'Fortsätt där du slutade',
    visibleCta: 'Fortsätt Landet Sverige',
  },
  {
    chapterCtaLabel: 'Start quiz for The country of Sweden',
    chapterTitle: 'The country of Sweden',
    language: 'en',
    linkLabel:
      'Continue where you left off in The country of Sweden. 1 question answered in this chapter',
    subtitle: '1 question answered in this chapter',
    title: 'Continue where you left off',
    visibleCta: 'Resume The country of Sweden',
  },
];

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;

          return (
            document.documentElement.scrollWidth <= viewportWidth + 1 &&
            document.body.scrollWidth <= viewportWidth + 1
          );
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

function recentProgressState() {
  const answeredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const answerDate = answeredAt.slice(0, 10);

  return {
    completedQuestionIds: ['q001'],
    questionProgress: {
      q001: {
        questionId: 'q001',
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        correctStreak: 1,
        lastAnsweredAt: answeredAt,
      },
    },
    totalXp: 10,
    answerDates: [answerDate],
    mockExamSessions: [],
    streakFreezeState: {
      available: 0,
      lastEarnedAt: answerDate,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  };
}

async function seedHomeState(page: Page, language: AppLanguage, progressState?: unknown) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, language, {
    localStorageValues: progressState
      ? {
          'progress\\progressState': JSON.stringify(progressState),
        }
      : {},
  });
}

for (const scenario of resumeCases) {
  test(`home resume CTA opens latest chapter in ${scenario.language}`, async ({ page }) => {
    const consoleErrors = collectConsoleAndPageErrors(page);

    await seedHomeState(page, scenario.language, recentProgressState());
    await page.goto('/home', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    const body = page.locator('body');
    await expect(body).toContainText(scenario.title);
    await expect(body).toContainText(scenario.chapterTitle);
    await expect(body).toContainText(scenario.subtitle);
    await expect(body).toContainText(scenario.visibleCta);

    const resumeLink = page.getByRole('link', { exact: true, name: scenario.linkLabel });
    await expect(resumeLink).toBeVisible();
    await resumeLink.scrollIntoViewIfNeeded();

    const box = await resumeLink.boundingBox();
    expect(box, `${scenario.language} resume link should render a tap target`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(resumeLink.locator('a')).toHaveCount(0);
    await expectNoHorizontalOverflow(page, `${scenario.language} home resume card`);

    await resumeLink.click();
    await expect(page).toHaveURL(/\/chapter\/ch01$/);
    await expect(page.getByLabel(scenario.chapterCtaLabel)).toBeVisible();

    expect(consoleErrors.get()).toEqual([]);
  });
}

test('home hides resume CTA when no progress exists', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedHomeState(page, 'sv');
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const body = page.locator('body');
  await expect(body).not.toContainText('Fortsätt där du slutade');
  await expect(body).not.toContainText('Senaste övning');
  await expectNoHorizontalOverflow(page, 'empty Swedish home resume card');

  expect(consoleErrors.get()).toEqual([]);
});
