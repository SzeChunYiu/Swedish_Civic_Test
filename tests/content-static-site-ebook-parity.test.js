const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
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
const staticEbookBareCivicTermPattern =
  /(^|[^\p{L}\p{N}_-])(region|kommun)(?=$|[^\p{L}\p{N}_-])/giu;
const swedishEbookMockExamUnnaturalPatterns = [/provexempel/i];
const staticEbookExtraLanguages = [
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
];
const chapter13EnglishHolidayGlossPattern =
  /[（(](?:Easter|Midsummer Eve|Christmas|New Year's Eve|First of May|Walpurgis Night|All Saints' Day|Advent)[）)]/i;
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
const staticEbookSourceAuthorityPhrasingPatterns = [
  /\bUHR says\b/i,
  /\bUHR\s+describes\b/i,
  /\bUHR\s+beskriver\b/i,
  /UHR\s+表示/,
  /تقول\s+UHR|وتقول\s+UHR/,
  /UHR\s+دەڵێت/,
  /UHR\s+می.?گوید/,
  /\bUHR\s+podaje\b/i,
  /\bUHR\s+wyraźnie\s+podaje\b/i,
  /UHR\s+waxay\s+sheeg(?:aysaa|tay)/i,
  /\bUHR[^.?!<]{0,80}(?:söylüyor|belirtiyor)\b/i,
  /UHR\s+повідомляє/i,
  /UHR\s+ከም\s+ዝብሎ|UHR[^።<]{0,120}ይብል/,
];
const staticEbookSomaliHolidayFoodTokenPatterns = [/\bherring\b/i];
const staticEbookSomaliHolidayFoodRequiredCopy = [
  'Habeenka Bartamaha Xagaaga',
  'kalluun la dhanaaniyey',
  'baradho cusub iyo farawle',
];
const staticEbookFoodBeverageSourceChapterIds = ['8', '13'];
const staticEbookFoodBeverageSourceTokenPatterns = [
  /\bherring\b/i,
  /\bstrawberries\b/i,
  /\bschnapps\b/i,
];
const staleChildApplicationClaimPatterns = [
  /children are usually included with a parent's application/i,
  /children can be included on a parent's citizenship application/i,
  /barn (?:kan|brukar|ska)[^.?!]{0,80}(?:stå med|ingå)[^.?!]{0,80}förälders/i,
];
const staleCitizenshipConductClaimPatterns = [
  /Have led an orderly life\s*[—-]\s*no significant criminal record/i,
  /Standard residence requirement:\s*5 years/i,
  /no significant criminal record/i,
  /Standardowy wymóg pobytu:\s*5 lat/i,
  /niekaralnoś|rejestr karn|karalnoś/i,
  /Standart ikamet şartı:\s*5 yıl/i,
  /sabıka kayd|adli sicil|önemli suç kaydı/i,
  /Стандартна вимога щодо проживання:\s*5 років/i,
  /судиміст|кримінальн.{0,24}запис|відсутність.{0,40}правопоруш/i,
  /شرط الإقامة المعتاد:\s*5 سنوات/i,
  /سجل جنائي|سوابق جنائية|لا[^.؟<]{0,40}جنائي/i,
  /شرط اقامت استاندارد:\s*5 سال/i,
  /سوءپیشینه|سابقهٔ کیفری|سابقه کیفری/i,
  /标准居留要求：5 年/i,
  /无(?:重大)?犯罪记录|無(?:重大)?犯罪記錄|犯罪纪录|犯罪紀錄/i,
  /標準居留要求：5 年/i,
  /Shuruudda deganaanshaha caadiga ah:\s*5 sano/i,
  /diiwaan dembi|diiwaan ciqaab/i,
  /مەرجی نیشتەجێبوونی ستاندارد:\s*5 ساڵ/i,
  /تۆماری تاوان|پێشینەی تاوان/i,
  /ስሩዕ ረቛሒ መንበሪ፦\s*5 ዓመት/i,
  /መዝገብ.{0,20}ገበን|ዘይ.{0,20}ገበን/i,
];
const staticEbookChapter11ConductCurrentnessByLocale = {
  'zh-Hans': {
    date: /2026 年 6 月 6 日/,
    residence: /主要规则为八年|主要居留规则：8 年/,
    conduct: /更严格的行为要求/,
    waiting: /更长的等待期|等待期更长/,
    decision: /逐案决定|裁定机关：Migrationsverket/,
  },
  'zh-Hant': {
    date: /2026 年 6 月 6 日/,
    residence: /主要規則為八年|主要居留規則：8 年/,
    conduct: /更嚴格的行為要求/,
    waiting: /更長的等待期|等待期更長/,
    decision: /逐案決定|裁定機關：Migrationsverket/,
  },
  ar: {
    date: /6 يونيو 2026/,
    residence: /ثماني سنوات|8 سنوات/,
    conduct: /شرط السلوك الأكثر صرامة|شرط سلوك أكثر صرامة/,
    waiting: /فترة انتظار أطول|فترات انتظار أطول/,
    decision: /كل حالة على حدة|الجهة صاحبة القرار:\s*Migrationsverket/,
  },
  ckb: {
    date: /6ی حوزەیرانی 2026/,
    residence: /هەشت ساڵ|8 ساڵ/,
    conduct: /مەرجی ڕەفتاری توندتر/,
    waiting: /ماوەی چاوەڕوانیی درێژتر|چاوەڕوانیی درێژتر/,
    decision: /هەر دۆسیەیەک|دەسەڵاتی بڕیاردان:\s*Migrationsverket/,
  },
  fa: {
    date: /6 ژوئن 2026/,
    residence: /هشت سال|8 سال/,
    conduct: /شرط سخت‌گیرانه‌تر مربوط به رفتار/,
    waiting: /دورهٔ انتظار طولانی‌تر|دوره‌های انتظار طولانی‌تر/,
    decision: /هر پرونده|مرجع تصمیم‌گیری:\s*Migrationsverket/,
  },
  pl: {
    date: /6 czerwca 2026/,
    residence: /osiem lat|8 lat/,
    conduct: /surowszy wymóg dotyczący prowadzenia się|Surowszy wymóg prowadzenia się/,
    waiting: /dłuższy okres oczekiwania|dłuższe okresy oczekiwania/,
    decision: /indywidualne sprawy|Organ decyzyjny:\s*Migrationsverket/,
  },
  so: {
    date: /6 Juun 2026/,
    residence: /siddeed sano|8 sano/,
    conduct: /shuruudda dhaqanka oo la adkeeyay|Shuruud dhaqan oo la adkeeyay/,
    waiting: /muddo sugitaan oo dheer|sugitaan dheer/,
    decision: /kiis kasta|Maamulka go'aaminta:\s*Migrationsverket/,
  },
  ti: {
    date: /6 ሰነ 2026/,
    residence: /ሸሞንተ ዓመት|8 ዓመት/,
    conduct: /ዝተጠናኸረ ናይ ጠባይ ረቛሒ/,
    waiting: /ዝነውሐ ግዜ ምጽባይ|ድሕሪ ገበናት ዝነውሐ ምጽባይ/,
    decision: /ነፍሲ ወከፍ ጉዳይ|ወሳኒ ኣካል፦\s*Migrationsverket/,
  },
  tr: {
    date: /6 Haziran 2026/,
    residence: /sekiz yıldır|8 yıl/,
    conduct: /Daha sıkı davranış şartı|daha sıkı davranış şartını/,
    waiting: /daha uzun bekleme süresi|daha uzun bekleme süreleri/,
    decision: /her dosyayı ayrı değerlendirir|Karar makamı:\s*Migrationsverket/,
  },
  uk: {
    date: /6 червня 2026/,
    residence: /вісім років|8 років/,
    conduct: /суворішій вимозі щодо поведінки|Суворіша вимога щодо поведінки/,
    waiting: /довший період очікування|довші строки очікування/,
    decision: /кожну справу окремо|Орган, що ухвалює рішення:\s*Migrationsverket/,
  },
};
const migrationsverketCitizenshipRulesUrl =
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html';
const officialPracticalTestSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
];
const officialPracticalTestSourceKeys = [
  'uhrOfficialTestAbout',
  'uhrOfficialTestFaq',
  'uhrOfficialTestSignup',
  'uhrOfficialTestStudyMaterial',
];
const officialPracticalTestSignupSourceKeys = ['uhrOfficialTestAbout', 'uhrOfficialTestSignup'];
const officialPracticalTestLanguageSourceKeys = ['uhrOfficialTestFaq'];
const officialPracticalTestSeatsSourceKeys = ['uhrOfficialTestAbout', 'uhrOfficialTestFaq'];
const officialPracticalTestPendingSourceKeys = [
  'uhrOfficialTestAbout',
  'uhrOfficialTestStudyMaterial',
  'editorialCommentary',
];
const expectedSafeEbookExternalSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.scb.se/mi0803-en',
  'https://www.riksbank.se/en-gb/about-the-riksbank/history/historical-timeline/1600-1699/sveriges-riksbank-is-founded/',
  'https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/',
  ...officialPracticalTestSourceUrls,
];

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runFocusedStaticEbookFootnoteHashValidator() {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-static-ebook-footnote-hash-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: process.env,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const jsonStart = result.stdout.indexOf('{');
  assert.notEqual(jsonStart, -1, result.stdout);
  return JSON.parse(result.stdout.slice(jsonStart));
}

function runFocusedStaticEbookProvenanceValidator() {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-static-ebook-provenance'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: process.env,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const jsonStart = result.stdout.indexOf('{');
  assert.notEqual(jsonStart, -1, result.stdout);
  return JSON.parse(result.stdout.slice(jsonStart));
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

function getStaticSiteLanguages() {
  return Array.from(
    readSiteFile('site/index.html').matchAll(/<button\s+[^>]*data-lang="([^"]+)"/g),
    (match) => match[1],
  );
}

function createEbookHarness(ebookSource = readSiteFile('site/ebook.js')) {
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

  vm.runInNewContext(ebookSource, context, { filename: 'site/ebook.js' });

  return { localStorage, location, reader, window };
}

function renderChapter(harness, lang, chapterId) {
  harness.localStorage.setItem('smt_lang', lang);
  harness.location.hash = `#/ebook?c=${chapterId}`;
  harness.reader.innerHTML = '';
  harness.window.smtEbookRender();
  return harness.reader.innerHTML;
}

function sourceWithExportedPracticeLinks() {
  const source = readSiteFile('site/ebook.js');
  const marker = '  function practiceLink(id) {';

  assert.match(source, /const PRACTICE_LINKS = \{/);
  assert.ok(
    source.includes(marker),
    'site/ebook.js should define practiceLink after PRACTICE_LINKS',
  );

  return source.replace(marker, `  window.__TEST_PRACTICE_LINKS__ = PRACTICE_LINKS;\n${marker}`);
}

function renderedPrimaryPracticeLink(html) {
  const match = html.match(/<a class="btn btn--gold btn--sm" href="([^"]+)">([^<]+) →<\/a>/);

  assert.ok(
    match,
    `ebook rendered HTML should include primary practice CTA: ${html.slice(0, 500)}`,
  );

  return { href: match[1], label: match[2] };
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

function assertNoBareStaticEbookCivicTerms(value, label) {
  const offenders = Array.from(value.matchAll(staticEbookBareCivicTermPattern), (match) => ({
    context: staticEbookCivicTermContext(value, match.index ?? 0),
    term: match[2],
  }));
  assert.deepEqual(offenders, [], `${label} should localize kommun/region civic terms`);
}

function staticEbookCivicTermContext(value, index) {
  return value
    .slice(Math.max(0, index - 90), index + 150)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertNoSwedishEbookMockExamUnnaturalness(value) {
  for (const pattern of swedishEbookMockExamUnnaturalPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoChapter13EnglishHolidayGloss(value, label) {
  assert.doesNotMatch(
    value,
    chapter13EnglishHolidayGlossPattern,
    `${label} should not contain parenthetical English common-holiday glosses`,
  );
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

function assertNoStaticEbookSourceAuthorityPhrasing(value) {
  for (const pattern of staticEbookSourceAuthorityPhrasingPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertSomaliChapter13HolidayFoodIsLocalized(value) {
  for (const pattern of staticEbookSomaliHolidayFoodTokenPatterns) {
    assert.doesNotMatch(value, pattern);
  }
  for (const copy of staticEbookSomaliHolidayFoodRequiredCopy) {
    assert.match(value, new RegExp(escapeRegExp(copy)));
  }
}

function findStaticEbookExtraLocaleFoodBeverageSourceOffenders(source) {
  const offenders = [];
  let chapterId = null;
  let lang = null;

  source.split('\n').forEach((line, index) => {
    const chapterMatch = line.match(/^    (\d+): \{$/);
    if (chapterMatch) {
      chapterId = chapterMatch[1];
      lang = null;
      return;
    }

    const langMatch = line.match(
      /^        (?:(?:'([^']+)')|([a-z][a-z0-9-]*)):\s*(?:`|'|"|svStudyBrief\()/,
    );
    if (langMatch) {
      lang = langMatch[1] || langMatch[2];
    }

    if (
      !staticEbookFoodBeverageSourceChapterIds.includes(chapterId) ||
      lang === 'en' ||
      lang === 'sv'
    ) {
      return;
    }

    for (const pattern of staticEbookFoodBeverageSourceTokenPatterns) {
      if (pattern.test(line)) {
        offenders.push({
          chapterId,
          line: index + 1,
          lang: lang || 'unknown',
          token: String(pattern),
          text: line.trim(),
        });
      }
    }
  });

  return offenders;
}

function assertNoStaleChildApplicationClaim(value) {
  for (const pattern of staleChildApplicationClaimPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

function assertNoStaleCitizenshipConductClaim(value) {
  for (const pattern of staleCitizenshipConductClaimPatterns) {
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

function annotatedSourceClaimBlocks(html) {
  return Array.from(
    html.matchAll(
      /<(?:p|li)\b(?=[^>]*\bdata-source-claims="ebook")(?=[^>]*\bdata-source-scope="ebook")(?=[^>]*\bdata-source-keys="[^"]+")[^>]*>[\s\S]*?<\/(?:p|li)>/g,
    ),
    (match) => match[0],
  );
}

function renderedFootnoteItems(html) {
  return Array.from(
    html.matchAll(/<li\b[^>]*\bid="eb-[^"]+-fn-\d+"[^>]*>[\s\S]*?<\/li>/g),
    (match) => match[0],
  );
}

function renderedExternalSourceAnchors(html) {
  return Array.from(html.matchAll(/<a\b(?=[^>]*\bhref="https?:\/\/)[^>]*>/g), (match) => match[0]);
}

function assertSafeOfficialTestSourceLinks(block, label) {
  officialPracticalTestSourceUrls.forEach((url) => {
    assert.match(
      block,
      new RegExp(
        `<a\\b(?=[^>]*\\bhref="${escapeRegExp(
          url,
        )}")(?=[^>]*\\btarget="_blank")(?=[^>]*\\brel="noreferrer")[^>]*>`,
      ),
      `${label} official-test source link should be safe for ${url}`,
    );
  });
  assert.doesNotMatch(
    block,
    /<a\b(?=[^>]*\bhref="#\/ebook\?c=)(?=[^>]*\btarget="_blank")/,
    `${label} internal ebook hash links must stay same-page`,
  );
  assert.doesNotMatch(
    block,
    /<a\b(?=[^>]*\bhref="#\/sources")(?=[^>]*\btarget="_blank")/,
    `${label} editorial commentary links must stay same-page`,
  );
}

function dataSourceKeys(block) {
  const match = block.match(/\bdata-source-keys="([^"]+)"/);
  assert.ok(match, `source block missing data-source-keys: ${block}`);
  return match[1].split(/\s+/).filter(Boolean);
}

function dataSourceMetadata(block) {
  const match = block.match(/\bdata-source-metadata="([^"]+)"/);
  assert.ok(match, `source block missing data-source-metadata: ${block}`);
  return match[1];
}

function sourceCountsFromBlocks(blocks) {
  const counts = {};
  blocks.forEach((block) => {
    Array.from(new Set(dataSourceKeys(block))).forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function renderedSourceCounts(html) {
  const match = html.match(/\bdata-source-counts='([^']+)'/);
  assert.ok(match, 'ebook provenance badge should expose data-source-counts');
  return JSON.parse(match[1]);
}

function rawEbookFactboxParagraphs(source) {
  return Array.from(
    source.matchAll(/<div class="ebook__factbox">[\s\S]*?<p(?<attrs>[^>]*)>/g),
    (match) => ({ attrs: match.groups.attrs, snippet: match[0] }),
  );
}

function renderedFootnoteSourceCounts(html) {
  const counts = {};
  const footnoteMatches = Array.from(
    html.matchAll(
      /<li\b(?=[^>]*\bid="eb-[^"]+-fn-\d+")(?=[^>]*\bdata-source-key="([^"]+)")[^>]*>/g,
    ),
    (match) => match[1],
  );
  assert.ok(footnoteMatches.length > 0, 'ebook footnotes should expose data-source-key rows');
  footnoteMatches.forEach((sourceKeys) => {
    Array.from(new Set(sourceKeys.split(/\s+/).filter(Boolean))).forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function sourceBlockContaining(blocks, pattern, label) {
  const block = blocks.find((candidate) => pattern.test(candidate));
  assert.ok(block, `missing source block for ${label}`);
  return block;
}

function findFunctionCallArguments(source, functionName) {
  const calls = [];
  let searchFrom = 0;
  while (searchFrom < source.length) {
    const start = source.indexOf(`${functionName}(`, searchFrom);
    if (start === -1) break;
    if (source.slice(Math.max(0, start - 9), start) === 'function ') {
      searchFrom = start + functionName.length + 1;
      continue;
    }

    let depth = 0;
    let quote = null;
    let escaped = false;
    let argumentCount = 1;
    for (let index = start + functionName.length; index < source.length; index += 1) {
      const char = source[index];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === "'" || char === '"' || char === '`') {
        quote = char;
      } else if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          calls.push({ start, argumentCount, text: source.slice(start, index + 1) });
          searchFrom = index + 1;
          break;
        }
      } else if (char === ',' && depth === 1) {
        argumentCount += 1;
      }
    }
  }
  return calls;
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

test('static ebook fact boxes must pass explicit source keys', () => {
  const source = readSiteFile('site/ebook.js');
  const calls = findFunctionCallArguments(source, 'ebookFactBox');
  const rawFactboxParagraphs = rawEbookFactboxParagraphs(source);

  assert.match(source, /function ebookFactBox\(lang,\s*heading,\s*facts,\s*sourceKeys\)/);
  assert.doesNotMatch(source, /function ebookFactBox\(lang,\s*heading,\s*facts,\s*sourceKeys\s*=/);
  assert.ok(calls.length > 0, 'static ebook should render fact boxes');
  calls.forEach((call) => {
    assert.ok(
      call.argumentCount >= 4,
      `ebookFactBox call must include explicit sourceKeys: ${call.text}`,
    );
  });
  assert.ok(rawFactboxParagraphs.length > 0, 'static ebook should still guard raw factbox markup');
  rawFactboxParagraphs.forEach(({ attrs, snippet }) => {
    assert.match(
      attrs,
      /ebookSourceKeyDataAttr\(|data-ebook-source-keys=/,
      `raw ebook factbox paragraph must carry explicit source metadata: ${snippet}`,
    );
  });
});

test('static ebook raw factbox prose renders with non-default provenance', () => {
  const harness = createEbookHarness();
  const englishIntroHtml = renderChapter(harness, 'en', 'intro');
  const swedishIntroHtml = renderChapter(harness, 'sv', 'intro');
  const englishChapter12Html = renderChapter(harness, 'en', '12');
  const swedishChapter12Html = renderChapter(harness, 'sv', '12');

  const englishTipBlock = sourceBlockContaining(
    annotatedSourceClaimBlocks(englishIntroHtml),
    /Short, repeated sessions make it easier/,
    'English editorial tip',
  );
  const swedishTipBlock = sourceBlockContaining(
    annotatedSourceClaimBlocks(swedishIntroHtml),
    /Växla mellan svenska och engelska/,
    'Swedish editorial tip',
  );
  const englishCurrentSourceBlock = sourceBlockContaining(
    annotatedSourceClaimBlocks(englishChapter12Html),
    /Sources accessed 2026-05-19/,
    'English current source note',
  );
  const swedishCurrentSourceBlock = sourceBlockContaining(
    annotatedSourceClaimBlocks(swedishChapter12Html),
    /Källor hämtade 2026-05-19/,
    'Swedish current source note',
  );

  assert.deepEqual(dataSourceKeys(englishTipBlock), ['editorialCommentary']);
  assert.deepEqual(dataSourceKeys(swedishTipBlock), ['editorialCommentary']);
  assert.deepEqual(dataSourceKeys(englishCurrentSourceBlock), officialPracticalTestSourceKeys);
  assert.deepEqual(dataSourceKeys(swedishCurrentSourceBlock), officialPracticalTestSourceKeys);
  assert.doesNotMatch(englishTipBlock, /\buhrStudyMaterial\b/);
  assert.doesNotMatch(swedishTipBlock, /\buhrStudyMaterial\b/);
  assert.doesNotMatch(englishChapter12Html, /\buhrOfficialTestSources\b/);
  assert.match(englishChapter12Html, /UHR: Om medborgarskapsprovet/);
  assert.match(englishChapter12Html, /UHR: Frågor och svar/);
  assert.match(englishChapter12Html, /UHR: Anmälan/);
  assert.match(englishChapter12Html, /UHR: Utbildningsmaterial/);
  officialPracticalTestSourceUrls.forEach((url) => {
    assert.match(englishCurrentSourceBlock, new RegExp(url));
    assert.match(swedishCurrentSourceBlock, new RegExp(url));
  });
  assertSafeOfficialTestSourceLinks(englishCurrentSourceBlock, 'English current source note');
  assertSafeOfficialTestSourceLinks(swedishCurrentSourceBlock, 'Swedish current source note');
});

test('static ebook chapter 12 official-test prose uses exact source-key footnotes', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const englishHtml = renderChapter(harness, 'en', '12');
  const swedishHtml = renderChapter(harness, 'sv', '12');
  const englishBlocks = annotatedSourceClaimBlocks(englishHtml);
  const swedishBlocks = annotatedSourceClaimBlocks(swedishHtml);

  assert.match(source, /uhrOfficialTestAbout/);
  assert.match(source, /uhrOfficialTestFaq/);
  assert.match(source, /uhrOfficialTestSignup/);
  assert.match(source, /uhrOfficialTestStudyMaterial/);

  const englishSignupBlock = sourceBlockContaining(
    englishBlocks,
    /first civic-knowledge sitting[\s\S]*Migrationsverket letter/,
    'English official-test signup paragraph',
  );
  const swedishSignupBlock = sourceBlockContaining(
    swedishBlocks,
    /första samhällskunskapsprovet[\s\S]*brev från Migrationsverket/i,
    'Swedish official-test signup paragraph',
  );
  const englishLanguageBlock = sourceBlockContaining(
    englishBlocks,
    /civic-knowledge test itself can only be taken in Swedish/,
    'English official-test language paragraph',
  );
  const swedishLanguageBlock = sourceBlockContaining(
    swedishBlocks,
    /samhällskunskapsprovet kan bara göras på svenska/,
    'Swedish official-test language paragraph',
  );
  const englishSeatsBlock = sourceBlockContaining(
    englishBlocks,
    /Seats are limited[\s\S]*free of charge[\s\S]*generous time/,
    'English official-test seats paragraph',
  );
  const swedishSeatsBlock = sourceBlockContaining(
    swedishBlocks,
    /Antalet platser är begränsat[\s\S]*kostnadsfritt[\s\S]*generöst med tid/,
    'Swedish official-test seats paragraph',
  );
  const englishPendingBlock = sourceBlockContaining(
    englishBlocks,
    /UHR has not yet published the exact time and place/,
    'English official-test pending-details paragraph',
  );
  const swedishPendingBlock = sourceBlockContaining(
    swedishBlocks,
    /UHR har ännu inte publicerat exakt tid och plats/,
    'Swedish official-test pending-details paragraph',
  );

  [
    englishSignupBlock,
    swedishSignupBlock,
    englishLanguageBlock,
    swedishLanguageBlock,
    englishSeatsBlock,
    swedishSeatsBlock,
    englishPendingBlock,
    swedishPendingBlock,
  ].forEach((block) => {
    assert.equal(dataSourceMetadata(block), 'inline');
    assert.doesNotMatch(block, /\buhrStudyMaterial\b/);
  });

  assert.deepEqual(dataSourceKeys(englishSignupBlock), officialPracticalTestSignupSourceKeys);
  assert.deepEqual(dataSourceKeys(swedishSignupBlock), officialPracticalTestSignupSourceKeys);
  assert.deepEqual(dataSourceKeys(englishLanguageBlock), officialPracticalTestLanguageSourceKeys);
  assert.deepEqual(dataSourceKeys(swedishLanguageBlock), officialPracticalTestLanguageSourceKeys);
  assert.deepEqual(dataSourceKeys(englishSeatsBlock), officialPracticalTestSeatsSourceKeys);
  assert.deepEqual(dataSourceKeys(swedishSeatsBlock), officialPracticalTestSeatsSourceKeys);
  assert.deepEqual(dataSourceKeys(englishPendingBlock), officialPracticalTestPendingSourceKeys);
  assert.deepEqual(dataSourceKeys(swedishPendingBlock), officialPracticalTestPendingSourceKeys);

  const englishFootnotes = renderedFootnoteItems(englishHtml).join('\n');
  const swedishFootnotes = renderedFootnoteItems(swedishHtml).join('\n');
  officialPracticalTestSourceUrls.forEach((url) => {
    assert.match(englishFootnotes, new RegExp(url));
    assert.match(swedishFootnotes, new RegExp(url));
  });
});

test('static ebook Swedish mock-exam wording uses övningsprov and survival-guide heading', () => {
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
  assert.match(
    swedishMockExamHtml,
    /<h1 class="ebook__h1"><span>[OÖ]vningsprov<\/span> <em>& [oö]verlevnadsguide<\/em><\/h1>/,
  );
  assert.match(swedishMockExamHtml, /Starta [oö]vningsprov/);
  assert.match(swedishMockExamHtml, /gör ett [oö]vningsprov/);
  assert.match(
    englishMockExamHtml,
    /<h1 class="ebook__h1"><span>Mock exam<\/span> <em>& survival guide<\/em><\/h1>/,
  );
  assert.match(englishMockExamHtml, /Start mock exam/);
  assert.doesNotMatch(swedishMockExamHtml, /aktuell provstatus/i);
  assert.doesNotMatch(englishMockExamHtml, /current test status/i);
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

test('static ebook practice links localize every shipped locale without href drift', () => {
  const harness = createEbookHarness(sourceWithExportedPracticeLinks());
  const practiceLinks = harness.window.__TEST_PRACTICE_LINKS__;
  const chapterIds = getExpectedChapterIds();
  const languages = getStaticSiteLanguages();
  const extraLanguages = languages.filter((lang) => !['en', 'sv'].includes(lang));

  assert.ok(practiceLinks, 'PRACTICE_LINKS should be test-exportable');
  assert.match(
    readSiteFile('site/ebook.js'),
    /return PRACTICE_LINKS\[id\] \|\| PRACTICE_LINKS\.intro;/,
  );
  assert.deepEqual(
    Object.keys(practiceLinks).sort((a, b) => chapterIds.indexOf(a) - chapterIds.indexOf(b)),
    chapterIds,
    'PRACTICE_LINKS should cover the ebook chapter order exactly',
  );

  for (const chapterId of chapterIds) {
    const expectedLink = practiceLinks[chapterId];

    assert.match(expectedLink.href, /^#\/(?:practice|mock)(?:\?c=(?:\d+|mix))?$/);

    for (const language of languages) {
      assert.equal(
        typeof expectedLink[language],
        'string',
        `PRACTICE_LINKS ${chapterId} missing ${language}`,
      );
      assert.notEqual(expectedLink[language].trim(), '', `PRACTICE_LINKS ${chapterId} ${language}`);

      const renderedLink = renderedPrimaryPracticeLink(renderChapter(harness, language, chapterId));

      assert.equal(renderedLink.href, expectedLink.href, `${chapterId} ${language} href`);
      assert.equal(renderedLink.label, expectedLink[language], `${chapterId} ${language} label`);
    }

    for (const language of extraLanguages) {
      assert.notEqual(
        expectedLink[language],
        expectedLink.en,
        `PRACTICE_LINKS ${chapterId} ${language} should not fall back to English`,
      );
      assert.notEqual(
        expectedLink[language],
        expectedLink.sv,
        `PRACTICE_LINKS ${chapterId} ${language} should not fall back to Swedish`,
      );
    }
  }
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
    assert.match(englishHtml, /UHR \(\d+ cites?\).+Editorial \(\d+ cites?\)/);
    assert.match(
      swedishHtml,
      /UHR \(\d+ (?:källa|källor)\).+Redaktionellt \(\d+ (?:källa|källor)\)/,
    );
    assert.doesNotMatch(swedishHtml, /\b\d+ cites?\b/);
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

test('static ebook chapter 13 extra languages avoid parenthetical English holiday glosses', () => {
  const harness = createEbookHarness();

  for (const lang of staticEbookExtraLanguages) {
    const html = renderChapter(harness, lang, '13');
    assert.match(html, /class="ebook__h1"/, `${lang} chapter 13 should render`);
    assertNoChapter13EnglishHolidayGloss(html, `${lang} chapter 13`);
  }
});

test('static ebook Somali chapter 13 localizes Midsummer food wording', () => {
  const harness = createEbookHarness();
  const html = renderChapter(harness, 'so', '13');

  assert.match(html, /class="ebook__h1"/, 'Somali chapter 13 should render');
  assertSomaliChapter13HolidayFoodIsLocalized(html);
});

test('static ebook chapter 8 and 13 source keeps English food and beverage tokens out of extra locales', () => {
  const offenders = findStaticEbookExtraLocaleFoodBeverageSourceOffenders(
    readSiteFile('site/ebook.js'),
  );

  assert.deepEqual(offenders, []);
});

test('static ebook chapters render source footnotes for every prose paragraph and list item', () => {
  const harness = createEbookHarness();

  for (const chapterId of getExpectedChapterIds().filter((id) => id !== 'intro')) {
    const englishHtml = renderChapter(harness, 'en', chapterId);
    const swedishHtml = renderChapter(harness, 'sv', chapterId);
    const englishBlocks = annotatedSourceClaimBlocks(englishHtml);
    const swedishBlocks = annotatedSourceClaimBlocks(swedishHtml);
    const englishFootnotes = renderedFootnoteItems(englishHtml);
    const swedishFootnotes = renderedFootnoteItems(swedishHtml);

    assert.ok(englishBlocks.length > 0, `chapter ${chapterId} should annotate English prose`);
    assert.ok(swedishBlocks.length > 0, `chapter ${chapterId} should annotate Swedish prose`);
    assert.equal(
      englishFootnotes.length,
      englishBlocks.length,
      `chapter ${chapterId} should render one English footnote per prose block`,
    );
    assert.equal(
      swedishFootnotes.length,
      swedishBlocks.length,
      `chapter ${chapterId} should render one Swedish footnote per prose block`,
    );
    assert.match(englishHtml, /class="ebook__footnotes"/);
    assert.match(swedishHtml, /class="ebook__footnotes"/);
    assert.match(englishHtml, /UHR public study material/);
    assert.match(swedishHtml, /UHR:s offentliga studiematerial/);
    assert.doesNotMatch(swedishHtml, /UHR public study material/);
    assert.match(englishHtml, /Editorial \(\d+ cites?\)/);
    assert.match(swedishHtml, /Redaktionellt \(\d+ (?:källa|källor)\)/);

    [...englishBlocks, ...swedishBlocks].forEach((block) => {
      assert.match(dataSourceMetadata(block), /^(inline|typed)$/);
    });
  }
});

test('static ebook source labels localize in rendered Swedish source notes', () => {
  const harness = createEbookHarness();
  const englishChapterOne = renderChapter(harness, 'en', '1');
  const swedishChapterOne = renderChapter(harness, 'sv', '1');
  const englishChapterSeven = renderChapter(harness, 'en', '7');
  const swedishChapterSeven = renderChapter(harness, 'sv', '7');

  assert.match(englishChapterOne, /UHR public study material/);
  assert.match(englishChapterOne, /Government Offices NATO membership notice/);
  assert.match(englishChapterOne, /editorial commentary/);
  assert.match(englishChapterSeven, /SCB land and water area statistics/);

  assert.match(swedishChapterOne, /UHR:s offentliga studiematerial/);
  assert.match(swedishChapterOne, /Regeringskansliets meddelande om Nato-medlemskapet/);
  assert.match(swedishChapterOne, /redaktionell kommentar/);
  assert.match(swedishChapterOne, /redaktionell kommentar<\/a> \(redaktionell\)/);
  assert.match(swedishChapterSeven, /SCB:s statistik om land- och vattenareal/);
  assert.doesNotMatch(swedishChapterOne, /UHR public study material/);
  assert.doesNotMatch(swedishChapterOne, /Government Offices NATO membership notice/);
  assert.doesNotMatch(swedishChapterOne, /editorial commentary/);
  assert.doesNotMatch(swedishChapterOne, /\(editorial\)/);
  assert.doesNotMatch(swedishChapterSeven, /SCB land and water area statistics/);
});

test('focus-static-ebook-footnote hash validator mirrors source-counts and route links', () => {
  const summary = runFocusedStaticEbookFootnoteHashValidator();

  assert.equal(summary.staticEbookFootnoteHashChaptersValidated, getExpectedChapterIds().length);
  assert.equal(summary.staticEbookFootnoteHashLanguagesValidated, 2);
  assert.equal(summary.staticEbookFootnoteHashParityValidated, true);
});

test('focus-static-ebook-provenance validator routes static ebook provenance guards', () => {
  const summary = runFocusedStaticEbookProvenanceValidator();

  assert.equal(summary.staticEbookOutcomeClaimParityValidated, true);
  assert.equal(summary.staticEbookPracticalTestCurrentnessValidated, true);
  assert.equal(summary.staticEbookFactboxProvenanceValidated, true);
  assert.equal(summary.staticEbookFootnoteHashChaptersValidated, getExpectedChapterIds().length);
  assert.equal(summary.staticEbookFootnoteHashLanguagesValidated, 2);
  assert.equal(summary.staticEbookFootnoteHashParityValidated, true);
  assert.equal(summary.staticEbookProvenanceParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'staticFaqFallbackParityValidated'),
    false,
  );
});

test('static ebook prose source metadata is explicit or typed, never fallback annotation', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const sourceMetadataModes = new Set();

  assert.doesNotMatch(source, /EBOOK_DEFAULT_PROSE_SOURCE_KEYS/);
  assert.doesNotMatch(source, /fallbackSourceKeys\s*=\s*EBOOK_DEFAULT_PROSE_SOURCE_KEYS/);
  assert.doesNotMatch(source, /explicitSourceKeys\s*\|\|\s*fallbackSourceKeys/);
  assert.doesNotMatch(source, /typeof point === 'string' \? null : point\.sourceKeys/);
  assert.match(source, /const EBOOK_BODY_SOURCE_KEYS = Object\.freeze\(\{/);
  assert.match(source, /function ebookBodySourceKeys\(chapterId\)/);
  assert.match(source, /annotate\(html, typedSourceKeys\)/);
  assert.match(source, /data-source-metadata="\$\{metadataKind\}"/);
  assert.match(source, /footnoteCollector\.annotate\(rawBodyHtml, ebookBodySourceKeys\(id\)\)/);

  for (const chapterId of getExpectedChapterIds()) {
    for (const lang of getStaticSiteLanguages()) {
      const html = renderChapter(harness, lang, chapterId);
      const blocks = annotatedSourceClaimBlocks(html);
      assert.ok(blocks.length > 0, `chapter ${chapterId} ${lang} should render sourced prose`);
      blocks.forEach((block) => {
        sourceMetadataModes.add(dataSourceMetadata(block));
        assert.ok(dataSourceKeys(block).length > 0, `chapter ${chapterId} ${lang} source keys`);
      });
      assert.deepEqual(
        renderedSourceCounts(html),
        sourceCountsFromBlocks(blocks),
        `chapter ${chapterId} ${lang} source counts should come from rendered metadata`,
      );
    }
  }

  assert.deepEqual(
    Array.from(sourceMetadataModes).sort(),
    ['inline', 'typed'],
    'ebook output should distinguish inline keys from typed section metadata',
  );
});

test('static ebook Swedish study briefs source factual bullets and editorial practice hints locally', () => {
  const harness = createEbookHarness();
  const chapter2SwedishBlocks = annotatedSourceClaimBlocks(renderChapter(harness, 'sv', '2'));
  const governmentPoint = sourceBlockContaining(
    chapter2SwedishBlocks,
    /Sverige är både en konstitutionell monarki/,
    'Swedish government study point',
  );
  const practiceHint = sourceBlockContaining(
    chapter2SwedishBlocks,
    /Läs punkterna långsamt/,
    'Swedish practice hint',
  );

  assert.deepEqual(dataSourceKeys(governmentPoint), ['uhrStudyMaterial']);
  assert.equal(dataSourceMetadata(governmentPoint), 'inline');
  assert.deepEqual(dataSourceKeys(practiceHint), ['editorialCommentary']);
  assert.equal(dataSourceMetadata(practiceHint), 'inline');
});

test('static ebook extra-locale kommun and region civic terms use localized glossary words in every chapter', () => {
  const harness = createEbookHarness();
  const chapterIds = getExpectedChapterIds();
  const extraLanguages = getStaticSiteLanguages().filter((lang) => !['en', 'sv'].includes(lang));

  assert.ok(extraLanguages.length > 0, 'static ebook should expose extra reader languages');
  assert.ok(
    chapterIds.includes('intro') && chapterIds.includes('13') && chapterIds.length >= 14,
    'static ebook civic-term guard should derive every shipped chapter',
  );

  for (const chapterId of chapterIds) {
    for (const lang of extraLanguages) {
      const html = renderChapter(harness, lang, chapterId);
      assertNoBareStaticEbookCivicTerms(html, `${lang} chapter ${chapterId}`);
    }
  }
});

test('static ebook source metadata keeps Vikings prose off governmentNato and source counts explicit', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();

  assert.match(source, /data-ebook-source-keys/);
  assert.match(source, /function ebookLedeSourceKeys\(chapterId\)/);
  assert.match(source, /function ebookBodySourceKeys\(chapterId\)/);
  assert.doesNotMatch(source, /function ebookChapterSourceKeys/);
  assert.doesNotMatch(source, /chooseEbookFootnoteKey/);

  const chapter1English = renderChapter(harness, 'en', '1');
  const chapter1Blocks = annotatedSourceClaimBlocks(chapter1English);
  const vikingsBlock = sourceBlockContaining(chapter1Blocks, /Norse-speaking traders/, 'Vikings');
  const kalmarBlock = sourceBlockContaining(
    chapter1Blocks,
    /Union of Kalmar|Hanseatic League/,
    'Kalmar',
  );
  const vasaBlock = sourceBlockContaining(chapter1Blocks, /Gustav Eriksson Vasa/, 'Gustav Vasa');
  const folkhemBlock = sourceBlockContaining(chapter1Blocks, /people's home/, 'folkhem');
  const natoBlock = sourceBlockContaining(chapter1Blocks, /joins NATO/, 'NATO');

  [vikingsBlock, kalmarBlock, vasaBlock, folkhemBlock].forEach((block) => {
    assert.doesNotMatch(block, /\bgovernmentNato\b/);
  });
  assert.match(natoBlock, /\bgovernmentNato\b/);
  assert.deepEqual(renderedSourceCounts(chapter1English), sourceCountsFromBlocks(chapter1Blocks));

  const chapter7Blocks = annotatedSourceClaimBlocks(renderChapter(harness, 'en', '7'));
  assert.match(
    sourceBlockContaining(chapter7Blocks, /fifth-largest country in Europe/, 'SCB geography'),
    /\bscbLandUse\b/,
  );

  const chapter9Blocks = annotatedSourceClaimBlocks(renderChapter(harness, 'en', '9'));
  assert.match(
    sourceBlockContaining(chapter9Blocks, /Riksbank.+founded in 1668/, 'Riksbank history'),
    /\briksbankHistory\b/,
  );

  const chapter10Blocks = annotatedSourceClaimBlocks(renderChapter(harness, 'en', '10'));
  assert.match(
    sourceBlockContaining(chapter10Blocks, /formally joined on 7 March 2024/, 'NATO membership'),
    /\bgovernmentNato\b/,
  );

  const chapter11Blocks = annotatedSourceClaimBlocks(renderChapter(harness, 'en', '11'));
  assert.match(
    sourceBlockContaining(
      chapter11Blocks,
      /children can no longer be included on a parent's citizenship application/,
      'child citizenship application rule',
    ),
    /\bmigrationsverketCitizenshipRules\b/,
  );
});

test('static ebook footnote links preserve route hashes and rendered source counts', () => {
  const harness = createEbookHarness();

  for (const chapterId of ['1', '7', '9', '12']) {
    for (const lang of ['en', 'sv']) {
      const html = renderChapter(harness, lang, chapterId);
      const blocks = annotatedSourceClaimBlocks(html);
      const blockCounts = sourceCountsFromBlocks(blocks);
      const badgeCounts = renderedSourceCounts(html);
      const footnoteCounts = renderedFootnoteSourceCounts(html);
      const sourceRefPattern = new RegExp(
        `href="#/ebook\\?c=${chapterId}&fn=eb-${chapterId}-${lang}-fn-\\d+"`,
      );
      const backlinkPattern = new RegExp(
        `href="#/ebook\\?c=${chapterId}&fnref=eb-${chapterId}-${lang}-fn-\\d+"`,
      );

      assert.deepEqual(
        badgeCounts,
        blockCounts,
        `chapter ${chapterId} ${lang} source-counts badge should match annotated prose`,
      );
      assert.deepEqual(
        footnoteCounts,
        badgeCounts,
        `chapter ${chapterId} ${lang} footnote rows should match source-counts badge`,
      );
      assert.match(html, sourceRefPattern);
      assert.match(html, backlinkPattern);
      assert.doesNotMatch(html, /href="#ebook-fn(?:ref)?-/);
    }
  }
});

test('static ebook malformed route hash values fail closed without losing valid chapters', () => {
  const harness = createEbookHarness();

  harness.localStorage.setItem('smt_lang', 'en');
  for (const hash of [
    '#/ebook?c=7&fn=%E0%A4%A',
    '#/ebook?c=7&fnref=%ZZ',
    '#/ebook?fn=%E0%A4%A&c=7',
  ]) {
    harness.location.hash = hash;
    assert.doesNotThrow(() => harness.window.smtEbookRender(), hash);
    assert.match(
      harness.reader.innerHTML,
      /<span class="ebook__progress">7 \/ 13<\/span>/,
      `${hash} should keep the valid requested chapter`,
    );
  }

  harness.location.hash = '#/ebook?c=%E0%A4%A&fn=eb-7-en-fn-1';
  assert.doesNotThrow(() => harness.window.smtEbookRender());
  assert.match(
    harness.reader.innerHTML,
    /<span class="ebook__progress">Guide<\/span>/,
    'malformed c query should fall back to the intro chapter',
  );
});

test('static ebook chapters expose heterogeneous source provenance in the source-count badge', () => {
  const harness = createEbookHarness();
  const chapterIds = getExpectedChapterIds();

  for (const chapterId of chapterIds) {
    for (const lang of ['en', 'sv']) {
      const html = renderChapter(harness, lang, chapterId);
      const counts = renderedSourceCounts(html);
      const nonUhrSourceKeys = Object.keys(counts).filter((key) => !key.startsWith('uhr'));

      assert.ok(
        nonUhrSourceKeys.length > 0,
        `chapter ${chapterId} ${lang} should show at least one non-UHR source or editorial note`,
      );
      assert.match(html, /ebook__provenance-badge--source-mix/);
    }
  }
});

test('static ebook external source links use safe attributes while internal hashes stay in-page', () => {
  const harness = createEbookHarness();
  const html = ['en', 'sv']
    .flatMap((lang) =>
      ['1', '7', '9', '10', '12'].map((chapterId) => renderChapter(harness, lang, chapterId)),
    )
    .join('\n');
  const externalAnchors = renderedExternalSourceAnchors(html);

  assert.ok(externalAnchors.length > 0, 'ebook should render external source anchors');
  externalAnchors.forEach((anchor) => {
    assert.match(anchor, /\btarget="_blank"/, `external source link needs _blank: ${anchor}`);
    assert.match(anchor, /\brel="noreferrer"/, `external source link needs noreferrer: ${anchor}`);
  });

  expectedSafeEbookExternalSourceUrls.forEach((url) => {
    assert.match(
      html,
      new RegExp(
        `<a\\b(?=[^>]*\\bhref="${escapeRegExp(
          url,
        )}")(?=[^>]*\\btarget="_blank")(?=[^>]*\\brel="noreferrer")[^>]*>`,
      ),
      `ebook source link should be safe for ${url}`,
    );
  });

  assert.doesNotMatch(html, /<a\b(?=[^>]*\bhref="#\/sources")(?=[^>]*\btarget="_blank")/);
  assert.doesNotMatch(html, /<a\b(?=[^>]*\bhref="#\/ebook\?c=)(?=[^>]*\btarget="_blank")/);
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
  assert.match(englishHtml, /civic-knowledge test itself can only be taken in Swedish/);
  assert.match(englishHtml, /separate from the Swedish-language tests/);
  assert.match(englishHtml, /Seats are limited/);
  assert.match(englishHtml, /free of charge/);
  assert.match(englishHtml, /generous time/);
  assert.match(englishHtml, /Practical details pending from UHR/);
  assert.match(englishHtml, /Sources accessed 2026-05-19/);

  assert.match(swedishHtml, /15 augusti 2026 i Stockholm/);
  assert.match(swedishHtml, /brev från Migrationsverket/);
  assert.match(swedishHtml, /samhällskunskapsprovet kan bara göras på svenska/);
  assert.match(swedishHtml, /skilt från de prov i svenska som införs senare/);
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

test('static ebook current-status prose avoids source-authority phrasing', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const currentStatusHtml = getStaticSiteLanguages()
    .flatMap((language) =>
      ['11', '12'].map((chapterId) => renderChapter(harness, language, chapterId)),
    )
    .join('\n');

  assertNoStaticEbookSourceAuthorityPhrasing(source);
  assertNoStaticEbookSourceAuthorityPhrasing(currentStatusHtml);
  assert.match(currentStatusHtml, /15 August 2026 in Stockholm/);
  assert.match(currentStatusHtml, /15 augusti 2026 i Stockholm/);
  assert.match(currentStatusHtml, /Migrationsverket letter/);
  assert.match(currentStatusHtml, /brev från Migrationsverket/);
  assert.match(currentStatusHtml, /can only be taken in Swedish/);
  assert.match(currentStatusHtml, /kan bara göras på svenska/);
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

test('static ebook chapter 11 keeps conduct requirement current and decision-safe', () => {
  const source = readSiteFile('site/ebook.js');
  const harness = createEbookHarness();
  const englishHtml = renderChapter(harness, 'en', '11');
  const swedishHtml = renderChapter(harness, 'sv', '11');

  assertNoStaleCitizenshipConductClaim(source);
  assertNoStaleCitizenshipConductClaim(englishHtml);
  assertNoStaleCitizenshipConductClaim(swedishHtml);

  assert.match(englishHtml, /From 6 June 2026, the adult main rule is eight years/);
  assert.match(englishHtml, /Meet the stricter conduct requirement/);
  assert.match(englishHtml, /Offences can mean a longer waiting period/);
  assert.match(englishHtml, /Migrationsverket decides individual cases/);
  assert.match(
    englishHtml,
    /Stricter conduct requirement with longer waiting periods after offences/,
  );
  assert.match(englishHtml, /Adult main residence rule: 8 years/);

  assert.match(swedishHtml, /Från 6 juni 2026 skärps skötsamhetskravet/);
  assert.match(swedishHtml, /brott kan innebära längre karenstid/);
  assert.match(swedishHtml, /Migrationsverket avgör det enskilda ärendet/);
  assert.match(swedishHtml, /Huvudregel för vuxnas hemvist: 8 år/);
  assert.match(swedishHtml, /Skärpt skötsamhetskrav med längre karenstider efter brott/);

  assert.match(englishHtml, /data-source-keys="migrationsverketCitizenshipRules"/);
  assert.match(swedishHtml, /migrationsverketCitizenshipRules/);
});

test('static ebook chapter 11 extra locales keep citizenship conduct rules current', () => {
  const harness = createEbookHarness();

  for (const lang of staticEbookExtraLanguages) {
    const expectations = staticEbookChapter11ConductCurrentnessByLocale[lang];
    assert.ok(expectations, `${lang} should have chapter 11 conduct currentness expectations`);

    const html = renderChapter(harness, lang, '11');
    assertNoStaleCitizenshipConductClaim(html);

    for (const [label, pattern] of Object.entries(expectations)) {
      assert.match(
        html,
        pattern,
        `${lang} chapter 11 should preserve the ${label} citizenship-rule concept`,
      );
    }

    assert.match(
      html,
      /data-source-keys="migrationsverketCitizenshipRules"/,
      `${lang} chapter 11 citizenship conduct rows should carry the Migrationsverket source key`,
    );
  }
});

test('native ebook study article audio narrates article prose with persisted rate', () => {
  const routeSource = readSiteFile('app/ebook.tsx');
  const articleAudioSource = readSiteFile('components/learning/ArticleAudioButton.tsx');
  const narrationSource = readSiteFile('lib/audio/ebookNarration.ts');

  assert.match(routeSource, /useAccessibilityStore\(\(state\) => state\.audioPlaybackRate\)/);
  assert.match(routeSource, /useSettingsStore\(\(state\) => state\.audioEnabled\)/);
  assert.match(routeSource, /<ArticleAudioButton[\s\S]*scope="article"/);
  assert.match(routeSource, /<ArticleAudioButton[\s\S]*scope="section"/);
  assert.match(routeSource, /text=\{buildEbookArticleNarrationText\(article\)\}/);
  assert.match(routeSource, /text=\{buildEbookSectionNarrationText\(section\)\}/);
  assert.match(articleAudioSource, /speakSwedish\(chunk, \{[\s\S]*rate,/);
  assert.match(articleAudioSource, /onDone:[\s\S]*playChunk\(index \+ 1, runId\)/);
  assert.match(narrationSource, /getLocalizedText\(article\.title, 'sv'\)/);
  assert.match(narrationSource, /getLocalizedText\(article\.lede, 'sv'\)/);
  assert.match(narrationSource, /article\.sections\.map\(buildEbookSectionNarrationText\)/);
  assert.doesNotMatch(narrationSource, /getEbookSourceNotes|sourceNoteKeys|provenance/i);
});

test('native ebook sections carry and render explicit source provenance', () => {
  const routeSource = readSiteFile('app/ebook.tsx');
  const contentSource = readSiteFile('lib/content/ebookContent.ts');

  assert.match(contentSource, /sourceNoteKeys:\s*readonly EbookSourceKey\[\]/);
  assert.match(contentSource, /function uniqueSourceNoteKeys\(sections:/);
  assert.match(contentSource, /sourceNoteKeys:\s*uniqueSourceNoteKeys\(sections\)/);
  assert.doesNotMatch(contentSource, /seed\.staticChapterId === '12' \? officialTestSourceKeys/);
  assert.match(contentSource, /migrationsverketCitizenshipRules/);
  assert.match(
    contentSource,
    /sourceNoteKeys:\s*\[[\s\S]*'officialTestOverview'[\s\S]*'officialTestSignup'[\s\S]*'migrationsverketCitizenshipRules'[\s\S]*\]/,
  );
  assert.match(contentSource, /sourceNoteKeys:\s*studyMaterialSourceKeys/);
  assert.match(contentSource, /getEbookSectionSourceNotes/);
  assert.match(contentSource, /export function getSafeEbookSourceUrl/);
  assert.match(contentSource, /new URL\(source\.url\)\.protocol === 'https:'/);

  assert.match(
    routeSource,
    /import \{ Link, useLocalSearchParams, useRouter \} from 'expo-router';/,
  );
  assert.match(routeSource, /getSafeEbookSourceUrl,/);
  assert.match(routeSource, /getEbookSectionSourceNotes,/);
  assert.match(routeSource, /const sectionSources = getEbookSectionSourceNotes\(section\);/);
  assert.match(routeSource, /sectionSourcesHeading: \(count\)/);
  assert.match(routeSource, /Källor för avsnittet/);
  assert.match(routeSource, /Section sources/);
  assert.match(
    routeSource,
    /sourceLinkAccessibilityLabel: \(label, url\) => `Öppna källa: \$\{label\}\. \$\{url\}`/,
  );
  assert.match(
    routeSource,
    /sourceLinkAccessibilityLabel: \(label, url\) => `Open source: \$\{label\}\. \$\{url\}`/,
  );
  assert.match(routeSource, /const safeSourceUrl = getSafeEbookSourceUrl\(source\);/);
  assert.match(
    routeSource,
    /accessibilityLabel=\{copy\.sourceLinkAccessibilityLabel\(sourceLabel, safeSourceUrl\)\}/,
  );
  assert.match(routeSource, /accessibilityRole="link"/);
  assert.match(routeSource, /href=\{safeSourceUrl\}/);
  assert.match(routeSource, /rel="noreferrer"/);
  assert.match(routeSource, /target="_blank"/);
  assert.match(routeSource, /styles\.sectionSources/);
  assert.match(routeSource, /minHeight: space\[6\]/);
  assert.match(routeSource, /sectionSources\.map\(\(source\) =>/);
});

test('native ebook article navigation uses selected tab semantics', () => {
  const routeSource = readSiteFile('app/ebook.tsx');
  const articleNavStart = routeSource.indexOf('<ScrollView');
  const articleNavEnd = routeSource.indexOf('</ScrollView>', articleNavStart);

  assert.ok(articleNavStart >= 0, 'native ebook route should render the article selector');
  assert.ok(articleNavEnd > articleNavStart, 'native ebook article selector should close');

  const articleNavSource = routeSource.slice(articleNavStart, articleNavEnd);

  assert.match(routeSource, /articleNavGroupAccessibilityLabel: 'Välj studieartikel'/);
  assert.match(routeSource, /articleNavGroupAccessibilityLabel: 'Choose study article'/);
  assert.match(articleNavSource, /aria-label=\{copy\.articleNavGroupAccessibilityLabel\}/);
  assert.match(articleNavSource, /accessibilityLabel=\{copy\.articleNavGroupAccessibilityLabel\}/);
  assert.match(articleNavSource, /accessibilityRole="tablist"/);
  assert.match(articleNavSource, /accessibilityRole="tab"/);
  assert.match(articleNavSource, /aria-selected=\{selected\}/);
  assert.match(articleNavSource, /accessibilityState=\{\{\s*selected\s*\}\}/);
  assert.doesNotMatch(articleNavSource, /accessibilityRole="button"/);
});
