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

const expectedRows = [
  {
    answerEn: 'Easter',
    answerSv: 'Påsk',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q101',
    pageApprox: 45,
    required: [/Good Friday/i, /Easter Sunday/i, /långfredagen/i, /påskdagen/i],
    section: 'Påsk',
  },
  {
    answerEn: 'Bonfires, spring songs, and sometimes a speech welcoming spring',
    answerSv: 'Brasor, vårsånger och ibland ett tal till våren',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q102',
    pageApprox: 46,
    required: [/30 April/i, /bonfires/i, /vårsånger/i, /tal till våren/i],
    section: 'Valborgsmässoafton',
  },
  {
    answerEn: "International Workers' Day with demonstrations and speeches",
    answerSv: 'Arbetarnas dag med demonstrationer och tal',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q103',
    pageApprox: 46,
    required: [/International Workers/i, /public holiday/i, /arbetarrörelsen/i, /helgdag/i],
    section: 'Första maj',
  },
  {
    answerEn: 'Light candles on graves to remember and honour people who have died',
    answerSv: 'Tända ljus på gravar för att minnas och hedra dem som har dött',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q104',
    pageApprox: 46,
    required: [/Christian holiday/i, /candles/i, /kyrkogården/i, /gravar/i],
    section: 'Alla helgons dag',
  },
  {
    answerEn: 'The four Sundays before Christmas Day, 25 December',
    answerSv: 'De fyra söndagarna före juldagen den 25 december',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q105',
    pageApprox: 47,
    required: [/four Sundays/i, /Christmas Day/i, /fyra söndagarna/i, /juldagen/i],
    section: 'Advent',
  },
  {
    answerEn: 'To gather, eat special Christmas food, and give each other Christmas presents',
    answerSv: 'Att samlas, äta särskild julmat och ge varandra julklappar',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q106',
    pageApprox: 47,
    required: [/Christmas Eve/i, /family holiday/i, /julafton/i, /julklappar/i],
    section: 'Jul',
  },
  {
    answerEn: 'Eid al-Fitr and Nouruz/Newroz',
    answerSv: 'Id al-fitr samt Nouruz och Newroz',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q107',
    pageApprox: 47,
    required: [/Eid al-Fitr/i, /Nouruz/i, /Newroz/i, /immigrants/i, /invandrare/i],
    section: 'Nya traditioner',
  },
  {
    answerEn: 'Buddhist and Hindu congregations and temples',
    answerSv: 'Buddhistiska och hinduiska församlingar och tempel',
    chapter: 'En sekulär stat och ett mångreligiöst land',
    chapterId: 'ch12',
    id: 'q108',
    pageApprox: 43,
    required: [/Buddhist/i, /Hindu/i, /temples/i, /församlingar/i, /tempel/i],
    section: 'Hinduism och buddhism',
  },
  {
    answerEn:
      'The role of religion has decreased, but religious questions have received more attention',
    answerSv: 'Religionens roll har minskat, men religionsfrågor har fått större uppmärksamhet',
    chapter: 'En sekulär stat och ett mångreligiöst land',
    chapterId: 'ch12',
    id: 'q109',
    pageApprox: 42,
    required: [/role of religion has decreased/i, /more attention/i, /religionens roll/i],
    section: 'Religionens roll',
  },
  {
    answerEn: 'Jews received full civil rights in Sweden only in 1870',
    answerSv: 'Judar fick fullständiga medborgerliga rättigheter i Sverige först 1870',
    chapter: 'En sekulär stat och ett mångreligiöst land',
    chapterId: 'ch12',
    id: 'q110',
    pageApprox: 43,
    required: [/18th century/i, /1870/i, /civil rights/i, /1700-talet/i, /synagogor/i],
    section: 'Judendom',
  },
];

test('CONTENT-VERIFY q101-q110 pins UHR locators, answers, and key explanation facts', () => {
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
