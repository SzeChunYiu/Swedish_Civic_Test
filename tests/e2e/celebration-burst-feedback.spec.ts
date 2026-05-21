import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

const mobileViewport = { width: 390, height: 844 };

test.use({ viewport: mobileViewport });

async function openRouteWithLanguage(page: Page, route: string, language: AppLanguage) {
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

type BoundingBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function boxesOverlap(first: BoundingBox, second: BoundingBox) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

async function expectNoHorizontalPageOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const viewportWidth = root.clientWidth;

          return root.scrollWidth <= viewportWidth + 1 && body.scrollWidth <= viewportWidth + 1;
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

async function expectNoOverlap(first: Locator, second: Locator, label: string) {
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();

  expect(firstBox, `${label} first element should render`).not.toBeNull();
  expect(secondBox, `${label} second element should render`).not.toBeNull();
  expect(boxesOverlap(firstBox!, secondBox!), label).toBe(false);
}

async function expectCelebrationCueVisibleAndDecorative(page: Page, label: string, score: Locator) {
  const cue = page.locator('[aria-hidden="true"]').getByText(label, { exact: true }).first();

  await expect(cue).toBeVisible();
  await expect
    .poll(
      () =>
        cue.evaluate((node) => {
          let element: Element | null = node;

          while (element) {
            const opacity = Number.parseFloat(window.getComputedStyle(element).opacity);
            if (opacity <= 0) return false;
            element = element.parentElement;
          }

          return true;
        }),
      { message: `${label} should render with visible opacity before the burst fades` },
    )
    .toBe(true);
  await expect(page.getByLabel(label, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(0);
  await expectNoOverlap(cue, score, `${label} cue should not overlap the score`);
  await expectNoHorizontalPageOverflow(page, `${label} feedback`);
}

test('practice shows the Swedish celebration cue only for correct feedback and clears on advance', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await openRouteWithLanguage(page, '/practice', 'sv');

  await expect(page.getByText('Var ligger Sverige?', { exact: true })).toBeVisible();
  await expect(page.getByText('Rätt svar', { exact: true })).toHaveCount(0);

  await page.getByLabel('Välj svaret I Norden i norra Europa').click();

  const score = page.getByText('Poäng: 1/1', { exact: true });
  await expect(score).toBeVisible();
  await expectCelebrationCueVisibleAndDecorative(page, 'Rätt svar', score);

  await page.getByLabel('Gå till nästa övningsfråga').click();

  await expect(page.getByText('Fråga 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Rätt svar', { exact: true })).toHaveCount(0);
  await expectNoHorizontalPageOverflow(page, 'Practice after advance');
  expect(consoleErrors).toEqual([]);
});

test('routed quiz shows the English celebration cue only for correct feedback and clears on reset', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await openRouteWithLanguage(page, '/quiz/q001', 'en');

  await expect(page.getByText('Where is Sweden located?', { exact: true })).toBeVisible();
  await expect(page.getByText('Correct answer', { exact: true })).toHaveCount(0);

  await page.getByLabel('Select answer In the Nordic region in northern Europe').click();

  const score = page.getByText('Score: 1/1', { exact: true });
  await expect(score).toBeVisible();
  await expectCelebrationCueVisibleAndDecorative(page, 'Correct answer', score);

  await page.getByLabel('Try this quiz question again').click();

  await expect(
    page.getByLabel('Select answer In the Nordic region in northern Europe'),
  ).toBeVisible();
  await expect(page.getByText('Correct answer', { exact: true })).toHaveCount(0);

  await openRouteWithLanguage(page, '/quiz/q002', 'en');
  await expect(page.getByText('Correct answer', { exact: true })).toHaveCount(0);
  await expectNoHorizontalPageOverflow(page, 'Routed quiz after session change');
  expect(consoleErrors).toEqual([]);
});
