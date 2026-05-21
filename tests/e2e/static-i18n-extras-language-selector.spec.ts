import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

declare global {
  interface Window {
    i18n?: Record<string, Record<string, string>>;
  }
}

const siteRoot = path.resolve('site');
const extraLocales = [
  'zh-Hans',
  'zh-Hant',
  'ar',
  'ckb',
  'fa',
  'pl',
  'so',
  'ti',
  'tr',
  'uk',
] as const;

type ExtraLocale = (typeof extraLocales)[number];

const contentTypeByExtension: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const forbiddenOutcomeSlogans = [
  /pass the test/i,
  /passed the test/i,
  /get (?:a|the|your) passport/i,
  /earn (?:a|the|your) passport/i,
  /klarar provet/i,
  /få passet/i,
  /skaffa passet/i,
  /通过测试/,
  /拿到护照/,
  /通過測試/,
  /拿到護照/,
  /اجتز الاختبار/,
  /احصل على الجواز/,
  /imtixaanka uga gud/i,
  /hel baasaboorka/i,
  /sınavı geç/i,
  /pasaportu al/i,
  /آزمون را قبول شوید/i,
  /گذرنامه بگیرید/i,
  /zdasz egzamin/i,
  /dostaniesz paszport/i,
  /ፓስፖርት ትወስድ/,
  /ዜግነት ትረክብ/,
  /складете іспит/i,
  /отримаєте паспорт/i,
  /پاسپۆرت دەست دەکەوێت/,
  /هاووڵاتیبوون دەست دەکەوێت/,
];
const forbiddenHomeChapterTwoCivicTerms =
  /(^|[^\p{L}\p{N}_-])(kommun|region|regering)(?=$|[^\p{L}\p{N}_-])/iu;
const forbiddenBareHomeChapterOneFolkhemmet = /[←→]\s*folkhemmet\s*(?:[←→.]|$)/i;
const localizedHomeChapterOneFolkhemmetTerms: Record<ExtraLocale, RegExp> = {
  'zh-Hans': /人民之家/,
  'zh-Hant': /人民之家/,
  ar: /بيت الشعب/,
  ckb: /ماڵی گەل/,
  fa: /خانه‌ی مردم/,
  pl: /dom ludu/i,
  so: /guriga dadka/i,
  ti: /ቤት ህዝቢ/,
  tr: /halkın evi/i,
  uk: /народний дім/i,
};
const localizedHomeChapterTwoCivicTermSnippets: Record<ExtraLocale, RegExp> = {
  'zh-Hans': /市镇、大区/,
  'zh-Hant': /市鎮、大區/,
  ar: /البلديات، والمناطق/,
  ckb: /شارەوانییەکان، هەرێمەکان/,
  fa: /شهرداری‌ها، منطقه‌ها/,
  pl: /gminy i regiony/,
  so: /degmooyinka iyo gobollada/,
  ti: /ናይ ከባቢ ምምሕዳራት፡ ክልላት/,
  tr: /belediyeler ve bölgeler/,
  uk: /муніципалітети й регіони/,
};

type StaticSite = {
  baseUrl: string;
  close: () => Promise<void>;
};

function sanitizedIndexHtml() {
  return fs
    .readFileSync(path.join(siteRoot, 'index.html'), 'utf8')
    .replace(/\s*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.[^>]+>\s*/g, '\n')
    .replace(
      /\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]+rel="stylesheet"\s*\/>\s*/g,
      '\n',
    )
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

function i18nSelector(key: string) {
  return `[data-i18n="${key}"]`;
}

async function dictionaryText(page: Page, locale: ExtraLocale, key: string) {
  const value = await page.evaluate(
    ({ key: lookupKey, locale: lookupLocale }) => {
      const table = window.i18n?.[lookupLocale];
      return typeof table?.[lookupKey] === 'string' ? table[lookupKey] : null;
    },
    { key, locale },
  );

  if (!value) throw new Error(`Missing ${locale}.${key} in site/i18n-extras.js`);
  return value;
}

async function expectDictionaryText(
  page: Page,
  locale: ExtraLocale,
  key: string,
  selector = i18nSelector(key),
) {
  await expect(page.locator(selector).first()).toHaveText(await dictionaryText(page, locale, key));
}

async function expectRootLocale(page: Page, locale: ExtraLocale) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        dir: document.documentElement.getAttribute('dir'),
        lang: document.documentElement.getAttribute('lang'),
        stored: window.localStorage.getItem('smt_lang'),
      })),
    )
    .toEqual({
      dir: locale === 'ar' || locale === 'ckb' || locale === 'fa' ? 'rtl' : 'ltr',
      lang: locale,
      stored: locale,
    });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNoOutcomeSlogans(page: Page) {
  const visibleText = await page.locator('body').innerText();

  for (const pattern of forbiddenOutcomeSlogans) {
    expect(visibleText).not.toMatch(pattern);
  }
}

async function openStaticHome(page: Page, baseUrl: string) {
  await page.addInitScript(() => {
    Math.random = () => 0.9;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smt_buddy_hidden', '1');
    window.localStorage.setItem('smt_lang', 'en');
    window.sessionStorage.setItem('smt_buddy_greeted', '1');
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await expect(page.locator('#settings-open')).toBeVisible();
  await expect(page.locator('#consent')).toBeVisible();
}

async function switchToPrivacyRoute(page: Page) {
  await page.evaluate(() => {
    window.location.hash = '#/privacy';
  });
  await expect(page.locator('[data-page="/privacy"]')).toHaveClass(/is-active/);
}

async function switchToTermsRoute(page: Page) {
  await page.evaluate(() => {
    window.location.hash = '#/terms';
  });
  await expect(page.locator('[data-page="/terms"]')).toHaveClass(/is-active/);
}

async function switchToHomeRoute(page: Page) {
  await page.evaluate(() => {
    window.location.hash = '#/';
  });
  await expect(page.locator('[data-page="/"]')).toHaveClass(/is-active/);
}

async function expectLegalReadingTime(page: Page, locale: ExtraLocale, key: string) {
  const value = await dictionaryText(page, locale, key);

  await expect(page.locator(i18nSelector(key))).toHaveText(value);
  if (locale === 'ckb') {
    expect(value).toMatch(/خولەک/);
    expect(value).not.toMatch(/\bmin\b/i);
  }
}

async function assertLongFormRouteCopy(page: Page, locale: ExtraLocale) {
  await switchToPrivacyRoute(page);
  await expectDictionaryText(page, locale, 'privacy.kicker');
  await expect(page.locator(i18nSelector('privacy.lede'))).toContainText(
    await dictionaryText(page, locale, 'privacy.lede'),
  );
  await expectLegalReadingTime(page, locale, 'privacy.meta3.v');
  await switchToTermsRoute(page);
  await expectDictionaryText(page, locale, 'terms.kicker');
  await expect(page.locator(i18nSelector('terms.lede'))).toContainText(
    await dictionaryText(page, locale, 'terms.lede'),
  );
  await expectLegalReadingTime(page, locale, 'terms.meta3.v');
  await switchToHomeRoute(page);
}

async function assertHomeChapterOneFolkhemmetGlossary(page: Page, locale: ExtraLocale) {
  const dictionaryDescription = await dictionaryText(page, locale, 'chap.1.d');
  const localizedIndex = dictionaryDescription.search(
    localizedHomeChapterOneFolkhemmetTerms[locale],
  );
  const glossaryIndex = dictionaryDescription.toLowerCase().indexOf('folkhemmet');

  expect(localizedIndex).toBeGreaterThanOrEqual(0);
  expect(glossaryIndex).toBeGreaterThanOrEqual(0);
  expect(localizedIndex).toBeLessThan(glossaryIndex);
  expect(dictionaryDescription).not.toMatch(forbiddenBareHomeChapterOneFolkhemmet);
}

async function assertHomeChapterTwoCivicTerms(page: Page, locale: ExtraLocale) {
  const expectedDescription = await dictionaryText(page, locale, 'chap.2.d');
  const chapterDescription = page.locator(i18nSelector('chap.2.d'));

  await expect(chapterDescription).toBeVisible();
  await expect(chapterDescription).toHaveText(expectedDescription);
  expect(await chapterDescription.innerText()).toMatch(
    localizedHomeChapterTwoCivicTermSnippets[locale],
  );
  expect(await chapterDescription.innerText()).not.toMatch(forbiddenHomeChapterTwoCivicTerms);
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

test('static Settings selects extra languages with localized legal metadata without overflow or outcome slogans', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  for (const locale of extraLocales) {
    await page.locator('#settings-open').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page
      .locator(`#settings-modal [data-set="language"] button[data-val="${locale}"]`)
      .click();

    await expectRootLocale(page, locale);
    await expectDictionaryText(page, locale, 'settings.title', '#settings-title');
    await expectDictionaryText(page, locale, 'settings.done');
    await expectNoHorizontalOverflow(page);

    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await page.locator('#nav-toggle').click();
    await expect(page.locator('#primary-nav')).toBeVisible();
    await expectDictionaryText(page, locale, 'nav.home', '#primary-nav [data-i18n="nav.home"]');
    await expectNoHorizontalOverflow(page);
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#primary-nav')).toBeHidden();

    await expectDictionaryText(page, locale, 'hero.eyebrow');
    await expectDictionaryText(page, locale, 'hero.cta1');
    await expectDictionaryText(page, locale, 'consent.title');
    await expectDictionaryText(page, locale, 'consent.min');
    await expectDictionaryText(page, locale, 'footer.t1');
    expect(await dictionaryText(page, locale, 'footer.app.5')).not.toMatch(/Roadmap/i);
    await expectDictionaryText(page, locale, 'footer.honest.p');
    await assertLongFormRouteCopy(page, locale);
    await expectRootLocale(page, locale);
    await expectNoOutcomeSlogans(page);
    await expectNoHorizontalOverflow(page);
  }

  expect(pageErrors).toEqual([]);
});

test('static Home chapter 1 folkhemmet glossary keeps localized term before Swedish glossary', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  for (const locale of extraLocales) {
    await page.locator('#settings-open').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page
      .locator(`#settings-modal [data-set="language"] button[data-val="${locale}"]`)
      .click();
    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await expectRootLocale(page, locale);
    await assertHomeChapterOneFolkhemmetGlossary(page, locale);
    await expect(page.locator('.list-quiet > li')).toHaveCount(13);
  }

  expect(pageErrors).toEqual([]);
});

test('static Home chapter 2 civic terms render localized card descriptions without kommun region regering', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  for (const locale of extraLocales) {
    await page.locator('#settings-open').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page
      .locator(`#settings-modal [data-set="language"] button[data-val="${locale}"]`)
      .click();
    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await expectRootLocale(page, locale);
    await assertHomeChapterTwoCivicTerms(page, locale);
    await expect(page.locator('.list-quiet > li')).toHaveCount(13);
  }

  expect(pageErrors).toEqual([]);
});
