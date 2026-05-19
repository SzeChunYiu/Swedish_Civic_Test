const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { assertNoUnsupportedStaticOutcomeSlogans } = require('./static-outcome-copy-guard');

const repoRoot = path.resolve(__dirname, '..');
const phrasePattern = (...parts) => new RegExp(parts.join(''), 'i');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function staticQuestionBank() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return context.window.SMT_QUESTIONS;
}

function staticQuestionSourceTitles() {
  return uniqueSorted(staticQuestionBank().map((question) => question.source?.title));
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
  const values = [];
  const entryPattern = /"([^"]+)": "((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = entryPattern.exec(appSource))) {
    const [, key, rawValue] = match;
    if (includeKey(key)) values.push(JSON.parse(`"${rawValue}"`));
  }
  return values;
}

function englishTranslationMap(appSource) {
  const englishMatch = appSource.match(/en:\s*{([\s\S]*?)\n\s*},\n\s*sv:/);
  assert.ok(englishMatch, 'static English dictionary should be present');

  const values = new Map();
  const entryPattern = /"([^"]+)": "((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = entryPattern.exec(englishMatch[1]))) {
    const [, key, rawValue] = match;
    values.set(key, JSON.parse(`"${rawValue}"`));
  }
  return values;
}

function normalizeInlineHtml(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function staticFallbackI18nValues(indexHtml, keyPrefix) {
  const values = new Map();
  const elementPattern = /<([a-z][a-z0-9-]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;

  let match;
  while ((match = elementPattern.exec(indexHtml))) {
    const [, , key, rawValue] = match;
    if (key.startsWith(keyPrefix)) values.set(key, normalizeInlineHtml(rawValue));
  }
  return values;
}

function staticFaqSection(indexHtml) {
  const faqMatch = indexHtml.match(/<section class="band faq"[\s\S]*?<\/section>/);
  assert.ok(faqMatch, 'static FAQ fallback section should be present');
  return faqMatch[0];
}

const unsupportedPracticalTestClaimPatterns = [
  phrasePattern('Format of ', 'the real test'),
  phrasePattern('multiple-choice ', 'and timed'),
  phrasePattern('Bring valid ', "ID\\s*\\(BankID,\\s*passport,\\s*or Swedish driver's licence\\)"),
  phrasePattern('Arrive 30 ', 'minutes early'),
  phrasePattern('test centre ', 'is strict'),
  phrasePattern('You may ', 'retake the test'),
  phrasePattern('There is a ', 'small fee'),
  phrasePattern('Language ', 'requirement:\\s*A2[–-]B1\\s*', '\\(separate test\\)'),
  phrasePattern('På provdagen är ', 'giltig legitimation'),
];

const officialPracticalTestSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
];

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

test('static question bank exports visible question provenance', () => {
  const questions = staticQuestionBank();
  const supported = new Set(['uhr', 'derived', 'editorial']);
  const counts = { uhr: 0, derived: 0, editorial: 0 };

  for (const question of questions) {
    assert.ok(
      supported.has(question.questionProvenance),
      `${question.id} should expose supported questionProvenance`,
    );
    counts[question.questionProvenance] += 1;
  }

  assert.equal(questions.find((question) => question.id === 'q001')?.questionProvenance, 'uhr');
  assert.ok(counts.uhr > 0, 'static bank should include UHR provenance rows');
  assert.ok(counts.derived > 0, 'static bank should include supplementary derived rows');
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

test('static FAQ no-JS fallback mirrors the English dictionary', () => {
  const indexHtml = read('site/index.html');
  const appSource = read('site/app.js');
  const englishTranslations = englishTranslationMap(appSource);
  const faqDictionaryEntries = Array.from(englishTranslations.entries())
    .filter(([key]) => key.startsWith('faq.'))
    .map(([key, value]) => [key, normalizeInlineHtml(value)]);
  const faqFallback = staticFallbackI18nValues(staticFaqSection(indexHtml), 'faq.');
  const faqFallbackEntries = Array.from(faqFallback.entries());

  assert.deepEqual(
    faqFallbackEntries.map(([key]) => key).sort(),
    faqDictionaryEntries.map(([key]) => key).sort(),
  );

  for (const [key, expectedValue] of faqDictionaryEntries) {
    assert.equal(
      faqFallback.get(key),
      expectedValue,
      `${key} no-JS fallback should match the English site/app.js dictionary`,
    );
  }
});

test('shared static copy guard rejects unsupported pass and passport outcome slogans', () => {
  assertNoUnsupportedStaticOutcomeSlogans(repoRoot);
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
