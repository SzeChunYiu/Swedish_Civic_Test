import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test('learn links to native study articles and back to chapter practice', async ({ page }) => {
  const consoleErrors: string[] = [];

  await page.setViewportSize({ height: 844, width: 390 });

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/learn', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByLabel(/Öppna studieartiklar/)).toBeVisible();
  await page.getByLabel(/Öppna studieartiklar/).click();

  await expect(page).toHaveURL(/\/ebook$/);
  await expect(page.locator('body')).toContainText('Studieguide i appen');
  await expect(page.locator('body')).toContainText('Sakta in. Vi har kaffe.');
  await expect(page.locator('body')).toContainText('Redaktionell');
  await expect(page.locator('body')).toContainText('Källor hämtade 2026-05-19');
  await expect(page.locator('body')).toContainText('UHR:s offentliga utbildningsmaterial');
  await expect(page.locator('body')).toContainText('Källa för avsnittet');
  const introSectionSourceLink = page
    .getByRole('link', {
      name: /Öppna källa: UHR:s offentliga utbildningsmaterial\./,
    })
    .first();
  await expect(introSectionSourceLink).toBeVisible();
  await expect(introSectionSourceLink).toHaveAttribute(
    'href',
    'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  );
  await expect(introSectionSourceLink).toHaveAttribute('target', '_blank');
  await expect(introSectionSourceLink).toHaveAttribute('rel', 'noreferrer');
  const sectionSourceBox = await introSectionSourceLink.boundingBox();
  expect(sectionSourceBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole('button', { name: 'Lyssna på artikeln' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lyssna på avsnittet' }).first()).toBeVisible();

  const articleNav = page.getByRole('tablist', { name: 'Välj studieartikel' });
  await expect(articleNav).toBeVisible();

  const introTab = articleNav.getByRole('tab', {
    name: /Öppna artikel Hur man läser den här boken/,
  });
  const chapterOneTab = articleNav.getByRole('tab', {
    name: /Öppna artikel Kapitel 01 · Historia/,
  });

  await expect(introTab).toHaveAttribute('aria-selected', 'true');
  await expect(chapterOneTab).toHaveAttribute('aria-selected', 'false');

  await chapterOneTab.click();

  await expect(page).toHaveURL(/\/ebook\?c=1$/);
  await expect(chapterOneTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('body')).toContainText('En kort historia om Sverige.');
  await expect(page.locator('body')).toContainText('Repetera nära källan');
  await expect(page.locator('body')).toContainText('Källa för avsnittet');
  await expect(page.getByRole('button', { name: 'Lyssna på artikeln' })).toBeVisible();

  await page.getByLabel('Tillbaka till studievägen').click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(
    page.getByRole('heading', { name: 'Bläddra bland kapitel med tydliga nästa steg' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('En kort historia om Sverige.');

  await page.goBack({ waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('body')).not.toContainText('En kort historia om Sverige.');

  await page.getByLabel(/Öppna studieartiklar/).click();
  await expect(page).toHaveURL(/\/ebook$/);
  await chapterOneTab.click();
  await expect(page).toHaveURL(/\/ebook\?c=1$/);

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);

  await page.getByLabel('Öppna övning för En kort historia om Sverige.').click();

  await expect(page).toHaveURL(/\/chapter\/ch10$/);
  await expect(page.locator('body')).toContainText('Sveriges moderna historia');

  expect(consoleErrors).toEqual([]);
});
