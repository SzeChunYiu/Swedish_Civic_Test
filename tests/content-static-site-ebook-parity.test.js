const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { assertNoUnsupportedStaticOutcomeSlogans } = require('../scripts/static-outcome-copy-guard');
const {
  assertNoUnsupportedStaticEbookCredentialClaims,
  assertNoUnsupportedStaticEbookCredentialText,
} = require('../scripts/static-ebook-credential-claim-guard');

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
const swedishEbookMockExamUnnaturalPatterns = [/provexempel/i];
const unsupportedEbookOutcomeClaimPatterns = [
  /Most people who pass this way/i,
  /three weeks,\s*not three days/i,
  /de flesta[^.?!]*(?:veckor|veckan)[^.?!]*(?:klarar|klara|godk[aä]n|prov)/i,
  /\b(?:typical|most)\s+(?:learners|people|users)[^.?!]*(?:pass|passing)[^.?!]*(?:days?|weeks?|months?)/i,
  /\b(?:pass|passing)\s+(?:rate|likelihood|chance|timeline)\b/i,
  /\b(?:guaranteed?|guarantees?)\s+(?:to\s+)?(?:pass|passing|approval)\b/i,
];
const unsupportedPracticalTestClaimPatterns = [
  phrasePattern('Format of ', 'the real test'),
  phrasePattern('multiple-choice ', 'and timed'),
  phrasePattern('Bring valid ', "ID\\s*\\(BankID,\\s*passport,\\s*or Swedish driver's licence\\)"),
  phrasePattern('Arrive 30 ', 'minutes early'),
  phrasePattern('test centre ', 'is strict'),
  phrasePattern('Multiple-choice:\\s*', 'every question'),
  phrasePattern('You may ', 'retake the test'),
  phrasePattern('There is a ', 'small fee'),
  phrasePattern('Language ', 'requirement:\\s*A2[–-]B1\\s*', '\\(separate test\\)'),
  phrasePattern('På provdagen är ', 'giltig legitimation'),
  phrasePattern('Tidsatt ', 'provträning'),
];
const staleChildApplicationClaimPatterns = [
  /children are usually included with a parent's application/i,
  /children can be included on a parent's citizenship application/i,
  /barn (?:kan|brukar|ska)[^.?!]{0,80}(?:stå med|ingå)[^.?!]{0,80}förälders/i,
];
const migrationsverketCitizenshipRulesUrl =
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html';
const officialPracticalTestSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
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

function assertNoSwedishEbookMockExamUnnaturalness(value) {
  for (const pattern of swedishEbookMockExamUnnaturalPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoUnsupportedEbookOutcomeClaim(value) {
  for (const pattern of unsupportedEbookOutcomeClaimPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoUnsupportedPracticalTestClaim(value) {
  for (const pattern of unsupportedPracticalTestClaimPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoStaleChildApplicationClaim(value) {
  for (const pattern of staleChildApplicationClaimPatterns) {
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

function annotatedProseParagraphs(html) {
  return Array.from(
    html.matchAll(
      /<p\b(?=[^>]*\bdata-source-claims="ebook")(?=[^>]*\bdata-source-scope="ebook")(?=[^>]*\bdata-source-keys="[^"]+")[^>]*>[\s\S]*?<\/p>/g,
    ),
    (match) => match[0],
  );
}

function renderedFootnoteItems(html) {
  return Array.from(html.matchAll(/<li id="eb-[^"]+-fn-\d+">[\s\S]*?<\/li>/g), (match) => match[0]);
}

test('static ebook source contains no stale untranslated placeholder copy', () => {
  const source = `${readSiteFile('site/ebook.js')}\n${readSiteFile('site/index.html')}`;

  assertNoUnsupportedStaticOutcomeSlogans(repoRoot);
  assertNoStaleEbookCopy(source);
  assertNoSwedishEbookQuizLoanwords(source);
  assertNoSwedishEbookMockExamUnnaturalness(source);
  assertNoUnsupportedEbookOutcomeClaim(source);
  assertNoUnsupportedPracticalTestClaim(source);
  assert.match(source, /function renderEbookProvenanceBadge\(lang,\s*footnotes\)/);
  assert.match(source, /const EBOOK_SOURCE_NOTES = Object\.freeze\(/);
  assert.match(source, /Starta [oö]vningsprov/);
  assert.match(source, /gör ett [oö]vningsprov/);
});

test('static ebook Swedish mock-exam wording uses övningsprov', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const swedishIntroHtml = renderChapter(harness, 'sv', 'intro');
  const swedishMockExamHtml = renderChapter(harness, 'sv', '12');
  const englishMockExamHtml = renderChapter(harness, 'en', '12');

  assertNoSwedishEbookMockExamUnnaturalness(source);
  assertNoSwedishEbookMockExamUnnaturalness(swedishIntroHtml);
  assertNoSwedishEbookMockExamUnnaturalness(swedishMockExamHtml);
  assert.match(source, /Starta [oö]vningsprov/);
  assert.match(source, /gör ett [oö]vningsprov/);
  assert.match(swedishIntroHtml, /Avsluta veckan med ett[\s\S]{0,80}[oö]vningsprov/);
  assert.match(swedishMockExamHtml, /Starta [oö]vningsprov/);
  assert.match(swedishMockExamHtml, /gör ett [oö]vningsprov/);
  assert.match(englishMockExamHtml, /Start mock exam/);
});

test('static ebook does not promise source-backed footnotes without citation coverage', () => {
  const source = `${readSiteFile('site/ebook.js')}\n${readSiteFile('site/index.html')}`;

  assert.equal(
    hasUnsupportedEbookSourcePromise(source) && !hasEbookCitationCoverage(source),
    false,
    'ebook source-backed or footnoted claims need ebook citation metadata or Sources-page coverage',
  );
});

test('static ebook intro avoids unsupported test-taker credential claims', () => {
  const harness = createEbookHarness();
  const englishHtml = renderChapter(harness, 'en', 'intro');
  const swedishHtml = renderChapter(harness, 'sv', 'intro');

  assertNoUnsupportedStaticEbookCredentialClaims(repoRoot);
  assertNoUnsupportedStaticEbookCredentialText(englishHtml, 'rendered english intro');
  assertNoUnsupportedStaticEbookCredentialText(swedishHtml, 'rendered swedish intro');
  assert.match(englishHtml, /public study material into calm, unofficial practice reading/);
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
    assertNoSwedishEbookMockExamUnnaturalness(swedishHtml);
    assertNoUnsupportedEbookOutcomeClaim(englishHtml);
    assertNoUnsupportedEbookOutcomeClaim(swedishHtml);
    assertNoUnsupportedPracticalTestClaim(englishHtml);
    assertNoUnsupportedPracticalTestClaim(swedishHtml);

    assert.match(englishHtml, /ebook__study-actions/);
    assert.match(swedishHtml, /ebook__study-actions/);
    assert.match(
      englishHtml,
      /class="ebook__provenance-badge ebook__provenance-badge--source-mix"/,
    );
    assert.match(
      swedishHtml,
      /class="ebook__provenance-badge ebook__provenance-badge--source-mix"/,
    );
    assert.match(
      englishHtml,
      /aria-label="Sources: \d+\. [^"]+\. Original study guide; verify facts through the Sources page and UHR material\."/,
    );
    assert.match(
      swedishHtml,
      /aria-label="Källor: \d+\. [^"]+\. Egen studieguide; kontrollera fakta via källsidan och UHR-materialet\."/,
    );
    assert.match(englishHtml, />Sources: \d+<\/span>/);
    assert.match(swedishHtml, />Källor: \d+<\/span>/);
    assert.match(englishHtml, /data-source-scope="ebook"/);
    assert.match(swedishHtml, /data-source-scope="ebook"/);
    assert.match(englishHtml, /href="#\/mock"/);
    assert.match(swedishHtml, /href="#\/mock"/);
    assert.match(englishHtml, /href="#\/sources"/);
    assert.match(swedishHtml, /href="#\/sources"/);
    assert.match(swedishHtml, /[OÖ]vningsprov/);

    if (chapterId === 'intro') {
      assert.match(englishHtml, /What this book is/);
      assert.match(englishHtml, /Short, repeated sessions make it easier/);
      assert.match(swedishHtml, /Vad den h[aä]r boken [aä]r/);
      assert.match(swedishHtml, /gör en övning/);
      assert.doesNotMatch(swedishHtml, /gör ett\s+quiz/i);
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
        assert.match(englishHtml, /Facts to review|Current citizenship notes/);
        assert.match(swedishHtml, /Det viktigaste/);
        assert.match(swedishHtml, /Plugga smart/);
        assert.match(swedishHtml, /Fakta att repetera/);
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

test('static ebook chapters render source footnotes for every prose paragraph', () => {
  const harness = createEbookHarness();

  for (const chapterId of getExpectedChapterIds().filter((id) => id !== 'intro')) {
    const englishHtml = renderChapter(harness, 'en', chapterId);
    const swedishHtml = renderChapter(harness, 'sv', chapterId);
    const englishParagraphs = annotatedProseParagraphs(englishHtml);
    const swedishParagraphs = annotatedProseParagraphs(swedishHtml);
    const englishFootnotes = renderedFootnoteItems(englishHtml);
    const swedishFootnotes = renderedFootnoteItems(swedishHtml);

    assert.ok(englishParagraphs.length > 0, `chapter ${chapterId} should annotate English prose`);
    assert.ok(swedishParagraphs.length > 0, `chapter ${chapterId} should annotate Swedish prose`);
    assert.equal(
      englishFootnotes.length,
      englishParagraphs.length,
      `chapter ${chapterId} should render one English footnote per prose paragraph`,
    );
    assert.equal(
      swedishFootnotes.length,
      swedishParagraphs.length,
      `chapter ${chapterId} should render one Swedish footnote per prose paragraph`,
    );
    assert.match(englishHtml, /class="ebook__footnotes"/);
    assert.match(swedishHtml, /class="ebook__footnotes"/);
    assert.match(englishHtml, /UHR public study material/);
    assert.match(swedishHtml, /UHR public study material/);
    assert.doesNotMatch(englishHtml, />Editorial<\/span>/);
    assert.doesNotMatch(swedishHtml, />Redaktionell<\/span>/);
  }
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

test('static ebook chapter 11 keeps child citizenship application rules current', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const englishHtml = renderChapter(harness, 'en', '11');
  const swedishHtml = renderChapter(harness, 'sv', '11');

  assertNoStaleChildApplicationClaim(source);
  assertNoStaleChildApplicationClaim(englishHtml);
  assertNoStaleChildApplicationClaim(swedishHtml);

  assert.match(englishHtml, /From 6 June 2026/);
  assert.match(
    englishHtml,
    /children can no longer be included on a parent's citizenship application/,
  );
  assert.match(englishHtml, /separate application signed by a guardian/);
  assert.match(englishHtml, /Children need a separate citizenship application from 6 June 2026/);

  assert.match(swedishHtml, /Från 6 juni 2026/);
  assert.match(swedishHtml, /barn inte längre stå med på en förälders medborgarskapsansökan/);
  assert.match(swedishHtml, /barnet behöver en egen ansökan/);
  assert.match(swedishHtml, /vårdnadshavare skriver under/);

  assert.match(source, /Migrationsverket citizenship rule changes from 6 June 2026/);
  assert.match(source, /retrievedDate: '2026-05-20'/);
  assert.match(source, new RegExp(migrationsverketCitizenshipRulesUrl));
});
