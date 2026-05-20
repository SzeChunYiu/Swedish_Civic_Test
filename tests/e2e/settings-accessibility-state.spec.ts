import { expect, test } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test('settings controls expose radiogroup and checked state on web', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/settings', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await page.getByRole('radio', { name: 'Byt frågespråk till Engelskt stöd' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Question language' })).toBeVisible();
  const swedishLanguage = page.getByRole('radio', { name: 'Set question language to Swedish' });
  const englishLanguage = page.getByRole('radio', {
    name: 'Set question language to English support',
  });

  await expect(englishLanguage).toHaveAttribute('aria-checked', 'true');
  await expect(swedishLanguage).toHaveAttribute('aria-checked', 'false');

  await expect(page.getByRole('radiogroup', { name: 'Daily goal' })).toBeVisible();
  const tenAnswers = page.getByRole('radio', { name: 'Set daily goal to 10 answers' });
  const twentyAnswers = page.getByRole('radio', { name: 'Set daily goal to 20 answers' });
  await twentyAnswers.click();

  await expect(twentyAnswers).toHaveAttribute('aria-checked', 'true');
  await expect(tenAnswers).toHaveAttribute('aria-checked', 'false');

  const enabledAudio = page.getByRole('switch', { name: 'Disable audio' });
  await expect(enabledAudio).toHaveAttribute('aria-checked', 'true');
  await enabledAudio.click();

  const disabledAudio = page.getByRole('switch', { name: 'Enable audio' });
  await expect(disabledAudio).toHaveAttribute('aria-checked', 'false');

  await page.reload({ waitUntil: 'networkidle' });

  await expect(
    page.getByRole('radio', { name: 'Set question language to English support' }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Set daily goal to 20 answers' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('switch', { name: 'Enable audio' })).toHaveAttribute(
    'aria-checked',
    'false',
  );

  expect(consoleErrors).toEqual([]);
});
