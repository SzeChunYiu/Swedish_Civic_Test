import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  collectPageErrors,
  expectElementNoHorizontalOverflow,
  openStaticEbook,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

async function expectMockLinksAreReachable(page: Page) {
  const mockLinks = page.locator('#ebook-reader .ebook__study-links a[href="#/mock"]');
  const count = await mockLinks.count();
  expect(count).toBeGreaterThanOrEqual(1);

  for (let index = 0; index < count; index += 1) {
    const link = mockLinks.nth(index);
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box, `mock link ${index + 1} should have a rendered box`).not.toBeNull();
    expect(
      box!.height,
      `mock link ${index + 1} should be at least 44px high`,
    ).toBeGreaterThanOrEqual(44);
    expect(
      box!.width,
      `mock link ${index + 1} should be a reachable button target`,
    ).toBeGreaterThanOrEqual(44);
  }

  const overlappingLinks = await page
    .locator('#ebook-reader .ebook__study-links a')
    .evaluateAll((links) => {
      const boxes = links.map((link) => link.getBoundingClientRect());
      return boxes.filter((box, index) =>
        boxes.some(
          (other, otherIndex) =>
            otherIndex > index &&
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top,
        ),
      ).length;
    });
  expect(overlappingLinks).toBe(0);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static-site browser specs use the shared sanitized server helper', async () => {
  const specDir = path.resolve('tests/e2e');
  const localServerCall = ['http', 'createServer'].join('.');
  const localSanitizedLoader = ['function sanitized', 'IndexHtml'].join('');

  for (const file of fs
    .readdirSync(specDir)
    .filter((name) => name.startsWith('static-') && name.endsWith('.spec.ts'))) {
    const source = fs.readFileSync(path.join(specDir, file), 'utf8');

    expect(source, `${file} must not define a local HTTP server`).not.toContain(localServerCall);
    expect(source, `${file} must not define a local sanitized index loader`).not.toContain(
      localSanitizedLoader,
    );
    expect(source, `${file} must use staticSiteServer.ts`).toContain("from './staticSiteServer'");
  }
});

test('static ebook Mock exam / Övningsprov survival guide wording renders naturally in Swedish and English', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const reader = page.locator('#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'sv', '#/ebook?c=intro');
  await expect(reader).toContainText('Sakta in.');
  await expect(reader).toContainText('Avsluta veckan med ett övningsprov');
  await expect(reader.getByRole('link', { name: 'Övningsprov', exact: true })).toBeVisible();
  await expect(reader).not.toContainText(/provexempel/i);
  await expectMockLinksAreReachable(page);
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'sv', '#/ebook?c=12');
  await expect(reader).toContainText('Kapitel 12 · Övningsprov');
  await expect(
    reader.getByRole('heading', { name: /Övningsprov.*överlevnadsguide/i }),
  ).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Starta övningsprov' })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Övningsprov', exact: true })).toBeVisible();
  await expect(reader).not.toContainText(/provexempel/i);
  await expectMockLinksAreReachable(page);
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=intro');
  await expect(reader.getByRole('link', { name: 'Mock exam', exact: true })).toBeVisible();
  await expect(reader).toContainText('run a mock exam once you finish reading');
  await expectMockLinksAreReachable(page);
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=12');
  await expect(reader).toContainText('Chapter 12 · Mock exam');
  await expect(reader.getByRole('heading', { name: /Mock exam.*survival guide/i })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Start mock exam' })).toBeVisible();
  await expect(reader.getByRole('link', { name: 'Mock exam', exact: true })).toBeVisible();
  await expectMockLinksAreReachable(page);
  await expectElementNoHorizontalOverflow(page, '#ebook-reader');

  expect(pageErrors).toEqual([]);
});
