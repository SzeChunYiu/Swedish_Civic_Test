import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  collectConsoleAndPageErrors,
  dismissBlockingModals,
  seedFreshSettingsLanguageAndAboutSeen,
} from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const minimumTargetSizePx = 44;

const homeActionLinks = [
  {
    expectedCount: 1,
    label: 'Starta ett tidsatt övningsprov från kortet Förberedelsesignal',
    name: 'preparation signal CTA',
  },
  {
    label: 'Starta den rekommenderade övningen',
    name: 'primary practice CTA',
  },
  {
    label: 'Bläddra bland alla samhällskapitel',
    name: 'secondary chapters CTA',
  },
  {
    expectedCount: 1,
    label: 'Starta ett tidsatt övningsprov från snabbåtgärderna',
    name: 'quick timed exam CTA',
  },
  {
    label: 'Granska bokmärkta eller missade frågor',
    name: 'feedback review CTA',
  },
  {
    label: 'Öppna framstegsöversikten',
    name: 'dashboard CTA',
  },
  {
    label: 'Öppna källor och transparens',
    name: 'source trust CTA',
  },
];

async function expectMinimumTargetSize(locator: Locator, name: string): Promise<void> {
  const count = await locator.count();
  expect(count, `${name} should render at least one matching link`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();

    expect(box, `${name} #${index + 1} should have a rendered target box`).not.toBeNull();
    expect(box!.width, `${name} #${index + 1} target width`).toBeGreaterThanOrEqual(
      minimumTargetSizePx,
    );
    expect(box!.height, `${name} #${index + 1} target height`).toBeGreaterThanOrEqual(
      minimumTargetSizePx,
    );
  }
}

async function getInteractionStyle(locator: Locator) {
  return locator.evaluate((node) => {
    const style = window.getComputedStyle(node);

    return {
      backgroundColor: style.backgroundColor,
      transform: style.transform,
    };
  });
}

async function getComputedInteractionStyle(locator: Locator) {
  return locator.evaluate((node) => {
    const style = window.getComputedStyle(node);

    return {
      backgroundColor: style.backgroundColor,
      transform: style.transform,
    };
  });
}

async function expectSecondaryKeyboardPressedFeedback({
  activationKey,
  expectedPath,
  label,
  page,
}: {
  activationKey: 'Enter' | 'Space';
  expectedPath: RegExp;
  label: string;
  page: Page;
}): Promise<void> {
  const link = page.getByRole('link', { exact: true, name: label }).first();
  await expectMinimumTargetSize(link, `${label} keyboard target`);
  await link.focus();

  const focusStyle = await getInteractionStyle(link);
  expect(focusStyle.backgroundColor, `${label} should expose focus feedback`).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
  expect(focusStyle.transform, `${label} should expose focus transform`).not.toBe('none');

  await page.keyboard.down(activationKey);
  const pressedStyle = await getInteractionStyle(link);
  expect(pressedStyle.backgroundColor, `${label} pressed background`).toBe(
    focusStyle.backgroundColor,
  );
  expect(pressedStyle.transform, `${label} pressed transform`).not.toBe(focusStyle.transform);
  expect(pressedStyle.transform, `${label} pressed transform`).not.toBe('none');
  await expect(page, `${label} should not navigate before key release`).toHaveURL(/\/home$/);

  await page.keyboard.up(activationKey);
  await expect(page).toHaveURL(expectedPath);
}

test('Home action links keep mobile-safe targets', async ({ page }) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  for (const link of homeActionLinks) {
    const matchingLinks = page.getByRole('link', { exact: true, name: link.label });
    const matchingLinkCount = await matchingLinks.count();

    if ('expectedCount' in link) {
      expect(matchingLinkCount, `${link.name} should render exactly once`).toBe(link.expectedCount);
    } else {
      expect(
        matchingLinkCount,
        `${link.name} should render at least one matching link`,
      ).toBeGreaterThan(0);
    }

    for (let index = 0; index < matchingLinkCount; index += 1) {
      await expectMinimumTargetSize(matchingLinks.nth(index), `${link.name} ${index + 1}`);
    }
  }

  const primaryPracticeLink = page.getByRole('link', {
    exact: true,
    name: 'Starta den rekommenderade övningen',
  });
  const idleStyle = await getComputedInteractionStyle(primaryPracticeLink);

  await primaryPracticeLink.focus();
  const focusStyle = await getComputedInteractionStyle(primaryPracticeLink);
  expect(focusStyle.backgroundColor).not.toBe(idleStyle.backgroundColor);
  expect(focusStyle.transform).not.toBe('none');

  await page.keyboard.down('Space');
  const keyboardPressedStyle = await getComputedInteractionStyle(primaryPracticeLink);
  expect(keyboardPressedStyle.backgroundColor).toBe(focusStyle.backgroundColor);
  expect(keyboardPressedStyle.transform).not.toBe(focusStyle.transform);
  expect(keyboardPressedStyle.transform).not.toBe('none');
  await expect(page, 'primary practice Space should not navigate before release').toHaveURL(
    /\/home$/,
  );

  await page.keyboard.up('Space');
  await expect(page).toHaveURL(/\/practice$/);

  expect(consoleErrors.get()).toEqual([]);
});

test('Home action links expose secondary keyboard pressed feedback before navigation', async ({
  page,
}) => {
  const consoleErrors = collectConsoleAndPageErrors(page);

  await seedFreshSettingsLanguageAndAboutSeen(page, 'sv');
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectSecondaryKeyboardPressedFeedback({
    activationKey: 'Space',
    expectedPath: /\/learn$/,
    label: 'Bläddra bland alla samhällskapitel',
    page,
  });

  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  await expectSecondaryKeyboardPressedFeedback({
    activationKey: 'Enter',
    expectedPath: /\/learn$/,
    label: 'Bläddra bland alla samhällskapitel',
    page,
  });

  expect(consoleErrors.get()).toEqual([]);
});
