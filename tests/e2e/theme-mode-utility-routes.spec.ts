import { expect, test, type Locator, type Page } from '@playwright/test';

import { darkColors } from '../../lib/theme';
import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

const accessibilityThemeModeKey = 'accessibility\\a11y.themeMode.v1';
const mobileViewport = { width: 390, height: 844 };

function hexToRgb(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
}

async function seedDarkTheme(page: Page) {
  await page.addInitScript((themeModeKey: string) => {
    window.localStorage.setItem(themeModeKey, 'dark');
  }, accessibilityThemeModeKey);
}

async function computedColors(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);

    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      color: style.color,
    };
  });
}

test.use({ viewport: mobileViewport });

test('search utility route uses dark theme tokens for input and route actions', async ({
  page,
}) => {
  await seedSettingsLanguage(page, 'sv');
  await markAboutTheTestSeen(page);
  await seedDarkTheme(page);

  await page.goto('/search', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const searchInput = page.getByRole('textbox', {
    name: 'Sök samhällsbegrepp och övningsfrågor',
  });
  await expect(searchInput).toBeVisible();
  await expect
    .poll(async () => (await computedColors(searchInput)).color)
    .toBe(hexToRgb(darkColors.text));
  await expect
    .poll(async () => (await computedColors(searchInput)).borderColor)
    .toBe(hexToRgb(darkColors.border));

  await searchInput.fill('kommun');
  const chapterLink = page.getByRole('link', { name: /Öppna kapitlet/ }).first();
  await expect(chapterLink).toBeVisible();
  await expect
    .poll(async () => (await computedColors(chapterLink)).borderColor)
    .toBe(hexToRgb(darkColors.focus));
});

test('citizenship requirements route uses dark theme tokens for checklist and CTAs', async ({
  page,
}) => {
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);
  await seedDarkTheme(page);

  await page.goto('/citizenship-requirements', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const firstChecklistItem = page.getByRole('checkbox', { name: /Not marked:/ }).first();
  await expect(firstChecklistItem).toBeVisible();
  await expect
    .poll(async () => (await computedColors(firstChecklistItem)).borderColor)
    .toBe(hexToRgb(darkColors.border));

  const practiceLink = page.getByRole('link', {
    name: 'Open civic knowledge practice mode',
  });
  await expect(practiceLink).toBeVisible();
  await expect
    .poll(async () => (await computedColors(practiceLink)).backgroundColor)
    .toBe(hexToRgb(darkColors.accent));
  await expect
    .poll(async () => (await computedColors(practiceLink)).color)
    .toBe(hexToRgb(darkColors.surface));
});
