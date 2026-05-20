const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

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

  assertNoStaleEbookCopy(source);
  assertNoSwedishEbookQuizLoanwords(source);
  assertNoUnsupportedEbookOutcomeClaim(source);
  assertNoUnsupportedPracticalTestClaim(source);
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
      } else {
        assert.match(englishHtml, /Facts you'll see on the test/);
        assert.match(swedishHtml, /Det viktigaste/);
        assert.match(swedishHtml, /Plugga smart/);
        assert.match(swedishHtml, /Fakta att kunna/);
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
