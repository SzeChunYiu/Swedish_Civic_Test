import { expect, type Page, test } from '@playwright/test';

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  return consoleErrors;
}

async function clickIfVisible(page: Page, name: RegExp): Promise<boolean> {
  const control = page.getByRole('button', { name }).first();

  try {
    await control.waitFor({ state: 'visible', timeout: 1_500 });
  } catch {
    return false;
  }

  await control.click({ timeout: 5_000 });
  return true;
}

async function dismissBlockingModals(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const dismissed =
      (await clickIfVisible(page, /Close language picker|Stäng språkväljaren/)) ||
      (await clickIfVisible(page, /Close launch sponsor ad|Stäng startannons/)) ||
      (await clickIfVisible(page, /Skip the guide|Hoppa över guiden/));

    if (!dismissed) return;

    await page.waitForTimeout(250);
  }
}

async function readVisibleBody(page: Page): Promise<string> {
  return page.locator('body').innerText();
}

async function seedHomeLanguage(page: Page, language: 'sv' | 'en'): Promise<void> {
  if (page.url() === 'about:blank') {
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
  }

  await page.evaluate((selectedLanguage) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('language', selectedLanguage);
    localStorage.setItem('settings\\language', selectedLanguage);
    localStorage.setItem('settings\\hasSeenAboutTheTest', 'true');
  }, language);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissBlockingModals(page);
}

test('home study-loop copy renders without stale flashcard promises', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await seedHomeLanguage(page, 'sv');

  await expect(page.getByLabel('Tidsatt övning', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'Växla mellan tidsatta övningsprov, bokmärken, missade frågor, ljud och förberedelsesignal.',
    ),
  ).toBeVisible();

  let bodyText = await readVisibleBody(page);
  expect(bodyText).not.toMatch(
    /flashcards|Flashkort|flashkort|felspårning|mistake tracking|redoindikator|Provredo/i,
  );

  await seedHomeLanguage(page, 'en');

  await expect(page.getByLabel('Timed practice', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'Switch between timed practice exams, bookmarks, missed-question review, audio, and preparation signals.',
    ),
  ).toBeVisible();

  bodyText = await readVisibleBody(page);
  expect(bodyText).not.toMatch(
    /flashcards|Flashkort|flashkort|felspårning|mistake tracking|Exam readiness|readiness signals/i,
  );
  expect(consoleErrors).toEqual([]);
});
