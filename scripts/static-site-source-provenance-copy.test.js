const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function staticQuestionSourceTitles() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return uniqueSorted(context.window.SMT_QUESTIONS.map((question) => question.source?.title));
}

function sourceClaimTitles(indexHtml) {
  return uniqueSorted(
    Array.from(indexHtml.matchAll(/data-source-title="([^"]+)"/g), (match) => match[1]),
  );
}

function sourcesRoute(indexHtml) {
  const routeMatch = indexHtml.match(
    /<main data-screen-label="05 Sources" data-page="\/sources">([\s\S]*?)<\/main>/,
  );
  assert.ok(routeMatch, 'static Sources route should be present');
  return routeMatch[1];
}

function termsContentParagraph(indexHtml) {
  const paragraphMatch = indexHtml.match(/<p data-i18n="terms\.s3\.p">([\s\S]*?)<\/p>/);
  assert.ok(paragraphMatch, 'static Terms content paragraph should be present');
  return paragraphMatch[1];
}

function appTranslationValues(appSource, includeKey) {
  const entries = appTranslationEntriesByLanguage(appSource, includeKey);
  return [...Object.values(entries.en), ...Object.values(entries.sv)];
}

function appTranslationBody(appSource, locale) {
  const marker = `\n  ${locale}: {`;
  const markerIndex = appSource.indexOf(marker);
  assert.notEqual(markerIndex, -1, `static app dictionary should include ${locale}`);
  const bodyStart = appSource.indexOf('{', markerIndex) + 1;
  let depth = 1;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (let index = bodyStart; index < appSource.length; index += 1) {
    const character = appSource[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === stringQuote) {
        inString = false;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      inString = true;
      stringQuote = character;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return appSource.slice(bodyStart, index);
      }
    }
  }

  assert.fail(`static app dictionary should close ${locale}`);
}

function appTranslationEntriesByLanguage(appSource, includeKey) {
  const locales = ['en', 'sv'];
  const entries = {};

  for (const locale of locales) {
    const body = appTranslationBody(appSource, locale);
    const dictionary = vm.runInNewContext(`({${body}\n})`, {}, { timeout: 1000 });
    entries[locale] = Object.fromEntries(
      Object.entries(dictionary).filter(([key]) => includeKey(key)),
    );
  }

  return entries;
}

function staticFaqDetails(indexHtml) {
  const listMatch = indexHtml.match(/<div class="faq__list">([\s\S]*?)<\/div>/);
  assert.ok(listMatch, 'static FAQ list should be present');
  return Array.from(
    listMatch[1].matchAll(/<details\b[^>]*class="faq__item"[^>]*>[\s\S]*?<\/details>/g),
    (match) => match[0],
  );
}

function staticFaqI18nKeys(indexHtml) {
  return staticFaqKeyPairs(indexHtml)
    .flatMap(({ answerKey, questionKey }) => [questionKey, answerKey])
    .sort((a, b) => a.localeCompare(b));
}

function staticFaqSurface(indexHtml) {
  return staticFaqDetails(indexHtml).join('\n');
}

function staticFaqKeyPairs(indexHtml) {
  return staticFaqDetails(indexHtml).map((details) => {
    const questionMatch = details.match(/<summary[^>]*data-i18n="(faq\.\d+\.q)"[^>]*>/);
    const answerMatch = details.match(/<p[^>]*data-i18n="(faq\.\d+\.a)"[^>]*>/);

    assert.ok(questionMatch, 'each static FAQ details item should have a localized question');
    assert.ok(answerMatch, 'each static FAQ details item should have a localized answer');
    assert.equal(
      questionMatch[1].replace(/\.q$/, ''),
      answerMatch[1].replace(/\.a$/, ''),
      'each static FAQ details item should pair matching question and answer keys',
    );

    return { questionKey: questionMatch[1], answerKey: answerMatch[1] };
  });
}

function sourceProvenanceSurface() {
  const indexHtml = read('site/index.html');
  const appJs = read('site/app.js');
  const sourceAndTermsTranslations = appTranslationValues(
    appJs,
    (key) => key.startsWith('sources.') || key === 'terms.s3.p',
  );

  return [sourcesRoute(indexHtml), termsContentParagraph(indexHtml), ...sourceAndTermsTranslations]
    .join('\n')
    .replace(/<[^>]+>/g, ' ');
}

test('static source claims match the shipped question-bank source titles', () => {
  const indexHtml = read('site/index.html');
  const questionSourceTitles = staticQuestionSourceTitles();
  const claimedSourceTitles = sourceClaimTitles(indexHtml);
  const surface = sourceProvenanceSurface();

  assert.deepEqual(claimedSourceTitles, questionSourceTitles);
  assert.deepEqual(questionSourceTitles, ['Sverige i fokus']);

  for (const title of questionSourceTitles) {
    assert.match(surface, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(surface, /UHR/i);
  assert.match(surface, /current question bank|nuvarande fr[aå]gebanken/i);
  assert.match(surface, /Primary source\s+1|Prim[aä]r k[aä]lla\s+1/i);
});

test('static source provenance copy rejects unshipped external source families', () => {
  const surface = sourceProvenanceSurface();

  [
    /Riksdagen\s+.*(?:basic laws|grundlagarna|riksdagens arbete)/i,
    /Regeringen\.se/i,
    /Migrationsverket\s+.*(?:citizenship requirements|medborgarskapskrav)/i,
    /Skolverket\s+.*(?:civic-knowledge|ramverk|kursplaner)/i,
    /SCB\s+\(?(?:Statistiska centralbyr[aå]n)?\)?\s+.*(?:demographics|demografi)/i,
    /Folkh[aä]lsomyndigheten/i,
    /Nationalencyklopedin/i,
    /Institutet f(?:ö|o)r spr[aå]k och folkminnen/i,
    /public sources\s+.*Riksdagen/i,
    /offentliga k[aä]llor\s+.*Riksdagen/i,
    /Primary sources\s+8/i,
    /Prim[aä]ra k[aä]llor\s+8/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static FAQ renders every localized question and answer key', () => {
  const indexHtml = read('site/index.html');
  const appJs = read('site/app.js');
  const faqEntries = appTranslationEntriesByLanguage(appJs, (key) => /^faq\.\d+\.(q|a)$/.test(key));
  const expectedKeys = uniqueSorted(Object.keys(faqEntries.en));
  const renderedKeys = staticFaqI18nKeys(indexHtml);

  assert.deepEqual(
    Object.keys(faqEntries.sv).sort((a, b) => a.localeCompare(b)),
    expectedKeys,
  );
  assert.deepEqual(renderedKeys, expectedKeys);

  for (const key of expectedKeys) {
    assert.equal(
      renderedKeys.filter((renderedKey) => renderedKey === key).length,
      1,
      `${key} should render exactly once in the visible static FAQ list`,
    );
  }
});

test('static FAQ provenance copy does not mention a nonexistent public question bank', () => {
  const indexHtml = read('site/index.html');
  const appJs = read('site/app.js');
  const faqEntries = appTranslationEntriesByLanguage(appJs, (key) => /^faq\.\d+\.(q|a)$/.test(key));
  const surface = [
    staticFaqSurface(indexHtml),
    ...Object.values(faqEntries.en),
    ...Object.values(faqEntries.sv),
  ].join('\n');

  assert.doesNotMatch(surface, /public bank|offentliga banken/i);
});

test('static ebook practical test copy is backed by current UHR source metadata', () => {
  const ebookSource = read('site/ebook.js');

  assert.match(ebookSource, /const OFFICIAL_TEST_SOURCE_NOTES = Object\.freeze\(/);
  assert.match(ebookSource, /retrievedDate: '2026-05-19'/);
  officialPracticalTestSourceUrls.forEach((url) => assert.match(ebookSource, new RegExp(url)));

  assert.match(
    ebookSource,
    /first civic-knowledge sitting will be held on 15 August 2026 in Stockholm/i,
  );
  assert.match(ebookSource, /only people who receive a letter from Migrationsverket can sign up/i);
  assert.match(ebookSource, /Seats are limited/i);
  assert.match(ebookSource, /free of charge/i);
  assert.match(ebookSource, /generous time/i);
  assert.match(ebookSource, /UHR has not yet published the exact time and place/i);
  assert.match(ebookSource, /första samhällskunskapsprovet inom medborgarskapsprovet/i);
  assert.match(ebookSource, /brev från Migrationsverket/i);
  assert.match(ebookSource, /Antalet platser är begränsat/i);
  assert.match(ebookSource, /kostnadsfritt/i);
  assert.match(ebookSource, /generöst med tid/i);
  assert.match(ebookSource, /praktiska detaljer väntar hos UHR/i);

  unsupportedPracticalTestClaimPatterns.forEach((pattern) =>
    assert.doesNotMatch(ebookSource, pattern),
  );
});

test('static ebook factbox and current prose claims use retrieved source metadata', () => {
  const ebookSource = read('site/ebook.js');

  assert.match(ebookSource, /const EBOOK_FACTBOX_SOURCE_NOTES = Object\.freeze\(/);
  assert.match(ebookSource, /function ebookFactBox\(lang, heading, facts/);
  assert.match(ebookSource, /retrievedDate: '2026-05-19'/);
  assert.match(ebookSource, /Facts to review/);
  assert.match(ebookSource, /Fakta att repetera/);
  assert.match(ebookSource, /Sources accessed/);
  assert.match(ebookSource, /Källor hämtade/);

  ebookFactboxSourceUrls.forEach((url) => assert.match(ebookSource, new RegExp(url)));
  unsupportedEbookFactboxPatterns.forEach((pattern) => assert.doesNotMatch(ebookSource, pattern));
});
