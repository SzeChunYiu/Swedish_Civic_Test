import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

type ComplianceRouteCase = {
  expectedLinkLabels: string[];
  marker: string;
  path: string;
};

const complianceFooterLabels = [
  'Öppna Om provet',
  'Öppna Information',
  'Öppna Integritet',
  'Öppna Villkor',
  'Öppna Källor',
  'Öppna Support',
] as const;

const complianceRouteCases: ComplianceRouteCase[] = [
  {
    expectedLinkLabels: ['Öppna framstegsöversikten', ...complianceFooterLabels],
    marker: 'Juridik och källor',
    path: '/profile',
  },
  {
    expectedLinkLabels: ['Tillbaka till profil', ...complianceFooterLabels],
    marker: 'Inställningar',
    path: '/settings',
  },
  {
    expectedLinkLabels: [
      'Tillbaka till startsidan',
      'Öppna UHR:s utbildningsmaterial',
      'Öppna UHR:s sida Om medborgarskapsprovet',
    ],
    marker: 'Källor',
    path: '/sources',
  },
  {
    expectedLinkLabels: ['Tillbaka till profil', 'Öppna den offentliga supportsidan'],
    marker: 'Support och återkoppling',
    path: '/support',
  },
  {
    expectedLinkLabels: ['Tillbaka till profil'],
    marker: 'Integritetspolicy',
    path: '/privacy',
  },
  {
    expectedLinkLabels: ['Tillbaka till profil'],
    marker: 'Användarvillkor',
    path: '/terms',
  },
  {
    expectedLinkLabels: ['Tillbaka till profil'],
    marker: 'Ansvarsfriskrivning',
    path: '/disclaimer',
  },
  {
    expectedLinkLabels: ['Öppna övningsläget', 'Tillbaka till startsidan'],
    marker: 'Vad är medborgarskapsprovet i samhällskunskap?',
    path: '/about-the-test',
  },
];

const firstRunSuppressedComplianceRouteCases = complianceRouteCases.filter(({ path }) =>
  ['/privacy', '/terms', '/disclaimer', '/sources', '/support'].includes(path),
);

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function seedStableSwedishSettings(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', 'sv');
    window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
  });
}

async function seedFirstRunUnseenSwedishSettings(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', 'sv');
    window.localStorage.removeItem('hasSeenAboutTheTest');
    window.localStorage.removeItem('settings\\hasSeenAboutTheTest');
  });
}

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

async function targetName(target: Locator) {
  return target.evaluate((element) => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim();

    return element.getAttribute('aria-label') ?? text ?? element.tagName;
  });
}

async function expectTouchTarget(locator: Locator, label: string) {
  await expect(locator, `${label} should be visible`).toBeVisible();
  await locator.scrollIntoViewIfNeeded();

  const box = await locator.boundingBox();
  expect(box, `${label} should render a measurable tap target`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44);
}

async function expectAllVisibleLinksAndButtonsMeetTargetSize(page: Page, routePath: string) {
  const targets = page.locator('a, button, [role="link"], [role="button"]');
  const count = await targets.count();

  expect(count, `${routePath} should expose at least one link or button`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const target = targets.nth(index);
    if (!(await target.isVisible().catch(() => false))) continue;

    await expectTouchTarget(
      target,
      `${routePath} target ${index + 1}: ${await targetName(target)}`,
    );
  }
}

for (const routeCase of complianceRouteCases) {
  test(`${routeCase.path} keeps visible link and button targets at least 44px tall`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedStableSwedishSettings(page);
    await page.goto(routeCase.path, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.locator('body')).toContainText(routeCase.marker);

    for (const label of routeCase.expectedLinkLabels) {
      await expectTouchTarget(page.getByRole('link', { name: label }).first(), label);
    }

    await expectAllVisibleLinksAndButtonsMeetTargetSize(page, routeCase.path);
    await expectNoHorizontalOverflow(page, routeCase.path);

    expect(consoleErrors).toEqual([]);
  });
}

for (const routeCase of firstRunSuppressedComplianceRouteCases) {
  test(`${routeCase.path} does not show the first-run guide over direct legal/support content`, async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await seedFirstRunUnseenSwedishSettings(page);
    await page.goto(routeCase.path, { waitUntil: 'networkidle' });

    await expect(page.getByRole('dialog', { name: 'Vad är medborgarskapsprovet?' })).toHaveCount(0);
    await expect(page.locator('body')).toContainText(routeCase.marker);
    for (const label of routeCase.expectedLinkLabels) {
      await expectTouchTarget(page.getByRole('link', { name: label }).first(), label);
    }
    await expectNoHorizontalOverflow(page, routeCase.path);

    expect(consoleErrors).toEqual([]);
  });
}
