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
  path: '/disclaimer' | '/sources' | '/support' | '/terms';
  sectionTitle: string;
  title: string;
  url: string;
  visibleLabel?: string;
};

type LegalSourceMaterialLinkLayoutFixture = {
  actionLabel: string;
  language: AppLanguage;
  path: '/disclaimer' | '/terms';
  publisherLabel: string;
  retrievedLabel: string;
  sectionTitle: string;
  title: string;
  urlLabel: string;
  visibleLabel: string;
};

type LegalSourceMaterialViewport = {
  label: 'desktop' | 'mobile';
  size: {
    height: number;
    width: number;
  };
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

type CitizenshipRequirementsOfficialSourceFixture = {
  language: AppLanguage;
  openPrefix: string;
  pageTitle: string;
  publishers: string[];
  retrievedLabel: string;
  sourceDates: Array<string | null>;
  sourceDateLabel: string;
  sourceHeading: string;
  sourceTitles: string[];
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
const OFFICIAL_SOURCE_RETRIEVED_DATE = '2026-05-21';
const UHR_AUTHORITY_BOUNDARY_URL = ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS[0];
const SOURCE_MATERIAL_LINK_RETRIEVED_DATE = '2026-05-20';
const CITIZENSHIP_REQUIREMENTS_OFFICIAL_SOURCE_URLS = [
  'https://www.migrationsverket.se/du-vill-ansoka/svenskt-medborgarskap/medborgarskap-for-vuxna/medborgarskap-for-vuxna.html',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
  'https://www.regeringen.se/artiklar/2025/11/inkomstbasbelopp-och-inkomstindex-for-ar-2026-faststallt/',
];
const CITIZENSHIP_REQUIREMENTS_SOURCE_RETRIEVED_DATE = '2026-05-19';

const legalExternalLinkFixtures: LegalExternalLinkFixture[] = [
  {
    actionLabel: 'Öppna UHR:s utbildningsmaterial',
    bodyText: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov.',
    language: 'sv',
    path: '/sources',
    sectionTitle: 'Primärt studiematerial',
    title: 'Källor',
    url: UHR_EDUCATION_MATERIAL_URL,
    visibleLabel: 'UHR: Utbildningsmaterial om det svenska samhället',
  },
  {
    actionLabel: 'Open UHR education material',
    bodyText: 'Sverige i fokus. Utbildningsmaterial till medborgarskapsprov.',
    language: 'en',
    path: '/sources',
    sectionTitle: 'Primary study material',
    title: 'Sources',
    url: UHR_EDUCATION_MATERIAL_URL,
    visibleLabel: 'UHR: Study material about Swedish society',
  },
  {
    actionLabel: 'Öppna UHR:s utbildningsmaterial',
    bodyText: 'Studera alltid det primära utbildningsmaterialet direkt.',
    language: 'sv',
    path: '/disclaimer',
    sectionTitle: 'Använd med källmaterialet',
    title: 'Ansvarsfriskrivning',
    url: UHR_EDUCATION_MATERIAL_URL,
    visibleLabel: 'UHR: Utbildningsmaterial om det svenska samhället',
  },
  {
    actionLabel: 'Open UHR education material',
    bodyText: 'Always study the primary education material directly.',
    language: 'en',
    path: '/disclaimer',
    sectionTitle: 'Use with source material',
    title: 'Disclaimer',
    url: UHR_EDUCATION_MATERIAL_URL,
    visibleLabel: 'UHR: Study material about Swedish society',
  },
  {
    actionLabel: 'Öppna UHR:s sida Om medborgarskapsprovet',
    bodyText: 'Se källänkarna nedan när du vill kontrollera studiematerialet',
    language: 'sv',
    path: '/terms',
    sectionTitle: 'Respektera källmaterialet',
    title: 'Användarvillkor',
    url: UHR_AUTHORITY_BOUNDARY_URL,
    visibleLabel: 'UHR: Om medborgarskapsprovet',
  },
  {
    actionLabel: 'Open UHR About the citizenship test page',
    bodyText: 'Use the source links below to check the study material',
    language: 'en',
    path: '/terms',
    sectionTitle: 'Respect source material',
    title: 'Terms of use',
    url: UHR_AUTHORITY_BOUNDARY_URL,
    visibleLabel: 'UHR: About the citizenship test',
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

const legalSourceMaterialLinkLayoutFixtures: LegalSourceMaterialLinkLayoutFixture[] = [
  {
    actionLabel: 'Öppna UHR:s utbildningsmaterial',
    language: 'sv',
    path: '/disclaimer',
    publisherLabel: 'Utgivare',
    retrievedLabel: 'Hämtad',
    sectionTitle: 'Använd med källmaterialet',
    title: 'Ansvarsfriskrivning',
    urlLabel: 'URL',
    visibleLabel: 'UHR: Utbildningsmaterial om det svenska samhället',
  },
  {
    actionLabel: 'Open UHR education material',
    language: 'en',
    path: '/disclaimer',
    publisherLabel: 'Publisher',
    retrievedLabel: 'Retrieved',
    sectionTitle: 'Use with source material',
    title: 'Disclaimer',
    urlLabel: 'URL',
    visibleLabel: 'UHR: Study material about Swedish society',
  },
  {
    actionLabel: 'Öppna UHR:s utbildningsmaterial',
    language: 'sv',
    path: '/terms',
    publisherLabel: 'Utgivare',
    retrievedLabel: 'Hämtad',
    sectionTitle: 'Respektera källmaterialet',
    title: 'Användarvillkor',
    urlLabel: 'URL',
    visibleLabel: 'UHR: Utbildningsmaterial om det svenska samhället',
  },
  {
    actionLabel: 'Open UHR education material',
    language: 'en',
    path: '/terms',
    publisherLabel: 'Publisher',
    retrievedLabel: 'Retrieved',
    sectionTitle: 'Respect source material',
    title: 'Terms of use',
    urlLabel: 'URL',
    visibleLabel: 'UHR: Study material about Swedish society',
  },
];

const legalSourceMaterialViewports: LegalSourceMaterialViewport[] = [
  { label: 'mobile', size: { width: 390, height: 844 } },
  { label: 'desktop', size: { width: 1024, height: 768 } },
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

const citizenshipRequirementsOfficialSourceFixtures: CitizenshipRequirementsOfficialSourceFixture[] =
  [
    {
      language: 'sv',
      openPrefix: 'Öppna källan i webbläsaren',
      pageTitle: 'Krav och behörighet',
      publishers: [
        'Migrationsverket',
        'Migrationsverket',
        'Universitets- och högskolerådet',
        'Universitets- och högskolerådet',
        'Universitets- och högskolerådet',
        'Regeringen',
        'Regeringen',
      ],
      retrievedLabel: 'Kontrollerad',
      sourceDates: [
        null,
        '2026-05-06',
        '2026-05-06',
        '2026-05-06',
        '2026-05-19',
        '2026-02-06',
        '2025-11-06',
      ],
      sourceDateLabel: 'Källdatum',
      sourceHeading: 'Officiella källor',
      sourceTitles: [
        'Ansök om svenskt medborgarskap',
        'Nya regler för svenskt medborgarskap från 6 juni 2026',
        'Om medborgarskapsprovet',
        'Anmälan till medborgarskapsprovet',
        'Utbildningsmaterial om det svenska samhället',
        'Ändrat uppdrag för medborgarskapsprovet',
        'Inkomstbasbelopp och inkomstindex för år 2026 fastställt',
      ],
    },
    {
      language: 'en',
      openPrefix: 'Open the source in the browser',
      pageTitle: 'Requirements and eligibility',
      publishers: [
        'Migrationsverket',
        'Migrationsverket',
        'Universitets- och högskolerådet',
        'Universitets- och högskolerådet',
        'Universitets- och högskolerådet',
        'Regeringen',
        'Regeringen',
      ],
      retrievedLabel: 'Checked',
      sourceDates: [
        null,
        '2026-05-06',
        '2026-05-06',
        '2026-05-06',
        '2026-05-19',
        '2026-02-06',
        '2025-11-06',
      ],
      sourceDateLabel: 'Source date',
      sourceHeading: 'Official sources',
      sourceTitles: [
        'Apply for Swedish citizenship',
        'New rules for Swedish citizenship from 6 June 2026',
        'About the citizenship test',
        'Registration for the citizenship test',
        'Study material about Swedish society',
        'Updated assignment for the citizenship test',
        'Income base amount and income index for 2026 set',
      ],
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

async function expectLinkTextSegmentsStayInsideBox(link: Locator, segments: string[]) {
  const result = await link.evaluate((element, expectedSegments) => {
    const linkRect = element.getBoundingClientRect();
    const missingSegments: string[] = [];
    const overflowingSegments: string[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    for (const segment of expectedSegments) {
      let matched = false;
      walker.currentNode = element;

      while (walker.nextNode()) {
        const textNode = walker.currentNode;
        const text = textNode.textContent ?? '';
        const startIndex = text.indexOf(segment);
        if (startIndex < 0) continue;

        matched = true;
        const range = document.createRange();
        range.setStart(textNode, startIndex);
        range.setEnd(textNode, startIndex + segment.length);

        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width === 0 || rect.height === 0) continue;
          if (
            rect.left < linkRect.left - 1 ||
            rect.right > linkRect.right + 1 ||
            rect.top < linkRect.top - 1 ||
            rect.bottom > linkRect.bottom + 1
          ) {
            overflowingSegments.push(segment);
            break;
          }
        }

        range.detach();
        break;
      }

      if (!matched) missingSegments.push(segment);
    }

    return {
      missingSegments,
      overflowingSegments,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      visibleHeight: element.clientHeight,
      visibleWidth: element.clientWidth,
    };
  }, segments);

  expect(result.missingSegments).toEqual([]);
  expect(result.overflowingSegments).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.visibleWidth + 1);
  expect(result.scrollHeight).toBeLessThanOrEqual(result.visibleHeight + 1);
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

async function focusLinkWithKeyboard(page: Page, link: Locator, label: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    if (await link.evaluate((element) => document.activeElement === element)) return;
  }

  throw new Error(`${label} was not reachable with Tab`);
}

async function expectKeyboardFocusVisible(link: Locator, label: string) {
  await expect(link, `${label} should receive keyboard focus`).toBeFocused();
  const focusStyle = await link.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

  const hasOutline =
    focusStyle.outlineStyle !== 'none' && Number.parseFloat(focusStyle.outlineWidth) > 0;
  const hasBoxShadow = focusStyle.boxShadow !== 'none';
  const hasVisibleFocusColor = focusStyle.outlineColor !== 'rgba(0, 0, 0, 0)';

  expect(
    (hasOutline && hasVisibleFocusColor) || hasBoxShadow,
    `${label} focus style ${JSON.stringify(focusStyle)}`,
  ).toBe(true);
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
  await page.context().route('https://www.regeringen.se/**', (route) =>
    route.fulfill({
      body: '<!doctype html><title>Regeringen destination</title>',
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

for (const viewport of legalSourceMaterialViewports) {
  test.describe(`${viewport.label} source-material legal link layout`, () => {
    test.use({ viewport: viewport.size });

    for (const fixture of legalSourceMaterialLinkLayoutFixtures) {
      test(`${fixture.path} keeps ${fixture.language} source-material link text wrapped and focus-visible`, async ({
        page,
      }) => {
        const pageErrors = collectPageErrors(page);
        await stubExternalDestinations(page);
        await seedCleanLanguage(page, fixture.language);

        await page.goto(fixture.path, { waitUntil: 'networkidle' });
        await dismissBlockingModals(page);

        await expect(page.getByRole('heading', { name: fixture.title }).last()).toBeVisible();
        await expect(
          page.getByRole('heading', { name: fixture.sectionTitle }).last(),
        ).toBeVisible();

        const link = page.getByRole('link', { name: fixture.actionLabel }).first();
        await expect(link).toBeVisible();

        await expectLinkTextSegmentsStayInsideBox(link, [
          fixture.visibleLabel,
          `${fixture.publisherLabel}: Universitets- och högskolerådet (UHR)`,
          `${fixture.retrievedLabel}: ${SOURCE_MATERIAL_LINK_RETRIEVED_DATE}`,
          `${fixture.urlLabel}: ${UHR_EDUCATION_MATERIAL_URL}`,
        ]);

        const linkBox = await expectRenderedBox(
          link,
          `${fixture.path} ${fixture.language} source-material link`,
        );
        expect(linkBox.width, `${fixture.actionLabel} width`).toBeGreaterThanOrEqual(44);
        expect(linkBox.height, `${fixture.actionLabel} height`).toBeGreaterThanOrEqual(44);

        await focusLinkWithKeyboard(page, link, fixture.actionLabel);
        await expectKeyboardFocusVisible(link, fixture.actionLabel);
        await expectExternalLinksAreTouchSafe(page);
        await expectNoHorizontalOverflow(page);

        expect(pageErrors).toEqual([]);
      });
    }
  });
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

for (const fixture of citizenshipRequirementsOfficialSourceFixtures) {
  test(`/citizenship-requirements exposes ${fixture.language} official source links safely`, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await stubExternalDestinations(page);
    await seedCleanLanguage(page, fixture.language);

    await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: fixture.pageTitle }).last()).toBeVisible();
    await expect(page.getByRole('heading', { name: fixture.sourceHeading }).last()).toBeVisible();

    for (const [index, sourceTitle] of fixture.sourceTitles.entries()) {
      const url = CITIZENSHIP_REQUIREMENTS_OFFICIAL_SOURCE_URLS[index];
      const sourceDate = fixture.sourceDates[index];
      const link = page
        .getByRole('link', { name: `${fixture.openPrefix}: ${sourceTitle}` })
        .first();

      await expect(link).toBeVisible();
      await expect(link).toContainText(sourceTitle);
      await expect(link).toContainText(fixture.publishers[index]);
      await expect(link).toContainText(url);
      await expect(link).toContainText(
        `${fixture.retrievedLabel} ${CITIZENSHIP_REQUIREMENTS_SOURCE_RETRIEVED_DATE}`,
      );
      if (sourceDate) {
        await expect(link).toContainText(`${fixture.sourceDateLabel} ${sourceDate}`);
      }
      await expect(link).toHaveAttribute('href', url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');
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
    await expect.poll(() => popup.url()).toBe(CITIZENSHIP_REQUIREMENTS_OFFICIAL_SOURCE_URLS[0]);
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
