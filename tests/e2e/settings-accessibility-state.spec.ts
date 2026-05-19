import { expect, test } from '@playwright/test';

test('settings controls expose selected and checked state on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  const closeLaunchSponsorAd = page.getByRole('button', {
    name: /Close launch sponsor ad|Stäng startannons/,
  });
  if (await closeLaunchSponsorAd.isVisible()) {
    await closeLaunchSponsorAd.click();
  }

  await page.getByLabel('Byt frågespråk till Engelskt stöd').click();
  const swedishLanguage = page.getByLabel('Set question language to Swedish');
  const englishLanguage = page.getByLabel('Set question language to English support');

  await expect(englishLanguage).toHaveAttribute('aria-selected', 'true');
  await expect(swedishLanguage).toHaveAttribute('aria-selected', 'false');

  const tenAnswers = page.getByLabel('Set daily goal to 10 answers');
  const twentyAnswers = page.getByLabel('Set daily goal to 20 answers');
  await twentyAnswers.click();

  await expect(twentyAnswers).toHaveAttribute('aria-selected', 'true');
  await expect(tenAnswers).toHaveAttribute('aria-selected', 'false');

  const enabledAudio = page.getByRole('switch', { name: 'Disable audio' });
  await expect(enabledAudio).toHaveAttribute('aria-checked', 'true');
  await enabledAudio.click();

  const disabledAudio = page.getByRole('switch', { name: 'Enable audio' });
  await expect(disabledAudio).toHaveAttribute('aria-checked', 'false');

  await page.reload({ waitUntil: 'networkidle' });

  await expect(page.getByLabel('Set question language to English support')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Set daily goal to 20 answers')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('switch', { name: 'Enable audio' })).toHaveAttribute(
    'aria-checked',
    'false',
  );

  expect(consoleErrors).toEqual([]);
});
