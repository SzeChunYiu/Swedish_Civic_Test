import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

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

  const enabledAudio = page.getByRole('switch', { name: 'Disable audio' });
  await expect(enabledAudio).toHaveAttribute('aria-checked', 'true');
  await enabledAudio.click();

  const disabledAudio = page.getByRole('switch', { name: 'Enable audio' });
  await expect(disabledAudio).toHaveAttribute('aria-checked', 'false');

  const easyReadOff = page.getByRole('switch', { name: 'Enable easy-read font' });
  await expect(easyReadOff).toHaveAttribute('aria-checked', 'false');
  await easyReadOff.click();
  await expect(page.getByRole('switch', { name: 'Disable easy-read font' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  const largeText = page.getByLabel('Choose text size: Large');
  const standardText = page.getByLabel('Choose text size: Standard');
  await largeText.click();
  await expect(largeText).toHaveAttribute('aria-checked', 'true');
  await expect(standardText).toHaveAttribute('aria-checked', 'false');

  const slowSpeech = page.getByLabel('Choose Swedish speech speed: Slow');
  const normalSpeech = page.getByLabel('Choose Swedish speech speed: Normal');
  await slowSpeech.click();
  await expect(slowSpeech).toHaveAttribute('aria-checked', 'true');
  await expect(normalSpeech).toHaveAttribute('aria-checked', 'false');

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
  await expect(page.getByRole('switch', { name: 'Disable easy-read font' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByLabel('Choose text size: Large')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('Choose Swedish speech speed: Slow')).toHaveAttribute(
    'aria-checked',
    'true',
  );

  expect(consoleErrors).toEqual([]);
});
