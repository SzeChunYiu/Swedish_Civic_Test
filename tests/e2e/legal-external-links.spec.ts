import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  dismissBlockingModals,
  markAboutTheTestSeen,
  seedSettingsLanguage,
  type AppLanguage,
} from './browserLaunch';

type BoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

type LegalExternalLinkFixture = {
  actionLabel: string;
  bodyText: string;
  language: AppLanguage;
  path: '/sources' | '/support';
  sectionTitle: string;
  title: string;
  url: string;
  visibleLabel?: string;
};

type AboutTheTestOfficialSourceFixture = {
  language: AppLanguage;
  openPrefix: string;
  pageTitle: string;
  publisherLabel: string;
  retrievedLabel: string;
  sourceHeading: string;
  sourceTitles: string[];
  urlLabel: string;
};

const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const PUBLIC_SUPPORT_URL = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
];
const OFFICIAL_SOURCE_RETRIEVED_DATE = '2026-05-20';

const legalExternalLinkFixtures: LegalExternalLinkFixture[] = [
  {
    actionLabel: 'Öppna UHR:s utbildningsmaterial',
    bodyText: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov.',
    language: 'sv',
    path: '/sources',
    sectionTitle: 'Primärt studiematerial',
    title: 'Källor',
    url: UHR_EDUCATION_MATERIAL_URL,
  },
  {
    actionLabel: 'Open UHR education material',
    bodyText: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov.',
    language: 'en',
    path: '/sources',
    sectionTitle: 'Primary study material',
    title: 'Sources',
    url: UHR_EDUCATION_MATERIAL_URL,
  },
  {
    actionLabel: 'Öppna den offentliga supportsidan',
    bodyText: 'Skicka återkoppling via den offentliga supportsidan:',
    language: 'sv',
    path: '/support',
    sectionTitle: 'Offentlig supportsida',
    title: 'Support och återkoppling',
    url: PUBLIC_SUPPORT_URL,
    visibleLabel: 'Offentlig supportsida',
  },
  {
    actionLabel: 'Open public support page',
    bodyText: 'Send feedback through the public support page:',
    language: 'en',
    path: '/support',
    sectionTitle: 'Public support page',
    title: 'Support and feedback',
    url: PUBLIC_SUPPORT_URL,
    visibleLabel: 'Public support page',
  },
];

const aboutTheTestOfficialSourceFixtures: AboutTheTestOfficialSourceFixture[] = [
  {
    language: 'sv',
    openPrefix: 'Öppna officiell källa',
    pageTitle: 'Vad är medborgarskapsprovet i samhällskunskap?',
    publisherLabel: 'Utgivare',
    retrievedLabel: 'Hämtad',
    sourceHeading: 'Officiella källor',
    sourceTitles: [
      'UHR: Om medborgarskapsprovet',
      'UHR: Frågor och svar',
      'UHR: Anmälan',
      'UHR: Utbildningsmaterial om det svenska samhället',
      'Migrationsverket: Nya regler för svenskt medborgarskap från 6 juni 2026',
    ],
    urlLabel: 'URL',
  },
  {
    language: 'en',
    openPrefix: 'Open official source',
    pageTitle: 'What is the Swedish civic test?',
    publisherLabel: 'Publisher',
    retrievedLabel: 'Retrieved',
    sourceHeading: 'Official sources',
    sourceTitles: [
      'UHR: About the citizenship test',
      'UHR: Questions and answers',
      'UHR: Registration',
      'UHR: Study material about Swedish society',
      'Migrationsverket: New rules for Swedish citizenship from 6 June 2026',
    ],
    urlLabel: 'URL',
  },
];

test.use({ viewport: { width: 390, height: 844 } });

async function seedCleanLanguage(page: Page, language: AppLanguage) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await seedSettingsLanguage(page, language);
  await markAboutTheTestSeen(page);
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

function boxesOverlap(a: BoundingBox, b: BoundingBox) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

async function expectRenderedBox(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a rendered box`).not.toBeNull();
  return box!;
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return {
      bodyScrollWidth: body.scrollWidth,
      clientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
    };
  });

  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectExternalLinksAreTouchSafe(page: Page) {
  const boxes = await page.locator('a[href^="https://"]').evaluateAll((links) =>
    links
      .map((link) => {
        const box = link.getBoundingClientRect();
        return {
          height: box.height,
          href: link.getAttribute('href'),
          width: box.width,
          x: box.x,
          y: box.y,
        };
      })
      .filter((box) => box.width > 0 && box.height > 0),
  );

  expect(boxes.length).toBeGreaterThanOrEqual(1);

  for (const box of boxes) {
    expect(box.width, `${box.href} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${box.href} height`).toBeGreaterThanOrEqual(44);
  }

  for (const [index, box] of boxes.entries()) {
    for (const other of boxes.slice(index + 1)) {
      expect(boxesOverlap(box, other), `${box.href} must not overlap ${other.href}`).toBe(false);
    }
  }
}

async function stubExternalDestinations(page: Page) {
  await page.context().route('https://www.uhr.se/**', (route) =>
    route.fulfill({
      body: '<!doctype html><title>UHR destination</title>',
      contentType: 'text/html; charset=utf-8',
      status: 200,
    }),
  );
  await page.context().route('https://www.migrationsverket.se/**', (route) =>
    route.fulfill({
      body: '<!doctype html><title>Migrationsverket destination</title>',
      contentType: 'text/html; charset=utf-8',
      status: 200,
    }),
  );
  await page.context().route('https://szechunyiu.github.io/**', (route) =>
    route.fulfill({
      body: '<!doctype html><title>Public support destination</title>',
      contentType: 'text/html; charset=utf-8',
      status: 200,
    }),
  );
}

for (const fixture of legalExternalLinkFixtures) {
  test(`${fixture.path} exposes ${fixture.language} external link target safely`, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await stubExternalDestinations(page);
    await seedCleanLanguage(page, fixture.language);

    await page.goto(fixture.path, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: fixture.title }).last()).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.sectionTitle }).last()).toBeVisible();

    const body = page.getByText(fixture.bodyText, { exact: false }).first();
    const link = page.getByRole('link', { name: fixture.actionLabel }).first();

    await expect(body).toBeVisible();
    await expect(link).toBeVisible();
    await expect(link).toContainText(fixture.visibleLabel ?? fixture.actionLabel);
    await expect(link).toContainText(fixture.url);
    await expect(link).toHaveAttribute('href', fixture.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');

    const bodyBox = await expectRenderedBox(body, `${fixture.path} ${fixture.language} body`);
    const linkBox = await expectRenderedBox(link, `${fixture.path} ${fixture.language} link`);
    expect(linkBox.width, `${fixture.actionLabel} width`).toBeGreaterThanOrEqual(44);
    expect(linkBox.height, `${fixture.actionLabel} height`).toBeGreaterThanOrEqual(44);
    expect(boxesOverlap(bodyBox, linkBox), `${fixture.actionLabel} must not overlap body`).toBe(
      false,
    );

    await expectExternalLinksAreTouchSafe(page);
    await expectNoHorizontalOverflow(page);

    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(fixture.url);
    await popup.close();

    expect(pageErrors).toEqual([]);
  });
}

for (const fixture of aboutTheTestOfficialSourceFixtures) {
  test(`/about-the-test exposes ${fixture.language} official source links safely`, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await stubExternalDestinations(page);
    await seedCleanLanguage(page, fixture.language);

    await page.goto('/about-the-test', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: fixture.pageTitle }).last()).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.sourceHeading }).last()).toBeVisible();

    for (const [index, sourceTitle] of fixture.sourceTitles.entries()) {
      const url = ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS[index];
      const link = page
        .getByRole('link', { name: `${fixture.openPrefix}: ${sourceTitle}` })
        .first();

      await expect(link).toBeVisible();
      await expect(link).toContainText(sourceTitle);
      await expect(link).toContainText(url);
      await expect(link).toContainText(
        `${fixture.retrievedLabel}: ${OFFICIAL_SOURCE_RETRIEVED_DATE}`,
      );
      await expect(link).toContainText(`${fixture.urlLabel}: ${url}`);
      await expect(link).toHaveAttribute('href', url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');

      if (url.includes('migrationsverket.se')) {
        await expect(link).toContainText(`${fixture.publisherLabel}: Migrationsverket`);
      } else {
        await expect(link).toContainText(
          `${fixture.publisherLabel}: Universitets- och högskolerådet (UHR)`,
        );
      }
    }

    await expectExternalLinksAreTouchSafe(page);
    await expectNoHorizontalOverflow(page);

    const firstOfficialLink = page
      .getByRole('link', {
        name: `${fixture.openPrefix}: ${fixture.sourceTitles[0]}`,
      })
      .first();
    const popupPromise = page.waitForEvent('popup');
    await firstOfficialLink.click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS[0]);
    await popup.close();

    expect(pageErrors).toEqual([]);
  });
}
