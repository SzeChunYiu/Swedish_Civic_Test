const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

const officialTocChapterStarts = [
  ['ch01', 'Landet Sverige', 5],
  ['ch02', 'Sveriges demokratiska system', 10],
  ['ch03', 'Så här styrs Sverige', 12],
  ['ch04', 'Politiska val och partier', 14],
  ['ch05', 'Lag och rätt', 16],
  ['ch06', 'Mediernas roll', 20],
  ['ch07', 'Mänskliga rättigheter', 22],
  ['ch08', 'Arbetsmarknad och privatekonomi', 27],
  ['ch09', 'Välfärdssamhället', 30],
  ['ch10', 'Sveriges moderna historia', 32],
  ['ch11', 'Sverige och omvärlden', 39],
  ['ch12', 'En sekulär stat och ett mångreligiöst land', 42],
  ['ch13', 'Traditioner och högtider', 45],
];

const expectedSectionRanges = {
  ch01: [
    ['Geografi, klimat och natur', 5, 5],
    ['Fjäll', 6, 6],
    ['Skogar, sjöar och öar', 6, 6],
    ['Befolkning', 7, 7],
  ],
  ch02: [
    ['Demokrati betyder folkstyre', 10, 10],
    ['En stark demokrati', 10, 10],
    ['Hot mot demokratin', 11, 11],
  ],
  ch03: [
    ['Landet styrs på olika nivåer', 12, 12],
    ['Staten', 12, 12],
    ['Myndigheter', 13, 13],
    ['Regioner och kommuner', 13, 13],
    ['Kommunernas ansvar', 13, 13],
    ['Sveriges statsskick', 13, 13],
  ],
  ch04: [
    ['Val och röstning', 14, 14],
    ['Folkomröstningar', 14, 14],
    ['Så här går det till att rösta', 14, 15],
    ['Politiska partier', 15, 15],
    ['Proportionella val', 15, 15],
  ],
  ch05: [
    ['Grundlagarna', 16, 16],
    ['Regeringsformen', 16, 16],
    ['Successionsordningen', 16, 16],
    ['Allemansrätten', 17, 17],
    ['Rättsväsendet', 17, 17],
    ['Rättssäkerhet', 17, 17],
    ['Domstolar', 18, 18],
    ['Polisen', 18, 18],
    ['Straffmyndighet och belastningsregister', 19, 19],
  ],
  ch06: [
    ['Fria medier', 20, 20],
    ['Public service', 21, 21],
    ['Källkritik', 21, 21],
  ],
  ch07: [
    ['Mänskliga rättigheter gäller alla', 22, 22],
    ['FN:s förklaring om de mänskliga rättigheterna', 22, 22],
    ['Jämställdhet mellan könen', 23, 23],
    ['Könsrelaterat våld och förtryck', 23, 24],
    ['Sexköpslagen', 24, 24],
    ['Barns rättigheter', 24, 25],
    ['Nationella minoriteter och urfolk', 25, 25],
    ['Hbtqi-personer', 26, 26],
    ['Arbetet mot diskriminering', 26, 26],
  ],
  ch08: [
    ['Så fungerar arbetsmarknaden', 27, 27],
    ['Arbetsmarknadens parter', 28, 28],
    ['Lagar och regler på arbetsmarknaden', 29, 29],
    ['A-kassan', 29, 29],
    ['Privatekonomi i Sverige', 29, 29],
  ],
  ch09: [
    ['Skatter för Sveriges välfärd', 30, 30],
    ['Statligt finansierad välfärd', 30, 30],
    ['Regionerna ansvarar för sjukvården', 30, 31],
    ['Kommunerna har ett stort ansvar', 31, 31],
  ],
  ch10: [
    ['Från jordbrukssamhälle till industrisamhälle', 32, 32],
    ['Befolkningsökning', 32, 32],
    ['Sveriges väg till demokrati', 33, 33],
    ['Folkrörelserna', 33, 33],
    ['Demokratins genombrott', 33, 34],
    ['Den svenska modellen', 35, 35],
    ['Rekordåren', 36, 36],
    ['Sverige blir ett invandrarland', 36, 36],
    ['Digital revolution och globalisering', 38, 38],
  ],
  ch11: [
    ['Nordiskt samarbete', 39, 39],
    ['EU och Europarådet', 39, 39],
    ['Globalt samarbete', 39, 39],
    ['Förenta nationerna (FN)', 39, 39],
    ['Försvars- och säkerhetspolitik', 40, 40],
    ['Den långa fredens historia', 40, 40],
    ['Sveriges försvar', 40, 41],
    ['Det civila försvaret', 41, 41],
  ],
  ch12: [
    ['Religionsfrihet', 42, 42],
    ['Kristendom', 43, 43],
    ['Judendom', 43, 43],
    ['Hinduism och buddhism', 43, 43],
    ['Islam', 44, 44],
  ],
  ch13: [
    ['Några traditionella högtider under året', 45, 45],
    ['Påsk', 45, 45],
    ['Valborgsmässoafton', 46, 46],
    ['Första maj', 46, 46],
    ['Sveriges nationaldag', 46, 46],
    ['Midsommar', 46, 46],
    ['Alla helgons dag', 46, 46],
    ['Advent', 47, 47],
    ['Lucia', 47, 47],
    ['Jul', 47, 47],
    ['Nya traditioner', 47, 47],
  ],
};

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('UHR page-range map mirrors app chapters and official table-of-contents starts', () => {
  const chapters = loadTs('data/chapters.ts', 'chapters');
  const pageRanges = loadTs('data/uhrReferenceMap.ts', 'uhrChapterPageRanges');

  assert.equal(pageRanges.length, chapters.length);
  assert.equal(pageRanges.length, officialTocChapterStarts.length);

  for (const [index, pageRange] of pageRanges.entries()) {
    const chapter = chapters[index];
    const [expectedChapterId, expectedChapterNameSv, expectedStartPage] =
      officialTocChapterStarts[index];
    const nextOfficialStart = officialTocChapterStarts[index + 1]?.[2];
    const expectedEndPage = nextOfficialStart ? nextOfficialStart - 1 : 47;

    assert.equal(pageRange.chapterId, chapter.id, `page range ${index} should keep chapter order`);
    assert.equal(pageRange.chapterNameSv, chapter.nameSv);
    assert.equal(pageRange.chapterId, expectedChapterId);
    assert.equal(pageRange.chapterNameSv, expectedChapterNameSv);
    assert.equal(pageRange.startPage, expectedStartPage);
    assert.equal(pageRange.endPage, expectedEndPage);
    assert.ok(pageRange.endPage >= pageRange.startPage);

    const expectedSections = expectedSectionRanges[pageRange.chapterId];
    assert.ok(expectedSections, `${pageRange.chapterId} should have expected section ranges`);
    assert.deepEqual(
      pageRange.sections.map((section) => [section.title, section.startPage, section.endPage]),
      expectedSections,
    );

    const sectionTitles = new Set();
    for (const section of pageRange.sections) {
      assert.ok(section.title, `${pageRange.chapterId} should not include blank section titles`);
      assert.ok(
        section.startPage >= pageRange.startPage && section.endPage <= pageRange.endPage,
        `${pageRange.chapterId} section ${section.title} should stay inside chapter pages`,
      );
      assert.ok(section.endPage >= section.startPage);
      assert.equal(
        sectionTitles.has(section.title),
        false,
        `${pageRange.chapterId} should not duplicate ${section.title}`,
      );
      sectionTitles.add(section.title);
    }
  }
});

test('UHR page-range map exposes one canonical chapter and section resolver', () => {
  const {
    uhrChapterPageRanges,
    findUhrChapterPageRange,
    findUhrSectionReference,
    isPageInsideUhrRange,
  } = loadTs('data/uhrReferenceMap.ts');

  const traditions = findUhrChapterPageRange('ch13');
  assert.equal(traditions, uhrChapterPageRanges[12]);
  assert.equal(traditions.chapterNameSv, 'Traditioner och högtider');
  assert.equal(isPageInsideUhrRange(46, traditions), true);
  assert.equal(isPageInsideUhrRange(44, traditions), false);

  const valborg = findUhrSectionReference('ch13', 'Valborgsmässoafton');
  assert.deepEqual(valborg, {
    title: 'Valborgsmässoafton',
    startPage: 46,
    endPage: 46,
  });
  assert.equal(isPageInsideUhrRange(46, valborg), true);
  assert.equal(isPageInsideUhrRange(47, valborg), false);
  assert.equal(findUhrSectionReference('ch13', 'Okänd sektion'), undefined);
});

test('UHR page-range guard rejects missing, fractional, and unmapped page values', () => {
  const { findUhrChapterPageRange, isPageInsideUhrRange } = loadTs('data/uhrReferenceMap.ts');
  const democracy = findUhrChapterPageRange('ch02');

  assert.equal(isPageInsideUhrRange(undefined, democracy), false);
  assert.equal(isPageInsideUhrRange(Number.NaN, democracy), false);
  assert.equal(isPageInsideUhrRange(10.5, democracy), false);
  assert.equal(isPageInsideUhrRange(10, undefined), false);
  assert.equal(isPageInsideUhrRange(10, democracy), true);
});
