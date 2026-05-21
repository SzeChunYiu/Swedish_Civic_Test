import { expect, test, type Page } from '@playwright/test';
import {
  collectPageErrors,
  openStaticEbook,
  setStaticSiteLanguage,
  startStaticSiteServer,
  type StaticSite,
  type StaticSiteLanguage,
} from './staticSiteServer';

type SourceCounts = Record<string, number>;

const chapterIds = ['1', '7', '9', '12'] as const;
const languages = ['en', 'sv'] as const satisfies readonly StaticSiteLanguage[];

const badgeLabels: Record<StaticSiteLanguage, Record<string, string>> = {
  en: {
    editorialCommentary: 'Editorial',
    governmentNato: 'Government Offices',
    migrationsverketCitizenshipRules: 'Migrationsverket',
    riksbankHistory: 'Riksbank',
    scbLandUse: 'SCB',
    uhrStudyMaterial: 'UHR',
  },
  sv: {
    editorialCommentary: 'Editorial',
    governmentNato: 'Government Offices',
    migrationsverketCitizenshipRules: 'Migrationsverket',
    riksbankHistory: 'Riksbank',
    scbLandUse: 'SCB',
    uhrStudyMaterial: 'UHR',
  },
};

function parseSourceCounts(serialized: string): SourceCounts {
  if (serialized.trim().startsWith('{')) {
    return JSON.parse(serialized) as SourceCounts;
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
      reader.querySelectorAll<HTMLElement>('.ebook__footnote-list li[data-source-key]'),
    );
    const footnoteCounts = footnoteItems.reduce<Record<string, number>>((counts, item) => {
      const key = item.dataset.sourceKey ?? '';
      if (!key) return counts;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    const footnoteLabels = footnoteItems.reduce<Record<string, string[]>>((labels, item) => {
      const key = item.dataset.sourceKey ?? '';
      if (!key) return labels;
      const sourceLabel =
        item.querySelector<HTMLAnchorElement>('a[href^="http"]')?.textContent?.trim() ??
        item.textContent
          ?.replace('↩', '')
          .replace(/\([^)]*\)/g, '')
          .trim() ??
        '';
      labels[key] = Array.from(new Set([...(labels[key] ?? []), sourceLabel].filter(Boolean)));
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
        expect(provenance.badgeText).toMatch(
          new RegExp(`${badgeLabels[language][sourceKey]} \\(${count} cites?\\)`),
        );
        expect(provenance.footnoteLabels[sourceKey]?.length ?? 0).toBeGreaterThan(0);
      }

      await expect(page.locator('#ebook-reader .ebook__source-ref a').first()).toHaveAttribute(
        'href',
        new RegExp(`^#/ebook\\?c=${chapterId}&fn=eb-${chapterId}-${language}-fn-\\d+$`),
      );
      await expect(
        page.locator('#ebook-reader .ebook__footnote-list > li > a').first(),
      ).toHaveAttribute(
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

  await page.locator('#eb-7-en-fn-1 > a').first().click();
  await expect(page).toHaveURL(/#\/ebook\?c=7&fnref=eb-7-en-fn-1$/);
  await expect(page.locator('#eb-7-en-fn-1-ref')).toBeVisible();
  await expect(page.locator('.ebook__nav a[data-eb="7"]')).toHaveClass(/is-active/);

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
  await expect(badge).toContainText('Editorial');
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toHaveAttribute(
    'aria-label',
    'Källor i kapitlet',
  );

  await renderEbookAfterLanguageSwitch(page, 'en');
  await expect(badge).toHaveAttribute('aria-label', /^Sources:/);
  await expect(badge).toContainText('Editorial');
  await expect(page.locator('#ebook-reader .ebook__footnotes')).toHaveAttribute(
    'aria-label',
    'Chapter sources',
  );

  expect(pageErrors).toEqual([]);
});
