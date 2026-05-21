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

  const darkTheme = page.getByRole('button', { name: 'Choose theme: Dark' });
  await darkTheme.click();
  await expect(darkTheme).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Choose theme: Use system' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await expect(page.getByRole('heading', { name: 'Settings' })).toHaveCSS(
    'color',
    'rgb(245, 247, 250)',
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
  await expect(page.getByRole('button', { name: 'Choose theme: Dark' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(
    page.getByRole('heading', {
      name: 'Prepare calmly, one civic concept at a time',
    }),
  ).toHaveCSS('color', 'rgb(245, 247, 250)');

  expect(consoleErrors).toEqual([]);
});
