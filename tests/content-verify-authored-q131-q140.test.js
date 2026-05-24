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

const traditionChapter = 'Traditioner och högtider';

const expectedRows = [
  {
    answerEn: 'Eating eggs, lamb, salmon, and herring, and children getting candy in Easter eggs',
    answerSv: 'Att äta ägg, lamm, lax och sill och att barn får godis i påskägg',
    chapterId: 'ch13',
    id: 'q131',
    pageApprox: 45,
    required: [/Easter Saturday/i, /eggs/i, /lamb/i, /salmon/i, /herring/i, /Easter eggs/i],
    section: 'Påsk',
  },
  {
    answerEn: 'Open one door each day until Christmas Eve',
    answerSv: 'Öppnar en lucka varje dag fram till julafton',
    chapterId: 'ch13',
    id: 'q132',
    pageApprox: 47,
    required: [/Advent calendar/i, /one door each day/i, /Christmas Eve/i, /julafton/i],
    section: 'Advent',
  },
  {
    answerEn: '2005',
    answerSv: '2005',
    chapterId: 'ch13',
    id: 'q133',
    pageApprox: 46,
    required: [/Riksdag decision/i, /2005/i, /6 June/i, /1523/i, /1809/i],
    section: 'Sveriges nationaldag',
  },
  {
    answerEn: 'On a Saturday at the end of October or the beginning of November',
    answerSv: 'På en lördag i slutet av oktober eller början av november',
    chapterId: 'ch13',
    id: 'q134',
    pageApprox: 46,
    required: [/All Saints/i, /Saturday/i, /end of October/i, /beginning of November/i],
    section: 'Alla helgons dag',
  },
  {
    answerEn: 'An Advent star in the window and an Advent candleholder with four candles',
    answerSv: 'En adventsstjärna i fönstret och en adventsljusstake med fyra ljus',
    chapterId: 'ch13',
    id: 'q135',
    pageApprox: 47,
    required: [/Advent star/i, /window/i, /four candles/i, /each Sunday until Christmas/i],
    section: 'Advent',
  },
  {
    answerEn: 'Go to cemeteries and light candles on graves',
    answerSv: 'Går till kyrkogården och tänder ljus på gravar',
    chapterId: 'ch13',
    id: 'q136',
    pageApprox: 46,
    required: [/cemeteries/i, /candles on relatives/i, /friends/i, /remember and honor/i],
    section: 'Alla helgons dag',
  },
  {
    answerEn: 'They can be brought along and adapted to new places and people',
    answerSv: 'De kan tas med och anpassas till nya platser och människor',
    chapterId: 'ch13',
    id: 'q137',
    pageApprox: 47,
    required: [/move to other countries/i, /bring traditions/i, /adapt/i, /Eid al-Fitr/i],
    section: 'Nya traditioner',
  },
  {
    answerEn:
      'Bring a Christmas tree into the home and decorate it with strings of lights, baubles, and tinsel',
    answerSv: 'Tar in en julgran i hemmet och dekorerar den med ljusslingor, kulor och glitter',
    chapterId: 'ch13',
    id: 'q138',
    pageApprox: 47,
    required: [/Christmas tree/i, /strings of lights/i, /baubles/i, /tinsel/i],
    section: 'Jul',
  },
  {
    answerEn: "Jesus' birth",
    answerSv: 'Jesu födelse',
    chapterId: 'ch13',
    id: 'q139',
    pageApprox: 47,
    required: [/Christian holiday/i, /Jesus' birth/i, /family holiday/i],
    section: 'Jul',
  },
  {
    answerEn:
      'Many people celebrate Christmas as a family holiday even when it has no religious meaning for them',
    answerSv:
      'Många firar jul som en familjehögtid även när julen inte har religiös betydelse för dem',
    chapterId: 'ch13',
    id: 'q140',
    pageApprox: 47,
    required: [/Christian roots/i, /family holiday/i, /no religious meaning/i, /spring bonfires/i],
    section: 'Jul',
  },
];

test('CONTENT-VERIFY q131-q140 pins UHR locators, answers, and key explanation facts', () => {
  for (const expected of expectedRows) {
    const question = byId(expected.id);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    const allText = textFor(question);

    assert.equal(question.reviewStatus, 'reviewed', `${expected.id} review status`);
    assert.equal(question.chapterId, expected.chapterId, `${expected.id} chapter id`);
    assert.equal(question.uhrReference.chapter, traditionChapter, `${expected.id} UHR chapter`);
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
