import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

declare global {
  interface Window {
    i18n?: Record<string, Record<string, string>>;
    smtSetLanguage?: (lang: string) => void;
    SMT_QUESTIONS?: Array<{
      id?: string;
      chapterId?: number;
      q?: Record<string, string>;
      why?: Record<string, string>;
      opts?: Array<Record<string, string>>;
      answer?: number;
      source?: {
        title?: string;
        chapter?: string;
        section?: string;
        page?: number;
      };
    }>;
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
const purchaseSurfaceLocales = [
  'ckb',
  'fa',
  'so',
  'ti',
  'tr',
] as const satisfies readonly ExtraLocale[];

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
const sourceRouteCopyKeys = [
  'sources.lede',
  'sources.meta3.v',
  'sources.s1.li2',
  'sources.s1.li3',
] as const;
const staleExtraSourceFragments: Record<ExtraLocale, readonly string[]> = {
  'zh-Hans': ['今天的题库仅来自 UHR', '不会列出其他来源系列'],
  'zh-Hant': ['目前題庫僅採用 UHR', '不會列出其他來源類別'],
  ar: ['يعتمد البنك اليوم على UHR فقط', 'ولا ندرج عائلات مصادر أخرى'],
  ckb: ['بانکەکە ئەمڕۆ تەنها UHRـە', 'خێزانە سەرچاوەکانی تر ناخەینە لیستەوە'],
  fa: ['بانک امروز تنها UHR است', 'خانواده‌های منبع دیگر را فهرست نمی‌کنیم'],
  pl: ['Baza opiera się dziś wyłącznie na UHR', 'Nie wymieniamy innych rodzin źródeł'],
  so: ['Bangigu maanta waa UHR-kaliya', 'Ma liiseyno qoysaska kale ee ilaha'],
  ti: ['እታ ባንኪ ሎሚ UHR-only እያ', 'ካልኦት ስድራቤታት ምንጪ ኣይንዝርዝርን'],
  tr: ["Banka bugün yalnızca UHR'ye dayanıyor", 'başka kaynak ailelerini listelemeyiz'],
  uk: ['Сьогодні банк лише на основі UHR', 'Ми не перелічуємо інші родини джерел'],
};
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
const chapterThreeFundamentalLawLocales = ['ar', 'ckb', 'so', 'ti', 'tr', 'uk'] as const;
const localizedHomeChapterThreeFundamentalLawSnippets: Record<
  (typeof chapterThreeFundamentalLawLocales)[number],
  RegExp
> = {
  ar: /القوانين الأساسية\s*\(Grundlagarna\)/,
  ckb: /یاسا بنەڕەتییەکان\s*\(Grundlagarna\)/,
  so: /Shuruucda aasaasiga ah\s*\(Grundlagarna\)/i,
  ti: /መሰረታዊ ሕግታት\s*\(Grundlagarna\)/,
  tr: /Temel yasalar\s*\(Grundlagarna\)/i,
  uk: /Основні закони\s*\(Grundlagarna\)/i,
};
const localizedHomeChapterElevenCitizenshipSnippets: Record<ExtraLocale, RegExp> = {
  'zh-Hans': /公民身份（medborgarskap）/,
  'zh-Hant': /公民身分（medborgarskap）/,
  ar: /الجنسية\s*\(medborgarskap\)/,
  ckb: /هاووڵاتیبوون\s*\(medborgarskap\)/,
  fa: /شهروندی\s*\(medborgarskap\)/,
  pl: /obywatelstwem\s*\(medborgarskap\)/i,
  so: /jinsiyadda\s*\(medborgarskap\)/i,
  ti: /ዜግነት\s*\(medborgarskap\)/,
  tr: /vatandaşlık\s*\(medborgarskap\)/i,
  uk: /громадянством\s*\(medborgarskap\)/i,
};
const q050RenderedSourceCriticismLocales = ['zh-Hans', 'ar', 'pl', 'so', 'tr', 'uk'] as const;
type Q050RenderedSourceCriticismLocale = (typeof q050RenderedSourceCriticismLocales)[number];
const localizedQ050SourceCriticismTerms: Record<Q050RenderedSourceCriticismLocale, RegExp> = {
  'zh-Hans': /来源批判/,
  ar: /نقد المصادر/,
  pl: /krytyka źródeł/i,
  so: /qiimeynta ilaha/i,
  tr: /kaynak eleştirisi/i,
  uk: /критика джерел/i,
};
const forbiddenQ050SourceCriticismStaleTerms =
  /具有(?:來|来)源批判意識|أن تكون ناقدًا للمصادر|krytyczne podejście do źródeł|si naqdineed loo eego ilaha|kaynaklara eleştirel yaklaşmak|критично ставитися до джерел/i;

type StaticQ050RenderedCopy = {
  question: string;
  explanation: string;
  answer: number;
  chapterIndex: number;
  source: {
    title?: string;
    chapter?: string;
    section?: string;
    page?: number;
  };
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function plainDictionaryText(value: string) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

async function expectDictionaryRenderedText(
  page: Page,
  locale: ExtraLocale,
  key: string,
  selector = i18nSelector(key),
) {
  const expected = plainDictionaryText(await dictionaryText(page, locale, key));
  await expect(page.locator(selector).first()).toHaveText(expected);
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

async function switchStaticSiteLanguage(page: Page, locale: ExtraLocale) {
  await page.evaluate((nextLocale) => {
    if (typeof window.smtSetLanguage !== 'function') {
      throw new Error('window.smtSetLanguage is not available');
    }
    window.smtSetLanguage(nextLocale);
  }, locale);
  await expectRootLocale(page, locale);
}

async function staticQ050RenderedCopy(
  page: Page,
  locale: Q050RenderedSourceCriticismLocale,
): Promise<StaticQ050RenderedCopy> {
  return page.evaluate((nextLocale) => {
    const questions = window.SMT_QUESTIONS ?? [];
    const chapterQuestions = questions.filter((question) => question.chapterId === 6);
    const chapterIndex = chapterQuestions.findIndex((question) => question.id === 'q050');
    const question = chapterQuestions[chapterIndex];

    if (!question) throw new Error('q050 is missing from static chapter 6 practice questions');
    const renderedQuestion = question.q?.[nextLocale];
    const explanation = question.why?.[nextLocale];
    if (!renderedQuestion || !explanation || typeof question.answer !== 'number') {
      throw new Error(`q050 is missing rendered ${nextLocale} question, explanation, or answer`);
    }

    return {
      question: renderedQuestion,
      explanation,
      answer: question.answer,
      chapterIndex,
      source: question.source ?? {},
    };
  }, locale);
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

async function switchToSourcesRoute(page: Page) {
  await page.evaluate(() => {
    window.location.hash = '#/sources';
  });
  await expect(page.locator('[data-page="/sources"]')).toHaveClass(/is-active/);
}

async function switchToHomeRoute(page: Page) {
  await page.evaluate(() => {
    window.location.hash = '#/';
  });
  await expect(page.locator('[data-page="/"]')).toHaveClass(/is-active/);
}

async function switchToPracticeChapter(page: Page, chapter: number | 'mix') {
  await page.evaluate((nextHash) => {
    if (window.location.hash === nextHash) return Promise.resolve();
    return new Promise<void>((resolve) => {
      window.addEventListener('hashchange', () => resolve(), { once: true });
      window.location.hash = nextHash;
    });
  }, `#/practice?c=${chapter}`);
  await expect(page.locator('[data-page="/practice"]')).toHaveClass(/is-active/);
  await expect(page.locator('#quiz-stage .quiz__q')).toBeVisible();
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

async function assertSourcesRouteCopy(page: Page, locale: ExtraLocale, settingsSourceHint: string) {
  await switchToSourcesRoute(page);

  for (const key of sourceRouteCopyKeys) {
    await expectDictionaryRenderedText(page, locale, key);
  }

  const sourceRouteText = await page.locator('[data-page="/sources"]').innerText();
  const sourceCopySurface = `${sourceRouteText}\n${settingsSourceHint}`;
  const metaText = await page.locator(i18nSelector('sources.meta3.v')).innerText();

  expect(sourceRouteText).toContain('179');
  expect(sourceRouteText).toContain('716');
  expect(sourceRouteText).toMatch(/\bUHR\b/);
  expect(settingsSourceHint).toContain('179');
  expect(metaText.trim()).not.toBe('Sverige i fokus');
  expect(sourceCopySurface).not.toMatch(/169|۱۶۹/);

  for (const staleFragment of staleExtraSourceFragments[locale]) {
    expect(sourceCopySurface).not.toMatch(new RegExp(escapeRegExp(staleFragment)));
  }
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

async function assertHomeChapterThreeFundamentalLawTerms(
  page: Page,
  locale: (typeof chapterThreeFundamentalLawLocales)[number],
) {
  const expectedDescription = await dictionaryText(page, locale, 'chap.3.d');
  const chapterDescription = page.locator(i18nSelector('chap.3.d'));

  await expect(chapterDescription).toBeVisible();
  await expect(chapterDescription).toHaveText(expectedDescription);

  const text = await chapterDescription.innerText();
  expect(text).toMatch(localizedHomeChapterThreeFundamentalLawSnippets[locale]);
  expect(text.search(localizedHomeChapterThreeFundamentalLawSnippets[locale])).toBeLessThan(
    text.indexOf('Grundlagarna'),
  );
  expect(text).not.toMatch(/^Grundlagarna\b/);
}

async function assertHomeChapterElevenCitizenshipTerms(page: Page, locale: ExtraLocale) {
  const expectedDescription = await dictionaryText(page, locale, 'chap.11.d');
  const chapterDescription = page.locator(i18nSelector('chap.11.d'));

  await expect(chapterDescription).toBeVisible();
  await expect(chapterDescription).toHaveText(expectedDescription);

  const text = await chapterDescription.innerText();
  expect(text).toMatch(localizedHomeChapterElevenCitizenshipSnippets[locale]);
  expect(text).toMatch(/PUT/);
  expect(text).not.toMatch(/PUT[^.。؟]*,\s*medborgarskap|medborgarskap\s*[（(]/iu);

  const glossaryIndex = text.toLowerCase().indexOf('medborgarskap');
  expect(glossaryIndex).toBeGreaterThanOrEqual(0);
  expect(['(', '（']).toContain(text[glossaryIndex - 1]);
}

async function openRenderedQ050Practice(page: Page, locale: Q050RenderedSourceCriticismLocale) {
  await switchToHomeRoute(page);
  await switchStaticSiteLanguage(page, locale);
  const q050 = await staticQ050RenderedCopy(page, locale);

  await switchToPracticeChapter(page, 'mix');
  await switchToPracticeChapter(page, 6);
  await switchStaticSiteLanguage(page, locale);

  for (let skipped = 0; skipped < q050.chapterIndex; skipped += 1) {
    await page.locator('#quiz-skip').dispatchEvent('click');
    await switchStaticSiteLanguage(page, locale);
  }

  await expect(page.locator('#quiz-stage .quiz__q')).toHaveText(q050.question);
  return q050;
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

test('static Sources route renders extra-language UHR and Derived provenance copy', async ({
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
    await expectDictionaryRenderedText(page, locale, 'settings.sources.hint');
    const settingsSourceHint = await page
      .locator(i18nSelector('settings.sources.hint'))
      .innerText();

    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await assertSourcesRouteCopy(page, locale, settingsSourceHint);
    await expectRootLocale(page, locale);
    await expectNoHorizontalOverflow(page);
  }

  expect(pageErrors).toEqual([]);
});

test('static purchase gate uses localized extra-language copy and account interpolation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await page.addInitScript(() => {
    for (const key of ['SMT_SUPABASE_URL', 'SMT_SUPABASE_ANON_KEY'] as const) {
      Object.defineProperty(window, key, {
        configurable: true,
        get: () => '',
        set: () => undefined,
      });
    }
  });
  await openStaticHome(page, staticSite.baseUrl);

  await page.evaluate(() => {
    window.localStorage.setItem('smt_signed_in', '1');
    window.localStorage.setItem('smt_account_id', 'acct-extra-locale');
    window.localStorage.setItem('smt_account_email', 'learner@example.test');
    window.dispatchEvent(new Event('smt:authchange'));
  });

  for (const locale of purchaseSurfaceLocales) {
    await page.locator('#settings-open').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page
      .locator(`#settings-modal [data-set="language"] button[data-val="${locale}"]`)
      .click();
    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await expectRootLocale(page, locale);
    await expectDictionaryText(page, locale, 'purchase.h1a');
    await expectDictionaryText(page, locale, 'purchase.h1b');
    await expectDictionaryText(page, locale, 'purchase.removeAds.title');
    await expectDictionaryText(page, locale, 'purchase.premium.title');
    await expect(page.locator('[data-purchase-kind="remove_ads"]')).toHaveText(
      await dictionaryText(page, locale, 'purchase.removeAds.ready'),
    );
    await expect(page.locator('[data-purchase-kind="pro_lifetime"]')).toHaveText(
      await dictionaryText(page, locale, 'purchase.premium.ready'),
    );
    await expect(page.locator('#purchase-status')).toHaveText(
      (await dictionaryText(page, locale, 'purchase.status.ready')).replace(
        '{account}',
        'learner@example.test',
      ),
    );

    const purchaseText = await page.locator('#purchase-account-gate').innerText();
    if (locale !== 'tr') {
      expect(purchaseText).not.toMatch(copiedTurkishPurchaseText);
    }
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

test('static Home demo question keeps q039 source and UHR provenance in extra languages', async ({
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
    await expectDictionaryText(page, locale, 'qcard.chip', '#qcard [data-i18n="qcard.chip"]');
    await expectDictionaryText(page, locale, 'qcard.q', '#qcard [data-i18n="qcard.q"]');
    await expectDictionaryText(page, locale, 'qcard.prov', '#qcard [data-i18n="qcard.prov"]');
    await expectDictionaryText(page, locale, 'qcard.src', '#qcard [data-i18n="qcard.src"]');

    const questionText = await page.locator('#qcard [data-i18n="qcard.q"]').innerText();
    if (locale === 'zh-Hans') {
      expect(questionText).toContain('采摘莓果');
      expect(questionText).not.toMatch(/\bberries\b/i);
    }
    const sourceText = await page.locator('#qcard [data-i18n="qcard.src"]').innerText();
    expect(sourceText).toContain('Sverige i fokus');
    expect(sourceText).toContain('Lag och rätt');
    expect(sourceText).toContain('Allemansrätten');
    expect(sourceText).toContain('17');
    expect(sourceText).not.toContain('Grundlagarna');
    await expect(page.locator('#qcard')).toHaveAttribute('data-source-question-id', 'q039');
    await expect(page.locator('#qcard .quiz__provenance--uhr')).toBeVisible();
    await expectNoHorizontalOverflow(page);
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

test('static Home chapter 3 fundamental laws render localized card descriptions before Grundlagarna', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);

  for (const locale of chapterThreeFundamentalLawLocales) {
    await page.locator('#settings-open').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page
      .locator(`#settings-modal [data-set="language"] button[data-val="${locale}"]`)
      .click();
    await page.locator('#settings-modal button[data-close="settings"]').last().click();
    await expect(page.locator('#settings-modal')).toBeHidden();

    await expectRootLocale(page, locale);
    await assertHomeChapterThreeFundamentalLawTerms(page, locale);
    await expect(page.locator('.list-quiet > li')).toHaveCount(13);
  }

  expect(pageErrors).toEqual([]);
});

test('static Home chapter 11 citizenship terms render localized glossary before medborgarskap', async ({
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
    await assertHomeChapterElevenCitizenshipTerms(page, locale);
    await expect(page.locator('.list-quiet > li')).toHaveCount(13);
  }

  expect(pageErrors).toEqual([]);
});

test('static q050 source criticism extra languages render noun-based question and explanation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  await openStaticHome(page, staticSite.baseUrl);
  await page.locator('#consent-min').click();
  await expect(page.locator('#consent')).toBeHidden();

  for (const locale of q050RenderedSourceCriticismLocales) {
    const q050 = await openRenderedQ050Practice(page, locale);
    expect(q050.source).toMatchObject({
      title: 'Sverige i fokus',
      chapter: 'Mediernas roll',
      section: 'Källkritik',
      page: 21,
    });

    const questionText = await page.locator('#quiz-stage .quiz__q').innerText();
    expect(questionText).toMatch(localizedQ050SourceCriticismTerms[locale]);
    expect(questionText).not.toMatch(forbiddenQ050SourceCriticismStaleTerms);

    const sourceText = await page.locator('#quiz-stage .quiz__source').innerText();
    expect(sourceText).toContain('Sverige i fokus');
    expect(sourceText).toContain('Mediernas roll');
    expect(sourceText).toContain('Källkritik');
    expect(sourceText).toContain('21');

    await page.locator(`#quiz-stage .quiz__opt[data-i="${q050.answer}"]`).dispatchEvent('click');
    await switchStaticSiteLanguage(page, locale);
    const feedback = page.locator('#quiz-stage .quiz__feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(q050.explanation);

    const explanationText = await feedback.innerText();
    expect(explanationText).toMatch(localizedQ050SourceCriticismTerms[locale]);
    expect(explanationText).not.toMatch(forbiddenQ050SourceCriticismStaleTerms);
    await expect(page.locator('#quiz-stage .quiz__feedback-source')).toContainText('Källkritik');
  }

  expect(pageErrors).toEqual([]);
});
