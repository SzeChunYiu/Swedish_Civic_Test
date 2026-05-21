import { expect, type Locator, test } from '@playwright/test';

import { dismissBlockingModals, markAboutTheTestSeen, seedSettingsLanguage } from './browserLaunch';

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(Math.floor(box?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.floor(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
}

test('Practice bookmark, supplementary, and About sources controls expose aria state and 44px targets on web', async ({
  page,
}) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await seedSettingsLanguage(page, 'en');
  await markAboutTheTestSeen(page);

  await page.goto('/practice', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
  await expect(page.getByText('Question 1')).toBeVisible();

  await expectTouchTarget(page.getByRole('button', { name: 'Bookmark this question' }));

  const audioEnabled = page.getByRole('switch', { name: 'Audio enabled, tap to mute' });
  await expect(audioEnabled).toHaveAttribute('aria-checked', 'true');
  await audioEnabled.click();
  const audioMuted = page.getByRole('switch', { name: 'Audio muted, tap to enable' });
  await expect(audioMuted).toHaveAttribute('aria-checked', 'false');
  await audioMuted.click();
  await expect(page.getByRole('switch', { name: 'Audio enabled, tap to mute' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  const uhrOnly = page.getByRole('switch', { name: 'UHR questions only' });
  await expectTouchTarget(uhrOnly);
  await expect(uhrOnly).toHaveAttribute('aria-checked', 'false');
  await uhrOnly.click();
  const supplementary = page.getByRole('switch', { name: 'Include supplementary questions' });
  await expectTouchTarget(supplementary);
  await expect(supplementary).toHaveAttribute('aria-checked', 'true');
  await supplementary.click();
  await expect(page.getByRole('switch', { name: 'UHR questions only' })).toHaveAttribute(
    'aria-checked',
    'false',
  );

  const aboutSources = page.getByRole('button', { name: 'About the sources' });
  await expectTouchTarget(aboutSources);
  await expect(aboutSources).toHaveAttribute('aria-expanded', 'false');
  await aboutSources.click();
  const closeSources = page.getByRole('button', { name: 'Close source details' });
  await expectTouchTarget(closeSources);
  await expect(closeSources).toHaveAttribute('aria-expanded', 'true');
  await closeSources.click();
  await expect(page.getByRole('button', { name: 'About the sources' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  const provenance = page.getByRole('button', { name: /Provenance: UHR source\. Source note:/ });
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await provenance.focus();
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/^Source note:/)).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(provenance).toHaveAttribute('aria-expanded', 'false');
  await provenance.click();
  await expect(provenance).toHaveAttribute('aria-expanded', 'true');

  expect(consoleErrors).toEqual([]);
});
