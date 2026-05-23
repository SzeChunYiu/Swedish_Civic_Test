import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type PrivacyLocalStudyDataScenario = {
  forbiddenVisibleCopy: RegExp;
  language: AppLanguage;
  localProgressCopy: RegExp[];
  sectionTitle: string;
  testTitle: string;
  title: string;
};

const scenarios: PrivacyLocalStudyDataScenario[] = [
  {
    forbiddenVisibleCopy: /\bIAP\b|\bFSRS\b|\bpurchase fields are included\b/i,
    language: 'sv',
    localProgressCopy: [
      /besvarade och bokmärkta frågor/i,
      /granskningar av fel svar/i,
      /övningsprovhistorik/i,
      /XP/i,
      /svarshistorik/i,
      /dagliga utmaningar/i,
      /studiesviter och svitskydd/i,
      /repetitionskort och repetitionsdagar/i,
      /inställningar/i,
      /tillgänglighetsval/i,
      /vald studiekompis/i,
      /checklista för medborgarskapskrav/i,
      /e-boksmarkeringar och frivilliga e-boksanteckningar/i,
      /Lokal studiedataexport och import tar inte med köp-, kvitto- eller annonsrättighetsfält/i,
      /Lokal studiedata kan exporteras och importeras i Inställningar/i,
    ],
    sectionTitle: 'Lokal lagring av framsteg',
    testTitle: '/privacy renders local study data disclosure in sv',
    title: 'Integritetspolicy',
  },
  {
    forbiddenVisibleCopy:
      /\badsDisabled\b|purchase fields are included|receipt fields are included/i,
    language: 'en',
    localProgressCopy: [
      /answered and bookmarked questions/i,
      /wrong-answer reviews/i,
      /mock exam history/i,
      /XP/i,
      /answer history/i,
      /daily challenges/i,
      /streaks and streak freezes/i,
      /FSRS review cards and graded review days/i,
      /settings/i,
      /accessibility preferences/i,
      /selected study companion/i,
      /citizenship requirements checklist state/i,
      /ebook highlights with optional notes/i,
      /Local study data export and import do not include purchase, receipt, or ad-entitlement fields/i,
      /Local study data can be exported and imported in Settings/i,
    ],
    sectionTitle: 'Local progress storage',
    testTitle: '/privacy renders local study data disclosure in en',
    title: 'Privacy policy',
  },
];

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
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

async function expectPrivacyLocalStudyDataCopy(
  page: Page,
  scenario: PrivacyLocalStudyDataScenario,
): Promise<void> {
  await expect(page.getByRole('heading', { name: scenario.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: scenario.sectionTitle })).toBeVisible();

  const body = page.locator('body');
  for (const pattern of scenario.localProgressCopy) {
    await expect(body).toContainText(pattern);
  }
  await expect(body).not.toContainText(scenario.forbiddenVisibleCopy);
  await expectNoHorizontalOverflow(page, `${scenario.language} privacy local study data copy`);
}

for (const scenario of scenarios) {
  test(scenario.testTitle, async ({ page }) => {
    const errors = collectConsoleAndPageErrors(page);

    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);
    await page.goto('/privacy', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expectPrivacyLocalStudyDataCopy(page, scenario);

    expect(errors.get()).toEqual([]);
  });
}
