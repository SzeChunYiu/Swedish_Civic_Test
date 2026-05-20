import { expect, test, type Locator, type Page } from '@playwright/test';

import { dismissBlockingModals } from './browserLaunch';

test.use({ viewport: { width: 390, height: 844 } });

const minimumTargetSizePx = 44;

const homeActionLinks = [
  {
    label: 'Starta ett mockprov för att kontrollera din redoindikator',
    name: 'readiness CTA',
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
    label: 'Granska bokmärkta eller missade frågor',
    name: 'feedback review CTA',
  },
];

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function expectMinimumTargetSize(locator: Locator, name: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${name} should have a rendered target box`).not.toBeNull();
  expect(box!.width, `${name} target width`).toBeGreaterThanOrEqual(minimumTargetSizePx);
  expect(box!.height, `${name} target height`).toBeGreaterThanOrEqual(minimumTargetSizePx);
}

async function seedHomeDefaults(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('settings\\language', 'sv');
    window.localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
  });
}

test('Home action links keep mobile-safe targets', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await seedHomeDefaults(page);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);

  for (const link of homeActionLinks) {
    await expectMinimumTargetSize(
      page.getByRole('link', { exact: true, name: link.label }),
      link.name,
    );
  }

  expect(consoleErrors).toEqual([]);
});
