const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

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
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
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

const { additionalQuestions } = loadTs('data/additionalQuestions.ts');

function byId(id) {
  const question = additionalQuestions.find((candidate) => candidate.id === id);
  assert.ok(question, `${id} should exist in additionalQuestions`);
  return question;
}

function textFor(question) {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...question.options.flatMap((option) => [option.textSv, option.textEn]),
  ].join('\n');
}

const religionChapter = 'En sekulär stat och ett mångreligiöst land';
const traditionChapter = 'Traditioner och högtider';

const expectedRows = [
  {
    answerEn: 'Sunni and Shia',
    answerSv: 'Sunni och shia',
    chapter: religionChapter,
    chapterId: 'ch12',
    id: 'q121',
    pageApprox: 44,
    required: [/Sunni/i, /Shia/i, /Muslim congregations/i, /muslimska församlingar/i],
    section: 'Islam',
  },
  {
    answerEn: 'Prayer, teaching, and community',
    answerSv: 'Bön, undervisning och gemenskap',
    chapter: religionChapter,
    chapterId: 'ch12',
    id: 'q122',
    pageApprox: 44,
    required: [/prayer/i, /teaching/i, /community/i, /muslimsk tradition/i],
    section: 'Islam',
  },
  {
    answerEn: 'They are mainly among immigrants from countries where these religions are large',
    answerSv: 'De finns främst bland invandrare från länder där religionerna är stora',
    chapter: religionChapter,
    chapterId: 'ch12',
    id: 'q123',
    pageApprox: 43,
    required: [/Buddhists and Hindus/i, /immigrants/i, /these religions are large/i],
    section: 'Hinduism och buddhism',
  },
  {
    answerEn: 'Gustav Vasa was elected king of Sweden',
    answerSv: 'Gustav Vasa valdes till svensk kung',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q124',
    pageApprox: 46,
    required: [/6 June 1523/i, /Gustav Vasa/i, /1809/i, /regeringsform/i],
    section: 'Sveriges nationaldag',
  },
  {
    answerEn:
      'Outdoor parties, flower wreaths, dancing around the midsummer pole, and Midsummer food',
    answerSv: 'Utomhusfester, blomsterkransar, dans runt midsommarstången och midsommarmat',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q125',
    pageApprox: 46,
    required: [/Midsummer/i, /flower wreaths/i, /midsummer pole/i, /jordgubbar/i],
    section: 'Midsommar',
  },
  {
    answerEn: 'They come from Christian traditions and are often seen as part of cultural heritage',
    answerSv: 'De kommer ur kristna traditioner och ses ofta som en del av kulturarvet',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q126',
    pageApprox: 45,
    required: [/Christian traditions/i, /cultural heritage/i, /time off work/i],
    section: 'Några traditionella högtider under året',
  },
  {
    answerEn: 'Eid al-Fitr',
    answerSv: 'Id al-fitr',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q127',
    pageApprox: 47,
    required: [/fasting month of Ramadan/i, /Nouruz/i, /Newroz/i, /ramadan/i],
    section: 'Nya traditioner',
  },
  {
    answerEn: 'At the spring equinox on 21 March',
    answerSv: 'Vid vårdagjämningen den 21 mars',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q128',
    pageApprox: 47,
    required: [/spring equinox/i, /21 March/i, /Persian and Kurdish/i, /vårdagjämningen/i],
    section: 'Nya traditioner',
  },
  {
    answerEn: 'A crown of lights on her head',
    answerSv: 'En ljuskrona på huvudet',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q129',
    pageApprox: 47,
    required: [/Lucia procession/i, /crown of lights/i, /candles/i, /ljuskrona/i],
    section: 'Lucia',
  },
  {
    answerEn: 'Julotta, a Christmas morning service',
    answerSv: 'Julotta',
    chapter: traditionChapter,
    chapterId: 'ch13',
    id: 'q130',
    pageApprox: 47,
    required: [/25 December/i, /Christmas morning/i, /church service/i, /gudstjänst/i],
    section: 'Jul',
  },
];

test('CONTENT-VERIFY q121-q130 pins UHR locators, answers, and key explanation facts', () => {
  for (const expected of expectedRows) {
    const question = byId(expected.id);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    const allText = textFor(question);

    assert.equal(question.reviewStatus, 'reviewed', `${expected.id} review status`);
    assert.equal(question.chapterId, expected.chapterId, `${expected.id} chapter id`);
    assert.equal(question.uhrReference.chapter, expected.chapter, `${expected.id} UHR chapter`);
    assert.equal(question.uhrReference.section, expected.section, `${expected.id} UHR section`);
    assert.equal(question.uhrReference.pageApprox, expected.pageApprox, `${expected.id} UHR page`);
    assert.equal(correctOption?.textSv, expected.answerSv, `${expected.id} correct Swedish answer`);
    assert.equal(correctOption?.textEn, expected.answerEn, `${expected.id} correct English answer`);
    assert.doesNotMatch(allText, /Sant eller falskt:|True or false:/i);
    assert.doesNotMatch(allText, /Enligt UHR|According to UHR/i);

    for (const pattern of expected.required) {
      assert.match(allText, pattern, `${expected.id} includes ${pattern}`);
    }
  }
});
