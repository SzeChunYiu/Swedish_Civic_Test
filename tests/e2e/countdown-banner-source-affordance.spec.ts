import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
  dismissBlockingModals,
  mockBrowserDate,
  seedFreshSettingsLanguageAndAboutSeen,
  type AppLanguage,
} from './browserLaunch';

import { CITIZENSHIP_TIMELINE_SOURCE_URLS } from '../../lib/learning/examDate';

type BoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

const expectedSources = [
  {
    label: 'Migrationsverket',
    roleName: {
      en: 'Open the Swedish Migration Agency source about new citizenship rules',
      sv: 'Migrationsverket',
    },
    url: CITIZENSHIP_TIMELINE_SOURCE_URLS.rulesEffectiveDate,
  },
  {
    label: 'UHR',
    roleName: {
      en: 'Open the UHR source about the first civic-knowledge test',
      sv: 'UHR',
    },
    url: CITIZENSHIP_TIMELINE_SOURCE_URLS.civicKnowledgeTestFirstSitting,
  },
] as const;

async function expectTargetSize(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label} source link should have a rendered box`).not.toBeNull();
  expect(box!.width, `${label} source link width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${label} source link height`).toBeGreaterThanOrEqual(44);
}

function boxesOverlap(a: BoundingBox, b: BoundingBox) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function collectConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function openHomeAndDismissModals(page: Page, language: AppLanguage = 'sv') {
  await seedFreshSettingsLanguageAndAboutSeen(page, language);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

async function expectSourceLinksVisible(page: Page, language: AppLanguage = 'sv') {
  for (const source of expectedSources) {
    const link = page.getByRole('link', { name: source.roleName[language] });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', source.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toContainText(source.label);
  }
}

async function expectSourceLinksMobileSafeAndOpenPopups({
  body,
  language = 'sv',
  page,
}: {
  body: Locator;
  language?: AppLanguage;
  page: Page;
}) {
  const bodyBox = await body.boundingBox();
  expect(bodyBox, 'countdown body should have a rendered box').not.toBeNull();

  for (const source of expectedSources) {
    const link = page.getByRole('link', { name: source.roleName[language] });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', source.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toContainText(source.label);
    await expectTargetSize(link, `${language} ${source.label}`);

    const linkBox = await link.boundingBox();
    expect(linkBox, `${language} ${source.label} link should have a rendered box`).not.toBeNull();
    expect(boxesOverlap(bodyBox!, linkBox!)).toBe(false);

    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(source.url);
    await popup.close();
  }
}

test('home countdown banner exposes official source links as mobile-safe targets', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-05-21T12:00:00.000Z');
  await openHomeAndDismissModals(page);

  const countdownBody = page.getByText(/Nya medborgarskapsregler gäller från/).first();
  const sourceLabel = page.getByText('Officiella datumkällor:', { exact: true });

  await expect(countdownBody).toBeVisible();
  await expect(sourceLabel).toBeVisible();

  await expectSourceLinksMobileSafeAndOpenPopups({ body: countdownBody, page });

  expect(consoleErrors).toEqual([]);
});

test('home countdown banner shows the civic-test phase after the new rules date', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-06-07T12:00:00.000Z');
  await openHomeAndDismissModals(page);

  await expect(
    page
      .getByText(
        /De nya medborgarskapsreglerna gäller nu sedan 6 juni 2026\. Nästa viktiga fas är samhällskunskapsprovet:/,
      )
      .first(),
  ).toBeVisible();
  await expect(page.getByText('till första provet').first()).toBeVisible();
  await expectSourceLinksVisible(page);

  expect(consoleErrors).toEqual([]);
});

test('home countdown banner English source links stay mobile-safe and open popups', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-06-07T12:00:00.000Z');
  await openHomeAndDismissModals(page, 'en');

  const countdownBody = page
    .getByText(
      /The new citizenship rules have applied since 6 June 2026\. The next key phase is the civic-knowledge test:/,
    )
    .first();
  await expect(countdownBody).toBeVisible();
  await expect(page.getByText('until first test').first()).toBeVisible();
  await expect(page.getByText('Official date sources:', { exact: true })).toBeVisible();
  await expectSourceLinksVisible(page, 'en');
  await expectSourceLinksMobileSafeAndOpenPopups({
    body: countdownBody,
    language: 'en',
    page,
  });
  await expect(page.getByText(/De nya medborgarskapsreglerna gäller nu sedan/)).toHaveCount(0);
  await expect(page.getByText('till första provet')).toHaveCount(0);
  await expect(page.getByText('Officiella datumkällor:', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('home countdown banner shows the civic-test phase in English support mode', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-06-07T12:00:00.000Z');
  await openHomeAndDismissModals(page, 'en');

  await expect(
    page
      .getByText(
        /The new citizenship rules have applied since 6 June 2026\. The next key phase is the civic-knowledge test:/,
      )
      .first(),
  ).toBeVisible();
  await expect(page.getByText('until first test').first()).toBeVisible();
  await expect(page.getByText('Official date sources:', { exact: true })).toBeVisible();
  await expectSourceLinksVisible(page, 'en');
  await expect(page.getByText(/De nya medborgarskapsreglerna gäller nu sedan/)).toHaveCount(0);
  await expect(page.getByText('till första provet')).toHaveCount(0);
  await expect(page.getByText('Officiella datumkällor:', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('home countdown banner disappears after the first civic-test sitting in English support mode', async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-08-16T12:00:00.000Z');
  await openHomeAndDismissModals(page, 'en');

  await expect(page.getByText('Study dashboard').first()).toBeVisible();
  await expect(page.getByText(/New citizenship rules apply from/)).toHaveCount(0);
  await expect(page.getByText(/The new citizenship rules have applied since/)).toHaveCount(0);
  await expect(page.getByText('Official date sources:', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Nya medborgarskapsregler gäller från/)).toHaveCount(0);
  await expect(page.getByText(/De nya medborgarskapsreglerna gäller nu sedan/)).toHaveCount(0);
  await expect(page.getByText('Officiella datumkällor:', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});

test('home countdown banner disappears after the first civic-test sitting', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await mockBrowserDate(page, '2026-08-16T12:00:00.000Z');
  await openHomeAndDismissModals(page);

  await expect(page.getByText('Studieöversikt').first()).toBeVisible();
  await expect(page.getByText(/Nya medborgarskapsregler gäller från/)).toHaveCount(0);
  await expect(page.getByText(/De nya medborgarskapsreglerna gäller nu sedan/)).toHaveCount(0);
  await expect(page.getByText('Officiella datumkällor:', { exact: true })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
