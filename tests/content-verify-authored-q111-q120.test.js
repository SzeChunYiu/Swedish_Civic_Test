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

const chapter = 'En sekulär stat och ett mångreligiöst land';

const expectedRows = [
  {
    answerEn: 'To promote understanding, tolerance, and respect for differences',
    answerSv: 'Att främja förståelse, tolerans och respekt för olikheter',
    id: 'q111',
    pageApprox: 42,
    required: [/religion studies/i, /understanding/i, /tolerance/i, /religionskunskapen/i],
    section: 'Religionsfrihet',
  },
  {
    answerEn: 'During the 1970s',
    answerSv: 'Under 1970-talet',
    id: 'q112',
    pageApprox: 44,
    required: [/first mosques/i, /1970s/i, /after the Second World War/i, /första moskéer/i],
    section: 'Islam',
  },
  {
    answerEn: 'Orthodox churches, the Catholic Church, and Protestant churches',
    answerSv: 'Ortodoxa kyrkor, katolska kyrkan och protestantiska kyrkor',
    id: 'q113',
    pageApprox: 43,
    required: [/Orthodox/i, /Catholic/i, /Protestant/i, /kristna samfund/i],
    section: 'Kristendom',
  },
  {
    answerEn: 'Travel to Asia and increased interest in meditation and yoga',
    answerSv: 'Resor till Asien och ökat intresse för meditation och yoga',
    id: 'q114',
    pageApprox: 43,
    required: [/20th century/i, /meditation/i, /yoga/i, /resor till Asien/i],
    section: 'Hinduism och buddhism',
  },
  {
    answerEn: 'To leave the Church of Sweden, but only if they joined another Christian community',
    answerSv: 'Att lämna Svenska kyrkan, men bara om man gick med i ett annat kristet samfund',
    id: 'q115',
    pageApprox: 42,
    required: [/1860/i, /Religious Freedom Act of 1951/i, /år 2000/i, /kristet samfund/i],
    section: 'Religionsfrihet',
  },
  {
    answerEn:
      'The right to practice one’s religion and to be protected from discrimination because of belief',
    answerSv: 'Rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro',
    id: 'q116',
    pageApprox: 42,
    required: [/Instrument of Government/i, /practice their religion/i, /discriminated/i],
    section: 'Religionsfrihet',
  },
  {
    answerEn: 'Christmas and Easter',
    answerSv: 'Jul och påsk',
    id: 'q117',
    pageApprox: 42,
    required: [/Christianity has left many cultural traces/i, /Christmas/i, /Easter/i],
    section: 'Religionens roll',
  },
  {
    answerEn: 'Baptisms, church weddings, and Christian funerals',
    answerSv: 'Dop, bröllop i kyrkan och kristen begravning',
    id: 'q118',
    pageApprox: 42,
    required: [/Baptisms/i, /church weddings/i, /Christian funerals/i, /Dop/i],
    section: 'Religionens roll',
  },
  {
    answerEn: 'A Catholic country',
    answerSv: 'Ett katolskt land',
    id: 'q119',
    pageApprox: 43,
    required: [/Middle Ages/i, /Catholic country/i, /Lutheran Protestant tradition/i],
    section: 'Kristendom',
  },
  {
    answerEn: 'Live in the country and practice their religion',
    answerSv: 'Bo i landet och utöva sin religion',
    id: 'q120',
    pageApprox: 43,
    required: [/18th century/i, /live and practice their religion/i, /1700-talet/i],
    section: 'Judendom',
  },
];

test('CONTENT-VERIFY q111-q120 pins UHR locators, answers, and key explanation facts', () => {
  for (const expected of expectedRows) {
    const question = byId(expected.id);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    const allText = textFor(question);

    assert.equal(question.reviewStatus, 'reviewed', `${expected.id} review status`);
    assert.equal(question.chapterId, 'ch12', `${expected.id} chapter id`);
    assert.equal(question.uhrReference.chapter, chapter, `${expected.id} UHR chapter`);
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
