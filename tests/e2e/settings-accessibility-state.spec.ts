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

test('settings controls expose selected and checked state on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page.getByLabel('Byt studiespråk till Engelskt stöd').click();
  const swedishLanguage = page.getByLabel('Set study language to Swedish');
  const englishLanguage = page.getByLabel('Set study language to English support');

  await expect(englishLanguage).toHaveAttribute('aria-checked', 'true');
  await expect(swedishLanguage).toHaveAttribute('aria-checked', 'false');

  const tenAnswers = page.getByLabel('Set daily goal to 10 answers');
  const twentyAnswers = page.getByLabel('Set daily goal to 20 answers');
  await twentyAnswers.click();

  await expect(twentyAnswers).toHaveAttribute('aria-checked', 'true');
  await expect(tenAnswers).toHaveAttribute('aria-checked', 'false');

  const systemTheme = page.getByLabel('Choose theme: Use system');
  const darkTheme = page.getByLabel('Choose theme: Dark');
  await darkTheme.click();

  await expect(darkTheme).toHaveAttribute('aria-checked', 'true');
  await expect(systemTheme).toHaveAttribute('aria-checked', 'false');

  await expect(
    page.getByRole('button', {
      name: /Cinnamon bun is selected as study companion\. Fika and everyday culture\./,
    }),
  ).toHaveAttribute('aria-selected', 'true');

  const cinnamonPreview = page.getByTestId('companion-preview-kanelbulle');
  await expect(cinnamonPreview).toBeVisible();
  await expect(cinnamonPreview).toHaveAttribute('aria-hidden', 'true');
  await expectPreviewAsset(cinnamonPreview, /kanelbulle.*idle.*svg/);

  const skoglimpaPreview = page.getByTestId('companion-preview-skoglimpa');
  await expect(skoglimpaPreview).toBeVisible();
  await expect(skoglimpaPreview).toHaveAttribute('aria-hidden', 'true');
  await expectPreviewAsset(skoglimpaPreview, /skoglimpa.*idle.*svg/);

  for (const preview of [cinnamonPreview, skoglimpaPreview]) {
    const box = await preview.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(48);
    expect(box!.height).toBeGreaterThanOrEqual(48);
  }

  await page
    .getByRole('button', {
      name: /Choose Dala horse as study companion\. Folk symbol from Dalarna\./,
    })
    .click();
  await expect(
    page.getByRole('button', {
      name: /Dala horse is selected as study companion\. Folk symbol from Dalarna\./,
    }),
  ).toHaveAttribute('aria-selected', 'true');

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
  await expect(
    page.getByRole('button', {
      name: /Dala horse is selected as study companion\. Folk symbol from Dalarna\./,
    }),
  ).toHaveAttribute('aria-selected', 'true');

  expect(consoleErrors).toEqual([]);
});
