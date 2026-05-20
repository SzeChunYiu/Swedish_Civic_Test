const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { assertNoUnsupportedStaticOutcomeSlogans } = require('../scripts/static-outcome-copy-guard');

const repoRoot = path.resolve(__dirname, '..');
const phrasePattern = (...parts) => new RegExp(parts.join(''), 'i');
const staleEbookCopyPatterns = [
  /Svenska [oö]vers[aä]ttningen kommer/i,
  /p[aå] engelska tills vidare/i,
  /kommer i v1\.1/i,
  /friendly stubs/i,
  /We're writing this chapter now/i,
  /Coming soon/i,
  /Kommer snart/i,
];
const swedishEbookQuizLoanwordPatterns = [
  phrasePattern('gör ett ', 'quiz'),
  phrasePattern('quiz', 'frågor'),
  phrasePattern('quiz', 'pass'),
  phrasePattern('quiz', 'et'),
];
const unsupportedEbookOutcomeClaimPatterns = [
  /Most people who pass this way/i,
  /three weeks,\s*not three days/i,
  /de flesta[^.?!]*(?:veckor|veckan)[^.?!]*(?:klarar|klara|godk[aä]n|prov)/i,
  /\b(?:typical|most)\s+(?:learners|people|users)[^.?!]*(?:pass|passing)[^.?!]*(?:days?|weeks?|months?)/i,
  /\b(?:pass|passing)\s+(?:rate|likelihood|chance|timeline)\b/i,
  /\b(?:guaranteed?|guarantees?)\s+(?:to\s+)?(?:pass|passing|approval)\b/i,
];
const staleEbookWelfareClaimPatterns = [
  /schools and university \(free for citizens and permanent residents\)/i,
  /University tuition:\s*free for residents/i,
  /parental leave \(480 days per child, split between parents\)/i,
  /90 are reserved for each parent \(the "pappamånader"\)/i,
  /typically\s+100[–-]400\s+SEK/i,
  /Children's healthcare is free/i,
  /Föräldraledighet:\s*480 dagar per barn/i,
];
const welfareCurrentnessSourceUrls = [
  'https://www.skatteverket.se/privat/etjansterochblanketter/svarpavanligafragor/inkomstavtjanst/privattjansteinkomsterfaq/narskamanbetalastatliginkomstskattochhurhogarden.5.10010ec103545f243e8000166.html',
  'https://www.universityadmissions.se/en/fees-scholarships-residence-permit/who-is-required-to-pay-fees/',
  'https://www.forsakringskassan.se/english/parents/when-the-child-is-born/parental-benefit',
  'https://www.1177.se/sa-fungerar-varden/kostnader-och-ersattningar/patientavgifter/',
];
const factboxSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.scb.se/mi0803-en',
  'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
];
const unsupportedFactboxPatterns = [
  /Facts you'll see on the test/i,
  /what you'll see on the test/i,
  /\b69%\s+is\s+forest/i,
  /\b9%\s+lake/i,
  /35\s*000\s+km\s+of\s+coastline/i,
  /Coastline incl\. islands:\s*~35\s*000\s+km/i,
  /historically commits\s+~?1%\s+of\s+GNI/i,
  /Citizenship test starts:\s*6 June 2026/i,
];

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readStaticChapterMeta() {
  const context = { console, window: {} };
  context.globalThis = context;
  vm.runInNewContext(readSiteFile('site/questions.js'), context, {
    filename: 'site/questions.js',
  });

  const meta = context.window.SMT_CHAPTERS_META || context.SMT_CHAPTERS_META;
  assert.ok(Array.isArray(meta), 'site/questions.js should expose SMT_CHAPTERS_META');

  return meta.map((chapter) => ({ id: String(chapter.id) }));
}

function getExpectedChapterIds() {
  return ['intro', ...readStaticChapterMeta().map((chapter) => chapter.id)];
}

function getEbookNavChapterIds() {
  return Array.from(
    readSiteFile('site/index.html').matchAll(/<a\s+[^>]*data-eb="([^"]+)"/g),
    (match) => match[1],
  );
}

function createEbookHarness() {
  const chapterIds = getExpectedChapterIds();
  const reader = { innerHTML: '', scrollTop: 0 };
  const navAnchors = chapterIds.map((id) => ({
    dataset: { eb: id },
    classList: { toggle() {} },
  }));
  const localStorageValues = new Map();
  const localStorage = {
    getItem(key) {
      return localStorageValues.has(key) ? localStorageValues.get(key) : null;
    },
    setItem(key, value) {
      localStorageValues.set(key, String(value));
    },
  };
  const location = { hash: '#/ebook' };
  const document = {
    addEventListener() {},
    getElementById(id) {
      return id === 'ebook-reader' ? reader : null;
    },
    querySelectorAll(selector) {
      return selector === '.ebook__nav a[data-eb]' ? navAnchors : [];
    },
  };
  const window = {
    addEventListener() {},
    localStorage,
    location,
    smtApplyEbookHighlights() {},
  };
  const context = {
    console,
    document,
    localStorage,
    location,
    setTimeout(callback) {
      callback();
      return 0;
    },
    window,
  };
  context.globalThis = context;

  vm.runInNewContext(readSiteFile('site/ebook.js'), context, { filename: 'site/ebook.js' });

  return { localStorage, location, reader, window };
}

function renderChapter(harness, lang, chapterId) {
  harness.localStorage.setItem('smt_lang', lang);
  harness.location.hash = `#/ebook?c=${chapterId}`;
  harness.reader.innerHTML = '';
  harness.window.smtEbookRender();
  return harness.reader.innerHTML;
}

function assertNoStaleEbookCopy(value) {
  for (const pattern of staleEbookCopyPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoSwedishEbookQuizLoanwords(value) {
  for (const pattern of swedishEbookQuizLoanwordPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoUnsupportedEbookOutcomeClaim(value) {
  for (const pattern of unsupportedEbookOutcomeClaimPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoStaleEbookWelfareClaim(value) {
  for (const pattern of staleEbookWelfareClaimPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoUnsupportedFactboxClaim(value) {
  for (const pattern of unsupportedFactboxPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function hasUnsupportedEbookSourcePromise(value) {
  return [
    /source-backed\s+chapters/i,
    /source-backed\s+ebook/i,
    /ebook\s+claims?\s+are\s+footnoted/i,
    /every\s+claim\s+here\s+is\s+footnoted/i,
    /footnoted\s+in\s+the\s+sources\s+page/i,
  ].some((pattern) => pattern.test(value));
}

function hasEbookCitationCoverage(value) {
  return [
    /data-source-claims="ebook"/i,
    /data-source-scope="ebook"/i,
    /EBOOK_SOURCE_NOTES/,
    /ebookSourceNotes/,
  ].some((pattern) => pattern.test(value));
}

test('static ebook source contains no stale untranslated placeholder copy', () => {
  const source = `${readSiteFile('site/ebook.js')}\n${readSiteFile('site/index.html')}`;

  assertNoUnsupportedStaticOutcomeSlogans(repoRoot);
  assertNoStaleEbookCopy(source);
  assertNoSwedishEbookQuizLoanwords(source);
  assertNoUnsupportedEbookOutcomeClaim(source);
  assertNoStaleEbookWelfareClaim(source);
  assert.match(source, /function renderEbookProvenanceBadge\(lang\)/);
});

test('static ebook does not promise source-backed footnotes without citation coverage', () => {
  const source = `${readSiteFile('site/ebook.js')}\n${readSiteFile('site/index.html')}`;

  assert.equal(
    hasUnsupportedEbookSourcePromise(source) && !hasEbookCitationCoverage(source),
    false,
    'ebook source-backed or footnoted claims need ebook citation metadata or Sources-page coverage',
  );
});

test('static ebook welfare claims are current and source dated', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const chapter4En = renderChapter(harness, 'en', '4');
  const chapter5En = renderChapter(harness, 'en', '5');
  const chapter6En = renderChapter(harness, 'en', '6');
  const chapter4Sv = renderChapter(harness, 'sv', '4');
  const chapter5Sv = renderChapter(harness, 'sv', '5');
  const chapter6Sv = renderChapter(harness, 'sv', '6');
  const renderedWelfareHtml = [
    chapter4En,
    chapter5En,
    chapter6En,
    chapter4Sv,
    chapter5Sv,
    chapter6Sv,
  ].join('\n');

  assertNoStaleEbookWelfareClaim(source);
  assertNoStaleEbookWelfareClaim(renderedWelfareHtml);
  assert.match(source, /EBOOK_WELFARE_CURRENTNESS_SOURCES/);
  assert.match(source, /retrieved:\s*'2026-05-19'/);
  for (const url of welfareCurrentnessSourceUrls) {
    assert.match(source, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(chapter4En, /2026 state income-tax threshold:\s*643,000 SEK/);
  assert.match(chapter4En, /University Admissions fee exemptions/);
  assert.match(chapter4Sv, /statlig inkomstskatt [öo]ver 643 000 kr/);
  assert.match(chapter5En, /Reserved per parent:\s*90 sickness-benefit-level days/);
  assert.match(chapter5Sv, /90 sjukpenningniv[aå]dagar per f[oö]r[aä]lder/);
  assert.match(chapter6En, /Patient fees vary by region/);
  assert.match(
    chapter6En,
    /Medicines within the medicine high-cost protection are free for children under 18/,
  );
  assert.match(chapter6Sv, /Patientavgifter varierar/);
  assert.match(renderedWelfareHtml, /Sources? checked 2026-05-19/);
  assert.match(renderedWelfareHtml, /K[äa]llor? kontrollerade 2026-05-19/);
});

test('static ebook navigation covers every shipped static chapter', () => {
  const expectedChapterIds = getExpectedChapterIds();

  assert.equal(expectedChapterIds.at(-1), '13');
  assert.deepEqual(getEbookNavChapterIds(), expectedChapterIds);
});

test('static ebook renders every chapter with Swedish and English body parity', () => {
  const harness = createEbookHarness();

  for (const chapterId of getExpectedChapterIds()) {
    const englishHtml = renderChapter(harness, 'en', chapterId);
    const swedishHtml = renderChapter(harness, 'sv', chapterId);

    assertNoStaleEbookCopy(englishHtml);
    assertNoStaleEbookCopy(swedishHtml);
    assertNoSwedishEbookQuizLoanwords(swedishHtml);
    assertNoUnsupportedEbookOutcomeClaim(englishHtml);
    assertNoUnsupportedEbookOutcomeClaim(swedishHtml);
    assertNoUnsupportedPracticalTestClaim(englishHtml);
    assertNoUnsupportedPracticalTestClaim(swedishHtml);
    assertNoUnsupportedFactboxClaim(englishHtml);
    assertNoUnsupportedFactboxClaim(swedishHtml);

    assert.match(englishHtml, /ebook__study-actions/);
    assert.match(swedishHtml, /ebook__study-actions/);
    assert.match(englishHtml, /class="ebook__provenance-badge"/);
    assert.match(swedishHtml, /class="ebook__provenance-badge"/);
    assert.match(
      englishHtml,
      /aria-label="Provenance: Editorial\. Original study guide; verify facts through the Sources page and UHR material\."/,
    );
    assert.match(
      swedishHtml,
      /aria-label="Källtyp: Redaktionell\. Egen studieguide; kontrollera fakta via källsidan och UHR-materialet\."/,
    );
    assert.match(englishHtml, />Editorial<\/span>/);
    assert.match(swedishHtml, />Redaktionell<\/span>/);
    assert.match(englishHtml, /href="#\/mock"/);
    assert.match(swedishHtml, /href="#\/mock"/);
    assert.match(englishHtml, /href="#\/sources"/);
    assert.match(swedishHtml, /href="#\/sources"/);
    assert.doesNotMatch(swedishHtml, /provexempel/i);

    if (chapterId === 'intro') {
      assert.match(englishHtml, /What this book is/);
      assert.match(englishHtml, /Short, repeated sessions make it easier/);
      assert.match(swedishHtml, /Vad den h[aä]r boken [aä]r/);
      assert.match(swedishHtml, /gör en övning/);
    } else {
      assert.doesNotMatch(englishHtml, /<div class="ebook__crumb">How to read this book<\/div>/);
      assert.doesNotMatch(
        swedishHtml,
        /<div class="ebook__crumb">Hur man l[aä]ser den h[aä]r boken<\/div>/,
      );
      if (chapterId === '12') {
        assert.match(englishHtml, /Current official status/);
        assert.match(swedishHtml, /Aktuell officiell status/);
        assert.match(swedishHtml, /Kapitel 12 · [OÖ]vningsprov/);
        assert.match(swedishHtml, /Starta [oö]vningsprov/);
      } else {
        assert.match(englishHtml, /Facts to review/);
        assert.match(swedishHtml, /Det viktigaste/);
        assert.match(swedishHtml, /Plugga smart/);
        assert.match(swedishHtml, /Fakta att repetera/);
        assert.match(englishHtml, /Sources accessed 2026-05-19/);
        assert.match(swedishHtml, /Källor hämtade 2026-05-19/);
      }
    }

    if (chapterId === '13') {
      assert.match(englishHtml, /Traditions,.+holidays, and change/s);
      assert.match(englishHtml, /National Day and civic ceremonies/);
      assert.match(swedishHtml, /Traditioner,.+h[oö]gtider och f[oö]r[aä]ndring/s);
      assert.match(englishHtml, /href="#\/practice\?c=13"/);
      assert.match(swedishHtml, /href="#\/practice\?c=13"/);
      assert.match(englishHtml, />13 \/ 13</);
      assert.match(swedishHtml, />13 \/ 13</);
    }

    assert.doesNotMatch(swedishHtml, /Facts you'll see on the test/);
    assert.doesNotMatch(swedishHtml, /Practice chapter/);
    assert.doesNotMatch(swedishHtml, /Chapter highlights/);
    assert.doesNotMatch(swedishHtml, /Next study steps/);
  }
});

test('static ebook factboxes carry retrieved source notes for current and quantitative facts', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();

  assert.match(source, /const EBOOK_FACTBOX_SOURCE_NOTES = Object\.freeze\(/);
  assert.match(source, /function ebookFactBox\(lang, heading, facts/);
  assert.match(source, /retrievedDate: '2026-05-19'/);
  factboxSourceUrls.forEach((url) => assert.match(source, new RegExp(url)));
  assertNoUnsupportedFactboxClaim(source);

  const natureEn = renderChapter(harness, 'en', '7');
  const natureSv = renderChapter(harness, 'sv', '7');
  assert.match(natureEn, /Statistics Sweden land-use statistics/);
  assert.match(natureSv, /SCB markanvändningsstatistik/);
  assertNoUnsupportedFactboxClaim(natureEn);
  assertNoUnsupportedFactboxClaim(natureSv);

  const moneyEn = renderChapter(harness, 'en', '9');
  const moneySv = renderChapter(harness, 'sv', '9');
  assert.match(moneyEn, /Sveriges Riksbank history/);
  assert.match(moneySv, /Riksbankens historik/);

  const worldEn = renderChapter(harness, 'en', '10');
  const worldSv = renderChapter(harness, 'sv', '10');
  assert.match(worldEn, /Government Offices: Sweden is a NATO member/);
  assert.match(worldSv, /Regeringskansliet: Sverige är medlem i Nato/);
});

test('static ebook chapter 12 keeps practical test claims current and sourced', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const englishHtml = renderChapter(harness, 'en', '12');
  const swedishHtml = renderChapter(harness, 'sv', '12');

  assertNoUnsupportedPracticalTestClaim(source);
  assertNoUnsupportedPracticalTestClaim(englishHtml);
  assertNoUnsupportedPracticalTestClaim(swedishHtml);

  assert.match(source, /const OFFICIAL_TEST_SOURCE_NOTES = Object\.freeze\(/);
  assert.match(source, /retrievedDate: '2026-05-19'/);
  officialPracticalTestSourceUrls.forEach((url) => assert.match(source, new RegExp(url)));

  assert.match(englishHtml, /15 August 2026 in Stockholm/);
  assert.match(englishHtml, /Migrationsverket letter/);
  assert.match(englishHtml, /Seats are limited/);
  assert.match(englishHtml, /free of charge/);
  assert.match(englishHtml, /generous time/);
  assert.match(englishHtml, /Practical details pending from UHR/);
  assert.match(englishHtml, /Sources accessed 2026-05-19/);

  assert.match(swedishHtml, /15 augusti 2026 i Stockholm/);
  assert.match(swedishHtml, /brev från Migrationsverket/);
  assert.match(swedishHtml, /Antalet platser är begränsat/);
  assert.match(swedishHtml, /kostnadsfritt/);
  assert.match(swedishHtml, /generöst med tid/);
  assert.match(swedishHtml, /Praktiska detaljer väntar hos UHR/);
  assert.match(swedishHtml, /Källor hämtade 2026-05-19/);

  officialPracticalTestSourceUrls.forEach((url) => {
    assert.match(englishHtml, new RegExp(url));
    assert.match(swedishHtml, new RegExp(url));
  });
});
