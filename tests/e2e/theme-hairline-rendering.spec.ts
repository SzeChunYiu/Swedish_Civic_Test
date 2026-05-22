import { expect, test, type Locator, type Page } from '@playwright/test';

import { space } from '../../lib/theme';
import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

async function expectCssPx(
  locator: Locator,
  property: 'borderTopWidth' | 'columnGap' | 'height' | 'paddingTop' | 'rowGap' | 'width',
  expectedPx: number,
  message: string,
) {
  await expect
    .poll(
      async () =>
        locator.evaluate((element, propertyName) => {
          const style = window.getComputedStyle(element);

          return style[propertyName as keyof CSSStyleDeclaration];
        }, property),
      { message },
    )
    .toBe(`${expectedPx}px`);
}

async function openRoute(page: Page, route: string) {
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en');
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

test('theme hairline borders and divider spacing render as 1px and 2px CSS values', async ({
  page,
}) => {
  await openRoute(page, '/search');

  const searchInput = page.getByTestId('search-input');
  await expect(searchInput).toBeVisible();
  await expectCssPx(
    searchInput,
    'borderTopWidth',
    space.hairline,
    'Search input border should render the semantic hairline as 1px CSS',
  );

  const searchSummarySpacer = page.getByTestId('search-accessibility-summary-spacer');
  await expectCssPx(
    searchSummarySpacer,
    'height',
    space.divider,
    'Search hidden summary spacer should preserve the 2px divider height',
  );
  await expectCssPx(
    searchSummarySpacer,
    'width',
    space.divider,
    'Search hidden summary spacer should preserve the 2px divider width',
  );

  await openRoute(page, '/settings?focus=study');

  const studyControls = page.getByTestId('study-settings-controls');
  await expect(studyControls).toBeVisible();
  await expectCssPx(
    studyControls,
    'borderTopWidth',
    space.hairline,
    'Focused Settings study controls should render the semantic hairline as 1px CSS',
  );

  const dailyGoalOption = page.getByTestId('daily-goal-option-5');
  await expect(dailyGoalOption).toBeVisible();
  await expectCssPx(
    dailyGoalOption,
    'borderTopWidth',
    space.hairline,
    'Daily goal pill border should render the semantic hairline as 1px CSS',
  );
  await expectCssPx(
    dailyGoalOption,
    'rowGap',
    space.divider,
    'Daily goal pill should keep the intentional 2px divider row gap',
  );
  await expectCssPx(
    dailyGoalOption,
    'columnGap',
    space.divider,
    'Daily goal pill should keep the intentional 2px divider column gap',
  );
});
