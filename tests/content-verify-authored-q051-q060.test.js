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

const expectedRows = [
  {
    id: 'q051',
    section: 'Mänskliga rättigheter gäller alla',
    page: 22,
    correct: ['a', 'För att förhindra krig och skydda människors rättigheter', 'To prevent war and protect human rights'],
    terms: ['Förenta nationerna', 'United Nations', '1945', '51 länder', '51 countries'],
  },
  {
    id: 'q052',
    section: 'FN:s förklaring om de mänskliga rättigheterna',
    page: 22,
    correct: ['a', 'Den presenterades 1948 och innehåller 30 artiklar', 'It was presented in 1948 and contains 30 articles'],
    terms: ['1948', '30 artiklar', '30 articles', 'födda fria och lika', 'born free and equal'],
  },
  {
    id: 'q053',
    section: 'Jämställdhet mellan könen',
    page: 23,
    correct: [
      'a',
      'Att kvinnor och män ska ha samma rättigheter och skyldigheter och lika mycket makt att påverka samhället och sina egna liv',
      'That women and men should have the same rights and duties and equal power to influence society and their own lives',
    ],
    terms: ['samma rättigheter och skyldigheter', 'same rights and duties', 'lika mycket makt', 'equal power'],
  },
  {
    id: 'q054',
    section: 'Könsrelaterat våld och förtryck',
    page: 23,
    correct: ['a', 'Det är brottsligt enligt svensk lag', 'They are crimes under Swedish law'],
    terms: ['brottsligt enligt svensk lag', 'crimes under Swedish law', 'tvångsäktenskap', 'forced marriage'],
  },
  {
    id: 'q055',
    section: 'Sexköpslagen',
    page: 24,
    correct: [
      'a',
      'Det är olagligt att köpa sex, men personen som säljer straffas inte',
      'It is illegal to buy sex, but the person who sells it is not punished',
    ],
    terms: ['köpa sex är olagligt', 'Buying sex is illegal', 'säljer sex straffas inte', 'sells sex is not punished'],
  },
  {
    id: 'q056',
    section: 'Barns rättigheter',
    page: 24,
    correct: ['c', '2020', '2020'],
    terms: ['barnkonventionen', 'Convention on the Rights of the Child', 'lag sedan 2020', 'law since 2020'],
  },
  {
    id: 'q057',
    section: 'Barns rättigheter',
    page: 25,
    correct: ['a', 'Att det är förbjudet att slå barn', 'That hitting children is prohibited'],
    terms: ['1979', 'förbjuda att slå barn', 'prohibit hitting children', 'först i världen', 'first country in the world'],
  },
  {
    id: 'q058',
    section: 'Nationella minoriteter och urfolk',
    page: 25,
    correct: [
      'a',
      'Judar, romer, samer, sverigefinnar och tornedalingar',
      'Jews, Roma, Sami, Sweden Finns, and Tornedalians',
    ],
    terms: ['år 2000', 'In 2000', 'minoritetsspråk', 'minority languages'],
  },
  {
    id: 'q059',
    section: 'Nationella minoriteter och urfolk',
    page: 25,
    correct: [
      'a',
      'Att representera den samiska befolkningen i frågor om språk, kultur och identitet',
      'To represent the Sami population on questions of language, culture, and identity',
    ],
    terms: ['Sametinget', 'Sami Parliament', 'rådgivande organ', 'advisory body'],
  },
  {
    id: 'q060',
    section: 'Hbtqi-personer',
    page: 26,
    correct: [
      'a',
      'Det är tillåtet att gifta sig med en person av samma kön',
      'It is permitted to marry a person of the same sex',
    ],
    terms: ['samma kön', 'same sex', 'diskrimineringslagen', 'Discrimination Act'],
  },
];

test('CONTENT-VERIFY q051-q060 pins UHR-backed human-rights source facts', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(sourceQuestions.map((question) => [question.id, question]));
  const publishedById = new Map(questions.map((question) => [question.id, question]));

  for (const expected of expectedRows) {
    const question = byId.get(expected.id);
    const publishedQuestion = publishedById.get(expected.id);
    assert.ok(question, `${expected.id} should exist in sourceQuestions`);
    assert.ok(publishedQuestion, `${expected.id} should exist in published questions`);
    assert.equal(question.chapterId, 'ch07');
    assert.equal(question.type, 'single_choice');
    assert.equal(question.reviewStatus, 'published');
    assert.deepEqual(publishedQuestion.uhrReference, question.uhrReference);
    assert.equal(question.uhrReference.chapter, 'Mänskliga rättigheter');
    assert.equal(question.uhrReference.section, expected.section);
    assert.equal(question.uhrReference.pageApprox, expected.page);
    assert.equal(question.correctOptionId, expected.correct[0]);

    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    assert.ok(correctOption, `${expected.id} should have a correct option`);
    assert.equal(correctOption.textSv, expected.correct[1]);
    assert.equal(correctOption.textEn, expected.correct[2]);

    const learnerText = [
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
      ...question.options.flatMap((option) => [option.textSv, option.textEn]),
    ].join('\n');

    assert.doesNotMatch(learnerText, /\b(?:Sant eller falskt|True or false|Enligt UHR|According to UHR)\b/);
    for (const term of expected.terms) {
      assert.match(learnerText, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});
