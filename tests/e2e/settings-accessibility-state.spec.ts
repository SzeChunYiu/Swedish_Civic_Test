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

type SettingsScrollReachabilityScenario = {
  complianceHeading: string;
  complianceLinkName: string | RegExp;
  focusCue?: string;
  importHeading: string;
  importInputName: string;
  language: 'en' | 'sv';
  path: string;
  previewImportName: string;
  resetImportName: string;
  studyControlsName: string;
  title: string;
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

async function expectNoDocumentHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      bodyScrollWidth: body.scrollWidth,
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(
    metrics.rootScrollWidth,
    `${label} root scroll width ${JSON.stringify(metrics)}`,
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(
    metrics.bodyScrollWidth,
    `${label} body scroll width ${JSON.stringify(metrics)}`,
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(
    metrics.rootClientWidth,
    `${label} root client width ${JSON.stringify(metrics)}`,
  ).toBeLessThanOrEqual(metrics.viewportWidth);
}

async function expectWithinViewport(locator: Locator, label: string) {
  const [box, viewport] = await Promise.all([
    locator.boundingBox(),
    locator.page().evaluate(() => ({
      height: window.innerHeight,
      width: window.innerWidth,
    })),
  ]);

  expect(box, `${label} should have a visible bounding box`).not.toBeNull();
  if (!box) return;

  expect(box.x, `${label} left edge`).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, `${label} right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y, `${label} top edge`).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height, `${label} bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
}

const settingsScrollReachabilityScenarios: SettingsScrollReachabilityScenario[] = [
  {
    complianceHeading: 'Juridik och källor',
    complianceLinkName: 'Öppna Källor',
    focusCue: 'Studieinställningarna från profilen är markerade här.',
    importHeading: 'Importera studiedata',
    importInputName: 'Klistra in JSON-export',
    language: 'sv',
    path: '/settings?focus=study',
    previewImportName: 'Förhandsgranska lokal studiedataimport',
    resetImportName: 'Återställ importfält',
    studyControlsName: 'Dagligt mål, språk och ljud',
    title: 'Inställningar',
  },
  {
    complianceHeading: 'Legal and sources',
    complianceLinkName: 'Open Sources',
    importHeading: 'Import study data',
    importInputName: 'Paste JSON export',
    language: 'en',
    path: '/settings',
    previewImportName: 'Preview local study data import',
    resetImportName: 'Reset import field',
    studyControlsName: 'Daily goal, language, and audio',
    title: 'Settings',
  },
];

for (const scenario of settingsScrollReachabilityScenarios) {
  test(`settings mobile scroll reaches lower controls in ${scenario.language}`, async ({
    page,
  }) => {
    const browserErrors = collectConsoleAndPageErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await seedFreshSettingsLanguageAndAboutSeen(page, scenario.language);

    await page.goto(scenario.path, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: scenario.title })).toBeVisible();
    const studyControls = page.getByLabel(scenario.studyControlsName);
    await expect(studyControls).toBeVisible();
    await expectWithinViewport(studyControls, `${scenario.language} study controls`);
    if (scenario.focusCue) {
      await expect(page.getByText(scenario.focusCue)).toBeVisible();
    }
    await expectNoDocumentHorizontalOverflow(page, `${scenario.language} settings top`);

    const importHeading = page.getByRole('heading', { name: scenario.importHeading });
    await importHeading.scrollIntoViewIfNeeded();
    await expect(importHeading).toBeVisible();
    await expect(page.getByLabel(scenario.importInputName)).toBeVisible();
    await expect(page.getByRole('button', { name: scenario.previewImportName })).toBeVisible();
    await expect(page.getByRole('button', { name: scenario.resetImportName })).toBeVisible();
    await expectWithinViewport(importHeading, `${scenario.language} import heading`);
    await expectNoDocumentHorizontalOverflow(page, `${scenario.language} settings import`);

    const complianceHeading = page.getByRole('heading', { name: scenario.complianceHeading });
    await complianceHeading.scrollIntoViewIfNeeded();
    await expect(complianceHeading).toBeVisible();
    const complianceLink = page.getByRole('link', { name: scenario.complianceLinkName });
    await expect(complianceLink).toBeVisible();
    await expectWithinViewport(complianceLink, `${scenario.language} compliance source link`);
    await expectNoDocumentHorizontalOverflow(page, `${scenario.language} settings footer`);

    expect(browserErrors.get()).toEqual([]);
  });
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

test('settings controls expose selected state and radio arrow keyboard navigation on web', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

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
  await expect(page.getByLabel('Choose theme: Dark')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radiogroup', { name: 'Choose study companion' })).toBeVisible();
  await expect(
    page.getByRole('radio', {
      name: /Dala horse is selected as study companion\. Folk symbol from Dalarna\./,
    }),
  ).toHaveAttribute('aria-checked', 'true');

  expect(consoleErrors).toEqual([]);
});
