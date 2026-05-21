const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');
const {
  assertNoUnsupportedStaticTeamCredentialClaims,
  assertNoUnsupportedStaticOutcomeSlogans,
  findUnsupportedStaticTeamCredentialClaimsInSource,
  findStaticHeadMetadataTitleIssues,
} = require('./static-outcome-copy-guard');

const repoRoot = path.resolve(__dirname, '..');
const phrasePattern = (...parts) => new RegExp(parts.join(''), 'i');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadTs(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(output.outputText, filename);
  return mod.exports;
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

function staticBuddyRuntime() {
  const source = read('site/buddies.js').replace(
    /\}\)\(\);\s*$/,
    `
  window.__staticBuddyRuntime = {
    BUDDIES,
    SMT_FACTS,
    BUDDY_GREETING_LINES,
    BUDDY_PAGE_NUDGES,
  };
})();
`,
  );
  const noop = () => {};
  const storageStub = {
    getItem() {
      return null;
    },
    setItem: noop,
    removeItem: noop,
  };
  const context = {
    window: { addEventListener: noop },
    document: {
      addEventListener: noop,
      getElementById() {
        return null;
      },
    },
    localStorage: storageStub,
    sessionStorage: storageStub,
    location: { hash: '#/' },
    requestAnimationFrame: noop,
    setTimeout: noop,
    clearTimeout: noop,
    Date,
    Math,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { timeout: 3000 });
  return context.window.__staticBuddyRuntime;
}

function assertTranslatedString(value, label) {
  assert.equal(typeof value, 'string', `${label} should be a string`);
  assert.notEqual(value.trim(), '', `${label} should not be empty`);
  assert.doesNotMatch(value, /\b(?:TODO|TBD|undefined|null)\b/i, `${label} should be final copy`);
}

function assertTranslatedPair(pair, label) {
  assert.ok(pair, `${label} should exist`);
  assertTranslatedString(pair.en, `${label}.en`);
  assertTranslatedString(pair.sv, `${label}.sv`);
}

function assertEqualTranslatedPool(pool, label) {
  assert.ok(pool, `${label} should exist`);
  assert.ok(Array.isArray(pool.en), `${label}.en should be an array`);
  assert.ok(Array.isArray(pool.sv), `${label}.sv should be an array`);
  assert.ok(pool.en.length > 0, `${label}.en should not be empty`);
  assert.equal(
    pool.sv.length,
    pool.en.length,
    `${label} should expose the same number of Swedish and English lines`,
  );

  for (const lang of ['en', 'sv']) {
    pool[lang].forEach((line, index) => assertTranslatedString(line, `${label}.${lang}[${index}]`));
  }
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

function i18nTranslationMaps(appSource) {
  const i18nMatch = appSource.match(/const i18n = \(window\.i18n = \{([\s\S]*?)\n\}\);/);
  assert.ok(i18nMatch, 'static i18n dictionary should be present');
  return vm.runInNewContext(`({${i18nMatch[1]}\n})`, {}, { timeout: 3000 });
}

function appTranslationValues(appSource, includeKey) {
  return Object.values(i18nTranslationMaps(appSource)).flatMap((dictionary) =>
    Object.entries(dictionary)
      .filter(([key]) => includeKey(key))
      .map(([, value]) => value),
  );
}

function englishTranslationMap(appSource) {
  return new Map(Object.entries(i18nTranslationMaps(appSource).en));
}

function normalizeInlineHtml(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeHtmlText(value) {
  return normalizeInlineHtml(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseStaticFallbackI18nValues(html, includeKey) {
  const values = new Map();
  const elementStack = [];
  const htmlTokenPattern =
    /<!--[\s\S]*?-->|<\/([a-z][a-z0-9-]*)\s*>|<([a-z][a-z0-9-]*)\b([^>]*)>|([^<]+)/gi;
  let match;

  while ((match = htmlTokenPattern.exec(html))) {
    const [token, closingTag, openingTag, rawAttrs, text] = match;
    if (typeof text === 'string') {
      elementStack.at(-1)?.parts.push(text);
      continue;
    }

    if (openingTag) {
      elementStack.at(-1)?.parts.push(token);
      const key = rawAttrs.match(/\bdata-i18n="([^"]+)"/)?.[1];
      const selfClosing = /\/\s*>$/.test(token);
      if (key && includeKey(key) && !selfClosing) {
        elementStack.push({ key, parts: [], tag: openingTag.toLowerCase() });
      }
      continue;
    }

    if (closingTag) {
      const closingTagName = closingTag.toLowerCase();
      const currentElement = elementStack.at(-1);
      if (currentElement?.tag === closingTagName) {
        const completedElement = elementStack.pop();
        values.set(completedElement.key, normalizeInlineHtml(completedElement.parts.join('')));
        elementStack.at(-1)?.parts.push(token);
      } else {
        elementStack.at(-1)?.parts.push(token);
      }
    }
  }

  return values;
}

function staticFallbackI18nValues(indexHtml, keyPrefix) {
  return parseStaticFallbackI18nValues(indexHtml, (key) => key.startsWith(keyPrefix));
}

function staticFaqSection(indexHtml) {
  const faqMatch = indexHtml.match(/<section class="band faq"[\s\S]*?<\/section>/);
  assert.ok(faqMatch, 'static FAQ fallback section should be present');
  return faqMatch[0];
}

function staticFaqItems(faqSectionHtml) {
  return Array.from(
    faqSectionHtml.matchAll(
      /<details\b[^>]*\bclass="[^"]*\bfaq__item\b[^"]*"[^>]*>([\s\S]*?)<\/details>/g,
    ),
    (match) => match[1],
  );
}

function staticFaqPairKeys(faqItemHtml) {
  const keyPattern = /<(summary|p)\b[^>]*\bdata-i18n="(faq\.(\d+)\.(q|a))"[^>]*>[\s\S]*?<\/\1>/g;
  return Array.from(faqItemHtml.matchAll(keyPattern), (match) => ({
    tag: match[1],
    key: match[2],
    number: match[3],
    kind: match[4],
  }));
}

function staticFaqKeysOutsideSection(indexHtml) {
  const indexWithoutFaqSection = indexHtml.replace(staticFaqSection(indexHtml), '');
  return Array.from(
    indexWithoutFaqSection.matchAll(/\bdata-i18n="(faq\.[^"]+)"/g),
    (match) => match[1],
  );
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
const ebookFactboxSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.scb.se/mi0803-en',
  'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
];
const unsupportedEbookFactboxPatterns = [
  /Facts you'll see on the test/i,
  /what you'll see on the test/i,
  /\b69%\s+is\s+forest/i,
  /\b9%\s+lake/i,
  /35\s*000\s+km\s+of\s+coastline/i,
  /Coastline incl\. islands:\s*~35\s*000\s+km/i,
  /world's oldest central bank/i,
  /historically commits\s+~?1%\s+of\s+GNI/i,
  /Citizenship test starts:\s*6 June 2026/i,
];

const homeHeroFooterFallbackKeys = [
  'hero.eyebrow',
  'hero.h1a',
  'hero.h1c',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'footer.t1',
  'footer.t2',
  'footer.about.p',
  'footer.honest.p',
];

function assertStaticHomeHeroFooterFallbackParity(indexHtml, appSource) {
  const englishTranslations = englishTranslationMap(appSource);
  const fallbackValues = parseStaticFallbackI18nValues(indexHtml, (key) =>
    homeHeroFooterFallbackKeys.includes(key),
  );

  assert.deepEqual(
    Array.from(fallbackValues.keys()).sort(),
    [...homeHeroFooterFallbackKeys].sort(),
    'static Home hero and footer should expose every guarded no-JS fallback key',
  );

  for (const key of homeHeroFooterFallbackKeys) {
    assert.equal(typeof englishTranslations.get(key), 'string', `${key} should be in site/app.js`);
    assert.equal(
      fallbackValues.get(key),
      normalizeInlineHtml(englishTranslations.get(key)),
      `${key} no-JS fallback should match the English site/app.js dictionary`,
    );
  }
}

function assertStaticSourcesFallbackParity(indexHtml, appSource) {
  const englishTranslations = englishTranslationMap(appSource);
  const sourceDictionaryEntries = Array.from(englishTranslations.entries())
    .filter(([key]) => key.startsWith('sources.'))
    .map(([key, value]) => [key, normalizeHtmlText(value)]);
  const sourcesFallback = staticFallbackI18nValues(sourcesRoute(indexHtml), 'sources.');

  assert.deepEqual(
    Array.from(sourcesFallback.keys()).sort(),
    sourceDictionaryEntries.map(([key]) => key).sort(),
    'static Sources route should expose every guarded no-JS fallback key',
  );

  for (const [key, expectedValue] of sourceDictionaryEntries) {
    assert.equal(
      normalizeHtmlText(sourcesFallback.get(key)),
      expectedValue,
      `${key} no-JS fallback should match the English site/app.js dictionary`,
    );
  }
}

function questionProvenanceCounts() {
  return staticQuestionBank().reduce(
    (counts, question) => {
      counts[question.questionProvenance] = (counts[question.questionProvenance] || 0) + 1;
      return counts;
    },
    { uhr: 0, derived: 0, editorial: 0 },
  );
}

function assertSourcesFallbackMatchesProvenanceMix(indexHtml) {
  const sourcesFallback = sourcesRoute(indexHtml).replace(/\s+/g, ' ');
  const counts = questionProvenanceCounts();

  assert.match(
    sourcesFallback,
    new RegExp(`~${counts.uhr}\\s+questions\\s+cited\\s+directly`, 'i'),
    'Sources no-JS fallback should show the current direct-UHR question count',
  );
  assert.match(
    sourcesFallback,
    new RegExp(`~${counts.derived}\\s+questions\\s+written\\s+editorially`, 'i'),
    'Sources no-JS fallback should show the current derived-question count',
  );
  assert.match(
    sourcesFallback,
    /data-i18n="sources\.meta3\.v">UHR \+ derived</,
    'Current-bank fallback should name both provenance families',
  );

  [
    /current question bank cites UHR's public study material/i,
    /don't list other source families/i,
    /Every shipped question cites a chapter, section, and page/i,
    /The bank is UHR-only today/i,
    /data-i18n="sources\.meta3\.v">Sverige i fokus</i,
  ].forEach((pattern) => assert.doesNotMatch(sourcesFallback, pattern));
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

test('question provenance helpers fail closed for invalid tags and source-note copy', () => {
  const {
    filterQuestionsByProvenance,
    getProvenanceDescription,
    getProvenanceLabel,
    getQuestionProvenance,
  } = loadTs('lib/content/provenance.ts');
  const pool = [
    { id: 'uhr', tags: ['chapter-1'] },
    { id: 'derived', tags: ['published-variant'] },
    { id: 'editorial', tags: ['editorial'] },
  ];

  assert.equal(getQuestionProvenance(null), 'uhr');
  assert.equal(getQuestionProvenance(undefined), 'uhr');
  assert.equal(getQuestionProvenance({ tags: 'editorial' }), 'uhr');
  assert.equal(getQuestionProvenance({ tags: { includes: () => true } }), 'uhr');
  assert.equal(getQuestionProvenance({ tags: ['editorial', 1] }), 'uhr');
  assert.equal(getQuestionProvenance({ tags: ['editorial'] }), 'editorial');
  assert.equal(getQuestionProvenance({ tags: ['published-variant'] }), 'derived');
  assert.deepEqual(filterQuestionsByProvenance(null, { includeSupplementary: false }), []);
  assert.deepEqual(
    filterQuestionsByProvenance(pool, { includeSupplementary: 'yes' }).map(
      (question) => question.id,
    ),
    ['uhr'],
  );
  assert.deepEqual(
    filterQuestionsByProvenance(pool, { includeSupplementary: true }).map(
      (question) => question.id,
    ),
    ['uhr', 'derived', 'editorial'],
  );
  assert.equal(getProvenanceLabel('banana', 'sv'), 'UHR');
  assert.equal(
    getProvenanceDescription(null, 'en'),
    "Based on UHR's study material Sverige i fokus.",
  );
  assert.equal(getProvenanceLabel('derived', 'banana'), 'Tillägg');
});

test('static study-buddy copy keeps complete Swedish and English line pools', () => {
  const { BUDDIES, SMT_FACTS, BUDDY_GREETING_LINES, BUDDY_PAGE_NUDGES } = staticBuddyRuntime();

  assert.ok(Array.isArray(BUDDIES), 'BUDDIES should be exported to the static buddy runtime');
  assert.ok(BUDDIES.length > 0, 'BUDDIES should not be empty');
  for (const buddy of BUDDIES) {
    assertTranslatedString(buddy.id, `${buddy.id}.id`);
    assertTranslatedString(buddy.name, `${buddy.id}.name`);
    assertTranslatedPair(buddy.subtitle, `${buddy.id}.subtitle`);
    assertTranslatedPair(buddy.factPrefix, `${buddy.id}.factPrefix`);
    assertEqualTranslatedPool(buddy.tips, `${buddy.id}.tips`);
    assertEqualTranslatedPool(buddy.pet, `${buddy.id}.pet`);
  }

  assertEqualTranslatedPool(BUDDY_GREETING_LINES, 'buddy greetings');
  for (const [pathName, line] of Object.entries(BUDDY_PAGE_NUDGES)) {
    assertTranslatedString(pathName, `buddy page nudge route ${pathName}`);
    assertTranslatedPair(line, `buddy page nudge ${pathName}`);
  }

  assert.ok(Array.isArray(SMT_FACTS), 'SMT_FACTS should be exported to the static buddy runtime');
  assert.ok(SMT_FACTS.length > 0, 'SMT_FACTS should not be empty');
  SMT_FACTS.forEach((fact, index) => assertTranslatedPair(fact, `SMT_FACTS[${index}]`));
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

test('static Sources no-JS fallback mirrors the English dictionary', () => {
  assertStaticSourcesFallbackParity(read('site/index.html'), read('site/app.js'));
});

test('static Sources no-JS fallback matches the shipped provenance mix', () => {
  const indexHtml = read('site/index.html');
  assertSourcesFallbackMatchesProvenanceMix(indexHtml);

  assert.throws(
    () =>
      assertSourcesFallbackMatchesProvenanceMix(
        indexHtml.replace('>UHR + derived</span>', '>Sverige i fokus</span>'),
      ),
    /Current-bank fallback should name both provenance families/,
  );
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

test('static FAQ no-JS fallback keeps ordered question and answer pairs', () => {
  const indexHtml = read('site/index.html');
  const faqItems = staticFaqItems(staticFaqSection(indexHtml));

  assert.equal(faqItems.length, 6, 'static FAQ fallback should render exactly six items');
  assert.deepEqual(staticFaqKeysOutsideSection(indexHtml), []);

  const itemPairs = faqItems.map(staticFaqPairKeys);
  assert.deepEqual(
    itemPairs.map((pairKeys) => pairKeys.map(({ key }) => key)),
    [
      ['faq.1.q', 'faq.1.a'],
      ['faq.2.q', 'faq.2.a'],
      ['faq.3.q', 'faq.3.a'],
      ['faq.4.q', 'faq.4.a'],
      ['faq.5.q', 'faq.5.a'],
      ['faq.6.q', 'faq.6.a'],
    ],
  );

  for (const [index, pairKeys] of itemPairs.entries()) {
    const expectedNumber = String(index + 1);
    assert.deepEqual(
      pairKeys.map(({ tag, number, kind }) => ({ tag, number, kind })),
      [
        { tag: 'summary', number: expectedNumber, kind: 'q' },
        { tag: 'p', number: expectedNumber, kind: 'a' },
      ],
      `faq.${expectedNumber} should keep its summary immediately paired with its answer`,
    );
  }
});

test('static Home hero and footer no-JS fallback mirrors the English dictionary', () => {
  assertStaticHomeHeroFooterFallbackParity(read('site/index.html'), read('site/app.js'));
});

test('static Home hero and footer no-JS fallback rejects stale copy drift', () => {
  const indexHtml = read('site/index.html');
  const appSource = read('site/app.js');

  assert.throws(
    () =>
      assertStaticHomeHeroFooterFallbackParity(
        indexHtml.replace('>Start practising</a', '>Start studying to pass</a'),
        appSource,
      ),
    /hero\.cta1 no-JS fallback should match/,
  );
});

test('shared static copy guard rejects unsupported pass and passport outcome slogans', () => {
  assertNoUnsupportedStaticOutcomeSlogans(repoRoot);

  const indexHtml = read('site/index.html');
  assert.deepEqual(findStaticHeadMetadataTitleIssues(indexHtml), []);
  assert.match(
    findStaticHeadMetadataTitleIssues(
      indexHtml.replace(/(<title>)[\s\S]*?(<\/title>)/, '$1Almost Swedish — Study, fika, pass.$2'),
    )
      .map((issue) => issue.match)
      .join('\\n'),
    /Study,\s*fika,\s*pass/,
  );
});

test('shared static copy guard rejects unsupported team credential claims', () => {
  assertNoUnsupportedStaticTeamCredentialClaims(repoRoot);

  const englishCredentialIssues = findUnsupportedStaticTeamCredentialClaimsInSource(
    "built by people who've taken the " + 'test themselves',
    'fixture.js',
  );
  assert.equal(englishCredentialIssues.length, 1);
  assert.equal(englishCredentialIssues[0].label, 'English team test-taker claim');
  assert.equal(englishCredentialIssues[0].match, 'taken the ' + 'test themselves');
  assert.deepEqual(
    findUnsupportedStaticTeamCredentialClaimsInSource(
      'byggt av personer som själva har gjort provet',
      'fixture.js',
    ).map(({ label, match }) => [label, match]),
    [['Swedish self-completed test claim', 'själva har gjort provet']],
  );
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
