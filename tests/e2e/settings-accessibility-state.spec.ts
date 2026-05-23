import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

const settingsLanguageStorageKey = 'settings\\language';
const accessibilityThemeModeStorageKey = 'accessibility\\a11y.themeMode.v1';

type MMKVPersistenceFailureHarnessOptions = {
  failingReads?: string[];
  failingWrites?: string[];
};

async function installMMKVPersistenceFailureHarness(
  page: Page,
  { failingReads = [], failingWrites = [] }: MMKVPersistenceFailureHarnessOptions,
) {
  await page.addInitScript(
    ({ failingReads, failingWrites }: { failingReads: string[]; failingWrites: string[] }) => {
      const readFailures = new Set(failingReads);
      const writeFailures = new Set(failingWrites);
      const originalGetItem = Storage.prototype.getItem;
      const originalSetItem = Storage.prototype.setItem;

      Storage.prototype.getItem = function getItem(key: string) {
        const storageKey = String(key);
        if (this === window.localStorage && readFailures.has(storageKey)) {
          throw new Error(`e2e forced MMKV read failure for ${storageKey}`);
        }
        return originalGetItem.call(this, key);
      };

      Storage.prototype.setItem = function setItem(key: string, value: string) {
        const storageKey = String(key);
        if (this === window.localStorage && writeFailures.has(storageKey)) {
          throw new Error(`e2e forced MMKV write failure for ${storageKey}`);
        }
        return originalSetItem.call(this, key, value);
      };
    },
    { failingReads, failingWrites },
  );
}

async function expectPreviewAsset(preview: Locator, pattern: RegExp) {
  await expect
    .poll(() =>
      preview.evaluate((element) => {
        const image = element.querySelector('img');
        if (image) return image.getAttribute('src') ?? '';

        return Array.from(element.querySelectorAll('*'))
          .map((node) => getComputedStyle(node).backgroundImage)
          .join('\n');
      }),
    )
    .toMatch(pattern);
}

async function expectStableCompanionPreview(preview: Locator, assetPattern: RegExp) {
  await expect(preview).toHaveCSS('height', '48px');
  await expect(preview).toHaveCSS('width', '48px');
  await expectPreviewAsset(preview, assetPattern);
}

test('settings renders separate accessibility persistence warning and settings persistence warning', async ({
  page,
}) => {
  const browserErrors = collectConsoleAndPageErrors(page);
  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await installMMKVPersistenceFailureHarness(page, {
    failingReads: [settingsLanguageStorageKey, accessibilityThemeModeStorageKey],
  });

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  const settingsReadWarning = page.getByRole('alert', {
    name: 'Inställningar kunde inte läsas. Appen använder standardval i den här sessionen.',
  });
  const accessibilityReadWarnings = page.getByRole('alert', {
    name: 'Tillgänglighetsinställningar kunde inte läsas. Appen använder standardinställningar i den här sessionen.',
  });

  await expect(settingsReadWarning).toBeVisible();
  await expect.poll(() => accessibilityReadWarnings.count()).toBeGreaterThan(0);

  await accessibilityReadWarnings.first().getByRole('button', { name: 'Jag förstår' }).click();
  await expect(accessibilityReadWarnings).toHaveCount(0);
  await expect(settingsReadWarning).toBeVisible();

  await settingsReadWarning.getByRole('button', { name: 'Jag förstår' }).click();
  await expect(settingsReadWarning).toHaveCount(0);
  expect(browserErrors.get()).toEqual([]);
});

test('settings dismisses accessibility persistence warning after write without settings-store warning', async ({
  page,
}) => {
  const browserErrors = collectConsoleAndPageErrors(page);
  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await installMMKVPersistenceFailureHarness(page, {
    failingWrites: [accessibilityThemeModeStorageKey],
  });

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('alert', {
      name: /Settings could not be loaded|The setting could not be saved/,
    }),
  ).toHaveCount(0);

  await page.getByLabel('Choose theme: Dark').click();
  const accessibilityWriteWarnings = page.getByRole('alert', {
    name: 'Accessibility preferences could not be saved. The change is available temporarily in this session.',
  });

  await expect.poll(() => accessibilityWriteWarnings.count()).toBeGreaterThan(0);
  await expect(
    page.getByRole('alert', {
      name: /Settings could not be loaded|The setting could not be saved/,
    }),
  ).toHaveCount(0);

  await accessibilityWriteWarnings.first().getByRole('button', { name: 'Got it' }).click();
  await expect(accessibilityWriteWarnings).toHaveCount(0);
  await expect(page.getByLabel('Choose theme: Dark')).toHaveAttribute('aria-checked', 'true');
  expect(browserErrors.get()).toEqual([]);
});

test('settings controls expose selected state, audio playback rate, and radio arrow keyboard navigation on web', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('radiogroup', { name: 'Uppläsningshastighet' })).toBeVisible();
  await expect(page.getByLabel('Ställ in uppläsningshastighet till 1,0x')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('radiogroup', { name: 'Välj studiekompis' })).toBeVisible();
  await expectStableCompanionPreview(
    page.getByTestId('companion-preview-kanelbulle'),
    /kanelbulle\/idle(?:\.[a-f0-9]+)?\.svg/,
  );
  await expectStableCompanionPreview(
    page.getByTestId('companion-preview-skoglimpa'),
    /skoglimpa\/idle(?:\.[a-f0-9]+)?\.svg/,
  );
  await expect(
    page.getByRole('radio', {
      name: /Kanelbulle är vald som studiekompis\. Fika och vardagskultur\./,
    }),
  ).toHaveAttribute('aria-checked', 'true');

  await page.getByLabel('Byt studiespråk till Engelskt stöd').click();
  const swedishLanguage = page.getByLabel('Set study language to Swedish');
  const englishLanguage = page.getByLabel('Set study language to English support');

  await expect(englishLanguage).toHaveAttribute('aria-checked', 'true');
  await expect(swedishLanguage).toHaveAttribute('aria-checked', 'false');
  await englishLanguage.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByLabel('Byt studiespråk till Svenska')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const swedishEnglishLanguage = page.getByLabel('Byt studiespråk till Engelskt stöd');
  await swedishEnglishLanguage.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );

  const tenAnswers = page.getByLabel('Set daily goal to 10 answers');
  const twentyAnswers = page.getByLabel('Set daily goal to 20 answers');
  await twentyAnswers.click();

  await expect(twentyAnswers).toHaveAttribute('aria-checked', 'true');
  await expect(tenAnswers).toHaveAttribute('aria-checked', 'false');
  await twentyAnswers.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tenAnswers).toHaveAttribute('aria-checked', 'true');
  await tenAnswers.focus();
  await page.keyboard.press('ArrowRight');
  await expect(twentyAnswers).toHaveAttribute('aria-checked', 'true');

  const systemTheme = page.getByLabel('Choose theme: Use system');
  const darkTheme = page.getByLabel('Choose theme: Dark');
  await darkTheme.click();

  await expect(darkTheme).toHaveAttribute('aria-checked', 'true');
  await expect(systemTheme).toHaveAttribute('aria-checked', 'false');
  await darkTheme.focus();
  await page.keyboard.press('ArrowRight');
  await expect(systemTheme).toHaveAttribute('aria-checked', 'true');
  await systemTheme.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(darkTheme).toHaveAttribute('aria-checked', 'true');

  await expect(page.getByRole('radiogroup', { name: 'Choose study companion' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: /Cinnamon bun is selected as study companion\. Fika and everyday culture\./,
    }),
  ).toHaveAttribute('aria-checked', 'true');
  const selectedCinnamonCompanion = page.getByRole('radio', {
    name: /Cinnamon bun is selected as study companion\. Fika and everyday culture\./,
  });

  await selectedCinnamonCompanion.focus();
  await page.keyboard.press('ArrowRight');
  const selectedRyeLoafCompanion = page.getByRole('radio', {
    name: /Swedish rye loaf is selected as study companion\. Dark rye bread and everyday Swedish food\./,
  });
  await expect(selectedRyeLoafCompanion).toHaveAttribute('aria-checked', 'true');
  await expect(selectedRyeLoafCompanion).toBeFocused();

  await selectedRyeLoafCompanion.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(selectedCinnamonCompanion).toHaveAttribute('aria-checked', 'true');
  await expect(selectedCinnamonCompanion).toBeFocused();

  await selectedCinnamonCompanion.focus();
  await page.keyboard.press('ArrowLeft');
  const snowmanCompanion = page.getByRole('radio', {
    name: /Snowman is selected as study companion\. Winter and climate\./,
  });
  await expect(snowmanCompanion).toHaveAttribute('aria-checked', 'true');
  await expect(snowmanCompanion).toBeFocused();

  await snowmanCompanion.focus();
  await page.keyboard.press('ArrowRight');
  await expect(selectedCinnamonCompanion).toHaveAttribute('aria-checked', 'true');
  await expect(selectedCinnamonCompanion).toBeFocused();

  await page
    .getByRole('radio', {
      name: /Choose Dala horse as study companion\. Folk symbol from Dalarna\./,
    })
    .click();
  await expectStableCompanionPreview(
    page.getByTestId('companion-preview-dala-horse'),
    /dala-horse\/idle(?:\.[a-f0-9]+)?\.svg/,
  );
  await expect(
    page.getByRole('radio', {
      name: /Dala horse is selected as study companion\. Folk symbol from Dalarna\./,
    }),
  ).toHaveAttribute('aria-checked', 'true');

  const enabledAudio = page.getByRole('switch', { name: 'Disable audio' });
  await expect(enabledAudio).toHaveAttribute('aria-checked', 'true');
  await enabledAudio.click();

  const disabledAudio = page.getByRole('switch', { name: 'Enable audio' });
  await expect(disabledAudio).toHaveAttribute('aria-checked', 'false');

  const standardPlaybackRate = page.getByLabel('Set audio playback rate to 1.0x');
  const fastPlaybackRate = page.getByLabel('Set audio playback rate to 1.25x');
  await fastPlaybackRate.click();
  await expect(fastPlaybackRate).toHaveAttribute('aria-checked', 'true');
  await expect(standardPlaybackRate).toHaveAttribute('aria-checked', 'false');
  await fastPlaybackRate.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(standardPlaybackRate).toHaveAttribute('aria-checked', 'true');
  await standardPlaybackRate.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByLabel('Set audio playback rate to 0.75x')).toHaveAttribute(
    'aria-checked',
    'true',
  );

  await page.reload({ waitUntil: 'networkidle' });

  await expect(page.getByLabel('Set study language to English support')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByLabel('Set daily goal to 20 answers')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('switch', { name: 'Enable audio' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expect(page.getByLabel('Set audio playback rate to 0.75x')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByLabel('Choose theme: Dark')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radiogroup', { name: 'Choose study companion' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: /Dala horse is selected as study companion\. Folk symbol from Dalarna\./,
    }),
  ).toHaveAttribute('aria-checked', 'true');

  expect(consoleErrors).toEqual([]);
});
