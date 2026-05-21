import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

type BoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

type TypographySample = {
  label: string;
  locator: (page: Page) => Locator;
};

type RouteTypographyFixture = {
  name: string;
  route: string;
  samples: TypographySample[];
};

const viewports = [
  { name: 'mobile', size: { width: 390, height: 844 } },
  { name: 'desktop', size: { width: 1024, height: 768 } },
] as const;

const fixtures: RouteTypographyFixture[] = [
  {
    name: 'home',
    route: '/home',
    samples: [
      {
        label: 'home eyebrow badge',
        locator: (page) => page.getByText('Studieöversikt', { exact: true }),
      },
      {
        label: 'home hero heading',
        locator: (page) =>
          page.getByRole('heading', {
            name: 'Studera lugnt, ett samhällsbegrepp i taget',
          }),
      },
      {
        label: 'home daily goal heading',
        locator: (page) => page.getByRole('heading', { name: 'Dagens mål' }),
      },
      {
        label: 'home countdown label',
        locator: (page) => page.getByText('tills nya reglerna', { exact: true }),
      },
    ],
  },
  {
    name: 'learn',
    route: '/learn',
    samples: [
      {
        label: 'learn eyebrow badge',
        locator: (page) => page.getByText('Studieväg', { exact: true }),
      },
      {
        label: 'learn hero heading',
        locator: (page) =>
          page.getByRole('heading', {
            name: 'Bläddra bland kapitel med tydliga nästa steg',
          }),
      },
      {
        label: 'learn section heading',
        locator: (page) => page.getByRole('heading', { name: '13 samhällsområden' }),
      },
      {
        label: 'learn first chapter card title',
        locator: (page) => page.getByText('Landet Sverige', { exact: true }),
      },
    ],
  },
  {
    name: 'practice',
    route: '/practice',
    samples: [
      {
        label: 'practice hub badge',
        locator: (page) => page.getByText('Övningshub', { exact: true }),
      },
      {
        label: 'practice hub heading',
        locator: (page) => page.getByRole('heading', { name: 'Välj hur du vill öva' }),
      },
      {
        label: 'practice hub answered count',
        locator: (page) => page.getByText(/Du har svarat på 0 av \d+ synliga frågor\./),
      },
      {
        label: 'practice first chapter card title',
        locator: (page) => page.getByText('Landet Sverige', { exact: true }),
      },
    ],
  },
  {
    name: 'profile',
    route: '/profile',
    samples: [
      {
        label: 'profile eyebrow badge',
        locator: (page) => page.getByText('Lokal profil', { exact: true }),
      },
      {
        label: 'profile hero heading',
        locator: (page) => page.getByRole('heading', { name: 'Framsteg utan konto' }),
      },
      {
        label: 'profile level metric label',
        locator: (page) => page.getByText('nivå', { exact: true }).first(),
      },
      {
        label: 'profile study settings heading',
        locator: (page) => page.getByRole('heading', { name: 'Studieinställningar' }),
      },
    ],
  },
];

async function openRoute(page: Page, route: string) {
  await seedSettingsLanguage(page, 'sv');
  await markAboutTheTestSeen(page);
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectZeroOrDefaultLetterSpacing(locator: Locator, label: string) {
  const letterSpacing = await locator.evaluate(
    (element) => window.getComputedStyle(element).letterSpacing,
  );

  expect(
    letterSpacing === 'normal' || letterSpacing === '0px',
    `${label} should render with default or zero letter spacing, received ${letterSpacing}`,
  ).toBe(true);
}

function boxesOverlap(a: BoundingBox, b: BoundingBox) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

async function expectRenderedTypographySample(
  page: Page,
  sample: TypographySample,
  viewportWidth: number,
) {
  const locator = sample.locator(page).first();
  await expect(locator, `${sample.label} should be visible`).toBeVisible();

  const box = await locator.boundingBox();
  expect(box, `${sample.label} should have a rendered box`).not.toBeNull();
  expect(box!.width, `${sample.label} width`).toBeGreaterThan(0);
  expect(box!.height, `${sample.label} height`).toBeGreaterThan(0);
  expect(box!.x, `${sample.label} should not overflow left`).toBeGreaterThanOrEqual(-2);
  expect(box!.x + box!.width, `${sample.label} should not overflow right`).toBeLessThanOrEqual(
    viewportWidth + 2,
  );

  await expectZeroOrDefaultLetterSpacing(locator, sample.label);

  return {
    box: box!,
    label: sample.label,
  };
}

async function expectNoHorizontalPageOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const visibleRects = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          bottom: rect.bottom,
          display: style.display,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          visibility: style.visibility,
          width: rect.width,
        };
      })
      .filter(
        (rect) =>
          rect.display !== 'none' &&
          rect.visibility !== 'hidden' &&
          rect.width > 2 &&
          rect.height > 2 &&
          rect.bottom > 0 &&
          rect.right > 0,
      );
    const maxRight = Math.max(root.clientWidth, ...visibleRects.map((rect) => rect.right));
    const minLeft = Math.min(0, ...visibleRects.map((rect) => rect.left));

    return {
      documentOverflow: Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth,
      leftOverflow: Math.abs(Math.min(0, minLeft)),
      rightOverflow: maxRight - root.clientWidth,
    };
  });

  expect(overflow.documentOverflow, `${label} document scroll overflow`).toBeLessThanOrEqual(2);
  expect(overflow.leftOverflow, `${label} visible left overflow`).toBeLessThanOrEqual(2);
  expect(overflow.rightOverflow, `${label} visible right overflow`).toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  test.describe(`${viewport.name} typography geometry`, () => {
    for (const fixture of fixtures) {
      test(`${fixture.name} renders tokenized text without overlap or overflow`, async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        await page.setViewportSize(viewport.size);
        await openRoute(page, fixture.route);

        const renderedSamples = [];
        for (const sample of fixture.samples) {
          renderedSamples.push(
            await expectRenderedTypographySample(page, sample, viewport.size.width),
          );
        }

        for (let index = 0; index < renderedSamples.length; index += 1) {
          for (let nextIndex = index + 1; nextIndex < renderedSamples.length; nextIndex += 1) {
            const current = renderedSamples[index];
            const next = renderedSamples[nextIndex];
            expect(
              boxesOverlap(current.box, next.box),
              `${current.label} should not overlap ${next.label}`,
            ).toBe(false);
          }
        }

        await expectNoHorizontalPageOverflow(page, `${viewport.name} ${fixture.name}`);
        expect(consoleErrors).toEqual([]);
      });
    }
  });
}
