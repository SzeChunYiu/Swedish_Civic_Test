import { expect, test, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;

        return (
          document.documentElement.scrollWidth <= viewportWidth + 1 &&
          document.body.scrollWidth <= viewportWidth + 1
        );
      }),
    )
    .toBe(true);
}

test('optional sign-in route degrades to anonymous study when Supabase env is absent', async ({
  page,
}) => {
  const errors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/(auth)/sign-in', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(
    page.getByRole('heading', { name: 'Sign in or keep studying locally' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
  await expect(page.getByText('Account sign-in is not configured for this build')).toBeVisible();

  await page.getByRole('button', { name: 'Continue without an account' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Prepare calmly|Studera lugnt/i })).toBeVisible();

  expect(errors.get().filter((message) => !message.includes('[auth]'))).toEqual([]);
});

test('onboarding exposes account choices while keeping anonymous start available', async ({
  page,
}) => {
  const errors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/onboarding', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Choose how to start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
  const anonymousLink = page.getByRole('link', {
    name: 'Continue to home without an account',
  });
  await expect(anonymousLink).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await anonymousLink.click();
  await expect(page).toHaveURL(/\/home$/);

  expect(errors.get().filter((message) => !message.includes('[auth]'))).toEqual([]);
});

test('account route never requires sign-in for anonymous learners', async ({ page }) => {
  const errors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');
  await page.goto('/account', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expect(page.getByRole('heading', { name: 'Account is optional' })).toBeVisible();
  await expect(
    page.getByText(/study bank, track local progress, and keep purchases/i),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Continue to home without an account' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open sign-in' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  expect(errors.get().filter((message) => !message.includes('[auth]'))).toEqual([]);
});

test('invalid referral deep links do not persist pending codes or offer sign-in continuation', async ({
  page,
}) => {
  const errors = collectConsoleAndPageErrors(page);
  const invalidPaths = ['/r/', '/r/abc', '/r/!!!!', '/r/__proto__'];

  await seedFreshSettingsLanguageAndAboutSeen(page, 'en');

  for (const invalidPath of invalidPaths) {
    await page.goto(invalidPath, { waitUntil: 'networkidle' });
    await dismissBlockingModals(page);

    await expect(page.getByRole('heading', { name: 'Invite link unavailable' })).toBeVisible();
    await expect(page.getByText('No invite code was saved')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue to sign-in' })).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Continue studying without an account' }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('referral.pendingCode.v1')))
      .toBeNull();
    await expectNoHorizontalOverflow(page);
  }

  await page.getByRole('link', { name: 'Continue studying without an account' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Prepare calmly|Studera lugnt/i })).toBeVisible();

  expect(errors.get().filter((message) => !message.includes('[auth]'))).toEqual([]);
});
