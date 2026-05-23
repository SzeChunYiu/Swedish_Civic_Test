import { expect, test, type Locator } from '@playwright/test';

import {
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeenWithStorage,
} from './browserLaunch';

const accessibilityEasyReadFontKey = 'accessibility\\a11y.easyReadFont.v1';
const accessibilityFontSizeStepKey = 'accessibility\\a11y.fontSizeStep.v1';

async function computedTextStyle(locator: Locator) {
  return locator.evaluate((element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
}

test('native ebook applies easy-read and largest text preferences without clipping article navigation', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await seedFreshSettingsLanguageAndAboutSeenWithStorage(page, 'en', {
    localStorageValues: {
      [accessibilityEasyReadFontKey]: 'true',
      [accessibilityFontSizeStepKey]: '3',
    },
  });

  await page.goto('/ebook', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const articleHeading = page.getByRole('heading', {
    name: "Slow down. We've got coffee.",
  });
  const lede = page.getByText('This is a companion, not a textbook.');
  const sectionBody = page.getByText("A plain-language reader for Sweden's citizenship test");
  const sourceLink = page
    .getByRole('link', {
      name: /Open source: UHR public study material\./,
    })
    .first();
  const articleNav = page.getByRole('tablist', { name: 'Choose study article' });
  const introTab = articleNav.getByRole('tab', { name: /Open article How to read this book/ });

  await expect(articleHeading).toBeVisible();
  await expect(lede).toBeVisible();
  await expect(sectionBody).toBeVisible();
  await expect(sourceLink).toBeVisible();
  await expect(introTab).toBeVisible();

  const headingStyle = await computedTextStyle(articleHeading);
  const ledeStyle = await computedTextStyle(lede);
  const sourceStyle = await computedTextStyle(sourceLink.getByText('UHR public study material'));
  const introTabBox = await introTab.boundingBox();

  expect(headingStyle.fontFamily).toContain('Atkinson');
  expect(headingStyle.fontSize).toBeGreaterThanOrEqual(28);
  expect(ledeStyle.fontFamily).toContain('Atkinson');
  expect(ledeStyle.fontSize).toBeGreaterThanOrEqual(24);
  expect(sourceStyle.fontFamily).toContain('Atkinson');
  expect(sourceStyle.fontSize).toBeGreaterThanOrEqual(18);
  expect(introTabBox?.height ?? 0).toBeGreaterThan(64);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);
});
