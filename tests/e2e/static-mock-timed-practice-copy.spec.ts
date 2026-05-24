import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const siteRoot = path.resolve('site');

const contentTypeByExtension: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

type StaticSite = {
  baseUrl: string;
  close: () => Promise<void>;
};

type Language = 'en' | 'sv';
type ThemePreference = 'auto' | 'dark';

type MockCopyContract = {
  answeredDotLabel: string;
  complete: string;
  currentDotLabel: string;
  disclaimer: string;
  landingRequired: RegExp[];
  language: Language;
  negative: RegExp;
  nextDotLabel: string;
  reviewHeading: string;
  scorePattern: RegExp;
  submit: string;
  unansweredDotLabel: string;
};

const copyContracts: readonly MockCopyContract[] = [
  {
    answeredDotLabel: 'Fråga 1 av 5, besvarad',
    complete: 'Övningspass klart.',
    currentDotLabel: 'Fråga 1 av 5, aktuell',
    disclaimer: 'Oberoende övning, inte ett riktigt prov eller en officiell UHR-fråga.',
    landingRequired: [
      /Tidsatt övning/,
      /Bygg ditt övningsprov/,
      /Välj din övningstid/,
      /Övningspoäng/,
      /% rätt/,
      /Ingen återkoppling/,
      /Starta övningsprov/,
    ],
    language: 'sv',
    negative:
      /(?:75\s*%|godkänd|underkänd|officiell(?:a)?\s+gräns|skarpt prov|tentamen|Klara provet|Få passet)/i,
    nextDotLabel: 'Fråga 2 av 5, aktuell',
    reviewHeading: 'Frågegenomgång',
    scorePattern: /\d+%\s+—\s+\d+\/5 rätt/,
    submit: 'Lämna in',
    unansweredDotLabel: 'Fråga 2 av 5, obesvarad',
  },
  {
    answeredDotLabel: 'Question 1 of 5, answered',
    complete: 'Practice round complete.',
    currentDotLabel: 'Question 1 of 5, current',
    disclaimer: 'Independent study practice, not a real exam or an official UHR question.',
    landingRequired: [
      /Timed practice/,
      /Build your practice round/,
      /Choose your practice time/,
      /Result/,
      /percent correct/,
      /Practice timer only/,
      /Start timed practice/,
    ],
    language: 'en',
    negative:
      /(?:75\s*%|official pass|pass threshold|pass line|pass\/fail|guaranteed pass|Earn the passport|Pass the test)/i,
    nextDotLabel: 'Question 2 of 5, current',
    reviewHeading: 'Question review',
    scorePattern: /\d+%\s+—\s+\d+\/5 correct/,
    submit: 'Submit',
    unansweredDotLabel: 'Question 2 of 5, unanswered',
  },
];

function sanitizedIndexHtml() {
  return fs
    .readFileSync(path.join(siteRoot, 'index.html'), 'utf8')
    .replace(/\s*<script[\s\S]*?src="https:\/\/unpkg\.com\/[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/\s*<script\s+type="text\/babel"\s+src="[^"]+"><\/script>\s*/g, '\n');
}

async function startStaticSiteServer(): Promise<StaticSite> {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^\.\.(?:\/|$)/, '');
    const requestedPath = path.join(siteRoot, safePath === '/' ? 'index.html' : safePath);
    const filePath =
      requestedPath.startsWith(siteRoot) &&
      fs.existsSync(requestedPath) &&
      fs.statSync(requestedPath).isFile()
        ? requestedPath
        : path.join(siteRoot, 'index.html');
    const extension = path.extname(filePath);

    response.writeHead(200, {
      'content-type': contentTypeByExtension[extension] ?? 'application/octet-stream',
    });
    response.end(
      filePath.endsWith('index.html') ? sanitizedIndexHtml() : fs.readFileSync(filePath),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Static site test server did not bind to a TCP port');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;

          return (
            document.documentElement.scrollWidth <= viewportWidth + 1 &&
            document.body.scrollWidth <= viewportWidth + 1
          );
        }),
      { message: `${label} should not overflow horizontally` },
    )
    .toBe(true);
}

async function openStaticMock(
  page: Page,
  baseUrl: string,
  language: Language,
  theme: ThemePreference = 'auto',
) {
  const allowedOrigin = new URL(baseUrl).origin;

  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.origin !== allowedOrigin) {
      await route.fulfill({ body: '', contentType: 'text/javascript; charset=utf-8', status: 200 });
      return;
    }

    await route.continue();
  });
  await page.addInitScript(
    ({ nextLanguage, nextTheme }: { nextLanguage: Language; nextTheme: ThemePreference }) => {
      localStorage.setItem('smt_ads_mode', 'none');
      localStorage.setItem('smt_buddy_hidden', '1');
      localStorage.setItem('smt_consent', 'min');
      localStorage.setItem('smt_lang', nextLanguage);
      localStorage.setItem(
        'smt_mock_cfg',
        JSON.stringify({ chapters: 'all', count: 5, minutes: 10 }),
      );
      localStorage.setItem('smt_motion', 'reduce');
      localStorage.setItem('smt_theme', nextTheme);
      sessionStorage.setItem('smt_anchor_closed', '1');
      sessionStorage.setItem('smt_buddy_greeted', '1');
    },
    { nextLanguage: language, nextTheme: theme },
  );

  await page.goto(`${baseUrl}/#/mock`, { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('#mock-stage')).toBeVisible();
}

async function expectFocusedMockDot(page: Page, label: string) {
  let focusedDotCount = 0;

  for (let attempts = 0; attempts < 24; attempts += 1) {
    await page.keyboard.press('Tab');
    focusedDotCount = await page.locator('#mock-stage .mock-dot:focus').count();
    if (focusedDotCount > 0) break;
  }

  expect(focusedDotCount, `${label} should be reachable by keyboard tabbing`).toBeGreaterThan(0);
  const dot = page.locator('#mock-stage .mock-dot:focus').first();
  await expect(dot).toBeFocused();

  const focusState = await dot.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      boxShadow: styles.boxShadow,
      height: rect.height,
      outlineStyle: styles.outlineStyle,
      outlineWidth: Number.parseFloat(styles.outlineWidth),
      visibleNumber: element.textContent?.trim()?.length ? true : false,
      width: rect.width,
    };
  });

  expect(focusState.visibleNumber, `${label} should keep a visible question number`).toBe(true);
  expect(focusState.width, `${label} should keep a 44px-wide target`).toBeGreaterThanOrEqual(44);
  expect(focusState.height, `${label} should keep a 44px-tall target`).toBeGreaterThanOrEqual(44);
  expect(focusState.outlineStyle, `${label} should show a visible focus outline`).toBe('solid');
  expect(
    focusState.outlineWidth,
    `${label} should use a strong focus outline`,
  ).toBeGreaterThanOrEqual(3);
  expect(focusState.boxShadow, `${label} should add a focus ring shadow`).not.toBe('none');
}

async function submitShortMockAttempt(page: Page, contract: MockCopyContract) {
  const stage = page.locator('#mock-stage');

  await page.locator('#cfg-start').click();
  await expect(page).toHaveURL(/#\/mock\?run=1$/);
  await expect(stage.getByRole('button', { name: contract.currentDotLabel })).toBeVisible();
  await expect(stage.getByRole('button', { name: contract.unansweredDotLabel })).toBeVisible();
  await expect(stage.getByRole('button', { name: /^Question 1$/ })).toHaveCount(0);

  await page.locator('#mock-stage .mock-opt').first().click();
  await page.locator('#mock-next').click();
  await expect(stage.getByRole('button', { name: contract.answeredDotLabel })).toBeVisible();
  await expect(stage.getByRole('button', { name: contract.nextDotLabel })).toBeVisible();

  for (let index = 1; index < 5; index += 1) {
    await page.locator('#mock-stage .mock-opt').first().click();
    if (index < 4) {
      await page.locator('#mock-next').click();
    }
  }

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: contract.submit }).click();
  await expect(page.locator('#mock-stage .mock-result')).toBeVisible();
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

for (const contract of copyContracts) {
  test(`static mock exam keeps neutral practice framing in ${contract.language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = collectPageErrors(page);
    const stage = page.locator('#mock-stage');

    await openStaticMock(page, staticSite.baseUrl, contract.language);
    for (const requiredCopy of contract.landingRequired) {
      await expect(stage).toContainText(requiredCopy);
    }
    await expect(stage).not.toContainText(contract.negative);
    await expectNoHorizontalOverflow(page, `${contract.language} mock landing`);

    await submitShortMockAttempt(page, contract);

    await expect(stage).toContainText(contract.complete);
    await expect(stage.locator('.mock-result__pct')).toContainText(contract.scorePattern);
    await expect(stage.getByRole('heading', { name: contract.reviewHeading })).toBeVisible();
    await expect(stage.locator('.result-chapters li').first()).toBeVisible();
    await expect(stage.locator('.mock-review__disclaimer').first()).toContainText(
      contract.disclaimer,
    );
    await expect(stage).not.toContainText(contract.negative);
    await expectNoHorizontalOverflow(page, `${contract.language} mock result`);

    expect(pageErrors).toEqual([]);
  });
}

for (const theme of ['auto', 'dark'] as const) {
  test(`static mock question navigation dots keep visible focus and target size in ${theme} theme`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = collectPageErrors(page);
    const stage = page.locator('#mock-stage');

    await openStaticMock(page, staticSite.baseUrl, 'en', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme-pref', theme);
    if (theme === 'dark') {
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }

    await page.locator('#cfg-start').click();
    await expect(page).toHaveURL(/#\/mock\?run=1$/);
    await expect(stage.getByRole('button', { name: copyContracts[1].currentDotLabel })).toHaveClass(
      /is-on/,
    );
    await expectFocusedMockDot(page, `${theme} current mock dot`);
    await expectNoHorizontalOverflow(page, `${theme} focused mock dot`);

    await page.locator('#mock-stage .mock-opt').first().click();
    await page.locator('#mock-next').click();
    await expect(
      stage.getByRole('button', { name: copyContracts[1].answeredDotLabel }),
    ).toHaveClass(/is-done/);
    await expectFocusedMockDot(page, `${theme} done mock dot`);
    await expectNoHorizontalOverflow(page, `${theme} focused done mock dot`);

    expect(pageErrors).toEqual([]);
  });
}
