import { expect, test, type Page } from '@playwright/test';
import {
  collectPageErrors,
  expectNoHorizontalOverflow,
  openStaticEbook,
  setStaticSiteLanguage,
  startStaticSiteServer,
  type StaticSite,
  type StaticSiteLanguage,
} from './staticSiteServer';

type SourceCounts = Record<string, number>;

const chapterIds = ['1', '7', '9', '12'] as const;
const languages = ['en', 'sv'] as const satisfies readonly StaticSiteLanguage[];
const extraLocaleSourceChromeCases = [
  {
    countLabel: 'المصادر',
    footnoteLabel: /^مصدر 1$/,
    footnotesHeading: 'ملاحظات مصادر الفصل',
    language: 'ar',
    sourcePageLink: 'صفحة المصادر',
  },
  {
    countLabel: '来源',
    footnoteLabel: /^来源 1$/,
    footnotesHeading: '本章来源说明',
    language: 'zh-Hans',
    sourcePageLink: '来源页面',
  },
] as const satisfies readonly {
  countLabel: string;
  footnoteLabel: RegExp;
  footnotesHeading: string;
  language: StaticSiteLanguage;
  sourcePageLink: string;
}[];
const localNoteExtraLocaleCases = [
  {
    chip: 'متصفح محلي',
    direction: 'rtl',
    language: 'ar',
    note: 'تبقى التظليلات والملاحظات في هذا المتصفح وتعمل محلياً من دون تسجيل دخول.',
  },
  {
    chip: 'وێبگەڕی ناوخۆیی',
    direction: 'rtl',
    language: 'ckb',
    note: 'نیشانەکردن و تێبینییەکان لەم وێبگەڕەدا دەمێننەوە و بەبێ چوونەژوورەوە بە شێوەی ناوخۆیی کار دەکەن.',
  },
  {
    chip: 'مرورگر محلی',
    direction: 'rtl',
    language: 'fa',
    note: 'هایلایت‌ها و یادداشت‌ها در این مرورگر می‌مانند و بدون ورود به حساب به‌صورت محلی کار می‌کنند.',
  },
  {
    chip: 'Lokalna przeglądarka',
    direction: 'ltr',
    language: 'pl',
    note: 'Zaznaczenia i notatki zostają w tej przeglądarce i działają lokalnie bez logowania.',
  },
  {
    chip: 'Browser maxalli ah',
    direction: 'ltr',
    language: 'so',
    note: 'Calaamadaha iyo qoraalladu waxay ku sii jiraan browser-kan, waxayna si maxalli ah u shaqeeyaan adigoon soo galin.',
  },
  {
    chip: 'ናይ ከባቢ መቃኛ',
    direction: 'ltr',
    language: 'ti',
    note: 'ምልክታትን ማስታወሻታትን ኣብዚ መቃኛ ይተርፋ እሞ ብዘይ መእተዊ ብከባቢ ይሰርሓ።',
  },
  {
    chip: 'Yerel tarayıcı',
    direction: 'ltr',
    language: 'tr',
    note: 'İşaretlemeler ve notlar bu tarayıcıda kalır, oturum açmadan yerel olarak çalışır.',
  },
  {
    chip: 'Локальний браузер',
    direction: 'ltr',
    language: 'uk',
    note: 'Виділення й нотатки залишаються в цьому браузері та працюють локально без входу.',
  },
] as const satisfies readonly {
  chip: string;
  direction: 'ltr' | 'rtl';
  language: StaticSiteLanguage;
  note: string;
}[];
const safeExternalSourceLinkCases = [
  {
    chapterId: '1',
    labels: ['UHR public study material', 'Government Offices NATO membership notice'],
  },
  {
    chapterId: '7',
    labels: ['SCB land and water area statistics'],
  },
  {
    chapterId: '9',
    labels: ['Riksbank historical timeline'],
  },
  {
    chapterId: '12',
    labels: [
      'UHR: Om medborgarskapsprovet',
      'UHR: Frågor och svar',
      'UHR: Anmälan',
      'UHR: Utbildningsmaterial',
    ],
  },
] as const;
const officialTestSourceLinkLabels = [
  'UHR: Om medborgarskapsprovet',
  'UHR: Frågor och svar',
  'UHR: Anmälan',
  'UHR: Utbildningsmaterial',
] as const;

const badgeLabels: Record<(typeof languages)[number], Record<string, string>> = {
  en: {
    editorialCommentary: 'Editorial',
    governmentNato: 'Government Offices',
    migrationsverketCitizenshipRules: 'Migrationsverket citizenship rules',
    riksbankHistory: 'Riksbank',
    scbLandUse: 'SCB',
    uhrOfficialTestAbout: 'UHR test overview',
    uhrOfficialTestFaq: 'UHR test FAQ',
    uhrOfficialTestSignup: 'UHR sign-up',
    uhrOfficialTestStudyMaterial: 'UHR study material',
    uhrStudyMaterial: 'UHR',
  },
  sv: {
    editorialCommentary: 'Redaktionellt',
    governmentNato: 'Government Offices',
    migrationsverketCitizenshipRules: 'Migrationsverket citizenship rules',
    riksbankHistory: 'Riksbank',
    scbLandUse: 'SCB',
    uhrOfficialTestAbout: 'UHR test overview',
    uhrOfficialTestFaq: 'UHR test FAQ',
    uhrOfficialTestSignup: 'UHR sign-up',
    uhrOfficialTestStudyMaterial: 'UHR study material',
    uhrOfficialTestSources: 'UHR:s provstatus',
    uhrStudyMaterial: 'UHR',
  },
};

function parseSourceCounts(serialized: string): SourceCounts {
  if (serialized.trim().startsWith('{')) {
    return JSON.parse(serialized);
  }

  return Object.fromEntries(
    serialized
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const [key, value] = entry.split(':');
        return [key, Number(value)];
      }),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function renderEbookAfterLanguageSwitch(page: Page, language: StaticSiteLanguage) {
  await setStaticSiteLanguage(page, language);
  await page.evaluate(() => {
    const staticWindow = window as typeof window & {
      smtEbookRender?: () => void;
    };
    staticWindow.smtEbookRender?.();
  });
}

async function readProvenance(page: Page) {
  return page.locator('#ebook-reader').evaluate((reader) => {
    const badge = reader.querySelector('.ebook__provenance-badge');
    const footnoteItems = Array.from(
      reader.querySelectorAll<HTMLElement>('.ebook__footnotes li[data-source-key]'),
    );
    const footnoteCounts = footnoteItems.reduce<Record<string, number>>((counts, item) => {
      const keys = (item.dataset.sourceKey ?? '').split(/\s+/).filter(Boolean);
      for (const key of new Set(keys)) {
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return counts;
    }, {});
    const footnoteLabels = footnoteItems.reduce<Record<string, string[]>>((labels, item) => {
      const keys = (item.dataset.sourceKey ?? '').split(/\s+/).filter(Boolean);
      if (keys.length === 0) return labels;
      const sourceLabel =
        item.querySelector<HTMLAnchorElement>('a[href^="http"]')?.textContent?.trim() ??
        item.textContent
          ?.replace('↩', '')
          .replace(/\([^)]*\)/g, '')
          .trim() ??
        '';
      for (const key of new Set(keys)) {
        labels[key] = Array.from(new Set([...(labels[key] ?? []), sourceLabel].filter(Boolean)));
      }
      return labels;
    }, {});

    return {
      badgeCounts: badge?.getAttribute('data-source-counts') ?? '',
      badgeText: badge?.textContent ?? '',
      footnoteCounts,
      footnoteLabels,
      footnoteTotal: footnoteItems.length,
    };
  });
}

let staticSite: StaticSite;

test.beforeAll(async () => {
  staticSite = await startStaticSiteServer();
});

test.afterAll(async () => {
  await staticSite.close();
});

for (const language of languages) {
  for (const chapterId of chapterIds) {
    test(`static ebook chapter ${chapterId} source badge matches footnotes in ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const pageErrors = collectPageErrors(page);

      await openStaticEbook(page, staticSite.baseUrl, language, `#/ebook?c=${chapterId}`);

      const provenance = await readProvenance(page);
      const badgeCounts = parseSourceCounts(provenance.badgeCounts);

      expect(provenance.footnoteTotal).toBeGreaterThan(0);
      expect(badgeCounts).toEqual(provenance.footnoteCounts);

      for (const [sourceKey, count] of Object.entries(badgeCounts)) {
        const countLabel = language === 'sv' ? '(?:källa|källor)' : 'cites?';
        expect(provenance.badgeText).toMatch(
          new RegExp(
            `${escapeRegExp(badgeLabels[language][sourceKey])} \\(${count} ${countLabel}\\)`,
          ),
        );
        expect(provenance.footnoteLabels[sourceKey]?.length ?? 0).toBeGreaterThan(0);
      }

      await expect(page.locator('#ebook-reader .ebook__source-ref a').first()).toHaveAttribute(
        'href',
        new RegExp(`^#/ebook\\?c=${chapterId}&fn=eb-${chapterId}-${language}-fn-\\d+$`),
      );
      await expect(page.locator('#ebook-reader .ebook__footnotes li a').first()).toHaveAttribute(
        'href',
        new RegExp(`^#/ebook\\?c=${chapterId}&fnref=eb-${chapterId}-${language}-fn-\\d+$`),
      );
      expect(pageErrors).toEqual([]);
    });
  }
}

test('static ebook footnote and backlink keep the active chapter hash', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=7');

  const firstFootnoteRef = page.locator('#ebook-reader .ebook__source-ref a').first();
  await firstFootnoteRef.click();
  await expect(page).toHaveURL(/#\/ebook\?c=7&fn=eb-7-en-fn-1$/);
  await expect(page.locator('#eb-7-en-fn-1')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="7"]')).toHaveClass(/is-active/);

  await page.locator('#eb-7-en-fn-1 > a[href^="#/ebook"]').click();
  await expect(page).toHaveURL(/#\/ebook\?c=7&fnref=eb-7-en-fn-1$/);
  await expect(page.locator('#eb-7-en-fn-1-ref')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="7"]')).toHaveClass(/is-active/);

  expect(pageErrors).toEqual([]);
});

for (const {
  countLabel,
  footnoteLabel,
  footnotesHeading,
  language,
  sourcePageLink,
} of extraLocaleSourceChromeCases) {
  test(`static ebook source chrome is localized in ${language}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = collectPageErrors(page);

    await openStaticEbook(page, staticSite.baseUrl, language, '#/ebook?c=7');

    const reader = page.locator('#ebook-reader');
    await expect(reader.locator('.ebook__footnotes')).toHaveAccessibleName(footnotesHeading);
    await expect(reader.locator('.ebook__footnotes h2')).toHaveText(footnotesHeading);
    await expect(reader.locator('.ebook__source-ref a').first()).toHaveAccessibleName(
      footnoteLabel,
    );
    await expect(reader.locator('.ebook__provenance-badge span').first()).toContainText(
      `${countLabel}:`,
    );
    await expect(reader.locator('.ebook__provenance-badge a[href="#/sources"]')).toHaveText(
      sourcePageLink,
    );
    await expect(reader).not.toContainText('Chapter source notes');
    await expect(reader).not.toContainText('Sources page');
    await expect(reader).not.toContainText('Original study guide');

    expect(pageErrors).toEqual([]);
  });
}

test('static ebook local note handles RTL and extra locale switches without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');

  const note = page.locator('.ebook__local-note');
  const chip = note.locator('.ebook__local-note-chip');

  for (const fixture of localNoteExtraLocaleCases) {
    await renderEbookAfterLanguageSwitch(page, fixture.language);

    await expect(page.locator('html')).toHaveAttribute('dir', fixture.direction);
    await expect(note).toContainText(fixture.note);
    await expect(chip).toHaveText(fixture.chip);
    await expect(note).not.toContainText(
      'Highlights and notes stay in this browser and work locally without sign-in.',
    );
    await expect(note).not.toContainText('Local browser');

    const pseudoContent = await note.evaluate(
      (element) => window.getComputedStyle(element, '::after').content,
    );
    expect(['none', 'normal', '""', '']).toContain(pseudoContent);

    await expectNoHorizontalOverflow(page, `static ebook local note in ${fixture.language}`);
    const metrics = await note.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        clientWidth: element.clientWidth,
        left: rect.left,
        right: rect.right,
        scrollWidth: element.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  }

  expect(pageErrors).toEqual([]);
});

test('static ebook ignores malformed footnote hash values without page errors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  for (const hash of ['#/ebook?c=7&fn=%E0%A4%A', '#/ebook?c=7&fnref=%ZZ']) {
    await openStaticEbook(page, staticSite.baseUrl, 'en', hash);
    await expect(page.locator('.ebook__progress')).toHaveText('7 / 13');
    await expect(page.locator('.ebook__nav a[data-eb="7"]')).toHaveClass(/is-active/);
  }

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=%E0%A4%A&fn=eb-7-en-fn-1');
  await expect(page.locator('.ebook__progress')).toHaveText('Guide');

  expect(pageErrors).toEqual([]);
});

test('static ebook external source links use safe attributes without changing chapter hashes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  for (const { chapterId, labels } of safeExternalSourceLinkCases) {
    await openStaticEbook(page, staticSite.baseUrl, 'en', `#/ebook?c=${chapterId}`);

    for (const label of labels) {
      const sourceLink = page.getByRole('link', { name: label }).first();
      await expect(sourceLink).toHaveAttribute('target', '_blank');
      await expect(sourceLink).toHaveAttribute('rel', /noreferrer/);
    }

    await expect(page.locator('#ebook-reader .ebook__source-ref a').first()).not.toHaveAttribute(
      'target',
      '_blank',
    );
    await expect(
      page.locator('#ebook-reader .ebook__footnotes li a[href^="#/ebook"]').first(),
    ).not.toHaveAttribute('target', '_blank');
  }

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await expect(
    page.getByRole('link', { name: 'editorial commentary' }).first(),
  ).not.toHaveAttribute('target', '_blank');

  expect(pageErrors).toEqual([]);
});

test('static ebook chapter 12 official test source links use safe external attributes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=12');

  const currentSourceNotes = page.locator('#ebook-reader .ebook__factbox', {
    hasText: 'Current source notes',
  });
  await expect(currentSourceNotes).toBeVisible();
  await expect(
    currentSourceNotes.locator('a[href^="https://www.uhr.se/medborgarskapsprovet/"]'),
  ).toHaveCount(officialTestSourceLinkLabels.length);

  for (const label of officialTestSourceLinkLabels) {
    const sourceLink = currentSourceNotes.getByRole('link', { name: label });
    await expect(sourceLink).toHaveAttribute('target', '_blank');
    await expect(sourceLink).toHaveAttribute('rel', /(^|\s)noreferrer(\s|$)/);
  }

  await expect(page.locator('#ebook-reader .ebook__source-ref a').first()).not.toHaveAttribute(
    'target',
    '_blank',
  );
  await expect(
    page.locator('#ebook-reader .ebook__footnotes li a[href^="#/ebook"]').first(),
  ).not.toHaveAttribute('target', '_blank');
  await expect(
    page.getByRole('link', { name: 'editorial commentary' }).first(),
  ).not.toHaveAttribute('target', '_blank');

  expect(pageErrors).toEqual([]);
});

test('static ebook language switching keeps localized source labels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);
  const badge = page.locator('#ebook-reader .ebook__provenance-badge');

  await openStaticEbook(page, staticSite.baseUrl, 'en', '#/ebook?c=1');
  await expect(badge).toHaveAttribute('aria-label', /^Sources:/);
  await expect(badge).toContainText('Editorial');

  await renderEbookAfterLanguageSwitch(page, 'sv');
  await expect(badge).toHaveAttribute('aria-label', /^Källor:/);
  await expect(badge).toContainText('Redaktionellt');
  await expect(badge).not.toContainText('Editorial');
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'UHR:s offentliga studiematerial',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'Regeringskansliets meddelande om Nato-medlemskapet',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'redaktionell kommentar',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'redaktionell kommentar (redaktionell)',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).not.toContainText(
    'UHR public study material',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).not.toContainText(
    'Government Offices NATO membership notice',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).not.toContainText(
    'editorial commentary',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).not.toContainText('(editorial)');
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toHaveAttribute(
    'aria-label',
    'Källnoter för kapitlet',
  );

  await renderEbookAfterLanguageSwitch(page, 'en');
  await expect(badge).toHaveAttribute('aria-label', /^Sources:/);
  await expect(badge).toContainText('Editorial');
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'UHR public study material',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'Government Offices NATO membership notice',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toContainText(
    'editorial commentary',
  );
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toHaveAttribute(
    'aria-label',
    'Chapter source notes',
  );

  expect(pageErrors).toEqual([]);
});

test('static ebook reader has no decorative orb pseudo-element', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = collectPageErrors(page);

  await page.goto(`${staticSite.baseUrl}/#/ebook?c=12`, { waitUntil: 'load' });
  await expect(page.locator('[data-page="/ebook"]')).toHaveClass(/is-active/);
  await expect(page.locator('#ebook-reader')).toBeVisible();

  const readerDecoration = await page.locator('#ebook-reader').evaluate((reader) => {
    const style = window.getComputedStyle(reader, '::after');
    return {
      backgroundImage: style.backgroundImage,
      content: style.content,
      height: style.height,
      width: style.width,
    };
  });

  expect(['none', 'normal', '']).toContain(readerDecoration.content);
  expect(readerDecoration.backgroundImage).toBe('none');
  expect(readerDecoration.width).toBe('auto');
  expect(readerDecoration.height).toBe('auto');
  expect(pageErrors).toEqual([]);
});
