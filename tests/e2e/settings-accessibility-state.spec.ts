import { expect, test, type Locator } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

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
