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

async function expectComputedColor(
  locator: Locator,
  property: 'backgroundColor' | 'borderColor' | 'color',
  expectedHexColor: string,
  message: string,
) {
  await expect
    .poll(async () => (await computedColors(locator))[property], { message })
    .toBe(hexToRgb(expectedHexColor));
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
  await expectComputedColor(
    chapterLink,
    'borderColor',
    darkColors.focus,
    'Search chapter links should use the dark focus border token',
  );

  await searchInput.fill('folkomröstning');
  const provenanceBadge = page.getByRole('button', { name: /Källtyp: UHR-källa/ }).first();
  await expect(provenanceBadge).toBeVisible();
  await expectComputedColor(
    provenanceBadge,
    'backgroundColor',
    darkColors.badgeBlueBg,
    'Search provenance badges should use the dark UHR badge background token',
  );
  await expectComputedColor(
    provenanceBadge.getByText('UHR-källa'),
    'color',
    darkColors.badgeBlueText,
    'Search provenance badge labels should use the dark UHR badge text token',
  );

  await provenanceBadge.click();
  const sourceNote = page.getByText(/^Källanteckning:/).first();
  await expect(sourceNote).toBeVisible();
  await expectComputedColor(
    provenanceBadge,
    'borderColor',
    darkColors.focus,
    'Expanded Search provenance badges should use the dark focus border token',
  );
  await expectComputedColor(
    sourceNote,
    'backgroundColor',
    darkColors.surfaceWarm,
    'Search provenance source notes should use the dark warm surface token',
  );
  await expectComputedColor(
    sourceNote,
    'borderColor',
    darkColors.border,
    'Search provenance source notes should use the dark border token',
  );
  await expectComputedColor(
    sourceNote,
    'color',
    darkColors.textSecondary,
    'Search provenance source notes should use the dark secondary text token',
  );
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

  const disclaimer = page.getByLabel(/Study disclaimer: Independent study tool/).first();
  await expect(disclaimer).toBeVisible();
  await expectComputedColor(
    disclaimer,
    'backgroundColor',
    darkColors.surfaceWarm,
    'Citizenship disclaimer should use the dark warm surface token',
  );
  await expectComputedColor(
    disclaimer,
    'borderColor',
    darkColors.border,
    'Citizenship disclaimer should use the dark border token',
  );
  await expectComputedColor(
    page.getByText('Study disclaimer').first(),
    'color',
    darkColors.textSecondary,
    'Citizenship disclaimer title should use the dark secondary text token',
  );
  await expectComputedColor(
    page.getByText(/^Independent study tool\./).first(),
    'color',
    darkColors.textDisclaimer,
    'Citizenship disclaimer copy should use the dark disclaimer text token',
  );

  const firstSourceLink = page
    .getByRole('link', { name: /Migrationsverket: Apply for Swedish citizenship/ })
    .first();
  await expect(firstSourceLink).toBeVisible();
  await expectComputedColor(
    firstSourceLink,
    'borderColor',
    darkColors.border,
    'Citizenship source links should use the dark border token',
  );
  await expectComputedColor(
    firstSourceLink.getByText('Apply for Swedish citizenship'),
    'color',
    darkColors.text,
    'Citizenship source titles should use the dark primary text token',
  );
  await expectComputedColor(
    firstSourceLink.getByText('Migrationsverket').first(),
    'color',
    darkColors.textMuted,
    'Citizenship source metadata should use the dark muted text token',
  );
  await expectComputedColor(
    firstSourceLink.getByText(/https:\/\/www\.migrationsverket\.se\//).first(),
    'color',
    darkColors.accent,
    'Citizenship source URLs should use the dark accent token',
  );

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
