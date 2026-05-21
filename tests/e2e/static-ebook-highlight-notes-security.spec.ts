import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  openStaticEbook,
  startStaticSiteServer,
  type StaticSite,
} from './staticSiteServer';

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static ebook highlight notes escape forged ids before rendering and lookup', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const unsafeId = 'h1"][autofocus][data-extra="x';
  const unsafeNote = '<img src=x onerror="window.__noteXss = true">';

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=intro');
  await page.evaluate(
    ({ id, note }) => {
      localStorage.setItem(
        'smt_hl_intro',
        JSON.stringify([
          {
            id,
            text: 'public study material',
            before: '',
            after: '',
            note,
          },
        ]),
      );
      (window as typeof window & { __noteXss?: boolean }).__noteXss = false;
      (window as typeof window & { smtEbookRender?: () => void }).smtEbookRender?.();
      (
        window as typeof window & { smtApplyEbookHighlights?: () => void }
      ).smtApplyEbookHighlights?.();
    },
    { id: unsafeId, note: unsafeNote },
  );

  const item = page.locator('#eb-notes-list .eb-notes-item').first();
  await expect(item).toBeVisible();
  await expect(item).toContainText(unsafeNote);
  await expect(item.locator('img, svg')).toHaveCount(0);
  await expect(item).toHaveAttribute('data-hl-id', unsafeId);

  const noteItemAttributeNames = await item.evaluate((element) =>
    Array.from(element.attributes, (attribute) => attribute.name),
  );
  expect(noteItemAttributeNames).not.toContain('autofocus');
  expect(noteItemAttributeNames).not.toContain('data-extra');
  expect(noteItemAttributeNames).not.toContain('onfocus');

  await item.getByRole('button', { name: 'Find highlight' }).click();
  await expect(page.locator('mark.eb-hl.is-flash')).toHaveCount(1);

  await item.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#eb-note')).toBeVisible();
  await expect(page.locator('#eb-note .eb-note__ta')).toHaveValue(unsafeNote);
  await expect(page.locator('#eb-note img, #eb-note svg')).toHaveCount(0);

  await expect
    .poll(() => page.evaluate(() => (window as typeof window & { __noteXss?: boolean }).__noteXss))
    .toBe(false);
  expect(pageErrors).toEqual([]);
});
